export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vxskkaxvlgycokdtuocj.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "sb_publishable_EulroVhS18qjuuQ31ERKig_0memrNhJ";

function getSupabaseProjectRef() {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

function decodeBase64UrlJson(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isLegacyJwtForCurrentProject(key) {
  const [, payload] = String(key || "").split(".");

  if (!payload) return true;

  const decoded = decodeBase64UrlJson(payload);
  const projectRef = getSupabaseProjectRef();

  return Boolean(decoded?.ref && projectRef && decoded.ref === projectRef);
}

function getSupabaseAnonKey() {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!envKey) return FALLBACK_SUPABASE_ANON_KEY;
  if (!envKey.includes(".")) return envKey;

  return isLegacyJwtForCurrentProject(envKey)
    ? envKey
    : FALLBACK_SUPABASE_ANON_KEY;
}

export const SUPABASE_ANON_KEY = getSupabaseAnonKey();

export const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export function supabaseRestUrl(path) {
  return `${SUPABASE_URL}/rest/v1/${path}`;
}
