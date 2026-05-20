import { NextResponse } from "next/server";
import {
  activateCustomerVipSubscription,
  getActiveCustomerVipSubscription,
  getCustomerVipSubscriptionHistory,
} from "../../../lib/supabaseAdmin";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function isVipPaymentTestModeEnabled() {
  return (
    process.env.TIKTOK_PAYMENT_TEST_MODE === "true" ||
    process.env.TIKTOK_PAYMENT_TEST_MODE === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const body = {
    customerId: searchParams.get("customerId") || "",
    openId: searchParams.get("openId") || "",
  };
  const verified = verifyCustomer(request, body);

  if (!verified) {
    return json(request, { error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await getActiveCustomerVipSubscription({
      customerId: verified.customerId,
    });
    const includeHistory =
      searchParams.get("includeHistory") === "1" ||
      searchParams.get("history") === "1";
    const history = includeHistory
      ? await getCustomerVipSubscriptionHistory({
          customerId: verified.customerId,
          limit: 30,
        })
      : undefined;

    return json(request, {
      ok: true,
      is_active: Boolean(subscription?.is_active),
      subscription,
      ...(includeHistory ? { history } : {}),
    });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to load VIP subscription",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
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

  if (!isVipPaymentTestModeEnabled()) {
    return json(
      request,
      {
        error:
          "VIP activation must come from TikTok payment webhook outside test mode.",
      },
      { status: 403 },
    );
  }

  const packageId = Number(body.packageId || body.package_id);
  if (!Number.isFinite(packageId) || packageId <= 0) {
    return json(request, { error: "Missing VIP package id" }, { status: 400 });
  }

  try {
    const subscription = await activateCustomerVipSubscription({
      customerId: verified.customerId,
      packageId,
      source: "tiktok_minis_test",
      sourceOrderId: body.orderId || body.order_id || null,
      sourceTradeOrderId: body.tradeOrderId || body.trade_order_id || null,
      metadata: {
        test_mode: true,
      },
    });

    return json(request, {
      ok: true,
      is_active: Boolean(subscription?.is_active),
      subscription,
    });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to activate VIP subscription",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
