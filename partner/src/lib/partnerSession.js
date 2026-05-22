import crypto from "crypto";

export const PARTNER_SESSION_COOKIE = "partner_session";

const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const REMEMBER_DURATION_SECONDS = 30 * 24 * 60 * 60;

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
      },
    }),
  );

  return {
    token: `${payload}.${sign(payload)}`,
    maxAge: remember ? REMEMBER_DURATION_SECONDS : undefined,
  };
}

export function verifyPartnerSessionToken(token) {
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
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
    return data.producer;
  } catch {
    return null;
  }
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
