import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { verifyCustomerAuthToken } from "../../../lib/customerAuthToken";
import { recordTikTokAppDailyVisit } from "../../../lib/supabaseAdmin";

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

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {}

  const authToken =
    request.headers.get("x-customer-auth-token") ||
    body.customerAuthToken ||
    body.customer_auth_token ||
    "";
  const verified = authToken ? verifyCustomerAuthToken(authToken) : null;
  const requestedCustomerId = String(body.customerId || body.customer_id || "");
  const requestedOpenId = String(body.openId || body.open_id || "");
  const canUseCustomer =
    verified &&
    (!requestedCustomerId || requestedCustomerId === verified.customerId) &&
    (!requestedOpenId || requestedOpenId === verified.openId);

  try {
    await recordTikTokAppDailyVisit({
      customerId: canUseCustomer ? verified.customerId : null,
    });

    return json(request, { ok: true });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to record app visit",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
