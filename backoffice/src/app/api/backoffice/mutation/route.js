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

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const body = await readJsonBody(request);
  if (body.error) {
    return jsonResponse({ error: body.error }, { status: body.status });
  }

  const {
    table,
    action,
    payload = {},
    filter = {},
    onConflict = null,
  } = body.data || {};

  if (!table || !action) {
    return jsonResponse({ error: 'Missing mutation target' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_mutation', {
    p_session_token: token,
    p_table: table,
    p_action: action,
    p_payload: payload,
    p_filter: filter,
    p_on_conflict: onConflict,
  });

  if (error) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 });
  }

  return jsonResponse({ data });
}
