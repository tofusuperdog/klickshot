export function getApiBaseUrl() {
  const envBaseUrl =
    process.env.NEXT_PUBLIC_MINCHAP_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return String(window.__MINCHAP_API_BASE_URL__ || "").replace(/\/$/, "");
  }

  return "";
}

export function getApiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}
