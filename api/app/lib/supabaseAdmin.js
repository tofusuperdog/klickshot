const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabaseRestUrl(path) {
  return `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`;
}

function getServiceRoleHeaders(extraHeaders = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extraHeaders,
  };
}

function requireSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }
}

export async function upsertTikTokCustomer(openId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const response = await fetch(
    getSupabaseRestUrl(
      "customers?on_conflict=tiktok_open_id&select=id,tiktok_open_id,preferred_language",
    ),
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        tiktok_open_id: openId,
        last_login_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to upsert Supabase customer",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : payload;
}

function normalizeVipSubscription(item) {
  if (!item) return null;

  return {
    id: item.id,
    customer_id: item.customer_id,
    vip_package_id: item.vip_package_id,
    package_type: item.package_type,
    duration_days: item.duration_days,
    bean_amount: item.bean_amount,
    starts_at: item.starts_at,
    expires_at: item.expires_at,
    status: item.status,
    is_active:
      item.status === "active" && new Date(item.expires_at).getTime() > Date.now(),
  };
}

export async function getActiveCustomerVipSubscription({ customerId }) {
  requireSupabaseAdmin();

  const response = await fetch(
    getSupabaseRestUrl(
      `customer_vip_subscriptions?customer_id=eq.${encodeURIComponent(customerId)}&status=eq.active&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,customer_id,vip_package_id,package_type,duration_days,bean_amount,starts_at,expires_at,status&order=expires_at.desc&limit=1`,
    ),
    {
      method: "GET",
      headers: getServiceRoleHeaders(),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to fetch active VIP subscription",
    );
  }

  return normalizeVipSubscription(Array.isArray(payload) ? payload[0] : null);
}

export async function getCustomerVipSubscriptionHistory({
  customerId,
  limit = 30,
}) {
  requireSupabaseAdmin();

  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 30);
  const response = await fetch(
    getSupabaseRestUrl(
      `customer_vip_subscriptions?customer_id=eq.${encodeURIComponent(customerId)}&select=id,customer_id,vip_package_id,package_type,duration_days,bean_amount,starts_at,expires_at,status,source_order_id,source_trade_order_id,created_at&order=created_at.desc&limit=${safeLimit}`,
    ),
    {
      method: "GET",
      headers: getServiceRoleHeaders(),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to fetch VIP subscription history",
    );
  }

  return Array.isArray(payload) ? payload.map(normalizeVipSubscription) : [];
}

export async function getVipPackageById(packageId) {
  requireSupabaseAdmin();

  const response = await fetch(
    getSupabaseRestUrl(
      `vip_package?id=eq.${encodeURIComponent(packageId)}&select=id,type,bean_amount,duration_days,price_thb,sort_order&limit=1`,
    ),
    {
      method: "GET",
      headers: getServiceRoleHeaders(),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || "Failed to fetch VIP package",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : null;
}

export async function activateCustomerVipSubscription({
  customerId,
  packageId,
  source,
  sourceOrderId,
  sourceTradeOrderId,
  metadata,
}) {
  requireSupabaseAdmin();

  const vipPackage = await getVipPackageById(packageId);
  if (!vipPackage) {
    throw new Error("VIP package was not found");
  }

  const activeSubscription = await getActiveCustomerVipSubscription({
    customerId,
  });
  const now = new Date();
  const currentExpiry = activeSubscription?.expires_at
    ? new Date(activeSubscription.expires_at)
    : null;
  const startsAt =
    currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
  const durationDays = Number(vipPackage.duration_days || 7);
  const expiresAt = new Date(startsAt.getTime() + durationDays * 86400000);
  const beanAmount = Number(
    vipPackage.bean_amount ?? vipPackage.price_thb ?? 0,
  );

  const response = await fetch(
    getSupabaseRestUrl("customer_vip_subscriptions?select=id,customer_id,vip_package_id,package_type,duration_days,bean_amount,starts_at,expires_at,status"),
    {
      method: "POST",
      headers: getServiceRoleHeaders({
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        customer_id: customerId,
        vip_package_id: vipPackage.id,
        package_type: vipPackage.type,
        duration_days: durationDays,
        bean_amount: beanAmount,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
        source: source || "tiktok_minis",
        source_order_id: sourceOrderId || null,
        source_trade_order_id: sourceTradeOrderId || null,
        metadata: metadata || {},
      }),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to activate VIP subscription",
    );
  }

  return normalizeVipSubscription(Array.isArray(payload) ? payload[0] : payload);
}

export async function updateTikTokCustomerLanguage({ customerId, openId, language }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      `customers?id=eq.${encodeURIComponent(customerId)}&tiktok_open_id=eq.${encodeURIComponent(openId)}&select=id,tiktok_open_id,preferred_language`,
    ),
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        preferred_language: language,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to update Supabase customer language",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : payload;
}

export async function getTikTokCustomerById({ customerId, openId }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      `customers?id=eq.${encodeURIComponent(customerId)}&tiktok_open_id=eq.${encodeURIComponent(openId)}&select=id,tiktok_open_id,preferred_language&limit=1`,
    ),
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to fetch Supabase customer",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : payload;
}

