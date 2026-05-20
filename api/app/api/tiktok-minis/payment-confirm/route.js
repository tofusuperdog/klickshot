import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";
import { activateCustomerVipSubscription } from "../../../lib/supabaseAdmin";
import { verifyTikTokPaymentOrderToken } from "../../../lib/tiktokPaymentOrderToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIKTOK_TRADE_ORDER_QUERY_URL =
  "https://open.tiktokapis.com/v2/minis/trade_order/query/";

function json(request, data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: withCorsHeaders(request, {
      ...(init.headers || {}),
    }),
  });
}

function verifyCustomer(request, body = {}) {
  const authToken =
    request.headers.get("x-customer-auth-token") ||
    body.customerAuthToken ||
    body.customer_auth_token ||
    "";
  const verified = verifyCustomerAuthToken(authToken);

  if (!verified) return null;

  const requestedCustomerId = String(body.customerId || body.customer_id || "");
  const requestedOpenId = String(body.openId || body.open_id || "");

  if (
    (requestedCustomerId && requestedCustomerId !== verified.customerId) ||
    (requestedOpenId && requestedOpenId !== verified.openId)
  ) {
    return null;
  }

  return verified;
}

function getTikTokError(payload) {
  return (
    payload?.error?.message ||
    payload?.error_description ||
    payload?.message ||
    payload?.error?.code ||
    payload?.error ||
    "TikTok payment order query failed"
  );
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON body" }, { status: 400 });
  }

  const verified = verifyCustomer(request, body);
  if (!verified) {
    return json(request, { error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = String(
    body.tiktokAccessToken || body.tiktok_access_token || "",
  ).trim();
  const paymentOrderToken = verifyTikTokPaymentOrderToken(
    body.paymentOrderToken || body.payment_order_token || "",
  );

  if (!accessToken) {
    return json(
      request,
      { error: "Missing TikTok access token. Please sign in again." },
      { status: 400 },
    );
  }

  if (
    !paymentOrderToken ||
    String(paymentOrderToken.customerId) !== verified.customerId ||
    String(paymentOrderToken.openId) !== verified.openId
  ) {
    return json(
      request,
      { error: "Invalid TikTok payment order token." },
      { status: 400 },
    );
  }

  try {
    const tikTokResponse = await fetch(TIKTOK_TRADE_ORDER_QUERY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trade_order_id: paymentOrderToken.tradeOrderId,
      }),
      cache: "no-store",
    });
    const payload = await tikTokResponse.json().catch(() => ({}));

    if (!tikTokResponse.ok) {
      return json(
        request,
        { error: getTikTokError(payload), details: payload },
        { status: tikTokResponse.status || 502 },
      );
    }

    const status = String(payload?.data?.trade_order_status || "");
    if (status !== "SUCCESS") {
      return json(request, {
        ok: true,
        payment_status: status || "PENDING",
        is_active: false,
        subscription: null,
      });
    }

    const subscription = await activateCustomerVipSubscription({
      customerId: verified.customerId,
      packageId: Number(paymentOrderToken.packageId),
      source: "tiktok_minis_query",
      sourceOrderId: paymentOrderToken.orderId || null,
      sourceTradeOrderId: paymentOrderToken.tradeOrderId || null,
      metadata: {
        trade_order_status: status,
        token_amount: paymentOrderToken.tokenAmount ?? null,
      },
    });

    return json(request, {
      ok: true,
      payment_status: status,
      is_active: Boolean(subscription?.is_active),
      subscription,
    });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to confirm TikTok payment order",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
