'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  {
    name: 'ภาพรวม',
    path: '/dashboard',
    permKey: null, // always visible
    iconInactive: '/dashboard.svg',
    iconActive: '/dashboard_b.svg',
  },
  {
    name: 'ซีรีส์',
    path: '/series',
    permKey: 'perm_series',
    iconInactive: '/series.svg',
    iconActive: '/series_b.svg',
  },
  {
    name: 'แนวเรื่อง',
    path: '/genres',
    permKey: 'perm_genres',
    iconInactive: '/genres.svg',
    iconActive: '/genres_b.svg',
  },
  {
    name: 'การแสดงผล',
    path: '/displays',
    permKey: 'perm_displays',
    iconInactive: '/displays.svg',
    iconActive: '/displays_b.svg',
  },
  {
    name: 'การขาย',
    path: '/sales',
    permKey: 'perm_sales',
    iconInactive: '/sales.svg',
    iconActive: '/sales_b.svg',
  },
  {
    name: 'ลูกค้า',
    path: '/customers',
    permKey: 'perm_customers',
    iconInactive: '/customers.svg',
    iconActive: '/customers_b.svg',
  },
  {
    name: 'ผู้ใช้งาน',
    path: '/users',
    permKey: 'perm_users',
    iconInactive: '/users.svg',
    iconActive: '/users_b.svg',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Filter menus based on user permissions
  const visibleMenus = menuItems.filter((item) => {
    if (!item.permKey) return true; // dashboard always visible
    return user && user[item.permKey];
  });

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <div className="w-[260px] h-full bg-gradient-to-b from-[#11154D] to-[#291337] text-gray-300 flex flex-col justify-between border-r border-[#2d2252] flex-shrink-0">
        <div>
          <div className="p-8 pb-4 flex flex-col items-center justify-center">
            <div className="relative w-[210px] h-[55px]">
              <Image src="/minchaplogo_main.webp" alt="minChap Logo" fill sizes="180px" style={{ objectFit: 'contain' }} priority />
            </div>
            <p className="text-xs text-gray-300 font-light tracking-wider mt-[-6px]">TikTok Minis CMS</p>
          </div>

          <nav className="mt-6 flex flex-col">
            {visibleMenus.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-4 px-8 py-3.5 transition-colors ${isActive
                    ? 'bg-gradient-to-r from-transparent to-[#28214f] text-[#6C72FF] border-l-4 border-white'
                    : 'hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                >
                  <div className="flex items-center justify-center relative w-7 h-7">
                    <Image
                      src={isActive ? item.iconActive : item.iconInactive}
                      alt={item.name}
                      fill
                      sizes="28px"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <span className="font-light tracking-wide">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-[#2d2252]">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center space-x-4 px-8 py-5 hover:bg-white/5 hover:text-white transition-colors text-gray-300 w-full cursor-pointer"
          >
            <div className="flex items-center justify-center relative w-6 h-6">
              <Image
                src="/logout.svg"
                alt="ออกจากระบบ"
                fill
                sizes="22px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span className="font-light tracking-wide">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[380px] shadow-2xl p-8 py-10 transform transition-all">

            <h2 className="text-xl font-semibold text-white text-center mb-2 tracking-wide">
              ยืนยันการออกจากระบบ
            </h2>
            <p className="text-gray-300 text-center text-[15px] mb-8 font-light">
              คุณต้องการออกจากระบบ ใช่หรือไม่?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-32 h-10 bg-[#D24949] hover:bg-red-500 transition-colors rounded text-white font-light cursor-pointer text-sm"
              >
                ออกจากระบบ
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-32 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-sm"
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
