"use client";

import { useLanguage } from "../LanguageContext";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Link from "next/link";
import { useClickOutside } from "../hooks/useClickOutside";
import { getApiUrl } from "../lib/apiBaseUrl";

const TIKTOK_USER_STORAGE_KEY = "minchap_tiktok_user";

function readStoredCustomerId() {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = JSON.parse(
      window.localStorage.getItem(TIKTOK_USER_STORAGE_KEY) || "null",
    );

    return storedUser?.is_dev_bypass ? null : storedUser?.id || null;
  } catch {
    return null;
  }
}

function readStoredCustomerAuthToken() {
  if (typeof window === "undefined") return "";

  try {
    const storedUser = JSON.parse(
      window.localStorage.getItem(TIKTOK_USER_STORAGE_KEY) || "null",
    );

    return storedUser?.is_dev_bypass ? "" : storedUser?.customer_auth_token || "";
  } catch {
    return "";
  }
}

export default function ContactPage() {
  const { t, language, changeLanguage } = useLanguage();
  const router = useRouter();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const langDropdownRef = useRef(null);
  const languages = ["TH", "EN", "JP", "CN"];

  useClickOutside(langDropdownRef, () => setIsLangOpen(false));

  const updateForm = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitStatus("submitting");
    setSubmitMessage("");

    try {
      const response = await fetch(getApiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerId: readStoredCustomerId(),
          customerAuthToken: readStoredCustomerAuthToken(),
          locale: language,
          source: "tiktok-mini",
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to send message");
      }

      setForm({ name: "", email: "", message: "" });
      setSubmitStatus("success");
      setSubmitMessage("ส่งข้อความเรียบร้อยแล้ว");
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error?.message || "ไม่สามารถส่งข้อความได้");
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-70px)] overflow-y-auto text-white bg-black">
      {/* Header matching screenshot */}
      <header className="hidden">
        <button onClick={() => router.back()} className="p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className="flex items-center">
          <img
            src="/minchap.svg"
            alt="MinChap"
            className="object-contain w-auto h-6"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selection Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 rounded bg-[#1A1A1A] px-2 py-1 text-xs font-semibold text-white/90 border border-white/10 uppercase"
            >
              {language}
              <svg
                className={`h-3 w-3 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-20 rounded-lg bg-[#1A1A1A] shadow-lg border border-white/10 py-1 flex flex-col z-50">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      changeLanguage(lang);
                      setIsLangOpen(false);
                    }}
                    className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${language === lang ? "text-white font-bold" : "text-white/60"}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center justify-center w-8 h-8 rounded text-white/90 opacity-60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <button onClick={() => router.push("/")} className="p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-col items-center w-full px-5 pt-4 pb-2 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(circle_at_50%_0%,rgba(151,62,255,0.28),transparent_52%)]" />
        <div className="pointer-events-none absolute left-[26%] top-7 h-1.5 w-1.5 rounded-full bg-[#df9cff] shadow-[0_0_13px_4px_rgba(191,142,255,0.55)]" />
        <div className="pointer-events-none absolute right-[28%] top-14 h-1 w-1 rounded-full bg-[#df9cff] shadow-[0_0_10px_3px_rgba(191,142,255,0.5)]" />
        <div className="pointer-events-none absolute right-[18%] top-7 h-1 w-1 rounded-full bg-white/70 shadow-[0_0_10px_3px_rgba(191,142,255,0.35)]" />

        <div className="relative z-10 flex w-full max-w-[360px] flex-col items-center text-center">
          <img
            src="/contact2.svg"
            alt=""
            className="mb-3 h-[58px] w-[58px] object-contain drop-shadow-[0_0_26px_rgba(166,72,255,0.65)]"
          />

          <h1 className="text-[25px] font-extrabold leading-tight text-white">
            {t("contact_us_title")}
          </h1>
          <p className="mt-3 max-w-[318px] text-[13px] font-medium leading-relaxed text-white/72">
            {t("contact_intro_line1")}
            <br />
            {t("contact_intro_line2")}
          </p>

          <div className="grid w-full grid-cols-3 gap-2 mt-4">
            {[
              { label: t("contact_feedback_tab"), icon: "star" },
              { label: t("contact_suggestion_tab"), icon: "bulb" },
              { label: t("contact_issue_tab"), icon: "alert" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#a855f7]/65 bg-[#11091d]/80 text-[12px] font-semibold text-white/86 shadow-[0_0_14px_rgba(168,85,247,0.18)]"
              >
                {item.icon === "star" && (
                  <svg
                    className="h-4 w-4 text-[#bf72ff]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="m12 2.7 2.83 5.74 6.34.92-4.59 4.47 1.08 6.31L12 17.16l-5.66 2.98 1.08-6.31-4.59-4.47 6.34-.92L12 2.7Z" />
                  </svg>
                )}
                {item.icon === "bulb" && (
                  <svg
                    className="h-4 w-4 text-[#bf72ff]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M8.6 14.2A6 6 0 1 1 15.4 14c-.9.7-1.4 1.5-1.4 2.5h-4c0-1-.5-1.8-1.4-2.3Z" />
                  </svg>
                )}
                {item.icon === "alert" && (
                  <svg
                    className="h-4 w-4 text-[#bf72ff]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10.3 3.7a2 2 0 0 1 3.4 0l8 13.6A2 2 0 0 1 20 20.3H4a2 2 0 0 1-1.7-3l8-13.6ZM11 9v4h2V9h-2Zm0 6v2h2v-2h-2Z" />
                  </svg>
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative z-10 mt-3 flex w-full max-w-[360px] flex-col gap-4 rounded-[18px] border border-[#9b4dff]/70 bg-[linear-gradient(180deg,rgba(23,18,31,0.94),rgba(8,7,13,0.96))] p-4 shadow-[0_0_22px_rgba(157,78,255,0.28)]"
        >
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-white/82">
              {t("name_label")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={updateForm("name")}
              placeholder={t("name_placeholder")}
              required
              className="h-11 w-full rounded-lg border border-[#76509a]/70 bg-white/[0.06] px-4 text-[14px] text-white outline-none transition-colors placeholder:text-white/34 focus:border-[#c77dff] focus:bg-white/[0.09]"
            />
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-white/82">
              {t("email_label")}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={updateForm("email")}
              placeholder={t("email_placeholder")}
              required
              className="h-11 w-full rounded-lg border border-[#76509a]/70 bg-white/[0.06] px-4 text-[14px] text-white outline-none transition-colors placeholder:text-white/34 focus:border-[#c77dff] focus:bg-white/[0.09]"
            />
          </div>

          {/* Message Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-white/82">
              {t("message_label")}
            </label>
            <textarea
              rows={6}
              value={form.message}
              onChange={updateForm("message")}
              placeholder={t("message_placeholder")}
              required
              className="min-h-[88px] w-full resize-none rounded-lg border border-[#76509a]/70 bg-white/[0.06] p-4 text-[14px] text-white outline-none transition-colors placeholder:text-white/34 focus:border-[#c77dff] focus:bg-white/[0.09]"
            />
          </div>

          <button
            type="submit"
            disabled={submitStatus === "submitting"}
            className="mx-auto flex h-11 w-[300px] items-center justify-center gap-3 rounded-xl bg-[linear-gradient(180deg,#d145ff_0%,#8318e5_100%)] text-[16px] font-extrabold text-white shadow-[0_10px_24px_rgba(162,35,255,0.48)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className="w-5 h-5 -rotate-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m22 2-7 20-4-9-9-4 20-7Z" />
              <path d="M22 2 11 13" />
            </svg>
            {submitStatus === "submitting" ? "กำลังส่ง..." : t("send_message")}
          </button>

          {submitMessage ? (
            <p
              className={`text-center text-[13px] font-semibold ${
                submitStatus === "success" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {submitMessage}
            </p>
          ) : null}
        </form>

        {/* Footer Note */}
        <div className="relative z-10 mt-3 flex w-full max-w-[360px] flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-white/88">
              <span className="text-[#bf72ff]">❤</span>
              {t("contact_thanks")}
            </p>
            <p className="text-[12px] font-medium text-white/45">
              {t("contact_response_time")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
