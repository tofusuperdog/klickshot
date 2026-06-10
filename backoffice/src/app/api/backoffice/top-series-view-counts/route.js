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

const BODY_LIMIT_BYTES = 1024;

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const parsedBody = await readJsonBody(request, BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const startDate = String(parsedBody.data?.start_date || '').trim();
  const endDate = String(parsedBody.data?.end_date || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return jsonResponse({ error: 'Invalid date range' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_top_series_view_counts', {
    p_session_token: token,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    return jsonResponse({ error: 'Unable to load top series view counts' }, { status: 403 });
  }

  return jsonResponse({ data: Array.isArray(data) ? data : [] });
}
