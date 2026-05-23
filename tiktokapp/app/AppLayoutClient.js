"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import { useEffect, useState, useRef } from "react";
import MagicTrail from "./MagicTrail";
import { useClickOutside } from "./hooks/useClickOutside";
import { getApiUrl } from "./lib/apiBaseUrl";

const LANGUAGE_STORAGE_KEY = "minchap_lang";
const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";
let hasRecordedAppVisit = false;
const LANGUAGES = ["TH", "EN", "CN", "JP"];
const LANGUAGE_LABELS = {
  TH: "ไทย",
  EN: "English",
  JP: "日本語",
  CN: "中文",
};
const LANGUAGE_SHEET_LABELS = {
  TH: "\u0e44\u0e17\u0e22",
  EN: "English",
  CN: "\u4e2d\u6587",
  JP: "\u65e5\u672c\u8a9e",
};
const LANGUAGE_SHEET_COPY = {
  TH: {
    title: "เลือกภาษาเริ่มต้น",
    description: "เลือกภาษาที่ต้องการใช้ใน MinChap",
  },
  EN: {
    title: "Choose app language",
    description: "Select the language you want to use in MinChap.",
  },
  JP: {
    title: "アプリの言語を選択",
    description: "MinChapで使用する言語を選択してください。",
  },
  CN: {
    title: "选择应用语言",
    description: "选择你想在 MinChap 中使用的语言。",
  },
};
const HEADER_HIDDEN_PATHS = new Set([
  "/myseries",
  "/search",
  "/profile",
  "/vip",
  "/contact",
  "/policy",
  "/terms",
  "/faq",
  "/topup",
  "/bill",
]);
const PROFILE_SECTION_PATHS = new Set([
  "/profile",
  "/bill",
  "/faq",
  "/terms",
  "/policy",
  "/contact",
]);

function isDetailPage(pathname) {
  return (
    pathname.startsWith("/watch") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/genre")
  );
}

function ShareModal({ isOpen, onClose, t }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1A] p-6 shadow-2xl border border-white/10 relative transform transition-all scale-100 opacity-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <div className="flex flex-col items-center pt-2 pb-4 text-center">
          <div className="mb-4 h-16 w-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{t("share_tiktok")}</h3>
          <p className="text-sm text-white/60 mb-6">{t("coming_soon")}</p>
          
          <button 
            onClick={onClose}
            className="w-full rounded-full bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function getLanguageSheetOptions() {
  return LANGUAGES;
}

function getStoredLanguagePreference() {
  if (typeof window === "undefined") return "";

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (LANGUAGES.includes(savedLanguage)) return savedLanguage;

  try {
    const storedUser = JSON.parse(
      window.localStorage.getItem(TIKTOK_USER_STORAGE_KEY) || "null",
    );
    const userLanguage = storedUser?.preferred_language;

    return LANGUAGES.includes(userLanguage) ? userLanguage : "";
  } catch {
    return "";
  }
}

async function saveCustomerLanguage({
  customerId,
  openId,
  customerAuthToken,
  language,
}) {
  if (!customerId || !openId || !customerAuthToken || !language) return;

  const response = await fetch(getApiUrl("/api/tiktok/customer-language"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId,
      openId,
      customerAuthToken,
      language,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Unable to save language.");
  }
}

function recordAppVisit() {
  if (hasRecordedAppVisit) return;

  hasRecordedAppVisit = true;

  const url = getApiUrl("/api/customer/app-visit");
  const body = JSON.stringify({});

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });

    if (navigator.sendBeacon(url, blob)) {
      return;
    }
  }

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch((error) => {
    console.warn("Failed to record app visit:", error);
  });
}

