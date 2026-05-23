"use client";

import { useEffect } from "react";
import { getApiUrl } from "./lib/apiBaseUrl";

const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";

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

const loginWithTikTokMinis = (ttMinis) =>
  new Promise((resolve, reject) => {
    let isSettled = false;
    const timeoutId = setTimeout(() => {
      finish(
        reject,
        new Error("TikTok login timed out."),
      );
    }, 15000);

    function finish(handler, value) {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutId);
      handler(value);
    }

    function handleResult(result) {
      if (result?.then) {
        result
          .then((response) => finish(resolve, response))
          .catch((error) => finish(reject, error));
      } else if (getAuthorizationCode(result)) {
        finish(resolve, result);
      }
    }

    function runLegacyLogin() {
      return ttMinis.login(
        (response) => {
          const code = getAuthorizationCode(response);

          if (code) {
            finish(resolve, response);
            return;
          }

          finish(
            reject,
            new Error(
              `TikTok login did not return an authorization code: ${formatError(response)}`,
            ),
          );
        },
        {
          returnScopes: true,
        },
      );
    }

    try {
      const result = ttMinis.login({
        success: (response) => finish(resolve, response),
        fail: (error) => finish(reject, error),
        complete: () => {},
      });

      handleResult(result);
    } catch (error) {
      try {
        handleResult(runLegacyLogin());
      } catch (legacyError) {
        finish(reject, legacyError || error);
      }
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

function dispatchLoginState(detail) {
  if (typeof window === "undefined") return;
  window.__MINCHAP_TIKTOK_LOGIN_STATE__ = detail;
  window.dispatchEvent(
    new CustomEvent("minchap:tiktok-login-state", { detail }),
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
        dispatchLoginState({ status: "success", user: devUser });
        return;
      }

      dispatchLoginState({ status: "checking" });

      const ttMinis = await waitForTikTokMinis();

      if (!isMounted) return;

      if (!ttMinis) {
        window.localStorage.removeItem(TIKTOK_USER_STORAGE_KEY);
        dispatchLoginState({ status: "not_tiktok" });
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

        const loginResult = await loginWithTikTokMinis(ttMinis);
        const code = getAuthorizationCode(loginResult);

        if (!code) {
          throw new Error("TikTok login did not return an authorization code");
        }

        dispatchLoginState({ status: "exchanging" });

        const response = await fetch(getApiUrl("/api/tiktok/silent-login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || `Backend login failed: ${response.status}`);
        }

        storeTikTokUser(payload.user);

        if (!isMounted) return;

        dispatchLoginState({ status: "success", user: payload.user });
      } catch (error) {
        if (!isMounted) return;

        dispatchLoginState({
          status: "error",
          message: formatError(error),
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
