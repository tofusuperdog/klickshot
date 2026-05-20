import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";
import {
  getCustomerRecentSeries,
  getTikTokCustomerById,
  upsertCustomerRecentSeries,
} from "../../../lib/supabaseAdmin";

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

async function verifyCustomer(request, body = null) {
  const url = new URL(request.url);
  const customerId = String(
    body?.customerId || url.searchParams.get("customerId") || "",
  ).trim();
  const openId = String(
    body?.openId || url.searchParams.get("openId") || "",
  ).trim();
  const customerAuthToken = String(
    body?.customerAuthToken ||
      request.headers.get("x-customer-auth-token") ||
      "",
  ).trim();
  const tokenPayload = verifyCustomerAuthToken(customerAuthToken);

  if (!customerId) {
    return { error: { message: "Missing customer id", status: 400 } };
  }

  if (!openId) {
    return { error: { message: "Missing TikTok open id", status: 400 } };
  }

  if (
    !tokenPayload ||
    tokenPayload.customerId !== customerId ||
    tokenPayload.openId !== openId
  ) {
    return { error: { message: "Invalid customer token", status: 401 } };
  }

  const customer = await getTikTokCustomerById({
    customerId: tokenPayload.customerId,
    openId: tokenPayload.openId,
  });

  if (!customer) {
    return { error: { message: "Customer not found", status: 404 } };
  }

  return { customer };
}

export async function GET(request) {
  try {
    const verification = await verifyCustomer(request);

    if (verification.error) {
      return json(
        request,
        { error: verification.error.message },
        { status: verification.error.status },
      );
    }

    const items = await getCustomerRecentSeries({
      customerId: verification.customer.id,
    });

    return json(request, { ok: true, items });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to fetch recent series",
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

  const seriesId = Number(body?.seriesId);
  const watchedAt = String(body?.watchedAt || "").trim();

  if (!Number.isSafeInteger(seriesId)) {
    return json(request, { error: "Invalid series id" }, { status: 400 });
  }

  if (watchedAt && Number.isNaN(Date.parse(watchedAt))) {
    return json(request, { error: "Invalid watched timestamp" }, { status: 400 });
  }

  try {
    const verification = await verifyCustomer(request, body);

    if (verification.error) {
      return json(
        request,
        { error: verification.error.message },
        { status: verification.error.status },
      );
    }

    await upsertCustomerRecentSeries({
      customerId: verification.customer.id,
      seriesId,
      watchedAt: watchedAt || null,
    });

    const items = await getCustomerRecentSeries({
      customerId: verification.customer.id,
    });

    return json(request, { ok: true, items });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to save recent series",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
