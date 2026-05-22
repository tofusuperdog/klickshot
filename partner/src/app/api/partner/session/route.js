import { NextResponse } from "next/server";
import {
  PARTNER_SESSION_COOKIE,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export const runtime = "nodejs";

export async function GET(request) {
  const token = request.cookies.get(PARTNER_SESSION_COOKIE)?.value;
  const producer = verifyPartnerSessionToken(token);

  if (!producer) {
    return NextResponse.json({ producer: null }, { status: 401 });
  }

  return NextResponse.json({ producer });
}
