import { getSupabaseConfig, jsonResponse } from "@/lib/partnerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ version: null }, { status: 200 });
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
    return jsonResponse({ version: null }, { status: 200 });
  }

  const data = await response.json().catch(() => null);

  return jsonResponse({
    version: typeof data === "string" ? data : null,
  });
}
