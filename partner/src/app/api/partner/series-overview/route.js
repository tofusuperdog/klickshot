import {
  getActivePartnerFromRequest,
  getSupabaseConfig,
  jsonResponse,
} from "@/lib/partnerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedRanges = new Set([1, 7, 14]);

export async function GET(request) {
  const producer = await getActivePartnerFromRequest(request);

  if (!producer) {
    return jsonResponse({ error: "Please sign in again." }, { status: 401 });
  }

  const { supabaseUrl, supabaseKey, partnerLoginSecret } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return jsonResponse({ error: "Partner series is not configured." }, { status: 500 });
  }

  const requestedDays = Number(request.nextUrl.searchParams.get("days") || 1);
  const days = allowedRanges.has(requestedDays) ? requestedDays : 1;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/partner_series_overview`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_producer_id: producer.id,
      p_days: days,
      p_app_secret: partnerLoginSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return jsonResponse({ error: "Unable to load series data." }, { status: 502 });
  }

  const rows = await response.json().catch(() => []);

  return jsonResponse({ rows, days });
}
