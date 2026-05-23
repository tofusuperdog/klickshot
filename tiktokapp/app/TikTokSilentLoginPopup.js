"use client";

import { useEffect } from "react";
import { getApiUrl } from "./lib/apiBaseUrl";

const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";
const TIKTOK_LOGIN_DEBUG_STORAGE_KEY = "minchap_tiktok_login_debug";

function shouldBypassTikTokAuth() {
  return (
    process.env.NODE_ENV === "development" &&
    ["1", "true", "yes"].includes(
      String(process.env.NEXT_PUBLIC_BYPASS_TIKTOK_AUTH || "").toLowerCase(),
    )
  );
}

function getDevBypassUser() {
  return {
    id: "dev-customer",
    open_id: "dev-open-id",
    customer_auth_token: "",
    preferred_language:
      window.localStorage.getItem("minchap_lang") ||
      "TH",
    scope: "dev-bypass",
    token_type: "dev",
    expires_in: null,
    refresh_expires_in: null,
    is_dev_bypass: true,
  };
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

const loginWithTikTokMinis = (ttMinis, onDebug = () => {}) =>
  new Promise((resolve, reject) => {
    let isSettled = false;
    let lastLoginCallback = null;
    const timeoutId = setTimeout(() => {
      finish(
        reject,
        new Error(
          lastLoginCallback
            ? `TikTok login did not return an authorization code: ${formatError(lastLoginCallback)}`
            : "TikTok login timed out.",
        ),
      );
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
            const code = getAuthorizationCode(response);

            onDebug({
              loginReturnedPromise: true,
              loginReturnedCode: Boolean(code),
            });

            if (code) {
              finish(resolve, { ...response, loginMethod: "login_promise" });
            }
          })
          .catch((error) => {
            onDebug({
              loginReturnedPromise: true,
              loginPromiseError: formatError(error),
            });
          });
      } else if (getAuthorizationCode(result)) {
        finish(resolve, result);
      }
    }

    function handleLoginResponse(response) {
      lastLoginCallback = response;
      onDebug({
        loginCallbackReceived: true,
        loginCallbackCode: Boolean(getAuthorizationCode(response)),
        loginCallbackError: response?.error ? formatError(response.error) : "",
      });

      const code = getAuthorizationCode(response);

      if (code) {
        finish(resolve, { ...response, loginMethod: "login" });
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

function getRuntimeDebugBase(extra = {}) {
  if (typeof window === "undefined") return extra;

  return {
    sdkAvailable: Boolean(window.TTMinis?.login),
    minisRuntime: Boolean(window.TTMinis?.isMinisRuntime),
    clientKeyConfigured: Boolean(window.__MINCHAP_TIKTOK_CLIENT_KEY__),
    initError: window.__MINCHAP_TIKTOK_INIT_ERROR__ || "",
    apiBaseUrl: window.__MINCHAP_API_BASE_URL__ || process.env.NEXT_PUBLIC_MINCHAP_API_BASE_URL || "",
    ...extra,
  };
}

function getSafeUserDebug(user = {}) {
  return {
    customerId: user?.id ? String(user.id) : "",
    openId: user?.tiktok_open_id || user?.open_id || user?.openId || "",
    customerAuthToken: Boolean(user?.customer_auth_token),
    accessToken: Boolean(user?.access_token),
    preferredLanguage: user?.preferred_language || "",
    isDevBypass: Boolean(user?.is_dev_bypass),
  };
}

function dispatchLoginState(detail) {
  if (typeof window === "undefined") return;

  const safeDetail = {
    updatedAt: new Date().toISOString(),
    ...getRuntimeDebugBase(detail),
  };

  window.__MINCHAP_TIKTOK_LOGIN_STATE__ = safeDetail;

  try {
    window.sessionStorage.setItem(
      TIKTOK_LOGIN_DEBUG_STORAGE_KEY,
      JSON.stringify(safeDetail),
    );
  } catch {}

  window.dispatchEvent(
    new CustomEvent("minchap:tiktok-login-state", { detail: safeDetail }),
  );
}

function storeTikTokUser(user) {
  if (typeof window === "undefined") return;

  if (!user?.id) {
    window.localStorage.removeItem(TIKTOK_USER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(TIKTOK_USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("minchap:tiktok-user-updated"));
}

export default function TikTokSilentLoginPopup() {
  useEffect(() => {
    let isMounted = true;

    async function runSilentLogin() {
      if (shouldBypassTikTokAuth()) {
        const devUser = getDevBypassUser();

        storeTikTokUser(devUser);
        dispatchLoginState({
          status: "success",
          source: "dev_bypass",
          ...getSafeUserDebug(devUser),
        });
        return;
      }

      dispatchLoginState({ status: "checking" });

      const ttMinis = await waitForTikTokMinis();

      if (!isMounted) return;

      if (!ttMinis) {
        window.localStorage.removeItem(TIKTOK_USER_STORAGE_KEY);
        dispatchLoginState({
          status: "not_tiktok",
          message: "TikTok Minis SDK is not available.",
        });
        return;
      }

      if (!window.__MINCHAP_TIKTOK_CLIENT_KEY__) {
        dispatchLoginState({
          status: "error",
          message: "TikTok client key is not configured.",
        });
        return;
      }

      try {
        if (!window.__MINCHAP_TIKTOK_SDK_READY__ && ttMinis.init) {
          ttMinis.init({ clientKey: window.__MINCHAP_TIKTOK_CLIENT_KEY__ });
          window.__MINCHAP_TIKTOK_SDK_READY__ = true;
        }

        dispatchLoginState({ status: "logging_in" });

        const loginResult = await loginWithTikTokMinis(ttMinis, (detail) => {
          dispatchLoginState({
            status: "logging_in",
            ...detail,
          });
        });
        const code = getAuthorizationCode(loginResult);

        if (!code) {
          throw new Error("TikTok login did not return an authorization code");
        }

        dispatchLoginState({
          status: "exchanging",
          codeReceived: true,
          loginMethod: loginResult?.loginMethod || "login",
        });

        const response = await fetch(getApiUrl("/api/tiktok/silent-login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const payload = await response.json().catch(() => ({}));
        const responseDebug = {
          apiStatus: response.status,
          apiOk: response.ok,
        };

        if (!response.ok) {
          const message = [payload.error, payload.details]
            .filter(Boolean)
            .join(": ");

          dispatchLoginState({
            status: "error",
            codeReceived: true,
            loginMethod: loginResult?.loginMethod || "login",
            ...responseDebug,
            message: message || `Backend login failed: ${response.status}`,
          });
          return;
        }

        storeTikTokUser(payload.user);

        if (!isMounted) return;

        dispatchLoginState({
          status: "success",
          codeReceived: true,
          loginMethod: loginResult?.loginMethod || "login",
          ...responseDebug,
          ...getSafeUserDebug(payload.user),
        });
      } catch (error) {
        if (!isMounted) return;

        dispatchLoginState({
          status: "error",
          message: formatError(error),
          errorName: error?.name || "",
          errorStack: error?.stack ? String(error.stack).slice(0, 320) : "",
        });
      }
    }

    runSilentLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
