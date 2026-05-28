'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const defaultForm = {
  report_name: '',
  start_date: '',
  end_date: '',
  tiktok_revenue: '',
  platform_expense: '',
  free_episode_weight: '0.5',
  paid_episode_weight: '1.0',
};

function toNumber(value) {
  return Number(value || 0);
}

function formatNumber(value, digits = 0) {
  return toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(value) {
  return toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatReportNameDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function buildReportName(startDate, endDate) {
  if (!startDate || !endDate) return '';
  return `${formatReportNameDate(startDate)} - ${formatReportNameDate(endDate)}`;
}

function statusClass(status) {
  if (status === 'sent') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  if (status === 'cancelled') return 'border-red-400/40 bg-red-400/10 text-red-200';
  return 'border-amber-300/40 bg-amber-300/10 text-amber-100';
}

function statusLabel(status) {
  if (status === 'sent') return 'ส่งแล้ว';
  if (status === 'cancelled') return 'ยกเลิกแล้ว';
  return 'ร่าง';
}

function validateForm(form) {
  if (!form.start_date || !form.end_date) return 'กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด';
  if (form.start_date > form.end_date) return 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด';

  const moneyFields = [
    ['รายได้จาก TikTok', form.tiktok_revenue],
    ['ค่าใช้จ่ายแพลตฟอร์ม', form.platform_expense],
  ];

  for (const [label, value] of moneyFields) {
    if (value === '' || Number.isNaN(Number(value)) || Number(value) < 0) {
      return `${label} ต้องเป็นตัวเลขและต้องไม่ติดลบ`;
    }
  }

  for (const [label, value] of [
    ['ค่าน้ำหนักตอนฟรี', form.free_episode_weight],
    ['ค่าน้ำหนักตอนเสียเงิน', form.paid_episode_weight],
  ]) {
    if (!/^(0(\.\d)?|1(\.0)?)$/.test(String(value))) {
      return `${label} ต้องอยู่ระหว่าง 0 ถึง 1 และใส่ทศนิยมได้ 1 ตำแหน่ง`;
    }
  }

  return '';
}

function translateApiError(message, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง') {
  if (!message) return fallback;
  if (message.includes('date range already exists')) return 'มีรายงานของช่วงวันที่นี้อยู่แล้ว';
  if (message.includes('total adjusted views')) return 'ยอดดูถ่วงน้ำหนักรวมต้องมากกว่า 0 จึงจะสร้างรายงานได้';
  if (message.includes('invalid report date range')) return 'ช่วงวันที่ของรายงานไม่ถูกต้อง';
  if (message.includes('non-negative')) return 'รายได้และค่าใช้จ่ายต้องไม่ติดลบ';
  if (message.includes('weights')) return 'ค่าน้ำหนักต้องอยู่ระหว่าง 0 ถึง 1 และมีทศนิยมได้ 1 ตำแหน่ง';
  if (message.includes('permission denied')) return 'คุณไม่มีสิทธิ์ใช้งานรายงานนี้';
  if (message.includes('invalid status transition')) return 'สถานะรายงานนี้ไม่สามารถทำรายการที่เลือกได้';
  return message;
}

const actionCopy = {
  send: {
    title: 'ส่งรายงานให้พาร์ทเนอร์',
    message: 'หลังส่งแล้วพาร์ทเนอร์จะเห็นรายงานนี้ในหน้าสรุปรอบบิลเฉพาะข้อมูลของตัวเอง',
    confirm: 'ส่งรายงาน',
    success: 'ส่งรายงานให้พาร์ทเนอร์แล้ว',
    buttonClass: 'bg-emerald-500 text-[#062018] hover:bg-emerald-400',
  },
  cancel: {
    title: 'ยกเลิกการส่งรายงาน',
    message: 'รายงานนี้จะไม่แสดงเป็นรายการที่ใช้งานอยู่ในหน้าสรุปรอบบิลของพาร์ทเนอร์ แต่ข้อมูลย้อนหลังยังถูกเก็บไว้',
    confirm: 'ยกเลิกการส่ง',
    success: 'ยกเลิกการส่งรายงานแล้ว',
    buttonClass: 'bg-amber-400 text-[#241800] hover:bg-amber-300',
  },
  delete: {
    title: 'ลบรายงาน',
    message: 'ระบบจะลบแบบเก็บประวัติ เพื่อไม่ให้ข้อมูลทางการเงินหายถาวร',
    confirm: 'ลบรายงาน',
    success: 'ลบรายงานแล้ว',
    buttonClass: 'bg-red-500 text-white hover:bg-red-400',
  },
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const showToast = useCallback((type, title, message = '') => {
    setToast({ type, title, message });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const loadReports = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/backoffice/reports', {
        cache: 'no-store',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = translateApiError(result.error, 'ไม่สามารถโหลดรายการรายงานได้');
        setError(message);
        showToast('error', 'โหลดรายการรายงานไม่สำเร็จ', message);
        setReports([]);
        return;
      }

      setReports(Array.isArray(result.data) ? result.data : []);
    } catch {
      const message = 'ไม่สามารถเชื่อมต่อ API รายงานได้';
      setError(message);
      showToast('error', 'เชื่อมต่อไม่สำเร็จ', message);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast, user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadDetail = async (reportId) => {
    setIsDetailLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/backoffice/reports?id=${reportId}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.data) {
        const message = translateApiError(result.error, 'ไม่สามารถโหลดรายละเอียดรายงานได้');
        setError(message);
        showToast('error', 'โหลดรายละเอียดไม่สำเร็จ', message);
        return;
      }

      setSelected(result.data);
    } catch {
      const message = 'ไม่สามารถเชื่อมต่อ API รายงานได้';
      setError(message);
      showToast('error', 'เชื่อมต่อไม่สำเร็จ', message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if ((field === 'start_date' || field === 'end_date') && next.start_date && next.end_date) {
        next.report_name = buildReportName(next.start_date, next.end_date);
      }
      return next;
    });
  };

  const openCreate = () => {
    setForm(defaultForm);
    setError('');
    setIsModalOpen(true);
  };

  const createReport = async (event) => {
    event.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      showToast('error', 'ข้อมูลไม่ถูกต้อง', validationError);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/backoffice/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          payload: {
            ...form,
            report_name: form.report_name.trim() || buildReportName(form.start_date, form.end_date),
            tiktok_revenue: Number(form.tiktok_revenue),
            platform_expense: Number(form.platform_expense),
            free_episode_weight: Number(form.free_episode_weight),
            paid_episode_weight: Number(form.paid_episode_weight),
          },
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = translateApiError(result.error, 'ไม่สามารถสร้างรายงานได้');
        setError(message);
        showToast('error', 'สร้างรายงานไม่สำเร็จ', message);
        return;
      }

      setSelected(result.data);
      setIsModalOpen(false);
      showToast('success', 'สร้างรายงานสำเร็จ', 'รายงานถูกสร้างเป็นสถานะร่าง พร้อมให้ตรวจสอบก่อนส่ง');
      await loadReports();
    } catch {
      const message = 'ไม่สามารถเชื่อมต่อ API รายงานได้';
      setError(message);
      showToast('error', 'เชื่อมต่อไม่สำเร็จ', message);
    } finally {
      setIsSaving(false);
    }
  };

  const requestAction = (report, action) => {
    setConfirmAction({ report, action });
  };

  const runAction = async () => {
    if (!confirmAction) return;

    const { report, action } = confirmAction;
    const reportId = report.id;
    setActionId(`${action}:${reportId}`);
    setError('');

    try {
      const response = await fetch('/api/backoffice/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, report_id: reportId }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = translateApiError(result.error, 'ไม่สามารถทำรายการนี้ได้');
        setError(message);
        showToast('error', 'ทำรายการไม่สำเร็จ', message);
        return;
      }

      if (action === 'delete') {
        setSelected(null);
      } else {
        setSelected(result.data);
      }
      showToast('success', actionCopy[action].success, report.report_name);
      setConfirmAction(null);
      await loadReports();
    } catch {
      const message = 'ไม่สามารถเชื่อมต่อ API รายงานได้';
      setError(message);
      showToast('error', 'เชื่อมต่อไม่สำเร็จ', message);
    } finally {
      setActionId('');
    }
  };

  const selectedReport = selected?.report || null;
  const partners = selected?.partners || [];
  const seriesRows = selected?.series || [];

  const summary = useMemo(() => {
    const partnerRevenue = partners.reduce((sum, row) => sum + toNumber(row.revenue_share_amount), 0);
    return { partnerRevenue };
  }, [partners]);

  return (
    <div className="w-full pb-20">
      {toast ? (
        <div className="fixed left-1/2 top-8 z-[120] w-[min(520px,calc(100vw-32px))] -translate-x-1/2">
          <div
            className={`flex items-start gap-4 rounded-xl border px-5 py-4 shadow-2xl backdrop-blur-md ${
              toast.type === 'success'
                ? 'border-emerald-300/40 bg-emerald-500/95 text-[#052016]'
                : 'border-red-300/40 bg-[#D24949]/95 text-white'
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.type === 'success' ? 'bg-[#052016]/12' : 'bg-white/14'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{toast.title}</div>
              {toast.message ? <div className="mt-1 text-sm opacity-85">{toast.message}</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="sticky top-0 z-40 -mx-10 mb-4 bg-[#110d29] px-10 pb-4 shadow-[0_14px_24px_rgba(17,13,41,0.92)] before:absolute before:inset-x-0 before:bottom-full before:h-10 before:bg-[#110d29] after:absolute after:inset-x-0 after:-bottom-4 after:h-4 after:bg-[#110d29]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-white">
            <div className="relative h-9 w-9">
              <Image src="/report.svg" alt="รายงาน" fill sizes="36px" style={{ objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-200">รายงานรายได้พาร์ทเนอร์</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="cursor-pointer rounded bg-[#5c85f1] px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#4a72d7]"
          >
            สร้างรายงาน
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(360px,0.45fr)_minmax(0,1fr)] gap-5">
        <section className="overflow-hidden rounded-lg border border-[#2d2252] bg-[#12102f]/70 shadow-lg">
          <div className="border-b border-[#2d2252] px-5 py-4">
            <h2 className="text-base font-semibold text-white">รายการรายงาน</h2>
            <p className="text-sm text-gray-400">ทั้งหมด {formatNumber(reports.length)} รายการ</p>
          </div>

          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">กำลังโหลดรายงาน...</div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-gray-400">ยังไม่มีรายงาน</div>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => loadDetail(report.id)}
                  className={`block w-full cursor-pointer border-b border-[#2d2252]/80 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] ${
                    selectedReport?.id === report.id ? 'bg-[#28214f]/60' : ''
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-white">{report.report_name}</span>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${statusClass(report.status)}`}>
                      {statusLabel(report.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(report.start_date)} - {formatDate(report.end_date)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <span>รายรับสุทธิ: {formatMoney(report.net_revenue)}</span>
                    <span>พาร์ทเนอร์: {formatNumber(report.partner_count)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-h-[620px] rounded-lg border border-[#2d2252] bg-[#12102f]/70 shadow-lg">
          {isDetailLoading ? (
            <div className="flex h-full min-h-[420px] items-center justify-center text-gray-400">กำลังโหลดรายละเอียด...</div>
          ) : !selectedReport ? (
            <div className="flex h-full min-h-[420px] items-center justify-center text-gray-400">
              เลือกรายงานจากรายการด้านซ้าย หรือสร้างรายงานใหม่
            </div>
          ) : (
            <div>
              <div className="border-b border-[#2d2252] p-6">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-white">{selectedReport.report_name}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass(selectedReport.status)}`}>
                        {statusLabel(selectedReport.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatDate(selectedReport.start_date)} - {formatDate(selectedReport.end_date)}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {selectedReport.status === 'draft' || selectedReport.status === 'cancelled' ? (
                      <button
                        type="button"
                        onClick={() => requestAction(selectedReport, 'send')}
                        disabled={actionId === `send:${selectedReport.id}`}
                        className="cursor-pointer rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-[#062018] transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {selectedReport.status === 'cancelled' ? 'ส่งอีกครั้ง' : 'ส่งให้พาร์ทเนอร์'}
                      </button>
                    ) : null}
                    {selectedReport.status === 'sent' ? (
                      <button
                        type="button"
                        onClick={() => requestAction(selectedReport, 'cancel')}
                        disabled={actionId === `cancel:${selectedReport.id}`}
                        className="cursor-pointer rounded border border-amber-300/50 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ยกเลิกการส่ง
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => requestAction(selectedReport, 'delete')}
                      disabled={actionId === `delete:${selectedReport.id}`}
                      className="cursor-pointer rounded border border-red-400/50 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ลบรายงาน
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-3">
                  {[
                    ['รายได้จาก TikTok', formatMoney(selectedReport.tiktok_revenue)],
                    ['ค่าใช้จ่ายแพลตฟอร์ม', formatMoney(selectedReport.platform_expense)],
                    ['รายรับสุทธิ', formatMoney(selectedReport.net_revenue)],
                    ['ยอดจ่ายพาร์ทเนอร์รวม', formatMoney(summary.partnerRevenue)],
                    ['ยอดดูตอนฟรี', formatNumber(selectedReport.total_free_views)],
                    ['ยอดดูตอนเสียเงิน', formatNumber(selectedReport.total_paid_views)],
                    ['ยอดดูถ่วงน้ำหนักรวม', formatNumber(selectedReport.total_adjusted_views, 1)],
                    ['ค่าน้ำหนัก ฟรี / เสียเงิน', `${selectedReport.free_episode_weight} / ${selectedReport.paid_episode_weight}`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-[#2d2252] bg-[#181236]/80 p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
                      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-3 text-base font-semibold text-white">สรุปรายได้ตามพาร์ทเนอร์</h3>
                <div className="overflow-x-auto rounded-lg border border-[#2d2252]">
                  <table className="w-full min-w-[820px] border-collapse text-sm">
                    <thead className="bg-[#181236] text-left text-gray-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">พาร์ทเนอร์</th>
                        <th className="px-4 py-3 text-right font-medium">ตอนฟรี</th>
                        <th className="px-4 py-3 text-right font-medium">ตอนเสียเงิน</th>
                        <th className="px-4 py-3 text-right font-medium">ยอดดูถ่วงน้ำหนัก</th>
                        <th className="px-4 py-3 text-right font-medium">รายได้ที่ได้รับ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map((partner) => (
                        <tr key={partner.id} className="border-t border-[#2d2252]/80 text-gray-300">
                          <td className="px-4 py-3 text-white">{partner.partner_name}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(partner.total_free_views)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(partner.total_paid_views)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(partner.adjusted_views, 1)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-200">{formatMoney(partner.revenue_share_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="mb-3 mt-8 text-base font-semibold text-white">รายละเอียดตามซีรีย์</h3>
                <div className="overflow-x-auto rounded-lg border border-[#2d2252]">
                  <table className="w-full min-w-[920px] border-collapse text-sm">
                    <thead className="bg-[#181236] text-left text-gray-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">ซีรีย์</th>
                        <th className="px-4 py-3 font-medium">พาร์ทเนอร์</th>
                        <th className="px-4 py-3 text-right font-medium">ตอนฟรี</th>
                        <th className="px-4 py-3 text-right font-medium">ตอนเสียเงิน</th>
                        <th className="px-4 py-3 text-right font-medium">ยอดดูถ่วงน้ำหนัก</th>
                        <th className="px-4 py-3 text-right font-medium">ยอดเงินจากซีรีย์</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seriesRows.map((series) => (
                        <tr key={series.id} className="border-t border-[#2d2252]/80 text-gray-300">
                          <td className="px-4 py-3 text-white">{series.series_title}</td>
                          <td className="px-4 py-3">{series.partner_name}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(series.total_free_views)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(series.total_paid_views)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(series.adjusted_views, 1)}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(series.revenue_contribution_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6 backdrop-blur-[1px]">
          <form onSubmit={createReport} className="w-full max-w-[720px] rounded-xl border border-[#504481] bg-[#12102f] p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">สร้างรายงานรายได้พาร์ทเนอร์</h2>
                <p className="mt-1 text-sm text-gray-400">ระบบจะบันทึกยอดวิวและคำนวณส่วนแบ่งรายได้เป็น Snapshot หลังสร้างรายงาน</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2">
                <span className="mb-1.5 block text-sm text-gray-300">ชื่อรายงาน</span>
                <input
                  value={form.report_name}
                  readOnly
                  className="h-10 w-full cursor-not-allowed rounded bg-gray-300 px-3 text-gray-700 outline-none"
                  placeholder="01/05/2026 - 31/05/2026"
                />
              </label>

              {[
                ['start_date', 'วันที่เริ่มต้น', 'date', ''],
                ['end_date', 'วันที่สิ้นสุด', 'date', ''],
                ['tiktok_revenue', 'รายได้จาก TikTok', 'number', '0.01'],
                ['platform_expense', 'ค่าใช้จ่ายแพลตฟอร์ม', 'number', '0.01'],
                ['free_episode_weight', 'ค่าน้ำหนักตอนฟรี', 'number', '0.1'],
                ['paid_episode_weight', 'ค่าน้ำหนักตอนเสียเงิน', 'number', '0.1'],
              ].map(([field, label, type, step]) => (
                <label key={field}>
                  <span className="mb-1.5 block text-sm text-gray-300">{label}</span>
                  <input
                    type={type}
                    step={step || undefined}
                    min={type === 'number' ? '0' : undefined}
                    max={field.includes('weight') ? '1' : undefined}
                    value={form[field]}
                    onChange={(event) => updateForm(field, event.target.value)}
                    className="h-10 w-full rounded bg-white px-3 text-black outline-none focus:ring-2 focus:ring-[#709bf0]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="cursor-pointer rounded border border-gray-500 px-5 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer rounded bg-[#5c85f1] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4a72d7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'กำลังสร้างรายงาน...' : 'สร้างรายงาน'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-[#504481] bg-[#12102f] shadow-2xl">
            <div className="border-b border-[#2d2252] bg-[#181236] px-7 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#6C72FF]/40 bg-[#6C72FF]/12 text-[#9bb8ff]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white">{actionCopy[confirmAction.action].title}</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-400">{actionCopy[confirmAction.action].message}</p>
                </div>
              </div>
            </div>

            <div className="px-7 py-6">
              <div className="rounded-lg border border-[#2d2252] bg-[#0f0b25] p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">รายงานที่เลือก</div>
                <div className="mt-2 text-base font-semibold text-white">{confirmAction.report.report_name}</div>
                <div className="mt-1 text-sm text-gray-400">
                  {formatDate(confirmAction.report.start_date)} - {formatDate(confirmAction.report.end_date)}
                </div>
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={Boolean(actionId)}
                  className="cursor-pointer rounded border border-gray-500 px-5 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={runAction}
                  disabled={Boolean(actionId)}
                  className={`cursor-pointer rounded px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${actionCopy[confirmAction.action].buttonClass}`}
                >
                  {actionId ? 'กำลังดำเนินการ...' : actionCopy[confirmAction.action].confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
