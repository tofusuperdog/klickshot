import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { createCustomerAuthToken } from "../../../lib/customerAuthToken";
import { upsertTikTokCustomer } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIKTOK_OAUTH_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
function json(request, data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: withCorsHeaders(request, {
      ...(init.headers || {}),
    }),
  });
}

function getTokenPayload(payload) {
  return payload?.data || payload;
}

function getTikTokError(payload) {
  return (
    payload?.error?.message ||
    payload?.error_description ||
    payload?.message ||
    payload?.error ||
    "TikTok OAuth token exchange failed"
  );
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      request,
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const code = String(body?.code || "").trim();
  const clientKey =
    process.env.TIKTOK_CLIENT_KEY || process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!code) {
    return json(
      request,
      { error: "Missing TikTok authorization code" },
      { status: 400 },
    );
  }

  if (!clientKey || !clientSecret) {
    return json(
      request,
      {
        error:
          "TikTok credentials are not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET on the backend.",
      },
      { status: 500 },
    );
  }

  const form = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
  });

  try {
    const tokenResponse = await fetch(TIKTOK_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      cache: "no-store",
    });

    const payload = await tokenResponse.json().catch(() => ({}));

    if (!tokenResponse.ok) {
      return json(
        request,
        { error: getTikTokError(payload), details: payload },
        { status: tokenResponse.status },
      );
    }

    const token = getTokenPayload(payload);

    if (!token?.open_id) {
      return json(
        request,
        {
          error: "TikTok OAuth response did not include open_id",
          details: payload,
        },
        { status: 502 },
      );
    }

    const customer = await upsertTikTokCustomer(token.open_id);
    const customerAuthToken = createCustomerAuthToken({
      customerId: customer?.id,
      openId: token.open_id,
    });

    return json(request, {
      ok: true,
      user: {
        id: customer?.id || null,
        open_id: token.open_id,
        customer_auth_token: customerAuthToken,
        preferred_language: customer?.preferred_language || null,
        scope: token.scope || "",
        token_type: token.token_type || "",
        access_token: token.access_token || "",
        expires_in: token.expires_in || null,
        refresh_expires_in: token.refresh_expires_in || null,
      },
    });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to exchange TikTok authorization code",
        details: error?.message || String(error),
      },
      { status: 502 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
