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

function formatMessageDate(value, { withYear = true } = {}) {
  if (!value) return '-';

  try {
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    })
      .format(new Date(value))
      .replace(',', '');
  } catch {
    return '-';
  }
}

function getTicketId(id) {
  return `#${id}`;
}

function formatSource(source) {
  return source ? String(source).replaceAll('_', '-') : '-';
}

function isOverdueTicket(item) {
  if (item.status === 'closed' || !item.created_at) return false;

  const createdAt = new Date(item.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;

  return Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000;
}

function TicketDetailModal({
  ticket,
  updatingId,
  savingNote,
  onClose,
  onToggleStatus,
  onSaveNote,
}) {
  const [staffNote, setStaffNote] = useState('');
  const [copyState, setCopyState] = useState('');
  const [noteState, setNoteState] = useState('');

  useEffect(() => {
    setStaffNote(ticket?.staff_note || '');
    setCopyState('');
    setNoteState('');
  }, [ticket]);

  if (!ticket) return null;

  const statusText = statusLabels[ticket.status] || ticket.status || 'เปิดอยู่';
  const actionText = ticket.status === 'closed' ? 'เปิด ticket' : 'ปิด ticket';

  const handleCopyEmail = async () => {
    if (!ticket.email) return;

    try {
      await navigator.clipboard.writeText(ticket.email);
      setCopyState('คัดลอก email แล้ว');
      window.setTimeout(() => setCopyState(''), 1800);
    } catch {
      setCopyState('คัดลอกไม่สำเร็จ');
      window.setTimeout(() => setCopyState(''), 1800);
    }
  };

  const handleSaveNote = async () => {
    const ok = await onSaveNote(ticket, staffNote);
    setNoteState(ok ? 'บันทึกหมายเหตุแล้ว' : 'บันทึกหมายเหตุไม่สำเร็จ');
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[3px]">
      <div className="relative w-full max-w-[920px] overflow-hidden rounded-xl border border-[#3a2c68] bg-[#12102f] shadow-2xl">
        <div className="border-b border-[#2d2252] bg-[linear-gradient(135deg,rgba(108,114,255,0.20),rgba(255,72,200,0.08))] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="ปิดหน้าต่างรายละเอียด"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 pr-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-white">Ticket {getTicketId(ticket.id)}</h3>
                <span
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    ticket.status === 'closed'
                      ? 'bg-[#17462e] text-[#85e0ad]'
                      : 'bg-[#28305c] text-[#b8c3ff]'
                  }`}
                >
                  {statusText}
                </span>
              </div>
              <p className="mt-2 truncate text-sm text-gray-300">{ticket.name || 'ไม่ระบุหัวข้อ'}</p>
            </div>

            <div className="flex items-center gap-3 pr-5">
              <button
                type="button"
                disabled={updatingId === ticket.id}
                onClick={() => onToggleStatus(ticket)}
                className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                  updatingId === ticket.id
                    ? 'cursor-wait bg-gray-700 text-gray-300'
                    : ticket.status === 'closed'
                      ? 'cursor-pointer bg-[#6C72FF] text-white hover:bg-[#5b61f2]'
                      : 'cursor-pointer bg-[#244b38] text-white hover:bg-[#2f6047]'
                }`}
              >
                {updatingId === ticket.id ? 'กำลังอัปเดต...' : actionText}
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[76vh] overflow-y-auto p-6 custom-scrollbar">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard label="ภาษา" value={ticket.locale || '-'} />
            <InfoCard label="ช่องทาง" value={formatSource(ticket.source)} />
            <InfoCard label="รหัสลูกค้า" value={ticket.customer_id || '-'} />
            <InfoCard label="วันที่รับข้อเสนอแนะ" value={formatMessageDate(ticket.created_at)} />
            <InfoCard label="อัปเดตล่าสุด" value={formatMessageDate(ticket.updated_at || ticket.created_at)} />
            <EmailCard email={ticket.email} copyState={copyState} onCopy={handleCopyEmail} />
          </div>

          <div className="mt-5 rounded-lg border border-[#2d2252] bg-[#0d0a1b]/70 p-4">
            <div className="mb-2 text-sm font-semibold text-white">ข้อความ:</div>
            <div className="max-h-[180px] overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-gray-200 custom-scrollbar">
              {ticket.message || '-'}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-[#3a2c68] bg-[#181331] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="staff-note" className="text-sm font-semibold text-white">
                หมายเหตุ
              </label>
              {noteState ? <span className="text-xs text-[#9f93ff]">{noteState}</span> : null}
            </div>
            <textarea
              id="staff-note"
              value={staffNote}
              onChange={(event) => {
                setStaffNote(event.target.value);
                setNoteState('');
              }}
              placeholder="บันทึกข้อมูลเพิ่มเติมสำหรับทีมงาน..."
              className="min-h-[120px] w-full resize-y rounded border border-[#2d2252] bg-[#0d0a1b] p-3 text-sm leading-6 text-white placeholder:text-gray-600 focus:border-[#6C72FF] focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="cursor-pointer rounded bg-[#6C72FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5b61f2] disabled:cursor-wait disabled:opacity-60"
              >
                {savingNote ? 'กำลังบันทึก...' : 'บันทึกหมายเหตุ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#2d2252] bg-[#0d0a1b]/70 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 min-w-0 break-words text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function EmailCard({ email, copyState, onCopy }) {
  return (
    <div className="rounded-lg border border-[#2d2252] bg-[#0d0a1b]/70 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">อีเมล์</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="min-w-0 break-words text-sm font-medium text-white">{email || '-'}</div>
        {email ? (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-[#6C72FF]"
            title="Copy email"
            aria-label="Copy email"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        ) : null}
      </div>
      {email ? (
        <div
          className={`mt-2 flex min-h-[28px] items-center gap-2 rounded border border-[#3a2c68] bg-[#181331]/95 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-300 ${
            copyState ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#85e0ad" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{copyState}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function ContactMessagesPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [updatingId, setUpdatingId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchMessages = async (active = true) => {
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
  };

  useEffect(() => {
    let active = true;
    fetchMessages(active);

    return () => {
      active = false;
    };
  }, [user, statusFilter]);

  const totalMessages = useMemo(() => messages.length, [messages]);
  const overdueCount = useMemo(() => messages.filter(isOverdueTicket).length, [messages]);

  const updateMessageInState = (updatedTicket) => {
    setMessages((current) => current.map((item) => (item.id === updatedTicket.id ? updatedTicket : item)));
    setSelectedTicket(updatedTicket);
  };

  const handleSaveNote = async (item, note) => {
    if (!user || savingNote) return false;

    const now = new Date().toISOString();
    setSavingNote(true);
    setError('');

    const { data, error: mutationError } = await backofficeMutation(
      user,
      'contact_messages',
      'update',
      {
        staff_note: note.trim() ? note.trim() : null,
        updated_at: now,
      },
      { id: item.id }
    );

    setSavingNote(false);

    if (mutationError) {
      setError('ไม่สามารถบันทึกหมายเหตุได้');
      return false;
    }

    const updatedTicket = Array.isArray(data) && data[0] ? data[0] : { ...item, staff_note: note.trim() || null, updated_at: now };
    updateMessageInState(updatedTicket);
    return true;
  };

  const handleToggleStatus = async (item) => {
    if (!user || updatingId) return;

    const nextStatus = item.status === 'closed' ? 'open' : 'closed';
    const now = new Date().toISOString();

    setUpdatingId(item.id);
    setError('');

    const { data, error: mutationError } = await backofficeMutation(
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

    const updatedTicket = Array.isArray(data) && data[0]
      ? data[0]
      : { ...item, status: nextStatus, closed_at: nextStatus === 'closed' ? now : null, updated_at: now };

    setMessages((current) => {
      const filteredOut =
        statusFilter !== 'all' &&
        statusFilter !== updatedTicket.status;
      const next = filteredOut
        ? current.filter((message) => message.id !== updatedTicket.id)
        : current.map((message) => (message.id === updatedTicket.id ? updatedTicket : message));
      return next;
    });
    setSelectedTicket(updatedTicket);
    setUpdatingId(null);
  };

  return (
    <div className="bg-[#131024] border border-[#2d2252] rounded shadow-md h-full min-h-0 flex flex-col">
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar pt-0">
        <div className="my-6 w-full px-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[17px] font-semibold text-white tracking-wide">ข้อเสนอแนะ</h2>
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

          <div className="flex border-b border-[#2d2252] mb-6">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`px-6 py-3 text-[15px] font-medium transition-colors border-b-2 cursor-pointer ${
                  statusFilter === option.value
                    ? 'border-[#6C72FF] text-[#6C72FF]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-gray-400 py-10 text-center font-light text-sm">
              กำลังโหลดข้อเสนอแนะ...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-[#ff9b9b]">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-[#131024] border border-[#2d2252] rounded-lg p-10 text-center text-gray-400 font-light text-sm">
              ยังไม่มีข้อเสนอแนะในขณะนี้
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((item) => {
                const overdue = isOverdueTicket(item);

                return (
                  <div
                    key={item.id}
                    className={`bg-[#131024]/50 border rounded p-3 transition-all group flex items-center justify-between gap-3 ${
                      overdue
                        ? 'border-[#6f2d3b] hover:bg-[#1a142b] hover:border-[#9c4052]'
                        : 'border-[#2d2252] hover:bg-[#1a1635] hover:border-[#3a2c68]'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="w-[56px] shrink-0">
                        <span className="text-[14px] font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          {getTicketId(item.id)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                        {item.name || 'ไม่ระบุหัวข้อ'}
                      </div>

                      <div className="w-[82px] shrink-0">
                        <span
                          className={`rounded px-2 py-1 text-[11px] font-medium ${
                            item.status === 'closed'
                              ? 'bg-[#17462e] text-[#85e0ad]'
                              : 'bg-[#28305c] text-[#b8c3ff]'
                          }`}
                        >
                          {statusLabels[item.status] || item.status || 'เปิดอยู่'}
                        </span>
                      </div>

                      <div className="hidden w-[140px] shrink-0 truncate text-xs text-gray-400 md:block">
                        {(item.locale || '-').toUpperCase()} · {formatSource(item.source)}
                      </div>

                      <div className="hidden w-[106px] shrink-0 text-right text-xs text-gray-400 lg:block">
                        {formatMessageDate(item.created_at, { withYear: false })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTicket(item)}
                      className="shrink-0 rounded p-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-[#6C72FF] cursor-pointer"
                      aria-label={`เปิดรายละเอียด ticket ${getTicketId(item.id)}`}
                      title="รายละเอียด"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TicketDetailModal
        ticket={selectedTicket}
        updatingId={updatingId}
        savingNote={savingNote}
        onClose={() => setSelectedTicket(null)}
        onToggleStatus={handleToggleStatus}
        onSaveNote={handleSaveNote}
      />
    </div>
  );
}
