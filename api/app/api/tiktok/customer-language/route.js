import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";
import { updateTikTokCustomerLanguage } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_LANGUAGES = new Set(["TH", "EN", "JP", "CN"]);

function json(request, data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: withCorsHeaders(request, {
      ...(init.headers || {}),
    }),
  });
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON body" }, { status: 400 });
  }

  const customerId = String(body?.customerId || "").trim();
  const openId = String(body?.openId || "").trim();
  const customerAuthToken = String(body?.customerAuthToken || "").trim();
  const language = String(body?.language || "").trim().toUpperCase();
  const tokenPayload = verifyCustomerAuthToken(customerAuthToken);

  if (!customerId) {
    return json(request, { error: "Missing customer id" }, { status: 400 });
  }

  if (!openId) {
    return json(request, { error: "Missing TikTok open id" }, { status: 400 });
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return json(request, { error: "Unsupported language" }, { status: 400 });
  }

  if (
    !tokenPayload ||
    tokenPayload.customerId !== customerId ||
    tokenPayload.openId !== openId
  ) {
    return json(request, { error: "Invalid customer token" }, { status: 401 });
  }

  try {
    const customer = await updateTikTokCustomerLanguage({
      customerId,
      openId,
      language,
    });

    if (!customer) {
      return json(request, { error: "Customer not found" }, { status: 404 });
    }

    return json(request, { ok: true, customer });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to update customer language",
        details: error?.message || String(error),
      },
      { status: 502 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
