import { NextResponse } from "next/server";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";
import { recordEpisodeDailyView } from "../../../lib/supabaseAdmin";

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

function toSafePositiveInteger(value) {
  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON body" }, { status: 400 });
  }

  const seriesId = toSafePositiveInteger(body?.seriesId);
  const episodeId = toSafePositiveInteger(body?.episodeId);
  const episodeNo = toSafePositiveInteger(body?.episodeNo);

  if (!seriesId) {
    return json(request, { error: "Invalid series id" }, { status: 400 });
  }

  if (!episodeId) {
    return json(request, { error: "Invalid episode id" }, { status: 400 });
  }

  if (!episodeNo) {
    return json(request, { error: "Invalid episode number" }, { status: 400 });
  }

  try {
    await recordEpisodeDailyView({
      seriesId,
      episodeId,
      episodeNo,
    });

    return json(request, { ok: true });
  } catch (error) {
    return json(
      request,
      {
        error: "Unable to record episode view",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
