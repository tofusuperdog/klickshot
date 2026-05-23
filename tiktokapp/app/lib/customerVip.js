"use client";

import { getApiUrl } from "./apiBaseUrl";

const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";
export const CUSTOMER_VIP_UPDATED_EVENT = "minchap_customer_vip_updated";

function storeTikTokUser(user) {
  if (typeof window === "undefined") return;

  if (!user?.id) {
    window.localStorage.removeItem(TIKTOK_USER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(TIKTOK_USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("minchap:tiktok-user-updated"));
}

const waitForTikTokMinis = async () => {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (typeof window !== "undefined" && window.TTMinis?.login) {
      return window.TTMinis;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return null;
};

const getAuthorizationCode = (loginResult) =>
  loginResult?.code ||
  loginResult?.auth_code ||
  loginResult?.authCode ||
  loginResult?.authorization_code ||
  loginResult?.authorizationCode ||
  loginResult?.AuthorizationCode ||
  loginResult?.authCode ||
  loginResult?.authResponse?.code ||
  loginResult?.authResponse?.auth_code ||
  loginResult?.authResponse?.authCode ||
  loginResult?.authResponse?.authorization_code ||
  loginResult?.authResponse?.authorizationCode ||
  loginResult?.data?.authResponse?.code ||
  loginResult?.data?.authResponse?.auth_code ||
  loginResult?.data?.authResponse?.authCode ||
  loginResult?.data?.authResponse?.authorization_code ||
  loginResult?.data?.code ||
  loginResult?.data?.auth_code ||
  loginResult?.data?.authCode ||
  loginResult?.data?.authorization_code ||
  "";

const formatError = (error) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || error.errMsg || JSON.stringify(error);
};

const loginWithTikTokMinis = (ttMinis) =>
  new Promise((resolve, reject) => {
    let isSettled = false;
    const timeoutId = setTimeout(() => {
      finish(reject, new Error("TikTok login timed out."));
    }, 30000);

    function finish(handler, value) {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutId);
      handler(value);
    }

    function handleResult(result) {
      if (result?.then) {
        result
          .then((response) => {
            if (getAuthorizationCode(response)) {
              finish(resolve, response);
            }
          })
          .catch(() => {});
      } else if (getAuthorizationCode(result)) {
        finish(resolve, result);
      }
    }

    function handleLoginResponse(response) {
      if (getAuthorizationCode(response)) {
        finish(resolve, response);
        return;
      }

      finish(
        reject,
        new Error(
          `TikTok login did not return an authorization code: ${formatError(response)}`,
        ),
      );
    }

    try {
      const result = ttMinis.login(handleLoginResponse);

      handleResult(result);
    } catch (error) {
      finish(reject, error);
    }
  });

export async function refreshTikTokCustomerSession({
  requireAccessToken = false,
  onDebug = () => {},
} = {}) {
  const ttMinis = await waitForTikTokMinis();

  if (!ttMinis) {
    throw new Error("TikTok SDK is not available. Please open this in TikTok.");
  }

  if (!window.__MINCHAP_TIKTOK_SDK_READY__ && ttMinis.init) {
    ttMinis.init({ clientKey: window.__MINCHAP_TIKTOK_CLIENT_KEY__ });
    window.__MINCHAP_TIKTOK_SDK_READY__ = true;
  }

  onDebug({ status: "logging_in" });

  const loginResult = await loginWithTikTokMinis(ttMinis);
  const code = getAuthorizationCode(loginResult);

  if (!code) {
    throw new Error("TikTok login did not return an authorization code.");
  }

  onDebug({
    status: "exchanging",
    codeReceived: true,
    loginMethod: "login",
  });

  const response = await fetch(getApiUrl("/api/tiktok/silent-login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const payload = await response.json().catch(() => ({}));

  onDebug({
    apiStatus: response.status,
    apiOk: response.ok,
  });

  if (!response.ok) {
    const message = [payload.error, payload.details]
      .filter(Boolean)
      .join(": ");

    throw new Error(message || `Backend login failed: ${response.status}`);
  }

  storeTikTokUser(payload.user);
  const customer = getStoredCustomer();

  if (requireAccessToken && !customer?.tiktokAccessToken) {
    throw new Error("TikTok login did not return a payment access token.");
  }

  return customer;
}

export function getStoredCustomer() {
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
      tiktokAccessToken: user.access_token || "",
    };
  } catch {
    return null;
  }
}

export function isVipSubscriptionActive(subscription) {
  return Boolean(
    subscription?.is_active &&
      subscription?.expires_at &&
      new Date(subscription.expires_at).getTime() > Date.now(),
  );
}

export async function loadCustomerVipSubscription({ includeHistory = false } = {}) {
  let customer = getStoredCustomer();
  if (!customer) {
    try {
      customer = await refreshTikTokCustomerSession();
    } catch {
      return { is_active: false, subscription: null };
    }
  }

  const params = new URLSearchParams({
    customerId: String(customer.customerId),
    openId: customer.openId,
  });
  if (includeHistory) {
    params.set("includeHistory", "1");
  }
  const response = await fetch(
    getApiUrl(`/api/customer/vip-subscription?${params.toString()}`),
    {
      headers: {
        "x-customer-auth-token": customer.customerAuthToken,
      },
    },
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load VIP subscription.");
  }

  return payload;
}

export async function activateVipPackageForTest(packageId) {
  let customer = getStoredCustomer();
  if (!customer) {
    customer = await refreshTikTokCustomerSession({
      requireAccessToken: true,
    }).catch(() => null);
  }

  if (!customer) {
    throw new Error("Please sign in before subscribing VIP.");
  }

  const response = await fetch(getApiUrl("/api/customer/vip-subscription"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-customer-auth-token": customer.customerAuthToken,
    },
    body: JSON.stringify({
      customerId: customer.customerId,
      openId: customer.openId,
      packageId,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to activate VIP subscription.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CUSTOMER_VIP_UPDATED_EVENT, { detail: payload }),
    );
  }

  return payload;
}

export async function createTikTokVipPaymentOrder(packageId) {
  let customer = getStoredCustomer();
  if (!customer) {
    customer = await refreshTikTokCustomerSession().catch(() => null);
  }

  if (!customer) {
    throw new Error("Please sign in before subscribing VIP.");
  }

  if (!customer.tiktokAccessToken) {
    customer = await refreshTikTokCustomerSession({
      requireAccessToken: true,
    });
  }

  if (!customer?.tiktokAccessToken) {
    throw new Error("Please sign in again before paying with TikTok.");
  }

  const response = await fetch(getApiUrl("/api/tiktok-minis/payment-order"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-customer-auth-token": customer.customerAuthToken,
    },
    body: JSON.stringify({
      customerId: customer.customerId,
      openId: customer.openId,
      packageId,
      tiktokAccessToken: customer.tiktokAccessToken,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to create TikTok payment order.");
  }

  return payload;
}

export async function confirmTikTokVipPaymentOrder({
  paymentOrderToken,
  attempts = 12,
  delayMs = 1500,
} = {}) {
  let customer = getStoredCustomer();
  if (!customer) {
    customer = await refreshTikTokCustomerSession({
      requireAccessToken: true,
    }).catch(() => null);
  }

  if (!customer) {
    throw new Error("Please sign in before subscribing VIP.");
  }

  if (!customer.tiktokAccessToken) {
    customer = await refreshTikTokCustomerSession({
      requireAccessToken: true,
    });
  }

  if (!customer?.tiktokAccessToken) {
    throw new Error("Please sign in again before confirming TikTok payment.");
  }

  if (!paymentOrderToken) {
    throw new Error("TikTok payment confirmation token is missing.");
  }

  let lastPayload = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(getApiUrl("/api/tiktok-minis/payment-confirm"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-customer-auth-token": customer.customerAuthToken,
      },
      body: JSON.stringify({
        customerId: customer.customerId,
        openId: customer.openId,
        tiktokAccessToken: customer.tiktokAccessToken,
        paymentOrderToken,
      }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Unable to confirm TikTok payment.");
    }

    lastPayload = payload;

    if (isVipSubscriptionActive(payload.subscription)) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(CUSTOMER_VIP_UPDATED_EVENT, { detail: payload }),
        );
      }

      return payload;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return lastPayload || { is_active: false, subscription: null };
}

export async function waitForActiveVipSubscription({
  attempts = 20,
  delayMs = 1500,
} = {}) {
  let lastPayload = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    lastPayload = await loadCustomerVipSubscription();

    if (isVipSubscriptionActive(lastPayload.subscription)) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(CUSTOMER_VIP_UPDATED_EVENT, { detail: lastPayload }),
        );
      }

      return lastPayload;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return lastPayload || { is_active: false, subscription: null };
}
