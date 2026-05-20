"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const cinematicParticles = Array.from({ length: 20 }, (_, index) => ({
  id: `particle-${index + 1}`,
  size: `${4 + (index % 4) * 2}px`,
  duration: `${10 + (index % 5) * 2.4}s`,
  delay: `${index * -0.8}s`,
  x: `${6 + ((index * 11) % 88)}%`,
  y: `${8 + ((index * 9) % 80)}%`,
  dx: `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 4) * 8)}px`,
  dy: `${(index % 3 === 0 ? -1 : 1) * (24 + (index % 5) * 6)}px`,
}));

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sysVersion, setSysVersion] = useState("v0.01.03");
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const fetchLatestVersion = async () => {
      const { data } = await supabase.rpc("public_backoffice_version");

      if (data) {
        setSysVersion(data);
      }
    };

    fetchLatestVersion();
  }, []);

  const showErrorMsg = (msg) => {
    setError(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorVisible(false);

    if (!username.trim() || !password.trim()) {
      showErrorMsg("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    const response = await fetch("/api/backoffice/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.user) {
      showErrorMsg("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      setIsLoading(false);
      return;
    }

    login(data.user);
    router.push("/dashboard");
  };

  return (
    <>
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${errorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"}`}
      >
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{error}</span>
        </div>
      </div>

      <div className="flex lg:hidden min-h-screen items-center justify-center bg-gradient-to-br from-[#11154D] to-[#291337]">
        <div className="text-center px-6 flex flex-col items-center">
          <div className="relative w-[280px] h-[80px] mb-8">
            <Image
              src="/minchap_tiktok.svg"
              alt="minChap TikTok"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ไม่รองรับการใช้งานบนอุปกรณ์นี้
          </h1>
          <p className="text-gray-300 font-light mb-8">
            กรุณาเข้าใช้งานผ่านคอมพิวเตอร์ (PC) เท่านั้น
          </p>
          <a
            href="https://www.minchapseries.com"
            className="px-6 py-2.5 bg-[#6a90f1] hover:bg-[#567ce2] transition-colors rounded text-white font-medium text-[15px]"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>

      <div className="hidden lg:flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#090d2b_0%,#11154D_32%,#1f255f_64%,#241230_100%)] relative overflow-hidden px-8">
        <div className="cinematic-stage" aria-hidden="true">
          <div className="cinematic-aurora" />
          <div className="cinematic-grid" />
          <div className="cinematic-beam cinematic-beam-left" />
          <div className="cinematic-beam cinematic-beam-right" />
          <div className="cinematic-orb cinematic-orb-one" />
          <div className="cinematic-orb cinematic-orb-two" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_38%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(7,10,28,0.08),_rgba(7,10,28,0.44))]" />

          <div className="cinematic-particles">
            {cinematicParticles.map((particle) => (
              <span
                key={particle.id}
                className="cinematic-particle"
                style={{
                  "--size": particle.size,
                  "--duration": particle.duration,
                  "--delay": particle.delay,
                  "--x": particle.x,
                  "--y": particle.y,
                  "--dx": particle.dx,
                  "--dy": particle.dy,
                }}
              />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(103,132,255,0.1),_transparent_55%)]" />

        <div className="glass-panel hero-shine relative z-10 flex items-stretch justify-center max-w-6xl w-full rounded-[32px] overflow-hidden">
          <div className="flex flex-col justify-center flex-1 px-16 py-18 min-h-[680px] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_35%)] pointer-events-none" />

            <div className="relative z-10 max-w-[520px]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/12 bg-white/6 text-[12px] uppercase tracking-[0.32em] text-blue-100/90 mb-8">
                MinChap Studio
              </div>

              <div className="relative w-[360px] h-[100px] mb-4">
                <Image
                  src="/minchaplogo_main.webp"
                  alt="minChap Logo"
                  fill
                  sizes="360px"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>

              <p className="text-blue-100/80 text-[15px] tracking-[0.3em] uppercase mb-5">
                TikTok Minis CMS
              </p>

              <h1 className="text-white text-[48px] leading-[1.05] font-semibold tracking-[-0.03em] mb-6">
                Behind every short film,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-[#a9bbff] to-[#ffbf96]">
                  there is a beautiful control room.
                </span>
              </h1>
            </div>
          </div>

          <div className="w-px bg-gradient-to-b from-transparent via-white/16 to-transparent" />

          <div className="flex flex-col justify-center w-[440px] px-12 py-14 relative bg-[linear-gradient(180deg,rgba(10,14,44,0.56),rgba(9,13,34,0.7))]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,144,255,0.14),_transparent_36%)] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-[29px] font-semibold text-white text-center mb-2 tracking-wide">
                ยินดีต้อนรับ
              </h2>

              <form onSubmit={handleLogin} className="w-full space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-light text-gray-200 mb-2"
                  >
                    ชื่อผู้ใช้งาน
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    className="w-full h-12 px-4 bg-white/88 border border-white/15 rounded-xl text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7b9cff] focus:border-transparent"
                    autoComplete="username"
                    placeholder="กรอกชื่อผู้ใช้งาน"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-light text-gray-200 mb-2"
                  >
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="w-full h-12 px-4 pr-11 bg-white/88 border border-white/15 rounded-xl text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7b9cff] focus:border-transparent"
                      autoComplete="current-password"
                      placeholder="กรอกรหัสผ่าน"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      aria-label={
                        showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                      }
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.5 6.5m3.378 3.378a3 3 0 004.243 4.243m0 0L17.5 17.5m-3.379-3.379L6.5 6.5m0 0L3 3m3.5 3.5L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center w-full h-12 rounded-xl text-white font-medium text-[15px] bg-[linear-gradient(90deg,#6f8fff_0%,#7a75ff_45%,#f09b67_100%)] hover:brightness-110 transition-all duration-300 shadow-[0_12px_32px_rgba(104,121,255,0.38)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-8 text-sm text-gray-300 font-light z-10">
          {sysVersion.toLowerCase().startsWith("v")
            ? sysVersion
            : `v${sysVersion}`}
        </div>
      </div>
    </>
  );
}
