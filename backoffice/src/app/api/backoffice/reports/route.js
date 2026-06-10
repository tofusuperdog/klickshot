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
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPORT_ACTIONS = new Set(['send', 'cancel', 'delete']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function badRequest(message) {
  return jsonResponse({ error: message }, { status: 400 });
}

function reportCreateErrorMessage(error) {
  const message = String(error?.message || '');
  const knownMessages = [
    'date range already exists',
    'report for this date range already exists',
    'total adjusted views must be greater than zero',
    'invalid report date range',
    'revenue and expense must be non-negative',
    'weights must be between 0 and 1 with one decimal place',
    'permission denied',
  ];

  return knownMessages.find((knownMessage) => message.includes(knownMessage)) || 'Unable to create report';
}

function rateLimited(request, token) {
  const key = `backoffice-reports:${getClientIp(request)}:${token.slice(0, 16)}`;
  return isRateLimited(key, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS);
}

function validReportPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (!String(payload.report_name || '').trim()) return false;
  if (!DATE_PATTERN.test(String(payload.start_date || ''))) return false;
  if (!DATE_PATTERN.test(String(payload.end_date || ''))) return false;

  const tiktokRevenue = Number(payload.tiktok_revenue);
  const platformExpense = Number(payload.platform_expense);
  const freeEpisodeWeight = Number(payload.free_episode_weight);
  const paidEpisodeWeight = Number(payload.paid_episode_weight);

  return (
    Number.isFinite(tiktokRevenue) &&
    Number.isFinite(platformExpense) &&
    Number.isFinite(freeEpisodeWeight) &&
    Number.isFinite(paidEpisodeWeight) &&
    tiktokRevenue >= 0 &&
    platformExpense >= 0 &&
    freeEpisodeWeight >= 0 &&
    freeEpisodeWeight <= 1 &&
    paidEpisodeWeight >= 0 &&
    paidEpisodeWeight <= 1
  );
}

export async function GET(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const supabase = createBackofficeSupabaseClient();
  const reportId = request.nextUrl.searchParams.get('id');

  if (reportId && !UUID_PATTERN.test(reportId)) {
    return badRequest('Invalid report id');
  }

  const rpcName = reportId
    ? 'backoffice_partner_revenue_report_detail'
    : 'backoffice_partner_revenue_reports';
  const args = reportId
    ? { p_session_token: token, p_report_id: reportId }
    : { p_session_token: token };

  const { data, error } = await supabase.rpc(rpcName, args);

  if (error) {
    return jsonResponse({ error: 'Unable to load reports' }, { status: 403 });
  }

  return jsonResponse({ data });
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
  const action = body.action || 'create';
  const supabase = createBackofficeSupabaseClient();

  if (action === 'create') {
    const payload = body.payload || {};
    if (!validReportPayload(payload)) {
      return badRequest('Invalid report payload');
    }

    const { data, error } = await supabase.rpc('backoffice_create_partner_revenue_report', {
      p_session_token: token,
      p_report_name: String(payload.report_name).trim(),
      p_start_date: payload.start_date,
      p_end_date: payload.end_date,
      p_tiktok_revenue: Number(payload.tiktok_revenue),
      p_platform_expense: Number(payload.platform_expense),
      p_free_episode_weight: Number(payload.free_episode_weight),
      p_paid_episode_weight: Number(payload.paid_episode_weight),
    });

    if (error) {
      return jsonResponse({ error: reportCreateErrorMessage(error) }, { status: 400 });
    }

    return jsonResponse({ data });
  }

  if (!REPORT_ACTIONS.has(action)) {
    return badRequest('Unsupported action');
  }

  if (!UUID_PATTERN.test(String(body.report_id || ''))) {
    return badRequest('Invalid report id');
  }

  const { data, error } = await supabase.rpc('backoffice_update_partner_revenue_report_status', {
    p_session_token: token,
    p_report_id: body.report_id,
    p_action: action,
  });

  if (error) {
    return jsonResponse({ error: 'Unable to update report' }, { status: 400 });
  }

  return jsonResponse({ data });
}
