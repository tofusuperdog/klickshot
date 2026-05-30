import {
  createPartnerSessionToken,
  forbiddenResponse,
  getClientIp,
  getPartnerCookieOptions,
  getSupabaseConfig,
  isSameOriginRequest,
  jsonResponse,
  PARTNER_SESSION_COOKIE,
  readJsonBody,
} from "@/lib/partnerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const LOGIN_BODY_LIMIT_BYTES = 8 * 1024;

function getClientKey(request, username) {
  return `${getClientIp(request)}:${username.toLowerCase()}`;
}

function isRateLimited(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || record.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_MAX_ATTEMPTS;
}

function resetRateLimit(key) {
  loginAttempts.delete(key);
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const { supabaseUrl, supabaseKey, partnerLoginSecret } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return jsonResponse(
      { error: "Partner login is not configured." },
      { status: 500 },
    );
  }

  const parsedBody = await readJsonBody(request, LOGIN_BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const body = parsedBody.data || {};
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const remember = Boolean(body.remember);

  if (!username || !password) {
    return jsonResponse(
      { error: "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน" },
      { status: 400 },
    );
  }

  if (username.length > 128 || password.length > 512) {
    return jsonResponse({ error: "Invalid credentials" }, { status: 401 });
  }

  const rateLimitKey = getClientKey(request, username);
  if (isRateLimited(rateLimitKey)) {
    return jsonResponse(
      { error: "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429 },
    );
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/partner_login`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_username: username,
      p_password: password,
      p_app_secret: partnerLoginSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return jsonResponse(
      { error: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้" },
      { status: 502 },
    );
  }

  const data = await response.json().catch(() => []);
  const producer = Array.isArray(data) ? data[0] : null;

  if (!producer) {
    return jsonResponse(
      { error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  resetRateLimit(rateLimitKey);

  const session = createPartnerSessionToken(producer, remember);
  const nextResponse = jsonResponse({
    producer: {
      id: producer.id,
      name: producer.name,
      username: producer.username,
      session_version: producer.session_version,
    },
  });
  nextResponse.cookies.set(
    PARTNER_SESSION_COOKIE,
    session.token,
    getPartnerCookieOptions(session.maxAge),
  );

  return nextResponse;
}
