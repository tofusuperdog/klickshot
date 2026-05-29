'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

const SYSTEM_TABS = [
  { id: 'back_office', label: 'หลังบ้าน' },
  { id: 'partner', label: 'พาร์ทเนอร์' },
  { id: 'website', label: 'เว็บไซด์' },
  { id: 'app', label: 'Tiktok minis' }
];

export default function VersionManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('back_office');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [latestVersions, setLatestVersions] = useState({
    back_office: '',
    partner: '',
    website: '',
    app: ''
  });
  const [versionCounts, setVersionCounts] = useState({
    back_office: 0,
    partner: 0,
    website: 0,
    app: 0
  });
  const [showDetailId, setShowDetailId] = useState(null);

  // Notification State
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);
  const errorTimeoutRef = useRef(null);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form State
  const [formSystem, setFormSystem] = useState('back_office');
  const [formVersion, setFormVersion] = useState('');
  const [formNewChecked, setFormNewChecked] = useState(false);
  const [formNewDesc, setFormNewDesc] = useState('');
  const [formImprovedChecked, setFormImprovedChecked] = useState(false);
  const [formImprovedDesc, setFormImprovedDesc] = useState('');
  const [formFixedChecked, setFormFixedChecked] = useState(false);
  const [formFixedDesc, setFormFixedDesc] = useState('');

  const displayError = (msg) => {
    setErrorMsg(msg);
    setShowError(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(false);
    }, 4000);
  };

  const fetchVersions = async () => {
    setLoading(true);
    const { data, error } = await backofficeQuery(user, 'system_versions', {
      system_type: activeTab,
    });

    if (!error && data) {
      setVersions(data);
    }
    setLoading(false);
  };

  const fetchLatestVersions = async () => {
    const results = {};
    const { data, error } = await backofficeQuery(user, 'latest_system_versions');

    SYSTEM_TABS.forEach((tab) => {
      results[tab.id] = !error && data && data[tab.id] ? data[tab.id] : 'ไม่มีข้อมูล';
    });
    setLatestVersions(results);
  };

  const fetchVersionCounts = async () => {
    if (!user) return;

    const entries = await Promise.all(
      SYSTEM_TABS.map(async (tab) => {
        const { data, error } = await backofficeQuery(user, 'system_versions', {
          system_type: tab.id,
        });

        return [tab.id, !error && Array.isArray(data) ? data.length : 0];
      })
    );

    setVersionCounts(Object.fromEntries(entries));
  };

  useEffect(() => {
    fetchVersions();
    fetchLatestVersions();
    fetchVersionCounts();
    setShowDetailId(null);
  }, [activeTab]);

  const handleOpenModal = () => {
    setEditingId(null);
    setFormSystem(activeTab);
    setFormVersion('');
    setFormNewChecked(false);
    setFormNewDesc('');
    setFormImprovedChecked(false);
    setFormImprovedDesc('');
    setFormFixedChecked(false);
    setFormFixedDesc('');
    setIsModalOpen(true);
  };

  const handleEdit = (v) => {
    setEditingId(v.id);
    setFormSystem(v.system_type);
    setFormVersion(v.version_number);
    setFormNewChecked(!!v.new_features);
    setFormNewDesc(v.new_features || '');
    setFormImprovedChecked(!!v.improved_features);
    setFormImprovedDesc(v.improved_features || '');
    setFormFixedChecked(!!v.fixed_features);
    setFormFixedDesc(v.fixed_features || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    const { error } = await backofficeMutation(user, 'system_versions', 'delete', {}, { id: deletingId });
    if (error) {
      displayError('เกิดข้อผิดพลาดในการลบข้อมูล');
    } else {
      fetchVersions();
      fetchVersionCounts();
    }
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formVersion.trim()) {
      displayError('กรุณากรอกเลขเวอร์ชัน');
      return;
    }

    if (!formNewChecked && !formImprovedChecked && !formFixedChecked) {
      displayError('กรุณาเลือกรายละเอียดการอัปเดตอย่างน้อย 1 อย่าง');
      return;
    }

    if (formNewChecked && !formNewDesc.trim()) {
      displayError('กรุณากรอกรายละเอียดในหัวข้อ เพิ่มใหม่');
      return;
    }
    if (formImprovedChecked && !formImprovedDesc.trim()) {
      displayError('กรุณากรอกรายละเอียดในหัวข้อ ปรับปรุง');
      return;
    }
    if (formFixedChecked && !formFixedDesc.trim()) {
      displayError('กรุณากรอกรายละเอียดในหัวข้อ แก้ไข');
      return;
    }

    setSubmitting(true);
    const payload = {
      system_type: formSystem,
      version_number: formVersion.trim(),
      new_features: formNewChecked ? formNewDesc.trim() : null,
      improved_features: formImprovedChecked ? formImprovedDesc.trim() : null,
      fixed_features: formFixedChecked ? formFixedDesc.trim() : null,
    };

    let error;
    if (editingId) {
      const { error: updateError } = await backofficeMutation(user, 'system_versions', 'update', payload, { id: editingId });
      error = updateError;
    } else {
      const { error: insertError } = await backofficeMutation(user, 'system_versions', 'insert', payload);
      error = insertError;
    }

    setSubmitting(false);

    if (error) {
      console.error(error);
      displayError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } else {
      setIsModalOpen(false);
      fetchVersions();
      fetchLatestVersions();
      fetchVersionCounts();
    }
  };

  const getVersionSummary = (version) => {
    return (
      version.improved_features ||
      version.fixed_features ||
      version.new_features ||
      '-'
    );
  };

  const getVersionMarkers = (version) => {
    const markers = [];

    if (version.new_features) {
      markers.push({
        label: 'เพิ่มใหม่',
        className: 'bg-[#34d981] shadow-[0_0_10px_rgba(52,217,129,0.45)]',
      });
    }
    if (version.improved_features) {
      markers.push({
        label: 'ปรับปรุง',
        className: 'bg-[#68a7ff] shadow-[0_0_10px_rgba(104,167,255,0.45)]',
      });
    }
    if (version.fixed_features) {
      markers.push({
        label: 'แก้ไข',
        className: 'bg-[#ff5b6b] shadow-[0_0_10px_rgba(255,91,107,0.45)]',
      });
    }

    return markers;
  };

  return (
    <div className="w-full px-1 py-4">
      {/* Error Notification Banner (format from login page) */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-out ${showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#263163] text-white">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.18.36.38.7.6 1h.1a2 2 0 1 1 0 4H20a1.7 1.7 0 0 0-.6 1Z" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold tracking-wide text-white">การอัปเดตระบบ</h2>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6869ff] to-[#7657f4] px-3 text-[12px] font-medium text-white shadow-[0_10px_22px_rgba(104,105,255,0.24)] transition-all hover:-translate-y-0.5 hover:from-[#7778ff] hover:to-[#8466ff]"
          title="เพิ่มเวอร์ชันใหม่"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          เพิ่มอัปเดต
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex border-b border-[#34407a]">
        {SYSTEM_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer border-b-2 px-5 py-3 text-[13px] font-medium transition-colors ${activeTab === tab.id
              ? 'border-[#716cff] text-[#8f8cff]'
              : 'border-transparent text-[#a6afcf] hover:text-white'
              }`}
          >
            <span>{tab.label}</span>
            <span className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
              activeTab === tab.id
                ? 'bg-[#716cff]/20 text-[#c5c3ff]'
                : 'bg-[#252b4a] text-[#8f99bc]'
            }`}>
              {versionCounts[tab.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-[#303b73] overflow-visible rounded-lg border border-[#34407a]/80 bg-[#202650]">
        {loading ? (
          <div className="text-gray-400 py-10 text-center font-light text-sm">กำลังโหลดข้อมูล...</div>
        ) : versions.length === 0 ? (
          <div className="p-10 text-center text-sm font-light text-gray-400">
            ยังไม่มีข้อมูลประวัติการอัปเดตสำหรับระบบนี้
          </div>
        ) : (
          versions.map((v) => (
            <div key={v.id} className="group relative flex min-h-[46px] items-center justify-between gap-4 bg-[#171d42] px-3 py-2.5 transition-colors hover:bg-[#1d2550]">
              <div className="grid min-w-0 flex-1 grid-cols-[76px_54px_minmax(0,1fr)_92px] items-center gap-3">
                {/* Version Number */}
                <div className="shrink-0">
                  <span className="inline-flex h-7 min-w-[62px] items-center justify-center rounded bg-[#283052] px-2 text-[12px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    {v.version_number}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2">
                  {getVersionMarkers(v).map((marker) => (
                    <span
                      key={marker.label}
                      className={`h-2.5 w-2.5 rounded-full ${marker.className}`}
                      title={marker.label}
                    />
                  ))}
                </div>

                <div className="truncate text-[12px] text-[#b8c0dc]">
                  {getVersionSummary(v)}
                </div>

                {/* Date */}
                <div className="truncate text-[12px] text-[#9ca7c8]">
                  {new Date(v.release_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Detail Button with Tooltip Logic */}
                <div className="relative">
                  <button
                    onClick={() => setShowDetailId(showDetailId === v.id ? null : v.id)}
                    className={`rounded p-1.5 transition-all cursor-pointer ${showDetailId === v.id ? 'bg-[#6C72FF] text-white' : 'text-[#9fa8c7] hover:text-white hover:bg-white/5'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  </button>

                  {/* Tooltip / Detail Popover */}
                  {showDetailId === v.id && (
                    <div className="fixed sm:absolute right-0 top-full mt-2 z-[150] w-[280px] sm:w-[320px] bg-[#1a1635] border border-[#3a2c68] rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex justify-between items-center mb-3 border-b border-[#34407a] pb-2">
                        <span className="text-white font-semibold text-sm">v{v.version_number}</span>
                        <button onClick={() => setShowDetailId(null)} className="text-gray-500 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {v.new_features && (
                          <div>
                            <div className="text-[#4ade80] text-[11px] font-bold mb-1 uppercase tracking-wider">เพิ่มใหม่</div>
                            <div className="text-gray-300 text-xs font-light leading-relaxed whitespace-pre-wrap">{v.new_features}</div>
                          </div>
                        )}
                        {v.improved_features && (
                          <div>
                            <div className="text-[#60a5fa] text-[11px] font-bold mb-1 uppercase tracking-wider">ปรับปรุง</div>
                            <div className="text-gray-300 text-xs font-light leading-relaxed whitespace-pre-wrap">{v.improved_features}</div>
                          </div>
                        )}
                        {v.fixed_features && (
                          <div>
                            <div className="text-[#f87171] text-[11px] font-bold mb-1 uppercase tracking-wider">แก้ไข</div>
                            <div className="text-gray-300 text-xs font-light leading-relaxed whitespace-pre-wrap">{v.fixed_features}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleEdit(v)}
                  className="cursor-pointer rounded p-1.5 text-[#9fa8c7] transition-all hover:bg-white/5 hover:text-white"
                  title="แก้ไข"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(v.id)}
                  className="cursor-pointer rounded p-1.5 text-[#9fa8c7] transition-all hover:bg-white/5 hover:text-red-300"
                  title="ลบ"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Overlay for Add/Edit */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-[#151a3f] border border-[#34407a] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 transform transition-transform duration-300 ${isModalOpen ? 'scale-100' : 'scale-95'} custom-scrollbar`}>
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? 'แก้ไขประวัติการอัปเดตระบบ' : 'เพิ่มประวัติการอัปเดตระบบ'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-light text-gray-300 mb-1.5">ระบบ</label>
                <select
                  value={formSystem}
                  onChange={(e) => setFormSystem(e.target.value)}
                  className="w-full h-10 px-3 bg-[#151a3f] border border-[#34407a] rounded text-sm text-white focus:outline-none focus:border-[#6C72FF] appearance-none cursor-pointer"
                >
                  {SYSTEM_TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-light text-gray-300">เลข Version</label>
                  {!editingId && (
                    <span className="text-[10px] text-[#6C72FF] font-medium">
                      (ล่าสุด: {latestVersions[formSystem]})
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="เช่น v1.2.0"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  required
                  className="w-full h-10 px-4 bg-[#151a3f] border border-[#34407a] rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6C72FF] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-[#34407a] pt-4">
              <label className="block text-sm font-semibold text-white mb-2">รายละเอียดการอัปเดต (เลือกอย่างน้อย 1 อย่าง)</label>

              {/* NEW Feature */}
              <div className="bg-[#151a3f] border border-[#34407a] rounded-lg p-3 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formNewChecked}
                    onChange={(e) => setFormNewChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#4ade80] cursor-pointer"
                  />
                  <span className="text-[#4ade80] text-sm font-medium tracking-wide">เพิ่มใหม่</span>
                </label>
                {formNewChecked && (
                  <textarea
                    placeholder="กรอกรายละเอียดสำหรับ เพิ่มใหม่..."
                    value={formNewDesc}
                    onChange={(e) => setFormNewDesc(e.target.value)}
                    className="w-full text-xs font-light mt-2 p-2.5 bg-[#171d42] border border-[#34407a] rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#4ade80] min-h-[80px] resize-y transition-colors"
                  />
                )}
              </div>

              {/* IMPROVED Feature */}
              <div className="bg-[#151a3f] border border-[#34407a] rounded-lg p-3 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formImprovedChecked}
                    onChange={(e) => setFormImprovedChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#60a5fa] cursor-pointer"
                  />
                  <span className="text-[#60a5fa] text-sm font-medium tracking-wide">ปรับปรุง</span>
                </label>
                {formImprovedChecked && (
                  <textarea
                    placeholder="กรอกรายละเอียดสำหรับ ปรับปรุง..."
                    value={formImprovedDesc}
                    onChange={(e) => setFormImprovedDesc(e.target.value)}
                    className="w-full text-xs font-light mt-2 p-2.5 bg-[#171d42] border border-[#34407a] rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#60a5fa] min-h-[80px] resize-y transition-colors"
                  />
                )}
              </div>

              {/* FIXED Feature */}
              <div className="bg-[#151a3f] border border-[#34407a] rounded-lg p-3 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFixedChecked}
                    onChange={(e) => setFormFixedChecked(e.target.checked)}
                    className="w-4 h-4 accent-[#f87171] cursor-pointer"
                  />
                  <span className="text-[#f87171] text-sm font-medium tracking-wide">แก้ไข</span>
                </label>
                {formFixedChecked && (
                  <textarea
                    placeholder="กรอกรายละเอียดสำหรับ แก้ไข..."
                    value={formFixedDesc}
                    onChange={(e) => setFormFixedDesc(e.target.value)}
                    className="w-full text-xs font-light mt-2 p-2.5 bg-[#171d42] border border-[#34407a] rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#f87171] min-h-[80px] resize-y transition-colors"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#34407a]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-[#504481] hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] disabled:opacity-50 transition-all rounded text-white font-medium cursor-pointer shadow-[0_0_15px_rgba(108,114,255,0.4)] text-sm"
              >
                {submitting ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <div className="bg-[#151a3f] border border-[#504481] rounded-xl w-full max-w-[380px] shadow-2xl p-8 py-10 transform transition-all animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-semibold text-white text-center mb-2 tracking-wide">
              ยืนยันการลบข้อมูล
            </h2>
            <p className="text-gray-300 text-center text-[15px] mb-8 font-light">
              คุณต้องการลบบันทึกการอัปเดตระบบนี้ ใช่หรือไม่?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={confirmDelete}
                className="w-32 h-10 bg-[#D24949] hover:bg-red-500 transition-all rounded text-white font-light cursor-pointer text-sm"
              >
                ยืนยันการลบ
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-32 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
