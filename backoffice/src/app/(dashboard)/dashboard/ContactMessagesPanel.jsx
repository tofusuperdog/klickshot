'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

const statusOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'open', label: 'เปิดอยู่' },
  { value: 'closed', label: 'ปิดแล้ว' },
];

const statusLabels = {
  open: 'เปิดอยู่',
  closed: 'ปิดแล้ว',
};

function formatMessageDate(value) {
  if (!value) return '-';

  try {
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    }).format(new Date(value));
  } catch {
    return '-';
  }
}

function getTicketId(id) {
  return `#${id}`;
}

function isOverdueTicket(item) {
  if (item.status === 'closed' || !item.created_at) return false;

  const createdAt = new Date(item.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;

  return Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;
}

export default function ContactMessagesPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchMessages() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const { data, error: queryError } = await backofficeQuery(user, 'contact_messages', {
        limit: 50,
        status: statusFilter,
      });

      if (!active) return;

      if (queryError) {
        setMessages([]);
        setError('ไม่สามารถโหลดข้อเสนอแนะได้');
      } else {
        setMessages(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    }

    fetchMessages();

    return () => {
      active = false;
    };
  }, [user, statusFilter]);

  const totalMessages = useMemo(() => messages.length, [messages]);
  const overdueCount = useMemo(() => messages.filter(isOverdueTicket).length, [messages]);

  const handleToggleStatus = async (item) => {
    if (!user || updatingId) return;

    const nextStatus = item.status === 'closed' ? 'open' : 'closed';
    const now = new Date().toISOString();

    setUpdatingId(item.id);
    setError('');

    const { error: mutationError } = await backofficeMutation(
      user,
      'contact_messages',
      'update',
      {
        status: nextStatus,
        closed_at: nextStatus === 'closed' ? now : null,
        updated_at: now,
      },
      { id: item.id }
    );

    if (mutationError) {
      setError('ไม่สามารถอัปเดตสถานะ ticket ได้');
      setUpdatingId(null);
      return;
    }

    const { data, error: queryError } = await backofficeQuery(user, 'contact_messages', {
      limit: 50,
      status: statusFilter,
    });

    if (queryError) {
      setError('อัปเดตแล้ว แต่ไม่สามารถโหลดรายการใหม่ได้');
    } else {
      setMessages(Array.isArray(data) ? data : []);
    }

    setUpdatingId(null);
  };

  return (
    <div className="bg-[#131024] border border-[#2d2252] rounded shadow-md h-full min-h-0 flex flex-col">
      <div className="p-5 border-b border-[#2d2252] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[17px] font-semibold text-white tracking-wide">ระบบข้อเสนอแนะ</h2>
          <div className="flex shrink-0 items-center gap-2 text-xs">
            {overdueCount > 0 ? (
              <span className="rounded border border-[#8f3434] bg-[#381414] px-2.5 py-1 text-[#ffb0b0]">
                เกิน 7 วัน {overdueCount}
              </span>
            ) : null}
            <span className="rounded border border-[#3c2a75] bg-[#241b46] px-2.5 py-1 text-[#b7a7ff]">
              {totalMessages} รายการ
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                statusFilter === option.value
                  ? 'bg-[#6C72FF] text-white'
                  : 'bg-[#211a3d] text-gray-300 hover:bg-[#2b2350]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            กำลังโหลดข้อเสนอแนะ...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-[#ff9b9b]">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="text-sm font-light">ยังไม่มีข้อเสนอแนะในขณะนี้</span>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => (
              <article
                key={item.id}
                className={`rounded border px-3 py-3 shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition-colors ${
                  isOverdueTicket(item)
                    ? 'border-[#6f2d3b] bg-[#181126] hover:border-[#9c4052]'
                    : 'border-[#2b2351] bg-[#181126] hover:border-[#4b3a82]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#271b58] px-2 py-0.5 text-[11px] font-semibold leading-5 text-[#9c7cff]">
                      {getTicketId(item.id)}
                    </span>
                    <span className="truncate text-sm font-semibold text-white">
                      {item.name || 'ไม่ระบุชื่อ'}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium leading-5 ${
                        item.status === 'closed'
                          ? 'bg-[#17462e] text-[#85e0ad]'
                          : 'bg-[#28305c] text-[#b8c3ff]'
                      }`}>
                      {statusLabels[item.status] || item.status || 'เปิดอยู่'}
                    </span>
                    {isOverdueTicket(item) ? (
                      <span className="rounded bg-[#4c1818] px-2 py-0.5 text-[10px] font-medium leading-5 text-[#ffb0b0]">
                        เกิน 7 วัน
                      </span>
                    ) : null}
                  </div>
                  <div className="shrink-0 pt-0.5 text-right text-[11px] text-[#8f89a8]">
                    {formatMessageDate(item.created_at)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1 text-xs text-[#958db1]">
                  <span className="truncate">{item.email || 'ไม่ระบุอีเมล'}</span>
                  {item.locale ? (
                    <>
                      <span>·</span>
                      <span>{item.locale}</span>
                    </>
                  ) : null}
                  {item.source ? (
                    <>
                      <span>·</span>
                      <span>{item.source}</span>
                    </>
                  ) : null}
                  {item.customer_id ? (
                    <>
                      <span>·</span>
                      <span>Customer ID: {item.customer_id}</span>
                    </>
                  ) : null}
                </div>

                <div className="mt-3 border-t border-[#2b2351]" />

                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm font-medium leading-6 text-[#f0edf8]">
                  {item.message || '-'}
                </p>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="text-xs text-[#8f89a8]">
                    {item.closed_at
                      ? `ปิดเมื่อ: ${formatMessageDate(item.closed_at)}`
                      : `อัปเดตล่าสุด: ${formatMessageDate(item.updated_at || item.created_at)}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    disabled={updatingId === item.id}
                    className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                      updatingId === item.id
                        ? 'cursor-wait border-gray-600 bg-gray-700 text-gray-300'
                        : item.status === 'closed'
                          ? 'cursor-pointer border-[#584aa3] bg-[#21183f] text-[#ded8ff] hover:bg-[#2a2050]'
                          : 'cursor-pointer border-[#4d7b62] bg-[#244b38] text-white hover:bg-[#2f6047]'
                    }`}
                  >
                    {updatingId === item.id
                      ? 'กำลังอัปเดต...'
                      : item.status === 'closed'
                        ? 'เปิด ticket อีกครั้ง'
                        : 'ปิด ticket'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
