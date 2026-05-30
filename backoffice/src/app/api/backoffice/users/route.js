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
const RATE_LIMIT_MAX_ATTEMPTS = 40;
const USERNAME_PATTERN = /^[A-Za-z0-9._@-]{3,128}$/;

function safeInteger(value) {
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
}

function rateLimited(request, token) {
  const key = `backoffice-users:${getClientIp(request)}:${token.slice(0, 16)}`;
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
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!USERNAME_PATTERN.test(username) || !password || password.length > 512) {
      return jsonResponse({ error: 'Invalid user details' }, { status: 400 });
    }

    rpcName = 'backoffice_users_create_secure';
    args = {
      p_session_token: token,
      p_username: username,
      p_password: password,
      p_perm_series: !!body.perm_series,
      p_perm_genres: !!body.perm_genres,
      p_perm_displays: !!body.perm_displays,
      p_perm_content_producers: !!body.perm_content_producers,
      p_perm_sales: !!body.perm_sales,
      p_perm_reports: !!body.perm_reports,
      p_perm_customers: !!body.perm_customers,
      p_perm_users: !!body.perm_users,
    };
  } else if (body.action === 'update') {
    const userId = safeInteger(body.user_id);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!userId || !USERNAME_PATTERN.test(username) || password.length > 512) {
      return jsonResponse({ error: 'Invalid user details' }, { status: 400 });
    }

    rpcName = 'backoffice_users_update_secure';
    args = {
      p_session_token: token,
      p_user_id: userId,
      p_username: username,
      p_password: password,
      p_perm_series: !!body.perm_series,
      p_perm_genres: !!body.perm_genres,
      p_perm_displays: !!body.perm_displays,
      p_perm_content_producers: !!body.perm_content_producers,
      p_perm_sales: !!body.perm_sales,
      p_perm_reports: !!body.perm_reports,
      p_perm_customers: !!body.perm_customers,
      p_perm_users: !!body.perm_users,
    };
  } else if (body.action === 'delete') {
    const userId = safeInteger(body.user_id);
    if (!userId) {
      return jsonResponse({ error: 'Invalid user id' }, { status: 400 });
    }

    rpcName = 'backoffice_users_delete_secure';
    args = {
      p_session_token: token,
      p_user_id: userId,
    };
  } else {
    return jsonResponse({ error: 'Unsupported user action' }, { status: 400 });
  }

  const { error } = await supabase.rpc(rpcName, args);

  if (error) {
    return jsonResponse({ error: 'Unable to process user request' }, { status: 403 });
  }

  return jsonResponse({ ok: true });
}
