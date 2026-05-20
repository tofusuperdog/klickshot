"use client";

import { getApiUrl } from "./apiBaseUrl";

export const RECENT_SERIES_STORAGE_KEY = "minchap_recent_series";
export const MAX_RECENT_SERIES = 9;
const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";
const RECENT_SERIES_UPDATED_EVENT = "minchap_recent_series_updated";

export function normalizeRecentSeriesItem(series) {
  if (!series?.id) return null;

  return {
    id: series.id,
    title_th: series.title_th || "",
    title_en: series.title_en || "",
    title_jp: series.title_jp || "",
    title_cn: series.title_cn || "",
    poster_url: series.poster_url || "",
    watched_at: series.watched_at || new Date().toISOString(),
  };
}

export function getRecentSeries() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SERIES_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    return parsed
      .filter((item) => item?.id && !seen.has(String(item.id)) && seen.add(String(item.id)))
      .slice(0, MAX_RECENT_SERIES);
  } catch {
    return [];
  }
}

function getStoredCustomer() {
  if (typeof window === "undefined") return null;

  try {
    const user = JSON.parse(
      window.localStorage.getItem(TIKTOK_USER_STORAGE_KEY) || "null",
    );

    if (
      !user?.id ||
      !user?.open_id ||
      !user?.customer_auth_token ||
      user?.is_dev_bypass
    ) {
      return null;
    }

    return {
      customerId: user.id,
      openId: user.open_id,
      customerAuthToken: user.customer_auth_token,
    };
  } catch {
    return null;
  }
}

function setRecentSeries(items) {
  if (typeof window === "undefined") return [];

  const seen = new Set();
  const normalized = (Array.isArray(items) ? items : [])
    .map(normalizeRecentSeriesItem)
    .filter((item) => item?.id && !seen.has(String(item.id)) && seen.add(String(item.id)))
    .slice(0, MAX_RECENT_SERIES);

  window.localStorage.setItem(
    RECENT_SERIES_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(
    new CustomEvent(RECENT_SERIES_UPDATED_EVENT, { detail: normalized }),
  );

  return normalized;
}

async function saveRecentSeriesToDatabase(series) {
  const customer = getStoredCustomer();
  if (!customer || !series?.id) return null;

  const response = await fetch(getApiUrl("/api/customer/recent-series"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...customer,
      seriesId: series.id,
      watchedAt: series.watched_at || null,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to save recent series.");
  }

  return Array.isArray(payload.items) ? payload.items : null;
}

export function saveRecentSeries(series) {
  if (typeof window === "undefined") return [];

  const nextItem = normalizeRecentSeriesItem(series);
  if (!nextItem) return getRecentSeries();

  const next = [
    nextItem,
    ...getRecentSeries().filter((item) => String(item.id) !== String(nextItem.id)),
  ].slice(0, MAX_RECENT_SERIES);

  setRecentSeries(next);
  saveRecentSeriesToDatabase(nextItem)
    .then((items) => {
      if (items) setRecentSeries(items);
    })
    .catch((error) => {
      console.error("Failed to sync recent series:", error);
    });

  return next;
}

async function syncLocalRecentSeriesToDatabase() {
  const customer = getStoredCustomer();
  if (!customer) return;

  const localItems = getRecentSeries();
  for (const item of [...localItems].reverse()) {
    await saveRecentSeriesToDatabase(item);
  }
}

export async function loadRecentSeries({
  fallbackToCache = true,
  syncLocal = true,
} = {}) {
  const customer = getStoredCustomer();

  if (!customer) return fallbackToCache ? getRecentSeries() : [];

  try {
    if (syncLocal) {
      await syncLocalRecentSeriesToDatabase();
    }

    const params = new URLSearchParams({
      customerId: String(customer.customerId),
      openId: customer.openId,
    });
    const response = await fetch(
      getApiUrl(`/api/customer/recent-series?${params.toString()}`),
      {
        headers: {
          "x-customer-auth-token": customer.customerAuthToken,
        },
      },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Unable to load recent series.");
    }

    return setRecentSeries(payload.items || []);
  } catch (error) {
    console.error("Failed to load recent series:", error);
    return fallbackToCache ? getRecentSeries() : [];
  }
}
