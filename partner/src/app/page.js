"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [partnerVersion, setPartnerVersion] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch("/api/partner/session", {
        credentials: "include",
      });

      if (response.ok) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    const fetchPartnerVersion = async () => {
      const response = await fetch("/api/partner/version", {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (data.version) {
        setPartnerVersion(data.version);
      }
    };

    fetchPartnerVersion();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/partner/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        remember,
      }),
    });

    const data = await response.json().catch(() => ({}));
    setIsLoading(false);

    if (!response.ok || !data.producer) {
      setError(data.error || "ไม่สามารถเข้าสู่ระบบได้");
      return;
    }

    router.replace("/dashboard");
  };

  if (isCheckingSession) {
    return (
      <main className="partner-page">
        <div className="loading-panel">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</div>
      </main>
    );
  }

  return (
    <main className="partner-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="aurora-field" aria-hidden="true">
        <span className="aurora-ribbon aurora-ribbon-one" />
        <span className="aurora-ribbon aurora-ribbon-two" />
        <span className="aurora-ribbon aurora-ribbon-three" />
      </div>
      <div className="grid-overlay" />

      <section className="login-shell" aria-label="Klickshot Partner login">
        <div className="brand-panel">
          <div className="brand-topline">
            <span className="status-dot" />
            Content Producer Portal
          </div>

          <div className="logo-wrap">
            <Image
              src="/klickshotlogo.webp"
              alt="Klickshot"
              fill
              sizes="(max-width: 760px) 240px, 360px"
              priority
            />
          </div>

          <div className="headline-block">
            <p className="section-label">Partner analytics</p>
            <h1>Track how your films perform on Klickshot.</h1>
            <p className="brand-copy">
              A focused workspace for content producers to review title
              performance, view trends, and monitor audience response.
            </p>
          </div>
        </div>

        <div className="form-panel">
          <div className="form-header">
            <p className="section-label">Klickshot Partner</p>
            <h2>ระบบผู้ผลิตคอนเทนต์</h2>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label className="field">
              <span>ชื่อผู้ใช้งาน</span>
              <input
                type="text"
                name="username"
                placeholder="กรอกชื่อผู้ใช้งาน"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="field">
              <span>รหัสผ่าน</span>
              <div className="password-control">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3.8 4.3 2.5l17.2 17.2-1.3 1.3-3.1-3.1A10.9 10.9 0 0 1 12 19C7 19 2.7 16.1 1 12c.8-1.9 2.1-3.6 3.7-4.8L3 3.8Zm6.3 6.3a3 3 0 0 0 4.1 4.1l-4.1-4.1ZM12 5c5 0 9.3 2.9 11 7a11.8 11.8 0 0 1-3.1 4.2l-2.4-2.4A5.9 5.9 0 0 0 10.2 6.5L8.3 4.6A11 11 0 0 1 12 5Zm0 3c-.4 0-.8.1-1.1.2l4.9 4.9A3.8 3.8 0 0 0 16 12a4 4 0 0 0-4-4Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 5c5 0 9.3 2.9 11 7-1.7 4.1-6 7-11 7S2.7 16.1 1 12c1.7-4.1 6-7 11-7Zm0 2C8 7 4.6 9 3.2 12 4.6 15 8 17 12 17s7.4-2 8.8-5C19.4 9 16 7 12 7Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div className="form-row">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="support-note">
            หากลืมรหัสผ่านหรือยังไม่มีบัญชี กรุณาติดต่อ{" "}
            <a href="mailto:klickshot.official@gmail.com">
              klickshot.official@gmail.com
            </a>
          </p>
          {partnerVersion ? (
            <p className="partner-version-note">Partner Portal v{partnerVersion}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
