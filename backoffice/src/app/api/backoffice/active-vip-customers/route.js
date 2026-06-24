import {
  createBackofficeSupabaseClient,
  forbiddenResponse,
  getBackofficeToken,
  isSameOriginRequest,
  jsonResponse,
  unauthorizedResponse,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_active_vip_customers', {
    p_session_token: token,
  });

  if (error) {
    return jsonResponse({ error: 'Unable to load active VIP customers' }, { status: 403 });
  }

  return jsonResponse({ data });
}
