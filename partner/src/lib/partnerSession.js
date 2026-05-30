import crypto from "crypto";
import { NextResponse } from "next/server";

export const PARTNER_SESSION_COOKIE = "partner_session";

const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const REMEMBER_DURATION_SECONDS = 30 * 24 * 60 * 60;
const JSON_BODY_LIMIT_BYTES = 32 * 1024;

export const SECURITY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

function getSessionSecret() {
  const secret = process.env.PARTNER_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("PARTNER_SESSION_SECRET must be configured.");
  }
  return secret;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createPartnerSessionToken(producer, remember = false) {
  const now = Math.floor(Date.now() / 1000);
  const tokenAge = remember ? REMEMBER_DURATION_SECONDS : SESSION_DURATION_SECONDS;
  const payload = base64UrlEncode(
    JSON.stringify({
      exp: now + tokenAge,
      producer: {
        id: producer.id,
        name: producer.name,
        username: producer.username,
        session_version: producer.session_version,
      },
    }),
  );

  return {
    token: `${payload}.${sign(payload)}`,
    maxAge: remember ? REMEMBER_DURATION_SECONDS : undefined,
  };
}

export function verifyPartnerSessionToken(token) {
  if (!token || !token.includes(".") || token.length > 4096) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature || "");
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  const validSignature =
    signatureBuffer.length === expectedSignatureBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);

  if (!validSignature) return null;

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (!data.producer?.id || !data.producer?.username) return null;
    if (!Number.isInteger(data.producer?.session_version)) return null;
    return data.producer;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return false;
  }

  if (!origin) return true;

  return origin === request.nextUrl.origin;
}

export function jsonResponse(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...SECURITY_HEADERS,
      ...(init.headers || {}),
    },
  });
}

export function forbiddenResponse(message = "Forbidden") {
  return jsonResponse({ error: message }, { status: 403 });
}

export async function readJsonBody(request, maxBytes = JSON_BODY_LIMIT_BYTES) {
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > maxBytes) {
    return { data: null, error: "Request body too large", status: 413 };
  }

  const rawBody = await request.text().catch(() => "");

  if (!rawBody) {
    return { data: {}, error: null, status: 200 };
  }

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    return { data: null, error: "Request body too large", status: 413 };
  }

  try {
    return { data: JSON.parse(rawBody), error: null, status: 200 };
  } catch {
    return { data: null, error: "Invalid JSON body", status: 400 };
  }
}

export async function validateActivePartnerSession(producer) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const partnerLoginSecret = process.env.PARTNER_LOGIN_SECRET;

  if (!producer || !supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/partner_session_validate`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_producer_id: producer.id,
      p_username: producer.username,
      p_session_version: producer.session_version,
      p_app_secret: partnerLoginSecret,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return null;

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data[0] || null : null;
}

export function getPartnerCookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  if (typeof maxAge === "number") {
    options.maxAge = maxAge;
  }

  return options;
}
