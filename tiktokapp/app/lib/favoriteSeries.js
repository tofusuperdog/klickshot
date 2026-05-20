"use client";

import { getApiUrl } from "./apiBaseUrl";

export const FAVORITE_SERIES_STORAGE_KEY = "minchap_favorite_series";
export const MAX_FAVORITE_SERIES = 9;
const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";
const FAVORITE_SERIES_UPDATED_EVENT = "minchap_favorite_series_updated";

export function normalizeFavoriteSeriesItem(series) {
  if (!series?.id) return null;

  return {
    id: series.id,
    title_th: series.title_th || "",
    title_en: series.title_en || "",
    title_jp: series.title_jp || "",
    title_cn: series.title_cn || "",
    poster_url: series.poster_url || "",
    favorited_at: series.favorited_at || new Date().toISOString(),
  };
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

export function getFavoriteSeries() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FAVORITE_SERIES_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    return parsed
      .filter(
        (item) =>
          item?.id && !seen.has(String(item.id)) && seen.add(String(item.id)),
      )
      .slice(0, MAX_FAVORITE_SERIES);
  } catch {
    return [];
  }
}

function setFavoriteSeries(items) {
  if (typeof window === "undefined") return [];

  const seen = new Set();
  const normalized = (Array.isArray(items) ? items : [])
    .map(normalizeFavoriteSeriesItem)
    .filter(
      (item) =>
        item?.id && !seen.has(String(item.id)) && seen.add(String(item.id)),
    )
    .slice(0, MAX_FAVORITE_SERIES);

  window.localStorage.setItem(
    FAVORITE_SERIES_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(
    new CustomEvent(FAVORITE_SERIES_UPDATED_EVENT, { detail: normalized }),
  );

  return normalized;
}

export function isSeriesFavorite(seriesId) {
  if (!seriesId) return false;

  return getFavoriteSeries().some(
    (item) => String(item.id) === String(seriesId),
  );
}

async function saveFavoriteSeriesToDatabase({ seriesId, isFavorite }) {
  const customer = getStoredCustomer();
  if (!customer || !seriesId) return null;

  const response = await fetch(getApiUrl("/api/customer/favorite-series"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...customer,
      seriesId,
      isFavorite,
      favoritedAt: isFavorite ? new Date().toISOString() : null,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to save favorite series.");
  }

  return Array.isArray(payload.items) ? payload.items : null;
}

export async function setSeriesFavorite(series, isFavorite) {
  if (typeof window === "undefined" || !series?.id) return getFavoriteSeries();

  const nextItem = normalizeFavoriteSeriesItem(series);
  const current = getFavoriteSeries();
  const next = isFavorite
    ? [
        { ...nextItem, favorited_at: new Date().toISOString() },
        ...current.filter((item) => String(item.id) !== String(nextItem.id)),
      ].slice(0, MAX_FAVORITE_SERIES)
    : current.filter((item) => String(item.id) !== String(nextItem.id));

  setFavoriteSeries(next);

  const items = await saveFavoriteSeriesToDatabase({
    seriesId: nextItem.id,
    isFavorite,
  });
  if (items) return setFavoriteSeries(items);

  return next;
}

export async function loadFavoriteSeries({ fallbackToCache = true } = {}) {
  const customer = getStoredCustomer();

  if (!customer) return fallbackToCache ? getFavoriteSeries() : [];

  try {
    const params = new URLSearchParams({
      customerId: String(customer.customerId),
      openId: customer.openId,
    });
    const response = await fetch(
      getApiUrl(`/api/customer/favorite-series?${params.toString()}`),
      {
        headers: {
          "x-customer-auth-token": customer.customerAuthToken,
        },
      },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Unable to load favorite series.");
    }

    return setFavoriteSeries(payload.items || []);
  } catch (error) {
    console.error("Failed to load favorite series:", error);
    return fallbackToCache ? getFavoriteSeries() : [];
  }
}

export async function loadFavoriteSeriesStatus(seriesId) {
  const customer = getStoredCustomer();

  if (!customer || !seriesId) return isSeriesFavorite(seriesId);

  try {
    const params = new URLSearchParams({
      customerId: String(customer.customerId),
      openId: customer.openId,
      seriesId: String(seriesId),
    });
    const response = await fetch(
      getApiUrl(`/api/customer/favorite-series?${params.toString()}`),
      {
        headers: {
          "x-customer-auth-token": customer.customerAuthToken,
        },
      },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.error || "Unable to load favorite series status.",
      );
    }

    return Boolean(payload.isFavorite);
  } catch (error) {
    console.error("Failed to load favorite series status:", error);
    return isSeriesFavorite(seriesId);
  }
}
