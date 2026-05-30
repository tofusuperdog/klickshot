import {
  forbiddenResponse,
  getPartnerCookieOptions,
  isSameOriginRequest,
  jsonResponse,
  PARTNER_SESSION_COOKIE,
} from "@/lib/partnerSession";

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const response = jsonResponse({ ok: true });
  response.cookies.set(
    PARTNER_SESSION_COOKIE,
    "",
    getPartnerCookieOptions(0),
  );

  return response;
}
