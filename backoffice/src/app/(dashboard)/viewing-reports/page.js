'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

function toDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const end = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);

  return { startDate: toDateKey(start), endDate: toDateKey(end) };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function DatePickerField({ label, value, min, max, onChange }) {
  const openPicker = (event) => {
    event.currentTarget.showPicker?.();
  };

  return (
    <label className="w-full sm:w-[260px]">
      <span className="mb-2 block text-sm font-medium text-[#c7cee6]">{label}</span>
      <div className="relative">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onClick={openPicker}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full cursor-pointer rounded-lg border border-[#3b477f] bg-[#101633] px-4 pr-12 text-sm text-white [color-scheme:dark] outline-none transition focus:border-[#777dff] focus:ring-2 focus:ring-[#6c72ff]/20 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#aeb7d5]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      </div>
    </label>
  );
}

export default function ViewingReportsPage() {
  const { user } = useAuth();
  const defaults = useState(getDefaultDateRange)[0];
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    if (!user?.id) return;
    if (!startDate || !endDate || startDate > endDate) {
      setError('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const response = await fetch(`/api/backoffice/viewing-reports?${params}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load viewing report');
      }

      setRows(Array.isArray(result.data) ? result.data : []);
    } catch (loadError) {
      console.error('Failed to load viewing report', loadError);
      setRows([]);
      setError('ไม่สามารถโหลดรายงานการเข้าชมได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  }, [endDate, startDate, user?.id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <div className="mb-5 flex shrink-0 items-center gap-3 text-white">
        <div className="relative h-9 w-9">
          <Image src="/report.svg" alt="รายงานการเข้าชม" fill sizes="36px" style={{ objectFit: 'contain' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-wide text-gray-200">รายงานการเข้าชม</h1>
          <p className="mt-0.5 text-sm font-light text-[#aab4d6]">สรุปยอดดูตอนฟรีและตอนเสียเงินแยกตามซีรีส์</p>
        </div>
      </div>

      <div className="mb-5 shrink-0 rounded border border-[#34407a] bg-[#151a3f]/95 p-5 shadow-[0_18px_40px_rgba(10,14,42,0.24)]">
        <div className="flex flex-wrap items-end gap-4">
          <DatePickerField label="วันเริ่มต้น" value={startDate} max={endDate} onChange={setStartDate} />
          <DatePickerField label="วันสิ้นสุด" value={endDate} min={startDate} onChange={setEndDate} />
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-[#34407a] bg-[#151a3f]/95 shadow-[0_18px_40px_rgba(10,14,42,0.24)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#34407a] px-5 py-4">
          <h2 className="text-base font-semibold text-white">รายการเข้าชมรายซีรีส์</h2>
          <span className="text-sm text-[#aab4d6]">ทั้งหมด {formatNumber(rows.length)} เรื่อง</span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#111735] text-[#bfc7e2]">
              <tr>
                <th className="px-5 py-3 text-left font-medium">ชื่อเรื่องภาษาไทย</th>
                <th className="px-5 py-3 text-left font-medium">ผู้ผลิต</th>
                <th className="px-5 py-3 text-right font-medium">จำนวนตอนที่ดูฟรี</th>
                <th className="px-5 py-3 text-right font-medium">จำนวนตอนที่ดูเสียเงิน</th>
                <th className="px-5 py-3 text-right font-medium">จำนวนตอนทั้งหมด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d376b]">
              {isLoading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#aab4d6]">กำลังโหลดรายงาน...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#aab4d6]">ไม่พบข้อมูลในช่วงวันที่ที่เลือก</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.series_id} className="text-gray-200 transition-colors hover:bg-white/[0.035]">
                    <td className="px-5 py-3.5 font-medium text-white">{row.title_th || '-'}</td>
                    <td className="px-5 py-3.5 text-[#c3cae0]">{row.producer_name || '-'}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-emerald-300">{formatNumber(row.free_views)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-amber-300">{formatNumber(row.paid_views)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-sky-300">{formatNumber(row.total_views)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
