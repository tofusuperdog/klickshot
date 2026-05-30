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
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 px-3 py-6 backdrop-blur-[3px] sm:px-4">
      <div className="relative w-full max-w-[960px] overflow-hidden rounded-lg border border-[#34407a] bg-[#0f1533]/95 shadow-2xl">
        <div
          className={`pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#34407a] bg-[#171d42]/95 px-4 py-2 text-sm font-medium text-white shadow-xl transition-all duration-300 ${
            copyState ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#85e0ad" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>{copyState}</span>
        </div>

        <div className="border-b border-[#293761] bg-[linear-gradient(135deg,rgba(94,102,255,0.20),rgba(30,37,82,0.38))] px-6 py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#5b60d8]/60 bg-[#273064] text-[#9c9aff] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <svg width="31" height="31" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[26px] font-bold leading-tight text-white">Ticket {getTicketId(ticket.id)}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      ticket.status === 'closed'
                        ? 'bg-[#17462e] text-[#85e0ad]'
                        : 'bg-[#28305c] text-[#b8c3ff]'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {statusText}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-medium text-[#b5bddb]">{ticket.name || 'ไม่ระบุหัวข้อ'}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-6 sm:pl-4">
              <button
                type="button"
                disabled={updatingId === ticket.id}
                onClick={() => onToggleStatus(ticket)}
                className={`min-w-[116px] cursor-pointer rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
                  updatingId === ticket.id
                    ? 'cursor-wait bg-gray-700 text-gray-300'
                    : ticket.status === 'closed'
                      ? 'bg-gradient-to-r from-[#6869ff] to-[#9c3dff] text-white hover:from-[#7778ff] hover:to-[#a954ff]'
                      : 'bg-[#244b38] text-white hover:bg-[#2f6047]'
                }`}
              >
                {updatingId === ticket.id ? 'กำลังอัปเดต...' : actionText}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded p-1.5 text-[#9ca7c8] transition-colors hover:bg-white/5 hover:text-white"
                aria-label="ปิดหน้าต่างรายละเอียด"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[76vh] overflow-y-auto px-6 py-5 custom-scrollbar">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard icon="language" label="ภาษา" value={(ticket.locale || '-').toUpperCase()} />
            <InfoCard icon="channel" label="ช่องทาง" value={formatSource(ticket.source)} />
            <InfoCard icon="customer" label="รหัสลูกค้า" value={ticket.customer_id || '-'} />
            <InfoCard icon="calendar" label="วันที่รับข้อเสนอแนะ" value={formatMessageDate(ticket.created_at)} />
            <InfoCard icon="clock" label="อัปเดตล่าสุด" value={formatMessageDate(ticket.updated_at || ticket.created_at)} />
            <EmailCard email={ticket.email} onCopy={handleCopyEmail} />
          </div>

          <section className="mt-5 rounded-lg border border-[#293761] bg-[#151b3d]/80 p-4">
            <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-white">
              <Icon name="message" />
              <span>ข้อความ</span>
            </div>
            <div className="max-h-[210px] overflow-y-auto rounded-lg border border-[#293761] bg-[#111735] p-4 whitespace-pre-wrap text-sm leading-7 text-gray-200 custom-scrollbar">
              {ticket.message || '-'}
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-[#293761] bg-[#151b3d]/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="staff-note" className="flex items-center gap-3 text-sm font-semibold text-white">
                <Icon name="note" />
                <span>หมายเหตุภายใน</span>
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
              className="min-h-[126px] w-full resize-y rounded-lg border border-[#293761] bg-[#111735] p-4 text-sm leading-6 text-white placeholder:text-gray-600 focus:border-[#6C72FF] focus:outline-none"
            />
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[124px] cursor-pointer rounded-lg border border-[#34407a] bg-[#121832] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1c2448]"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={savingNote}
              className="min-w-[190px] cursor-pointer rounded-lg bg-gradient-to-r from-[#6869ff] to-[#9c3dff] px-5 py-3 text-sm font-semibold text-white transition-colors hover:from-[#7778ff] hover:to-[#a954ff] disabled:cursor-wait disabled:opacity-60"
            >
              {savingNote ? 'กำลังบันทึก...' : 'บันทึกหมายเหตุ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Icon({ name }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths = {
    language: (
      <>
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
      </>
    ),
    channel: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20" />
        <path d="M12 2a15.3 15.3 0 0 0 0 20" />
      </>
    ),
    customer: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h4" />
        <path d="M7 13h2" />
        <path d="M14 13h3" />
        <path d="M14 9h3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />,
    note: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
  };

  return (
    <svg {...common} className="shrink-0 text-[#7478ff]">
      {paths[name]}
    </svg>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="flex min-h-[80px] items-center gap-4 rounded-lg border border-[#293761] bg-[#151b3d]/80 px-4 py-3">
      <Icon name={icon} />
      <div className="min-w-0">
        <div className="text-xs font-medium text-[#8d95b5]">{label}</div>
        <div className="mt-1 min-w-0 break-words text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function EmailCard({ email, onCopy }) {
  return (
    <div className="flex min-h-[80px] items-center gap-4 rounded-lg border border-[#293761] bg-[#151b3d]/80 px-4 py-3">
      <Icon name="email" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-[#8d95b5]">อีเมล</div>
        <div className="mt-1 min-w-0 break-words text-sm font-semibold text-white">{email || '-'}</div>
      </div>
      <div className="shrink-0">
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
    </div>
  );
}

export default function ContactMessagesPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [messageCounts, setMessageCounts] = useState({
    all: 0,
    open: 0,
    closed: 0,
  });
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

  const fetchMessageCounts = async (active = true) => {
    if (!user) return;

    const entries = await Promise.all(
      statusOptions.map(async (option) => {
        const { data, error: queryError } = await backofficeQuery(user, 'contact_messages', {
          limit: 50,
          status: option.value,
        });

        return [option.value, !queryError && Array.isArray(data) ? data.length : 0];
      })
    );

    if (!active) return;

    setMessageCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    let active = true;
    fetchMessages(active);
    fetchMessageCounts(active);

    return () => {
      active = false;
    };
  }, [user, statusFilter]);

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
    fetchMessageCounts();
  };

  return (
    <div className="bg-[#151a3f]/95 border border-[#34407a] rounded shadow-[0_18px_40px_rgba(10,14,42,0.24)] h-full min-h-0 flex flex-col">
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar pt-0 bg-[#151a3f]/95">
        <div className="w-full px-1 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#263163] text-white">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
              </div>
              <h2 className="text-[17px] font-semibold tracking-wide text-white">ข้อเสนอแนะ</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {overdueCount > 0 ? (
                <span className="rounded-lg border border-[#8f3434] bg-[#381414] px-2.5 py-1 text-[#ffb0b0]">
                  เกิน 7 วัน {overdueCount}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-3 flex border-b border-[#34407a]">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`cursor-pointer border-b-2 px-5 py-3 text-[13px] font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'border-[#716cff] text-[#8f8cff]'
                    : 'border-transparent text-[#a6afcf] hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                <span className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                  statusFilter === option.value
                    ? 'bg-[#716cff]/20 text-[#c5c3ff]'
                    : 'bg-[#252b4a] text-[#8f99bc]'
                }`}>
                  {messageCounts[option.value] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="divide-y divide-[#303b73] overflow-hidden rounded-lg border border-[#34407a]/80 bg-[#202650]">
            {loading ? (
              <div className="py-10 text-center text-sm font-light text-gray-400">
                กำลังโหลดข้อเสนอแนะ...
              </div>
            ) : error ? (
              <div className="py-10 text-center text-sm text-[#ff9b9b]">
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className="p-10 text-center text-sm font-light text-gray-400">
                ยังไม่มีข้อเสนอแนะในขณะนี้
              </div>
            ) : (
              messages.map((item) => {
                const overdue = isOverdueTicket(item);

                return (
                  <div
                    key={item.id}
                    className={`group flex min-h-[46px] items-center justify-between gap-3 bg-[#171d42] px-3 py-2.5 transition-colors ${
                      overdue ? 'hover:bg-[#2b1d45]' : 'hover:bg-[#1d2550]'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="w-[56px] shrink-0">
                        <span className="inline-flex h-7 min-w-[54px] items-center justify-center rounded bg-[#283052] px-2 text-[12px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                          {getTicketId(item.id)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 truncate text-[12px] text-[#b8c0dc]">
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

                      <div className="hidden w-[140px] shrink-0 truncate text-xs text-[#9ca7c8] md:block">
                        {(item.locale || '-').toUpperCase()} · {formatSource(item.source)}
                      </div>

                      <div className="hidden w-[106px] shrink-0 text-right text-xs text-[#9ca7c8] lg:block">
                        {formatMessageDate(item.created_at, { withYear: false })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTicket(item)}
                      className="shrink-0 cursor-pointer rounded p-1.5 text-[#9fa8c7] transition-all hover:bg-white/5 hover:text-white"
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
              })
            )}
          </div>
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
