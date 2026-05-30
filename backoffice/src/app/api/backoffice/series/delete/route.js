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

const BODY_LIMIT_BYTES = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 30;

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const rateLimitKey = `backoffice-series-delete:${getClientIp(request)}:${token.slice(0, 16)}`;
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const parsedBody = await readJsonBody(request, BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const numericSeriesId = Number(parsedBody.data?.seriesId);

  if (!Number.isSafeInteger(numericSeriesId) || numericSeriesId <= 0) {
    return jsonResponse({ error: 'Invalid series id' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_delete_series', {
    p_session_token: token,
    p_series_id: numericSeriesId,
  });

  if (error) {
    return jsonResponse({ error: 'Unable to delete series' }, { status: 403 });
  }

  return jsonResponse({ data });
}
