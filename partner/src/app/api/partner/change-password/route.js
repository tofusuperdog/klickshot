import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  isSameOriginRequest,
  jsonResponse,
  PARTNER_SESSION_COOKIE,
  readJsonBody,
  validateActivePartnerSession,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const partnerLoginSecret = process.env.PARTNER_LOGIN_SECRET;

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

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
      { error: "Partner password change is not configured." },
      { status: 500 },
    );
  }

  const parsedBody = await readJsonBody(request, 8 * 1024);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const body = parsedBody.data || {};
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่" },
      { status: 400 },
    );
  }

  if (/\s/.test(newPassword)) {
    return NextResponse.json(
      { error: "รหัสผ่านใหม่ต้องไม่มีช่องว่าง" },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" },
      { status: 400 },
    );
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/partner_change_password`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_producer_id: producer.id,
      p_username: producer.username,
      p_current_password: currentPassword,
      p_new_password: newPassword,
      p_app_secret: partnerLoginSecret,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง หรือไม่สามารถเปลี่ยนรหัสผ่านได้" },
      { status: response.status === 401 ? 401 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
