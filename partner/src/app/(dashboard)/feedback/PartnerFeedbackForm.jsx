"use client";

import { useEffect, useState } from "react";

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
        throw new Error(data.error || "ไม่สามารถส่งข้อความได้");
      }

      setForm({
        category: "feedback",
        email: "",
        message: "",
      });
      setSubmitStatus("idle");
      setNotification({
        title: "ส่งข้อความแล้ว",
        message: "ทีมงานได้รับข้อความของคุณเรียบร้อยแล้ว",
      });
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error?.message || "ไม่สามารถส่งข้อความได้");
    }
  };

  return (
    <>
      <header className="content-header partner-feedback-header">
        <div>
          <p className="section-label">Partner feedback</p>
          <h1>Feedback / ข้อเสนอแนะ</h1>
          <p>ส่งคำติชม ข้อเสนอแนะ หรือแจ้งปัญหาการใช้งาน Partner Portal ให้ทีม Klickshot</p>
        </div>
      </header>

      <section className="partner-feedback-shell">
        <div className="partner-feedback-intro">
          <p className="section-label">ส่งข้อความถึงทีมงาน</p>
          <h2>ช่วยให้เราปรับ Partner Portal ให้ใช้งานได้ดีขึ้น</h2>
          <p>
            กรอกอีเมลติดต่อกลับ และเล่ารายละเอียดให้ชัดเจน
            ระบบจะแนบข้อมูลบัญชีพาร์ทเนอร์ของคุณให้อัตโนมัติ
          </p>
          <div className="partner-feedback-note">
            <strong>ข้อมูลที่ส่งจะถูกจัดเก็บเป็น ticket</strong>
            <span>ทีมงานจะใช้เพื่อตรวจสอบปัญหาและพัฒนาระบบ Partner Portal</span>
          </div>
        </div>

        <form className="partner-feedback-form" onSubmit={handleSubmit}>
          <label className="partner-feedback-field">
            <span>อีเมลติดต่อกลับ</span>
            <input
              type="email"
              value={form.email}
              onChange={updateForm("email")}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="partner-feedback-field">
            <span>ข้อความ</span>
            <textarea
              rows={7}
              value={form.message}
              onChange={updateForm("message")}
              placeholder="พิมพ์คำติชม ข้อเสนอแนะ หรือปัญหาที่พบได้ที่นี่"
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
            {submitStatus === "submitting" ? "กำลังส่ง..." : "ส่งข้อความ"}
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
