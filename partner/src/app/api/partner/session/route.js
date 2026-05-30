import {
  getPartnerCookieOptions,
  jsonResponse,
  PARTNER_SESSION_COOKIE,
  validateActivePartnerSession,
  verifyPartnerSessionToken,
} from "@/lib/partnerSession";

export const runtime = "nodejs";

export async function GET(request) {
  const token = request.cookies.get(PARTNER_SESSION_COOKIE)?.value;
  const producer = verifyPartnerSessionToken(token);

  if (!producer) {
    const response = jsonResponse({ producer: null }, { status: 401 });
    response.cookies.set(PARTNER_SESSION_COOKIE, "", getPartnerCookieOptions(0));
    return response;
  }

  const activeProducer = await validateActivePartnerSession(producer);

  if (!activeProducer) {
    const response = jsonResponse({ producer: null }, { status: 401 });
    response.cookies.set(PARTNER_SESSION_COOKIE, "", getPartnerCookieOptions(0));
    return response;
  }

  return jsonResponse({ producer: activeProducer });
}
