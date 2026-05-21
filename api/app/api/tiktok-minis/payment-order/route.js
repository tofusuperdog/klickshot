import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";
import { getVipPackageById } from "../../../lib/supabaseAdmin";
import { createTikTokPaymentOrderToken } from "../../../lib/tiktokPaymentOrderToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIKTOK_TRADE_ORDER_CREATE_URL =
  "https://open.tiktokapis.com/v2/minis/trade_order/create/";

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
    "TikTok payment order creation failed"
  );
}

function getBeanAmount(vipPackage) {
  return Number(vipPackage?.bean_amount ?? 0);
}

function getProductName(vipPackage) {
  const type = String(vipPackage?.type || "VIP").trim();
  return type ? `MinChap ${type}` : "MinChap VIP";
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
  const packageId = Number(body.packageId || body.package_id);

  if (!accessToken) {
    return json(
      request,
      { error: "Missing TikTok access token. Please sign in again." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(packageId) || packageId <= 0) {
    return json(request, { error: "Missing VIP package id" }, { status: 400 });
  }

  try {
    const vipPackage = await getVipPackageById(packageId);
    const tokenAmount = getBeanAmount(vipPackage);

    if (!vipPackage || !Number.isFinite(tokenAmount) || tokenAmount <= 0) {
      return json(
        request,
        { error: "VIP package is unavailable for TikTok payment." },
        { status: 400 },
      );
    }

    const orderId = [
      "minchap",
      `vip_package_${packageId}`,
      verified.customerId,
      Date.now(),
    ].join("_");

    const orderPayload = {
      token_type: "BEANS",
      token_amount: tokenAmount,
      order_info: {
        order_id: orderId,
        product_id: `vip_package_${packageId}`,
        product_name: getProductName(vipPackage),
        order_url: "/bill",
        quantity: 1,
        quantity_unit: "package",
        image_url:
          process.env.TIKTOK_MINIS_PAYMENT_IMAGE_URL ||
          "https://tiktok.minchapseries.com/popcorn.svg",
      },
    };

    const tikTokResponse = await fetch(TIKTOK_TRADE_ORDER_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
      cache: "no-store",
    });
    const payload = await tikTokResponse.json().catch(() => ({}));

    if (!tikTokResponse.ok || !payload?.data?.trade_order_id) {
      return json(
        request,
        {
          error: getTikTokError(payload),
          details: payload,
        },
        { status: tikTokResponse.status || 502 },
      );
    }

    return json(request, {
      ok: true,
      order_id: orderId,
      trade_order_id: payload.data.trade_order_id,
      payment_order_token: createTikTokPaymentOrderToken({
        customerId: verified.customerId,
        openId: verified.openId,
        packageId,
        orderId,
        tradeOrderId: payload.data.trade_order_id,
        tokenAmount,
      }),
      package_id: packageId,
      token_amount: tokenAmount,
    });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to create TikTok payment order",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
