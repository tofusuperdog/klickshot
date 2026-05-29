import { NextResponse } from "next/server";
import {
  createPartnerSessionToken,
  getPartnerCookieOptions,
  PARTNER_SESSION_COOKIE,
} from "@/lib/partnerSession";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const partnerLoginSecret = process.env.PARTNER_LOGIN_SECRET;
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function getClientKey(request, username) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
  return `${ip}:${username.toLowerCase()}`;
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
  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return NextResponse.json(
      { error: "Partner login is not configured." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const remember = Boolean(body.remember);

  if (!username || !password) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน" },
      { status: 400 },
    );
  }

  const rateLimitKey = getClientKey(request, username);
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
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
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้" },
      { status: 502 },
    );
  }

  const data = await response.json().catch(() => []);
  const producer = Array.isArray(data) ? data[0] : null;

  if (!producer) {
    return NextResponse.json(
      { error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  resetRateLimit(rateLimitKey);

  const session = createPartnerSessionToken(producer, remember);
  const nextResponse = NextResponse.json({
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
