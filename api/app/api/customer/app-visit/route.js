import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
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
  try {
    await recordTikTokAppDailyVisit();

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
