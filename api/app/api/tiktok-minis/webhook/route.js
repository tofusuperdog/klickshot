import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  activateCustomerVipSubscription,
  upsertTikTokCustomer,
} from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function parseSignatureHeader(signatureHeader) {
  if (!signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value),
  );

  if (!parts.t || !parts.s) return null;

  return {
    timestamp: parts.t,
    signature: parts.s,
  };
}

function safeCompareHex(a, b) {
  const first = Buffer.from(a, "hex");
  const second = Buffer.from(b, "hex");

  if (first.length !== second.length) return false;

  return crypto.timingSafeEqual(first, second);
}

function getWebhookSecret() {
  return (
    process.env.TIKTOK_MINIS_WEBHOOK_SECRET ||
    process.env.TIKTOK_CLIENT_SECRET ||
    ""
  );
}

function verifyTikTokSignature({ bodyText, signatureHeader, webhookSecret }) {
  if (!webhookSecret) {
    return {
      ok: false,
      reason:
        "TikTok webhook secret is not configured. Set TIKTOK_MINIS_WEBHOOK_SECRET or TIKTOK_CLIENT_SECRET.",
    };
  }

  const parsedSignature = parseSignatureHeader(signatureHeader);

  if (!parsedSignature) {
    return { ok: false, reason: "Missing or invalid TikTok-Signature header" };
  }

  const timestamp = Number(parsedSignature.timestamp);

  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: "Invalid TikTok signature timestamp" };
  }

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "TikTok signature timestamp is too old" };
  }

  const signedPayload = `${parsedSignature.timestamp}.${bodyText}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  if (!safeCompareHex(expectedSignature, parsedSignature.signature)) {
    return { ok: false, reason: "TikTok webhook signature mismatch" };
  }

  return { ok: true };
}

function parseWebhookContent(content) {
  if (!content) return {};
  if (typeof content === "object") return content;

  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function getVipPackageIdFromContent(content) {
  const structuredValue =
    content.vip_package_id ||
    content.package_id ||
    content.packageId ||
    content.product_id ||
    content.productId ||
    content.order_id ||
    content.orderId ||
    "";
  const structuredMatch = String(structuredValue).match(/vip_package_(\d+)/i);

  if (structuredMatch) return Number(structuredMatch[1]);

  const rawValue =
    content.vip_package_id ||
    content.package_id ||
    content.packageId ||
    content.product_id ||
    content.productId ||
    content.orderId ||
    "";
  const match = String(rawValue).match(/\d+/);

  return match ? Number(match[0]) : 0;
}

async function handleTradeOrderRedeemSuccess(payload) {
  const content = parseWebhookContent(payload.content);
  const packageId = getVipPackageIdFromContent(content);

  console.info("TikTok Minis payment success webhook received:", {
    event: payload.event,
    client_key: payload.client_key || "",
    user_openid: payload.user_openid || "",
    trade_order_id: content.trade_order_id || "",
    order_id: content.order_id || "",
    is_sandbox: content.is_sandbox,
  });

  if (!payload.user_openid || !packageId) return;

  const customer = await upsertTikTokCustomer(payload.user_openid);
  if (!customer?.id) return;

  await activateCustomerVipSubscription({
    customerId: customer.id,
    packageId,
    source: "tiktok_minis",
    sourceOrderId: content.order_id || null,
    sourceTradeOrderId: content.trade_order_id || null,
    metadata: {
      event: payload.event,
      is_sandbox: content.is_sandbox ?? null,
    },
  });
}

async function handleTradeOrderRefundTraceback(payload) {
  const content = parseWebhookContent(payload.content);

  console.info("TikTok Minis payment refund webhook received:", {
    event: payload.event,
    client_key: payload.client_key || "",
    user_openid: payload.user_openid || "",
    trade_order_id: content.trade_order_id || "",
    order_id: content.order_id || "",
    refund_amount: content.refund_amount,
    is_sandbox: content.is_sandbox,
  });

  // TODO: When payment tables are ready, reverse the entitlement or open a
  // review task depending on the VIP access policy.
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "tiktok-minis-webhook",
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request) {
  const bodyText = await request.text();
  const signatureHeader =
    request.headers.get("tiktok-signature") ||
    request.headers.get("TikTok-Signature");

  const signatureCheck = verifyTikTokSignature({
    bodyText,
    signatureHeader,
    webhookSecret: getWebhookSecret(),
  });

  if (!signatureCheck.ok) {
    console.warn("Rejected TikTok Minis webhook:", signatureCheck.reason);

    return NextResponse.json(
      { ok: false, error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let payload;

  try {
    payload = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  try {
    switch (payload.event) {
      case "minis.trade_order.redeem.success":
        await handleTradeOrderRedeemSuccess(payload);
        break;
      case "minis.trade_order.redeem.refund_traceback":
        await handleTradeOrderRefundTraceback(payload);
        break;
      default:
        console.info("TikTok Minis webhook received:", {
          event: payload.event || "",
          client_key: payload.client_key || "",
          user_openid: payload.user_openid || "",
        });
    }
  } catch (error) {
    console.error("Failed to process TikTok Minis webhook:", error);
  }

  return NextResponse.json({ ok: true });
}
