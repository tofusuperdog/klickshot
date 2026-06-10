import {
  createBackofficeSupabaseClient,
  forbiddenResponse,
  getBackofficeToken,
  isSameOriginRequest,
  jsonResponse,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BODY_LIMIT_BYTES = 4 * 1024;

export async function GET(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_contract_notifications', {
    p_session_token: token,
  });

  if (error) {
    return jsonResponse({ notifications: [] }, { status: 200 });
  }

  return jsonResponse({ notifications: Array.isArray(data) ? data : [] });
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const parsedBody = await readJsonBody(request, BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const notificationKey = String(parsedBody.data?.notification_key || '').trim();
  if (!notificationKey) {
    return jsonResponse({ error: 'Missing notification key' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { error } = await supabase.rpc('backoffice_dismiss_notification', {
    p_session_token: token,
    p_notification_key: notificationKey,
  });

  if (error) {
    return jsonResponse({ error: 'Unable to dismiss notification' }, { status: 403 });
  }

  return jsonResponse({ ok: true });
}
