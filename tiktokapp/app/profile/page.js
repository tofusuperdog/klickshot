"use client";

import { useLanguage } from "../LanguageContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  CUSTOMER_VIP_UPDATED_EVENT,
  isVipSubscriptionActive,
  loadCustomerVipSubscription,
} from "../lib/customerVip";
import { SUPABASE_HEADERS, supabaseRestUrl } from "../lib/supabase";

const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";
const LANGUAGE_OPTIONS = [
  { code: "TH", label: "\u0e44\u0e17\u0e22" },
  { code: "EN", label: "English" },
  { code: "CN", label: "\u4e2d\u6587" },
  { code: "JP", label: "\u65e5\u672c\u8a9e" },
];
const LANGUAGE_LABELS = LANGUAGE_OPTIONS.reduce((labels, option) => {
  labels[option.code] = option.label;
  return labels;
}, {});

function LanguageIcon() {
  return (
    <svg
      className="h-[25px] w-[25px] text-[#B95CFF]"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function readStoredUserId() {
  if (typeof window === "undefined") return "-";

  try {
    const storedUser = JSON.parse(
      window.localStorage.getItem(TIKTOK_USER_STORAGE_KEY) || "null",
    );

    return storedUser?.id ? String(storedUser.id) : "-";
  } catch {
    return "-";
  }
}

export default function AppProfile() {
  const { language, changeLanguage, t } = useLanguage();
  const [isVipActive, setIsVipActive] = useState(true);
  const [version, setVersion] = useState("1.01");
  const [userId, setUserId] = useState("-");
  const [vipSubscription, setVipSubscription] = useState(null);
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);

  const headers = SUPABASE_HEADERS;

  useEffect(() => {
    setUserId(readStoredUserId());

    const updateUserId = () => {
      setUserId(readStoredUserId());
      loadCustomerVipSubscription()
        .then((payload) => setVipSubscription(payload.subscription || null))
        .catch(() => setVipSubscription(null));
    };

    window.addEventListener("storage", updateUserId);
    window.addEventListener("minchap:tiktok-user-updated", updateUserId);
    window.addEventListener(CUSTOMER_VIP_UPDATED_EVENT, updateUserId);
    updateUserId();

    return () => {
      window.removeEventListener("storage", updateUserId);
      window.removeEventListener("minchap:tiktok-user-updated", updateUserId);
      window.removeEventListener(CUSTOMER_VIP_UPDATED_EVENT, updateUserId);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchVersion = fetch(
          supabaseRestUrl(
            "system_versions?system_type=eq.app&select=version_number&order=release_date.desc&limit=1",
          ),
          { headers },
        );
        const fetchSettings = fetch(
          supabaseRestUrl("app_settings?select=*&id=eq.1"),
          { headers },
        );

        const [vRes, sRes] = await Promise.all([fetchVersion, fetchSettings]);
        const vData = await vRes.json();
        const sData = await sRes.json();

        if (vData && vData.length > 0) {
          setVersion(vData[0].version_number);
        }
        if (sData && sData.length > 0) {
          setIsVipActive(sData[0].is_vip_active !== false);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }
    fetchData();
  }, []);

  const activeVipSubscription = isVipSubscriptionActive(vipSubscription)
    ? vipSubscription
    : null;
  const formatVipExpiry = (value) => {
    if (!value) return "";

    return new Intl.DateTimeFormat(language === "TH" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  };

  const menuItems = [
    {
      id: "subscription-history",
      label: t("subscription_history"),
      icon: "/subscription-history.svg",
      path: "/bill",
    },
    {
      id: "language",
      label: t("language_menu"),
      iconComponent: <LanguageIcon />,
      value: LANGUAGE_LABELS[language] || language,
      onClick: () => setIsLanguageSheetOpen(true),
    },
    { id: "faq", label: t("faq"), icon: "/faq.svg", path: "/faq" },
    { id: "terms", label: t("terms"), icon: "/term.svg", path: "/terms" },
    {
      id: "policy",
      label: t("privacy"),
      icon: "/policy.svg",
      path: "/policy",
    },
    {
      id: "contact",
      label: t("contact"),
      icon: "/contact.svg",
      path: "/contact",
    },
  ];

  return (
    <div className="relative flex min-h-[calc(100dvh-130px)] w-full flex-col overflow-y-auto bg-black px-5 pb-8 pt-4 text-white no-scrollbar">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_7%,rgba(173,82,255,0.24),transparent_35%),radial-gradient(circle_at_50%_30%,rgba(126,31,196,0.14),transparent_45%)]" />
      <div className="relative z-10 flex flex-col">
        {/* User Info Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex w-[90px] shrink-0 flex-col items-center">
            <div className="relative h-[80px] w-[90px] pt-5">
              <img
                src="/user.svg"
                alt="Profile"
                className="object-contain w-full h-full "
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 pt-3">
            <h2 className="text-[24px] font-extrabold leading-tight tracking-tight text-white">
              {t("profile_account_title")}
            </h2>
            <div className="text-[15px]  leading-tight text-white/72">
              {t("profile_user_id")}:{" "}
              <span className="text-[#B985FF]">{userId}</span>
            </div>
            <div className="text-[15px]  leading-tight text-white/72">
              {t("app_version")}{" "}
              <span className="text-[#B985FF]">{version}</span>
            </div>
          </div>
        </div>

        {/* Minchap-VIP Card */}
        {isVipActive && (
          <div className="relative mb-5 w-full overflow-hidden rounded-[18px] border border-[#C15BFF] bg-[radial-gradient(circle_at_36%_19%,rgba(235,188,255,0.16),transparent_18%),linear-gradient(115deg,#1B0A25_0%,#2F1544_48%,#16091F_100%)] px-4 py-6 shadow-[0_0_24px_rgba(178,55,255,0.26),inset_0_0_22px_rgba(199,91,255,0.13)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_19%_34%,rgba(255,255,255,0.23),transparent_2px),radial-gradient(circle_at_24%_16%,rgba(255,151,236,0.55),transparent_2px),radial-gradient(circle_at_16%_57%,rgba(255,222,130,0.34),transparent_3px)]" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="relative w-[72px] shrink-0">
                <img
                  src="/popcorn.svg"
                  alt="Popcorn"
                  className="h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.5)]"
                />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <h3 className="mb-2 text-[24px] font-extrabold leading-none tracking-tight text-white">
                  MinChap{" "}
                  <span className="bg-gradient-to-b from-[#FAE8FF] via-[#B65CFF] to-[#6E14C8] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(191,105,255,0.7)]">
                    VIP
                  </span>
                </h3>
                <p className="text-[17px] leading-tight text-white/86">
                  {activeVipSubscription
                    ? activeVipSubscription.package_type
                    : t("unlimited_watch")}
                </p>
                {activeVipSubscription ? (
                  <p className="mt-1 text-[13px] leading-tight text-white/62">
                    Expires {formatVipExpiry(activeVipSubscription.expires_at)}
                  </p>
                ) : null}
                {activeVipSubscription ? (
                  <div className="mt-4 inline-flex h-10 max-w-[190px] items-center justify-center rounded-[12px] border border-[#D8B4FF]/32 bg-white/[0.07] px-4 text-[14px] font-bold text-[#E9D5FF]">
                    Active VIP
                  </div>
                ) : (
                  <Link
                    href="/vip"
                    className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-b from-[#B24BFF] to-[#7800D7] px-5 font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_20px_rgba(143,42,255,0.38)] transition-transform active:scale-[0.98] ${
                      language === "EN"
                        ? "max-w-[180px] text-[15px]"
                        : "max-w-[160px] text-[17px]"
                    }`}
                  >
                    {t("subscribe_vip")}
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menu List */}
        <div className="flex flex-col">
          {menuItems.map((item, index) => {
            const content = (
              <>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.055] shadow-[inset_0_0_16px_rgba(255,255,255,0.04)]">
                  {item.iconComponent || (
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="h-[25px] w-[25px] object-contain opacity-90"
                    />
                  )}
                </div>
                <span className="min-w-0 flex-1 text-[18px]  text-white/92 group-active:text-white">
                  {item.label}
                </span>
                {item.value ? (
                  <span className="shrink-0 text-[16px] font-medium text-[#C77DFF]">
                    {item.value}
                  </span>
                ) : null}
                <svg
                  className="w-6 h-6 shrink-0 text-white/60 group-active:text-white/80"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </>
            );

            return (
            <div key={item.id}>
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="group flex w-full items-center gap-5 py-4 text-left transition-colors active:bg-white/5"
                >
                  {content}
                </button>
              ) : (
                <Link
                  href={item.path || "#"}
                  className="flex items-center w-full gap-5 py-4 text-left transition-colors group active:bg-white/5"
                >
                  {content}
                </Link>
              )}

              {index < menuItems.length - 1 && (
                <div className="h-[1px] bg-[#2A2A2A]" />
              )}
            </div>
          );
          })}
        </div>
      </div>

      {isLanguageSheetOpen ? (
        <div className="fixed inset-0 z-[9998] flex items-end bg-black/60">
          <button
            type="button"
            aria-label="Close language menu"
            onClick={() => setIsLanguageSheetOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative w-full rounded-t-2xl border border-white/10 bg-[#121016] px-5 pb-8 pt-4 shadow-[0_-18px_48px_rgba(0,0,0,0.48)]">
            <div className="mx-auto mb-5 h-1 w-11 rounded-full bg-white/22" />
            <div className="overflow-hidden rounded-xl bg-white/[0.055]">
              {LANGUAGE_OPTIONS.map((option, index) => {
                const isSelected = language === option.code;

                return (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => {
                      changeLanguage(option.code);
                      setIsLanguageSheetOpen(false);
                    }}
                    className={`flex h-14 w-full items-center justify-between px-4 text-left text-[17px] font-medium ${
                      index > 0 ? "border-t border-white/10" : ""
                    } ${isSelected ? "text-[#C77DFF]" : "text-white/90"}`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
