import {
  forbiddenResponse,
  getActivePartnerFromRequest,
  getClientIp,
  getSupabaseConfig,
  isRateLimited,
  isSameOriginRequest,
  jsonResponse,
  readJsonBody,
} from "@/lib/partnerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PASSWORD_BODY_LIMIT_BYTES = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const producer = await getActivePartnerFromRequest(request);

  if (!producer) {
    return jsonResponse({ error: "Please sign in again." }, { status: 401 });
  }

  const rateLimitKey = `change-password:${getClientIp(request)}:${producer.id}`;
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse(
      { error: "Too many password change attempts. Please try again later." },
      { status: 429 },
    );
  }

  const { supabaseUrl, supabaseKey, partnerLoginSecret } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return jsonResponse({ error: "Partner password change is not configured." }, { status: 500 });
  }

  const parsedBody = await readJsonBody(request, PASSWORD_BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const body = parsedBody.data || {};
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return jsonResponse({ error: "Please enter the current and new passwords." }, { status: 400 });
  }

  if (currentPassword.length > 512 || newPassword.length > 512) {
    return jsonResponse({ error: "Invalid password." }, { status: 400 });
  }

  if (/\s/.test(newPassword)) {
    return jsonResponse({ error: "New password must not contain spaces." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return jsonResponse({ error: "New password must be at least 6 characters." }, { status: 400 });
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
    cache: "no-store",
  });

  if (!response.ok) {
    return jsonResponse(
      { error: "Unable to change password with the provided current password." },
      { status: response.status === 401 ? 401 : 400 },
    );
  }

  return jsonResponse({ ok: true });
}
