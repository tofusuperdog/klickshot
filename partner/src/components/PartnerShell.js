"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "ภาพรวม" },
  { href: "/series", label: "ซีรีส์ของฉัน" },
  { href: "/billing", label: "สรุปรอบบิล" },
];

export default function PartnerShell({ producer, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/partner/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/");
  };

  return (
    <main className="partner-app">
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Image
            src="/klickshotlogo.webp"
            alt="Klickshot"
            fill
            sizes="180px"
            priority
          />
        </div>

        <div className="producer-card">
          <span>เข้าสู่ระบบในนาม</span>
          <strong>{producer.name}</strong>
          <small>@{producer.username}</small>
        </div>

        <nav className="app-nav" aria-label="เมนู Partner">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              className={pathname === item.href ? "active" : ""}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button type="button" className="logout-button" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </aside>

      <section className="app-content">{children}</section>
    </main>
  );
}
