"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MagicEffect = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: -100, y: -100 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      for (let i = 0; i < 4; i++) {
        particles.push({
          x: mouse.x,
          y: mouse.y,
          size: Math.random() * 8 + 4,
          speedX: Math.random() * 4 - 2,
          speedY: Math.random() * 4 - 2,
          hue: Math.random() * 40 + 200, // Deep blues and Purples
          life: 1,
          thickness: Math.random() * 2 + 1
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: mouse.x,
            y: mouse.y,
            size: Math.random() * 8 + 4,
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * 4 - 2,
            hue: Math.random() * 40 + 200,
            life: 1,
            thickness: Math.random() * 2 + 1
          });
        }
      }
    };
    window.addEventListener("touchmove", handleTouchMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // Draw particle as a glowing soft orb or a streak
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${p.life})`);
        gradient.addColorStop(0.2, `hsla(${p.hue}, 100%, 70%, ${p.life * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Optional streak effect
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 90%, ${p.life * 0.3})`;
        ctx.lineWidth = p.thickness;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.speedX * 4, p.y - p.speedY * 4);
        ctx.stroke();

        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.012; 
        p.size *= 0.98;

        if (p.size <= 0.5 || p.life <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 mix-blend-screen"
    />
  );
};
export default function Home() {
  const [version, setVersion] = useState("");
  const logoRef = useRef(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/system_versions?system_type=eq.website&select=version_number&order=release_date.desc&limit=1`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            }
          }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setVersion(data[0].version_number);
        }
      } catch (error) {
        console.error("Error fetching version:", error);
      }
    };

    fetchVersion();

    const handleMouseOver = (e) => {
      if (!logoRef.current) return;
      const { clientX, clientY } = e;
      const x = (clientX - window.innerWidth / 2) / 50;
      const y = (clientY - window.innerHeight / 2) / 50;
      logoRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.02)`;
    };

    window.addEventListener("mousemove", handleMouseOver);
    return () => window.removeEventListener("mousemove", handleMouseOver);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#0a0c2e] via-[#11154D] to-[#291337] flex items-center justify-center font-sans">
      
      {/* Cinematic Overlays */}
      <div className="grain-overlay" />
      <div className="cinematic-vignette" />
      <div className="absolute inset-0 animate-flicker pointer-events-none z-40 bg-white/1" />

      {/* Floating Bokeh / Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-[float_15s_infinite_ease-in-out]" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-[float_20s_infinite_ease-in-out_reverse]" />
        <div className="absolute top-[40%] right-[25%] w-48 h-48 bg-indigo-400/10 rounded-full blur-[80px] animate-[float_12s_infinite_ease-in-out_offset-5s]" />
      </div>

      {/* Background glow behind center content */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
        <div className="w-[800px] h-[800px] bg-[#6a90f1] rounded-full blur-[180px] scale-110"></div>
      </div>

      <MagicEffect />

      <h1 className="sr-only">minChap - ดูซีรีส์และหนังแนวตั้งบน TikTok</h1>

      <div 
        ref={logoRef}
        className="relative z-10 flex flex-col items-center gap-1 w-full max-w-sm md:max-w-[500px] px-6 transition-transform duration-300 ease-out"
      >

        {/* Minchap Logo Area */}
        <div className="relative w-full h-[80px] md:h-[140px] flex items-center justify-center drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-logo">
          <Image
            src="/minchap.svg"
            alt="minChap"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Divider with text */}
        <div className="relative flex items-center w-full my-4 animate-tracking-in [animation-delay:0.5s]">
          <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>
          <span className="flex-shrink-0 mx-6 text-gray-300 text-sm md:text-lg font-light tracking-[0.3em] uppercase opacity-80">
            Coming Soon on
          </span>
          <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-gray-400/50 to-transparent"></div>
        </div>

        {/* TikTok Logo Area */}
        <div className="relative w-full h-[70px] md:h-[110px] flex items-center justify-center drop-shadow-xl animate-logo [animation-delay:0.8s]">
          <Image
            src="/tiktok.svg"
            alt="TikTok"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 w-full text-center text-xs md:text-sm font-light tracking-widest z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:1.5s]">
        <div className="text-gray-400/80 pointer-events-none mb-3 uppercase text-[10px] border-b border-gray-500/20 pb-1 flex items-center gap-2">
          <span>Developed by Love Drama Co.,ltd</span>
          {version && (
            <>
              <span className="w-1 h-1 bg-gray-500/40 rounded-full"></span>
              <span className="text-gray-500/60 font-mono tracking-normal lowercase">v{version}</span>
            </>
          )}
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/terms-of-service" className="text-gray-500 hover:text-white transition-all duration-300 underline-offset-8 decoration-gray-700 hover:decoration-white">
            Terms of Service
          </Link>
          <span className="text-gray-700 w-1 h-1 bg-gray-700 rounded-full"></span>
          <Link href="/privacy-policy" className="text-gray-500 hover:text-white transition-all duration-300 underline-offset-8 decoration-gray-700 hover:decoration-white">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
