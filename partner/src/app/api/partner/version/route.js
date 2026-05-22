import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ version: null }, { status: 200 });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/public_partner_version`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ version: null }, { status: 200 });
  }

  const data = await response.json().catch(() => null);

  return NextResponse.json({
    version: typeof data === "string" ? data : null,
  });
}
