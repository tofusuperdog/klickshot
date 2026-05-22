import { NextResponse } from "next/server";
import {
  getPartnerCookieOptions,
  PARTNER_SESSION_COOKIE,
} from "@/lib/partnerSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    PARTNER_SESSION_COOKIE,
    "",
    getPartnerCookieOptions(0),
  );

  return response;
}
