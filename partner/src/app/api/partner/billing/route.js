import {
  getActivePartnerFromRequest,
  getSupabaseConfig,
  jsonResponse,
} from "@/lib/partnerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function callBillingRpc(config, name, body) {
  const { supabaseUrl, supabaseKey } = config;
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      data: null,
      error: "Unable to load billing reports.",
      status: 502,
    };
  }

  const data = await response.json().catch(() => null);
  return { data, error: null, status: 200 };
}

export async function GET(request) {
  const producer = await getActivePartnerFromRequest(request);

  if (!producer) {
    return jsonResponse({ error: "Please sign in again." }, { status: 401 });
  }

  const { supabaseUrl, supabaseKey, partnerLoginSecret } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return jsonResponse({ error: "Partner billing is not configured." }, { status: 500 });
  }

  const reportId = request.nextUrl.searchParams.get("reportId");
  if (reportId && !UUID_PATTERN.test(reportId)) {
    return jsonResponse({ error: "Invalid report id." }, { status: 400 });
  }

  const rpcName = reportId ? "partner_billing_report_detail" : "partner_billing_reports";
  const payload = reportId
    ? {
        p_producer_id: producer.id,
        p_report_id: reportId,
        p_app_secret: partnerLoginSecret,
      }
    : {
        p_producer_id: producer.id,
        p_app_secret: partnerLoginSecret,
      };

  const result = await callBillingRpc({ supabaseUrl, supabaseKey }, rpcName, payload);

  if (result.error) {
    return jsonResponse({ error: result.error }, { status: result.status });
  }

  return jsonResponse({ data: result.data });
}
