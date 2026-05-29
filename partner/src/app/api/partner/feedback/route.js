import { NextResponse } from "next/server";
import {
  PARTNER_SESSION_COOKIE,
  validateActivePartnerSession,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const partnerLoginSecret = process.env.PARTNER_LOGIN_SECRET;
const allowedCategories = new Set(["feedback", "suggestion", "issue"]);

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  const token = request.cookies.get(PARTNER_SESSION_COOKIE)?.value;
  const producer = await validateActivePartnerSession(verifyPartnerSessionToken(token));

  if (!producer) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง" },
      { status: 401 },
    );
  }

  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return NextResponse.json(
      { error: "Partner feedback is not configured." },
      { status: 500 },
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = String(body?.email || "").trim();
  const message = String(body?.message || "").trim();
  const requestedCategory = String(body?.category || "feedback").trim();
  const category = allowedCategories.has(requestedCategory)
    ? requestedCategory
    : "feedback";

  if (!email || !message) {
    return NextResponse.json(
      { error: "กรุณากรอกอีเมลและข้อความ" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "รูปแบบอีเมลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/partner_contact_message_create`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_producer_id: producer.id,
      p_name: producer.name,
      p_username: producer.username,
      p_email: email,
      p_category: category,
      p_message: message,
      p_app_secret: partnerLoginSecret,
    }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "ไม่สามารถส่งข้อความได้ในขณะนี้",
        details: data?.message || data?.error || null,
      },
      { status: response.status === 404 ? 404 : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: Array.isArray(data) ? data[0]?.id || null : data?.id || null,
  });
}
