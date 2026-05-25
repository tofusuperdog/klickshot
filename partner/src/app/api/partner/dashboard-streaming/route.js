import { NextResponse } from "next/server";
import {
  PARTNER_SESSION_COOKIE,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const partnerLoginSecret = process.env.PARTNER_LOGIN_SECRET;
const allowedRanges = new Set([7, 14, 30]);

export async function GET(request) {
  const token = request.cookies.get(PARTNER_SESSION_COOKIE)?.value;
  const producer = verifyPartnerSessionToken(token);

  if (!producer) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง" },
      { status: 401 },
    );
  }

  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return NextResponse.json(
      { error: "Partner dashboard is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") || 7);
  const days = allowedRanges.has(requestedDays) ? requestedDays : 7;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/partner_dashboard_streaming`, {
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
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลกราฟได้ในขณะนี้" },
      { status: 502 },
    );
  }

  const rows = await response.json().catch(() => []);

  return NextResponse.json({ rows, days });
}