function LanguageBottomSheet({
  isOpen,
  mode,
  customerId,
  openId,
  customerAuthToken,
  onClose,
}) {
  const { language, changeLanguage } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const options = getLanguageSheetOptions();

  const handleChooseLanguage = async (lang) => {
    changeLanguage(lang);
    setError("");

    if (mode !== "tiktok") {
      onClose();
      return;
    }

    if (!customerId || !openId || !customerAuthToken) {
      setError("Unable to save language.");
      return;
    }

    setIsSaving(true);
    try {
      await saveCustomerLanguage({
        customerId,
        openId,
        customerAuthToken,
        language: lang,
      });

      const storedUser = window.localStorage.getItem("minchap_tiktok_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        window.localStorage.setItem(
          "minchap_tiktok_user",
          JSON.stringify({ ...user, preferred_language: lang }),
        );
        window.dispatchEvent(new Event("minchap:tiktok-user-updated"));
      }

      onClose();
    } catch (saveError) {
      setError(saveError?.message || "Unable to save language.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end bg-black/60 sm:hidden">
      <div className="w-full rounded-t-2xl border border-white/10 bg-[#111111] px-4 pb-8 pt-4 shadow-2xl">
        <div className="overflow-hidden rounded-xl bg-[#1f1d23]">
          {options.map((lang, index) => {
            const isSelected = language === lang;

            return (
              <button
                key={lang}
                type="button"
                disabled={isSaving}
                onClick={() => handleChooseLanguage(lang)}
                className={`flex h-14 w-full items-center justify-between px-4 text-left text-[16px] font-semibold transition-colors active:bg-white/10 disabled:opacity-60 ${
                  index > 0 ? "border-t border-white/10" : ""
                } ${isSelected ? "text-[#C77DFF]" : "text-white/90"}`}
              >
                <span>{LANGUAGE_SHEET_LABELS[lang]}</span>
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

        {error ? <p className="mt-3 text-sm text-[#ff6b81]">{error}</p> : null}
      </div>
    </div>
  );
}

function LayoutContent({ children }) {
  const { language, changeLanguage, t } = useLanguage();
  const pathname = usePathname();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [languageSheet, setLanguageSheet] = useState({
    isOpen: false,
    mode: "guest",
    customerId: null,
    openId: null,
    customerAuthToken: null,
  });
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const navItems = [
    { path: "/", label: t("home"), icon: "/home.svg", iconActive: "/home_selected.svg" },
    { path: "/myseries", label: t("myseries"), icon: "/myseries.svg", iconActive: "/myseries_selected.svg" },
    { path: "/search", label: t("search"), icon: "/search.svg", iconActive: "/search_selected.svg" },
    { path: "/profile", label: t("profile"), icon: "/profile.svg", iconActive: "/profile_selected.svg" },
  ];

  const isTopupPage = pathname === "/topup";
  const isWatchPage = pathname.startsWith("/watch");
  const isCategoryPage = pathname.startsWith("/category");
  const isGenrePage = pathname.startsWith("/genre");
  const isVipPage = pathname === "/vip";
  const isProfileSectionPage = PROFILE_SECTION_PATHS.has(pathname);
  const showHeader = pathname !== "/" && !HEADER_HIDDEN_PATHS.has(pathname) && !isDetailPage(pathname);

  useEffect(() => {
    recordAppVisit();
  }, []);

  useEffect(() => {
    const handleTikTokLoginState = (event) => {
      const { status, user } = event.detail || {};

      if (["checking", "logging_in", "exchanging"].includes(status)) {
        setLanguageSheet((current) => ({ ...current, isOpen: false }));
        return;
      }

      if (status === "not_tiktok") {
        setLanguageSheet({
          isOpen: !getStoredLanguagePreference(),
          mode: "guest",
          customerId: null,
          openId: null,
          customerAuthToken: null,
        });
        return;
      }

      if (status === "success") {
        if (user?.preferred_language && LANGUAGES.includes(user.preferred_language)) {
          changeLanguage(user.preferred_language);
          setLanguageSheet({
            isOpen: false,
            mode: "tiktok",
            customerId: user.id || null,
            openId: user.open_id || null,
            customerAuthToken: user.customer_auth_token || null,
          });
          return;
        }

        const savedLanguage = getStoredLanguagePreference();

        if (savedLanguage) {
          changeLanguage(savedLanguage);
          setLanguageSheet({
            isOpen: false,
            mode: "tiktok",
            customerId: user?.id || null,
            openId: user?.open_id || null,
            customerAuthToken: user?.customer_auth_token || null,
          });

          saveCustomerLanguage({
            customerId: user?.id || null,
            openId: user?.open_id || null,
            customerAuthToken: user?.customer_auth_token || null,
            language: savedLanguage,
          })
            .then(() => {
              if (!user?.id) return;

              window.localStorage.setItem(
                TIKTOK_USER_STORAGE_KEY,
                JSON.stringify({
                  ...user,
                  preferred_language: savedLanguage,
                }),
              );
              window.dispatchEvent(new Event("minchap:tiktok-user-updated"));
            })
            .catch((error) => {
              console.error("Failed to save early language selection:", error);
            });
          return;
        }

        setLanguageSheet({
          isOpen: true,
          mode: "tiktok",
          customerId: user?.id || null,
          openId: user?.open_id || null,
          customerAuthToken: user?.customer_auth_token || null,
        });
      }
    };

    window.addEventListener("minchap:tiktok-login-state", handleTikTokLoginState);
    return () => {
      window.removeEventListener("minchap:tiktok-login-state", handleTikTokLoginState);
    };
  }, [changeLanguage]);

  return (
    <div className="relative flex min-h-screen bg-black">
      
      {/* Mobile Content Wrapper */}
      <div className="flex w-full flex-col sm:hidden relative pb-[70px]">
        
        {/* Header - Hide on VIP, Contact, Policy, Topup, and Bill pages */}
        {showHeader && (
          <header className="fixed left-0 right-0 top-0 z-40 flex h-[60px] items-center justify-between px-4 bg-black/80 backdrop-blur-md border-b border-white/10">
            
            {/* Logo */}
            <div className="flex items-center h-full">
              <img src="/minchap.svg" alt="MinChap" className="h-6 w-auto object-contain" />
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
              
              {/* Language Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 rounded bg-[#1A1A1A] px-2 py-1 text-xs font-semibold text-white/90 border border-white/10"
                >
                  {language}
                  <svg className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-20 rounded-lg bg-[#1A1A1A] shadow-lg border border-white/10 py-1 flex flex-col z-50">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          changeLanguage(lang);
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${language === lang ? 'text-white font-bold' : 'text-white/60'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Share Menu Button */}
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center h-7 w-9 rounded bg-[#1A1A1A] text-white/90 border border-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
              </button>

              {/* Close Button */}
              <Link 
                href="/"
                className="flex items-center justify-center p-1 text-white/90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </Link>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col relative w-full ${showHeader ? "pt-[60px]" : ""}`}>
          {children}
        </main>

        {/* Bottom Navigation - Hide on VIP, Topup, category, and genre pages */}
        {!isVipPage && !isTopupPage && !isWatchPage && !isCategoryPage && !isGenrePage && (
          <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[70px] bg-[#1A1A1A] border-t border-white/5 pb-5 pt-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.path ||
                (item.path === "/profile" && isProfileSectionPage);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex flex-1 flex-col items-center justify-center gap-1"
                >
                  <div className="relative h-6 w-6">
                    <img src={isActive ? item.iconActive : item.icon} alt={item.label} className="object-contain" />
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-[#BF8EFF]' : 'text-white/50'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      {/* Desktop Not Supported Screen (Visible on sm and up) */}
      <div className="hidden sm:flex flex-1 flex-col items-center justify-center p-8 text-center max-w-lg mx-auto min-h-screen">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm shadow-xl w-full">
          <div className="mb-6 flex justify-center text-white/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-white">{t("not_supported")}</h1>
          <p className="text-white/70 mb-8 leading-relaxed">
            {t("not_supported_desc")}
          </p>
          <Link href="/" className="inline-block rounded-full bg-white/10 px-8 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20 border border-white/20">
            {t("home")}
          </Link>
        </div>
      </div>

      {/* Modals */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} t={t} />
      <LanguageBottomSheet
        isOpen={languageSheet.isOpen}
        mode={languageSheet.mode}
        customerId={languageSheet.customerId}
        openId={languageSheet.openId}
        customerAuthToken={languageSheet.customerAuthToken}
        onClose={() => setLanguageSheet((current) => ({ ...current, isOpen: false }))}
      />

      <MagicTrail />
    </div>
  );
}

export default function AppLayoutClient({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}
