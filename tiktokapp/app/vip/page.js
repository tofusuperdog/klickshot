"use client";

import { useLanguage } from "../LanguageContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  confirmTikTokVipPaymentOrder,
  createTikTokVipPaymentOrder,
  waitForActiveVipSubscription,
} from "../lib/customerVip";
import { SUPABASE_HEADERS, supabaseRestUrl } from "../lib/supabase";

export default function VipPage() {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch(
          supabaseRestUrl("vip_package?select=*&order=sort_order"),
          {
            headers: SUPABASE_HEADERS,
          },
        );
        const data = await response.json();
        setPackages(data);
      } catch (err) {
        console.error("Failed to fetch VIP packages:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  const benefits = [
    { id: 1, text: t("no_ads") },
    { id: 2, text: t("all_episodes") },
    { id: 3, text: t("unlimited_rewatch") },
  ];

  // Map database type to localized title if possible, else use DB type
  const getPackageTitle = (pkg) => {
    const type = pkg.type.toLowerCase();
    if (type.includes("สัปดาห์") || type.includes("weekly"))
      return t("weekly_vip");
    if (type.includes("เดือน") || type.includes("monthly"))
      return t("monthly_vip");
    return pkg.type;
  };

  const getPackageDescription = (pkg) => {
    const type = pkg.type.toLowerCase();
    if (type.includes("weekly"))
      return t("weekly_vip_desc");
    if (type.includes("monthly"))
      return t("monthly_vip_desc");
    return t("unlimited_watch");
  };

  // TikTok Minis payments use Beans as the payment unit.
  const getBeanAmount = (pkg) => {
    return Number(pkg.bean_amount || 0);
  };

  const getBeanPriceInfo = (pkg) => ({
    price: getBeanAmount(pkg),
    unit: "Beans",
  });

  const getThaiPackageTitle = (pkg) => {
    const type = pkg.type.toLowerCase();
    if (
      type.includes("à¸ªà¸±à¸›à¸”à¸²à¸«à¹Œ") ||
      type.includes("weekly")
    ) {
      return "รายสัปดาห์ - VIP";
    }
    if (
      type.includes("à¹€à¸”à¸·à¸­à¸™") ||
      type.includes("monthly")
    ) {
      return "รายเดือน - VIP";
    }
    return pkg.type;
  };

  const getLocalizedPaymentNotice = (pkg) => {
    const title = getPackageTitle(pkg);
    const { price, unit } = getBeanPriceInfo(pkg);

    switch (language) {
      case "EN":
        return `Package ${title}: ${price} ${unit}`;
      case "JP":
        return `パッケージ ${title}: ${price} ${unit}`;
      case "CN":
        return `套餐 ${title}: ${price} ${unit}`;
      default:
        return `แพ็กเกจ ${title} ราคา ${price} ${unit}`;
    }
  };

  const payWithTikTokMinis = (tradeOrderId) =>
    new Promise((resolve, reject) => {
      if (!tradeOrderId) {
        reject(new Error("TikTok payment order id is missing."));
        return;
      }

      if (typeof window === "undefined" || !window.TTMinis) {
        reject(new Error("TikTok payment SDK is not available."));
        return;
      }

      let isSettled = false;

      function finish(handler, value) {
        if (isSettled) return;
        isSettled = true;
        handler(value);
      }

      try {
        const options = { trade_order_id: tradeOrderId };
        let result;

        if (window.TTMinis.pay) {
          result = window.TTMinis.pay((response) => {
            if (response?.is_success) {
              finish(resolve, response);
              return;
            }

            finish(
              reject,
              new Error(
                response?.error?.error_msg ||
                  response?.error?.message ||
                  response?.error?.error_code ||
                  "TikTok payment was not completed.",
              ),
            );
          }, options);
        } else if (window.TTMinis.game?.pay) {
          result = window.TTMinis.game.pay({
            ...options,
            success: (response) => finish(resolve, response),
            fail: (error) =>
              finish(
                reject,
                new Error(
                  error?.errMsg ||
                    error?.message ||
                    "TikTok payment was not completed.",
                ),
              ),
            complete: () => {},
          });
        } else {
          finish(reject, new Error("TikTok payment SDK is not available."));
          return;
        }

        if (result?.then) {
          result.then(resolve).catch(reject);
        }
      } catch (error) {
        finish(reject, error);
      }
    });

  const handleVipPayment = async () => {
    if (!selectedPackage || paymentLoading) return;

    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      setPaymentMessage("Creating TikTok payment order...");
      const order = await createTikTokVipPaymentOrder(selectedPackage.id);
      const tradeOrderId =
        order?.trade_order_id ||
        order?.data?.trade_order_id ||
        order?.tradeOrderId ||
        "";
      const paymentOrderToken =
        order?.payment_order_token || order?.paymentOrderToken || "";

      if (!tradeOrderId) {
        throw new Error("TikTok payment order id is missing.");
      }
      if (!paymentOrderToken) {
        throw new Error("TikTok payment confirmation token is missing.");
      }

      setPaymentMessage("Opening TikTok payment...");
      await payWithTikTokMinis(tradeOrderId);

      setPaymentMessage("Payment received. Activating VIP...");
      let subscriptionPayload = await confirmTikTokVipPaymentOrder({
        paymentOrderToken,
      });

      if (!subscriptionPayload?.subscription?.is_active) {
        subscriptionPayload = await waitForActiveVipSubscription({
          attempts: 8,
          delayMs: 1500,
        });
      }

      if (!subscriptionPayload?.subscription?.is_active) {
        setPaymentMessage("Payment is processing. Please check your VIP status shortly.");
        return;
      }

      setPaymentMessage("VIP activated");
      setSelectedPackage(null);
      router.replace("/profile");
    } catch (error) {
      setPaymentMessage(error?.message || "Unable to activate VIP");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen pb-10 overflow-hidden text-white bg-black">
      {/* Main Content */}
      <div className="flex flex-col px-6 pt-4">
        {/* VIP Branding Section */}
        <div className="mb-7 flex items-center gap-4 rounded-[18px] bg-white/[0.025] px-1 py-2">
          <div className="relative h-[64px] w-[64px] shrink-0">
            <img
              src="/popcorn.svg"
              alt="Popcorn"
              className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-left">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
              {t("subscribe_vip")}
            </h1>
            <p className="text-[15px] font-medium leading-tight text-white/64">
              {t("unlimited_watch")}
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col gap-4 mb-8">
          {loading ? (
            <div className="flex justify-center w-full py-10">
              <div className="w-6 h-6 border-2 border-[#BF8EFF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            packages.map((pkg) => {
              const { price, unit } = getBeanPriceInfo(pkg);
              const title = getPackageTitle(pkg);
              const description = getPackageDescription(pkg);

              return (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => {
                    setPaymentMessage("");
                    setSelectedPackage(pkg);
                  }}
                  className={`relative w-full rounded-2xl p-5 overflow-hidden transition-all active:scale-95 scroll-mt-20 ${
                    pkg.is_recommended
                      ? "border border-[#C15BFF] bg-[radial-gradient(circle_at_36%_19%,rgba(235,188,255,0.16),transparent_18%),linear-gradient(115deg,#1B0A25_0%,#2F1544_48%,#16091F_100%)] shadow-[0_0_24px_rgba(178,55,255,0.26),inset_0_0_22px_rgba(199,91,255,0.13)]"
                      : "bg-[#121212] border border-white/10"
                  }`}
                >
                  {pkg.is_recommended && (
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_19%_34%,rgba(255,255,255,0.23),transparent_2px),radial-gradient(circle_at_24%_16%,rgba(255,151,236,0.55),transparent_2px),radial-gradient(circle_at_16%_57%,rgba(255,222,130,0.34),transparent_3px)]" />
                  )}

                  {pkg.is_recommended && (
                    <div className="absolute right-0 top-0 z-10 rounded-bl-xl bg-gradient-to-b from-[#B24BFF] to-[#7800D7] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_20px_rgba(143,42,255,0.38)]">
                      {t("popular_badge")}
                    </div>
                  )}

                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex flex-col text-left">
                        <h3
                          className={`text-xl font-bold mb-0.5 ${pkg.is_recommended ? "text-white" : "text-white/90"}`}
                        >
                          {title}
                        </h3>
                        <p
                          className={`text-[14px] pt-1 font-medium ${pkg.is_recommended ? "text-white/86" : "text-white/60"}`}
                        >
                          {description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-[24px] font-extrabold whitespace-nowrap pt-6 ${pkg.is_recommended ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.42)]" : "text-white/90"}`}
                    >
                      {price} {unit}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Benefits Box */}
        <div className="w-full rounded-[22px] border border-white/20 bg-[radial-gradient(circle_at_88%_35%,rgba(119,51,191,0.16),transparent_35%),linear-gradient(120deg,rgba(27,27,31,0.92),rgba(12,12,15,0.98))] px-7 pt-4 pb-2 shadow-[inset_0_0_28px_rgba(255,255,255,0.03)]">
          <h4 className="mb-2 text-left text-[18px] font-extrabold leading-tight text-white">
            {t("vip_benefits")}
          </h4>
          <div className="flex flex-col">
            {benefits.map((benefit, index) => (
              <div key={benefit.id}>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C344FF] to-[#6400C8] text-white shadow-[0_0_12px_rgba(184,65,255,0.62)]">
                    <svg
                      className="h-2.5 w-2.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-[16px]  leading-tight text-white/92">
                    {benefit.text}
                  </span>
                </div>
                {index < benefits.length - 1 && (
                  <div className="ml-[50px] h-[1px] bg-white/12" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedPackage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
          <div className="relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#BF8EFF]/25 bg-[#12091D] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E91E63] via-[#BF8EFF] to-[#6000B3]" />
            <div className="p-6 text-center pt-7">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#6000B3]/30 ring-1 ring-[#BF8EFF]/30">
                <img
                  src="/popcorn.svg"
                  alt="VIP"
                  className="object-contain w-8 h-8 drop-shadow"
                />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white">
                {t("subscribe_vip")}
              </h2>
              <div className="space-y-2 text-[15px] leading-relaxed text-white/78">
                <p>{getLocalizedPaymentNotice(selectedPackage)}</p>
                {paymentMessage ? (
                  <p className="text-[#FFB86B]">{paymentMessage}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleVipPayment}
                disabled={paymentLoading}
                className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-[#6000B3] to-[#8A2BE2] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(96,0,179,0.35)] transition-transform active:scale-[0.98]"
              >
                {paymentLoading ? "Processing..." : t("ok")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="mt-3 h-10 w-full rounded-xl border border-white/15 text-[14px] font-medium text-white/72 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
