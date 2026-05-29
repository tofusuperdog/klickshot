import { NextResponse } from "next/server";
import {
  PARTNER_SESSION_COOKIE,
  validateActivePartnerSession,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const partnerLoginSecret = process.env.PARTNER_LOGIN_SECRET;

async function callBillingRpc(name, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: data?.message || "Unable to load billing reports.",
      status: 502,
    };
  }

  return { data, error: null, status: 200 };
}

export async function GET(request) {
  const token = request.cookies.get(PARTNER_SESSION_COOKIE)?.value;
  const producer = await validateActivePartnerSession(verifyPartnerSessionToken(token));

  if (!producer) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return NextResponse.json({ error: "Partner billing is not configured." }, { status: 500 });
  }

  const reportId = request.nextUrl.searchParams.get("reportId");
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

  const result = await callBillingRpc(rpcName, payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ data: result.data });
}
