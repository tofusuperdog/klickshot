import {
  createBackofficeSupabaseClient,
  forbiddenResponse,
  isSameOriginRequest,
  jsonResponse,
  publicUser,
  readJsonBody,
  setBackofficeSessionCookie,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOGIN_BODY_LIMIT_BYTES = 8 * 1024;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;
const loginAttempts = new Map();

function getClientKey(request, username) {
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
  return `${ip}:${username.toLowerCase()}`;
}

function isRateLimited(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || record.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
}

function resetRateLimit(key) {
  loginAttempts.delete(key);
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const body = await readJsonBody(request, LOGIN_BODY_LIMIT_BYTES);
  if (body.error) {
    return jsonResponse({ error: body.error }, { status: body.status });
  }

  const { username = '', password = '' } = body.data || {};
  const trimmedUsername = String(username).trim();
  const passwordValue = String(password);

  if (!trimmedUsername || !passwordValue) {
    return jsonResponse({ error: 'Missing credentials' }, { status: 400 });
  }

  if (trimmedUsername.length > 128 || passwordValue.length > 512) {
    return jsonResponse({ error: 'Invalid credentials' }, { status: 401 });
  }

  const rateLimitKey = getClientKey(request, trimmedUsername);
  if (isRateLimited(rateLimitKey)) {
    return jsonResponse({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase
    .rpc('backoffice_login', {
      p_username: trimmedUsername,
      p_password: passwordValue,
    })
    .maybeSingle();

  if (error || !data?.session_token) {
    return jsonResponse({ error: 'Invalid credentials' }, { status: 401 });
  }

  resetRateLimit(rateLimitKey);

  const response = jsonResponse({ user: publicUser(data) });
  setBackofficeSessionCookie(response, data.session_token, data.session_expires_at);
  return response;
}
