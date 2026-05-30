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

const allowedCategories = new Set(["feedback", "suggestion", "issue"]);
const FEEDBACK_BODY_LIMIT_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const producer = await getActivePartnerFromRequest(request);

  if (!producer) {
    return jsonResponse({ error: "Please sign in again." }, { status: 401 });
  }

  const rateLimitKey = `feedback:${getClientIp(request)}:${producer.id}`;
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
    return jsonResponse(
      { error: "Too many feedback submissions. Please try again later." },
      { status: 429 },
    );
  }

  const { supabaseUrl, supabaseKey, partnerLoginSecret } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey || !partnerLoginSecret) {
    return jsonResponse({ error: "Partner feedback is not configured." }, { status: 500 });
  }

  const parsedBody = await readJsonBody(request, FEEDBACK_BODY_LIMIT_BYTES);
  if (parsedBody.error) {
    return jsonResponse({ error: parsedBody.error }, { status: parsedBody.status });
  }

  const body = parsedBody.data || {};
  const email = String(body?.email || "").trim();
  const message = String(body?.message || "").trim();
  const requestedCategory = String(body?.category || "feedback").trim();
  const category = allowedCategories.has(requestedCategory)
    ? requestedCategory
    : "feedback";

  if (!email || !message) {
    return jsonResponse({ error: "Please enter an email and message." }, { status: 400 });
  }

  if (email.length > 254 || !isValidEmail(email)) {
    return jsonResponse({ error: "Invalid email address." }, { status: 400 });
  }

  if (message.length > 5000) {
    return jsonResponse({ error: "Message is too long." }, { status: 400 });
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
    cache: "no-store",
  });

  if (!response.ok) {
    return jsonResponse(
      { error: "Unable to send feedback right now." },
      { status: response.status === 404 ? 404 : 502 },
    );
  }

  const data = await response.json().catch(() => null);

  return jsonResponse({
    ok: true,
    id: Array.isArray(data) ? data[0]?.id || null : data?.id || null,
  });
}
