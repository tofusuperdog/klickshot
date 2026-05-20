import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";
import {
  deleteCustomerFavoriteSeries,
  getCustomerFavoriteSeries,
  getTikTokCustomerById,
  isCustomerFavoriteSeries,
  upsertCustomerFavoriteSeries,
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

    const url = new URL(request.url);
    const seriesId = Number(url.searchParams.get("seriesId") || "");

    if (url.searchParams.has("seriesId")) {
      if (!Number.isSafeInteger(seriesId)) {
        return json(request, { error: "Invalid series id" }, { status: 400 });
      }

      const isFavorite = await isCustomerFavoriteSeries({
        customerId: verification.customer.id,
        seriesId,
      });

      return json(request, { ok: true, isFavorite });
    }

    const items = await getCustomerFavoriteSeries({
      customerId: verification.customer.id,
    });

    return json(request, { ok: true, items });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to fetch favorite series",
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
  const shouldFavorite = Boolean(body?.isFavorite);
  const favoritedAt = String(body?.favoritedAt || "").trim();

  if (!Number.isSafeInteger(seriesId)) {
    return json(request, { error: "Invalid series id" }, { status: 400 });
  }

  if (favoritedAt && Number.isNaN(Date.parse(favoritedAt))) {
    return json(
      request,
      { error: "Invalid favorited timestamp" },
      { status: 400 },
    );
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

    if (shouldFavorite) {
      await upsertCustomerFavoriteSeries({
        customerId: verification.customer.id,
        seriesId,
        favoritedAt: favoritedAt || null,
      });
    } else {
      await deleteCustomerFavoriteSeries({
        customerId: verification.customer.id,
        seriesId,
      });
    }

    const items = await getCustomerFavoriteSeries({
      customerId: verification.customer.id,
    });

    return json(request, { ok: true, isFavorite: shouldFavorite, items });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to save favorite series",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
