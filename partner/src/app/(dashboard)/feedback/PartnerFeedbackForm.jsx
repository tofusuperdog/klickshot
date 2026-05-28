"use client";

import { useEffect, useState } from "react";
import { usePartnerLanguage } from "@/components/PartnerLanguageProvider";

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function PartnerFeedbackForm() {
  const { t } = usePartnerLanguage();
  const [form, setForm] = useState({
    category: "feedback",
    email: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotification(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const updateForm = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setSubmitMessage("");
    setSubmitStatus("idle");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitStatus === "submitting") {
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/partner/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || t("feedback.failed"));
      }

      setForm({
        category: "feedback",
        email: "",
        message: "",
      });
      setSubmitStatus("idle");
      setNotification({
        title: t("feedback.successTitle"),
        message: t("feedback.successMessage"),
      });
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error?.message || t("feedback.failed"));
    }
  };

  return (
    <>
      <header className="content-header partner-feedback-header">
        <div>
          <p className="section-label">{t("feedback.kicker")}</p>
          <h1>{t("feedback.title")}</h1>
          <p>{t("feedback.copy")}</p>
        </div>
      </header>

      <section className="partner-feedback-shell">
        <div className="partner-feedback-intro">
          <p className="section-label">{t("feedback.introKicker")}</p>
          <h2>{t("feedback.introTitle")}</h2>
          <p>{t("feedback.introCopy")}</p>
          <div className="partner-feedback-note">
            <strong>{t("feedback.noteTitle")}</strong>
            <span>{t("feedback.noteCopy")}</span>
          </div>
        </div>

        <form className="partner-feedback-form" onSubmit={handleSubmit}>
          <label className="partner-feedback-field">
            <span>{t("feedback.email")}</span>
            <input
              type="email"
              value={form.email}
              onChange={updateForm("email")}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="partner-feedback-field">
            <span>{t("feedback.message")}</span>
            <textarea
              rows={7}
              value={form.message}
              onChange={updateForm("message")}
              placeholder={t("feedback.messagePlaceholder")}
              required
            />
          </label>

          {submitMessage && submitStatus === "error" ? (
            <p className={`partner-feedback-status ${submitStatus}`}>
              {submitMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="partner-feedback-submit"
            disabled={submitStatus === "submitting"}
          >
            <SendIcon />
            {submitStatus === "submitting" ? t("feedback.submitting") : t("feedback.submit")}
          </button>
        </form>
      </section>

      {notification ? (
        <div className="partner-notification" role="status" aria-live="polite">
          <span className="partner-notification-icon">
            <CheckIcon />
          </span>
          <span>
            <strong>{notification.title}</strong>
            <small>{notification.message}</small>
          </span>
        </div>
      ) : null}
    </>
  );
}
