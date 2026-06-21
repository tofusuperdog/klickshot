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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const startDate = request.nextUrl.searchParams.get('start_date') || '';
  const endDate = request.nextUrl.searchParams.get('end_date') || '';

  if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
    return jsonResponse({ error: 'Invalid date range' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_viewing_report', {
    p_session_token: token,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    return jsonResponse({ error: 'Unable to load viewing report' }, { status: 403 });
  }

  return jsonResponse({ data });
}
