import {
  createBackofficeSupabaseClient,
  forbiddenResponse,
  getBackofficeToken,
  getClientIp,
  isRateLimited,
  isSameOriginRequest,
  jsonResponse,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BODY_LIMIT_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 60;
const USERNAME_PATTERN = /^[A-Za-z0-9._@-]{3,128}$/;
const STATUS_VALUES = new Set(['active', 'inactive', 'suspended']);

function safeInteger(value) {
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
}

function validName(value) {
  const name = String(value || '').trim();
  return name && name.length <= 255 ? name : null;
}

function rateLimited(request, token) {
  const key = `backoffice-content-producers:${getClientIp(request)}:${token.slice(0, 16)}`;
  return isRateLimited(key, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS);
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  if (rateLimited(request, token)) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const parsedBody = await readJsonBody(request, BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const body = parsedBody.data || {};
  const supabase = createBackofficeSupabaseClient();
  let rpcName = '';
  let args = {};

  if (body.action === 'create') {
    const name = validName(body.name);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!name || !USERNAME_PATTERN.test(username) || !password || password.length > 512) {
      return jsonResponse({ error: 'Invalid content producer details' }, { status: 400 });
    }

    rpcName = 'backoffice_content_producers_create_secure';
    args = {
      p_session_token: token,
      p_name: name,
      p_username: username,
      p_password: password,
    };
  } else if (body.action === 'update') {
    const producerId = safeInteger(body.content_producer_id);
    const name = validName(body.name);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!producerId || !name || !USERNAME_PATTERN.test(username) || password.length > 512) {
      return jsonResponse({ error: 'Invalid content producer details' }, { status: 400 });
    }

    rpcName = 'backoffice_content_producers_update_secure';
    args = {
      p_session_token: token,
      p_content_producer_id: producerId,
      p_name: name,
      p_username: username,
      p_password: password,
    };
  } else if (body.action === 'delete') {
    const producerId = safeInteger(body.content_producer_id);
    if (!producerId) {
      return jsonResponse({ error: 'Invalid content producer id' }, { status: 400 });
    }

    rpcName = 'backoffice_content_producers_delete_secure';
    args = {
      p_session_token: token,
      p_content_producer_id: producerId,
    };
  } else if (body.action === 'set_status') {
    const producerId = safeInteger(body.content_producer_id);
    const status = String(body.status || '');
    if (!producerId || !STATUS_VALUES.has(status)) {
      return jsonResponse({ error: 'Invalid content producer status' }, { status: 400 });
    }

    rpcName = 'backoffice_content_producers_set_status_secure';
    args = {
      p_session_token: token,
      p_content_producer_id: producerId,
      p_status: status,
    };
  } else {
    return jsonResponse({ error: 'Unsupported content producer action' }, { status: 400 });
  }

  const { error } = await supabase.rpc(rpcName, args);

  if (error) {
    return jsonResponse({ error: 'Unable to process content producer request' }, { status: 403 });
  }

  return jsonResponse({ ok: true });
}