export async function createContactMessage({
  customerId,
  name,
  email,
  message,
  locale,
  source,
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl("contact_messages?select=id"),
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        customer_id: customerId || null,
        name,
        email,
        message,
        locale: locale || null,
        source: source || "web",
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to create contact message",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : payload;
}

export async function upsertCustomerRecentSeries({
  customerId,
  seriesId,
  watchedAt,
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      "customer_recent_series?on_conflict=customer_id,series_id&select=id,customer_id,series_id,watched_at",
    ),
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        customer_id: customerId,
        series_id: seriesId,
        watched_at: watchedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to upsert customer recent series",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : payload;
}

export async function getCustomerRecentSeries({ customerId }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      `customer_recent_series?customer_id=eq.${encodeURIComponent(customerId)}&select=series_id,watched_at,series!inner(id,title_th,title_en,title_jp,title_cn,poster_url,status)&series.status=eq.published&order=watched_at.desc&limit=9`,
    ),
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to fetch customer recent series",
    );
  }

  return Array.isArray(payload)
    ? payload
        .map((item) =>
          item.series
            ? {
                ...item.series,
                watched_at: item.watched_at,
              }
            : null,
        )
        .filter(Boolean)
    : [];
}

export async function upsertCustomerFavoriteSeries({
  customerId,
  seriesId,
  favoritedAt,
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      "customer_favorite_series?on_conflict=customer_id,series_id&select=id,customer_id,series_id,favorited_at",
    ),
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        customer_id: customerId,
        series_id: seriesId,
        favorited_at: favoritedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to upsert customer favorite series",
    );
  }

  return Array.isArray(payload) ? payload[0] || null : payload;
}

export async function deleteCustomerFavoriteSeries({ customerId, seriesId }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      `customer_favorite_series?customer_id=eq.${encodeURIComponent(customerId)}&series_id=eq.${encodeURIComponent(seriesId)}`,
    ),
    {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to delete customer favorite series",
    );
  }

  return true;
}

export async function isCustomerFavoriteSeries({ customerId, seriesId }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      `customer_favorite_series?customer_id=eq.${encodeURIComponent(customerId)}&series_id=eq.${encodeURIComponent(seriesId)}&select=id&limit=1`,
    ),
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to fetch customer favorite series status",
    );
  }

  return Array.isArray(payload) && payload.length > 0;
}

export async function getCustomerFavoriteSeries({ customerId }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const response = await fetch(
    getSupabaseRestUrl(
      `customer_favorite_series?customer_id=eq.${encodeURIComponent(customerId)}&select=series_id,favorited_at,series!inner(id,title_th,title_en,title_jp,title_cn,poster_url,status)&series.status=eq.published&order=favorited_at.desc&limit=9`,
    ),
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Failed to fetch customer favorite series",
    );
  }

  return Array.isArray(payload)
    ? payload
        .map((item) =>
          item.series
            ? {
                ...item.series,
                favorited_at: item.favorited_at,
              }
            : null,
        )
        .filter(Boolean)
    : [];
}
