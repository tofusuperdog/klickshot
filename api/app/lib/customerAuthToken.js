import crypto from "crypto";

const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function getSigningSecret() {
  return (
    process.env.CUSTOMER_AUTH_TOKEN_SECRET ||
    process.env.TIKTOK_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function signTokenPayload(encodedPayload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createCustomerAuthToken({ customerId, openId }) {
  const secret = getSigningSecret();

  if (!secret || !customerId || !openId) return "";

  const payload = base64UrlJson({
    customerId: String(customerId),
    openId: String(openId),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
  const signature = signTokenPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function verifyCustomerAuthToken(token) {
  const secret = getSigningSecret();

  if (!secret || !token) return null;

  const [encodedPayload, signature] = String(token).split(".");

  if (!encodedPayload || !signature) return null;

  const expectedSignature = signTokenPayload(encodedPayload, secret);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    if (!payload?.customerId || !payload?.openId || !payload?.exp) {
      return null;
    }

    if (Number(payload.exp) < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      customerId: String(payload.customerId),
      openId: String(payload.openId),
    };
  } catch {
    return null;
  }
}
