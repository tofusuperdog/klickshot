import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECURITY_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...SECURITY_HEADERS,
      ...(init.headers || {}),
    },
  });
}

export async function GET() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ version: null });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/system_versions?system_type=eq.website&select=version_number&order=release_date.desc&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response?.ok) {
    return jsonResponse({ version: null });
  }

  const data = await response.json().catch(() => []);
  const version = Array.isArray(data) ? data[0]?.version_number || null : null;

  return jsonResponse({ version });
}
