"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const menuGroups = [
  {
    items: [
      {
        name: "ภาพรวม",
        path: "/dashboard",
        permKey: null,
        iconInactive: "/dashboard.svg",
        iconActive: "/dashboard_b.svg",
      },
    ],
  },
  {
    label: "คอนเทนต์",
    items: [
      {
        name: "ซีรีส์",
        path: "/series",
        permKey: "perm_series",
        iconInactive: "/series.svg",
        iconActive: "/series_b.svg",
      },
      {
        name: "แนวเรื่อง",
        path: "/genres",
        permKey: "perm_genres",
        iconInactive: "/genres.svg",
        iconActive: "/genres_b.svg",
      },
      {
        name: "การแสดงผล",
        path: "/displays",
        permKey: "perm_displays",
        iconInactive: "/displays.svg",
        iconActive: "/displays_b.svg",
      },
    ],
  },
  {
    label: "ผู้ใช้ & ลูกค้า",
    items: [
      {
        name: "ผู้ผลิตคอนเทนต์",
        path: "/content-producers",
        permKey: "perm_content_producers",
        iconInactive: "/film.svg",
        iconActive: "/film_b.svg",
      },
      {
        name: "ลูกค้า",
        path: "/customers",
        permKey: "perm_customers",
        iconInactive: "/customers.svg",
        iconActive: "/customers_b.svg",
      },
      {
        name: "ผู้ใช้งาน",
        path: "/users",
        permKey: "perm_users",
        iconInactive: "/users.svg",
        iconActive: "/users_b.svg",
      },
    ],
  },
  {
    label: "การเงิน",
    items: [
      {
        name: "การขาย",
        path: "/sales",
        permKey: "perm_sales",
        iconInactive: "/sales.svg",
        iconActive: "/sales_b.svg",
      },
    ],
  },
  {
    label: "ระบบ",
    items: [
      {
        name: "รายงาน",
        path: "/reports",
        permKey: "perm_reports",
        iconInactive: "/report.svg",
        iconActive: "/report_b.svg",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const canViewMenu = (item) => {
    if (!item.permKey) return true;
    if (user?.is_admin) return true;
    return user && user[item.permKey];
  };

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(canViewMenu),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      <div className="w-[232px] h-full bg-gradient-to-b from-[#101440] via-[#0d1238] to-[#0a1130] text-gray-300 flex flex-col justify-between border-r border-[#161a44] flex-shrink-0 shadow-[12px_0_38px_rgba(0,0,0,0.22)]">
        <div className="min-h-0">
          <div className="flex items-center px-5 pt-5 pb-6">
            <div className="relative w-[218px] h-[75px]">
              <Image
                src="/klickshotlogo.webp"
                alt="Klick Shot Logo"
                fill
                sizes="218px"
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </div>

          <nav className="flex flex-col gap-3 px-4">
            {visibleGroups.map((group) => (
              <div key={group.label || "main"} className="flex flex-col gap-1">
                {group.label && (
                  <div className="flex items-center gap-3 px-1.5 pt-1 pb-1.5">
                    <span className="shrink-0 text-[12px] font-light leading-none text-[#aeb7d5]">
                      {group.label}
                    </span>
                    <span className="h-px flex-1 bg-[#253052]/80" />
                  </div>
                )}

                {group.items.map((item) => {
                  const isActive =
                    pathname === item.path || pathname.startsWith(item.path + "/");

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`group flex h-12 items-center gap-3 rounded-lg px-3 text-[14px] transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[#5c56ff] to-[#3922aa] text-white shadow-[0_10px_22px_rgba(84,72,255,0.28)]"
                          : "text-[#c3cae0] hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                        <Image
                          src={isActive ? item.iconActive : item.iconInactive}
                          alt={item.name}
                          className={isActive ? "brightness-0 invert" : ""}
                          fill
                          sizes="24px"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <span className="font-medium tracking-normal">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#253052]/80 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-[14px] text-[#c3cae0] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <Image
                src="/logout.svg"
                alt="ออกจากระบบ"
                fill
                sizes="20px"
                style={{ objectFit: "contain" }}
              />
            </div>
            <span className="font-medium tracking-normal">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[380px] shadow-2xl p-8 py-10 transform transition-all">
            <h2 className="mb-2 text-xl font-semibold tracking-wide text-center text-white">
              ยืนยันการออกจากระบบ
            </h2>
            <p className="text-gray-300 text-center text-[15px] mb-8 font-light">
              คุณต้องการออกจากระบบ ใช่หรือไม่?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-32 h-10 bg-[#D24949] hover:bg-red-500 transition-all rounded text-white font-light cursor-pointer text-sm"
              >
                ออกจากระบบ
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-32 h-10 text-sm font-light text-gray-300 transition-colors border border-gray-500 rounded cursor-pointer hover:bg-white/5"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
