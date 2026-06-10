'use client';

import { useEffect, useState } from 'react';

export default function ContractNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadNotifications() {
      try {
        const response = await fetch('/api/backoffice/contract-notifications', {
          cache: 'no-store',
          credentials: 'include',
        });
        const result = await response.json().catch(() => ({}));

        if (!isCurrent) return;
        setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
      } catch {
        if (isCurrent) setNotifications([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 60 * 1000);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    }

    function handleContractNotificationRefresh() {
      loadNotifications();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener(
      'backoffice:contract-notifications-refresh',
      handleContractNotificationRefresh,
    );

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(
        'backoffice:contract-notifications-refresh',
        handleContractNotificationRefresh,
      );
    };
  }, []);

  if (isLoading || notifications.length === 0) return null;

  const expiredCount = notifications.filter((item) => Number(item.days_until_end) <= 0).length;
  const alertCount = expiredCount || notifications.length;
  const title =
    expiredCount > 0
      ? `มีซีรีส์หมดสัญญาแล้ว ${alertCount.toLocaleString('th-TH')} เรื่อง`
      : `มีซีรีส์ใกล้หมดสัญญา ${alertCount.toLocaleString('th-TH')} เรื่อง`;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed left-1/2 top-3 z-[220] w-[calc(100%-2rem)] max-w-[720px] -translate-x-1/2"
    >
      <section className="flex min-h-[72px] items-center gap-4 rounded-lg border border-[#d7bf30]/75 bg-[#2f2d22]/95 px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.34)] backdrop-blur-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7bf30]/80 text-[#FDE047]">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold leading-6 text-white">
            {title}
          </div>
          <div className="truncate text-[12px] font-medium leading-5 text-[#f7e9a2]">
            กรุณาตรวจสอบและปิดการเผยแพร่ให้ทันเวลา เพื่อหลีกเลี่ยงความเสี่ยงด้านลิขสิทธิ์และค่าปรับ
          </div>
        </div>
      </section>
    </div>
  );
}
