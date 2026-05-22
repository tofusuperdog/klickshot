'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

const SYSTEM_TABS = [
  { id: 'back_office', label: 'ระบบหลังบ้าน' },
  { id: 'partner', label: 'ระบบพาร์ทเนอร์' },
  { id: 'website', label: 'เว็บไซด์' },
  { id: 'app', label: 'แอปดูวีดีโอ' }
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

  useEffect(() => {
    fetchVersions();
    fetchLatestVersions();
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
    }
  };

  return (
    <div className="my-6 w-full px-2">
      {/* Error Notification Banner (format from login page) */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-out ${showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[17px] font-semibold text-white tracking-wide">การอัปเดตระบบ</h2>
        <button
          onClick={handleOpenModal}
          className="w-9 h-9 bg-gradient-to-r from-[#6C72FF] to-[#8C6DFF] hover:from-[#5b61f2] hover:to-[#7c5de8] text-white rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center cursor-pointer"
          title="เพิ่มเวอร์ชันใหม่"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2d2252] mb-6">
        {SYSTEM_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-[15px] font-medium transition-colors border-b-2 cursor-pointer ${activeTab === tab.id
              ? 'border-[#6C72FF] text-[#6C72FF]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-400 py-10 text-center font-light text-sm">กำลังโหลดข้อมูล...</div>
        ) : versions.length === 0 ? (
          <div className="bg-[#131024] border border-[#2d2252] rounded-lg p-10 text-center text-gray-400 font-light text-sm">
            ยังไม่มีข้อมูลประวัติการอัปเดตสำหรับระบบนี้
          </div>
        ) : (
          versions.map((v) => (
            <div key={v.id} className="bg-[#131024]/50 border border-[#2d2252] rounded p-3 hover:bg-[#1a1635] hover:border-[#3a2c68] transition-all relative group flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Version Number */}
                <div className="w-[70px] shrink-0">
                  <span className="text-[14px] font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {v.version_number}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {v.new_features && (
                    <span className="w-2 h-2 rounded-full bg-[#4ade80]" title="ฟีเจอร์ใหม่"></span>
                  )}
                  {v.improved_features && (
                    <span className="w-2 h-2 rounded-full bg-[#60a5fa]" title="ปรับปรุง"></span>
                  )}
                  {v.fixed_features && (
                    <span className="w-2 h-2 rounded-full bg-[#f87171]" title="แก้ไขบัค"></span>
                  )}
                </div>

                {/* Date */}
                <div className="text-gray-400 text-[12px] truncate">
                  {new Date(v.release_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Detail Button with Tooltip Logic */}
                <div className="relative">
                  <button
                    onClick={() => setShowDetailId(showDetailId === v.id ? null : v.id)}
                    className={`p-1.5 rounded transition-all cursor-pointer ${showDetailId === v.id ? 'bg-[#6C72FF] text-white' : 'text-gray-400 hover:text-[#6C72FF] hover:bg-white/5'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                  </button>

                  {/* Tooltip / Detail Popover */}
                  {showDetailId === v.id && (
                    <div className="fixed sm:absolute right-0 top-full mt-2 z-[150] w-[280px] sm:w-[320px] bg-[#1a1635] border border-[#3a2c68] rounded-lg shadow-2xl p-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex justify-between items-center mb-3 border-b border-[#2d2252] pb-2">
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
                  className="p-1.5 text-gray-400 hover:text-[#6C72FF] hover:bg-white/5 rounded transition-all cursor-pointer"
                  title="แก้ไข"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(v.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded transition-all cursor-pointer"
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
        <div className={`bg-[#12102f] border border-[#2d2252] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 transform transition-transform duration-300 ${isModalOpen ? 'scale-100' : 'scale-95'} custom-scrollbar`}>
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
                  className="w-full h-10 px-3 bg-[#131024] border border-[#2d2252] rounded text-sm text-white focus:outline-none focus:border-[#6C72FF] appearance-none cursor-pointer"
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
                  className="w-full h-10 px-4 bg-[#131024] border border-[#2d2252] rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6C72FF] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-[#2d2252] pt-4">
              <label className="block text-sm font-semibold text-white mb-2">รายละเอียดการอัปเดต (เลือกอย่างน้อย 1 อย่าง)</label>

              {/* NEW Feature */}
              <div className="bg-[#131024] border border-[#2d2252] rounded-lg p-3 transition-colors">
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
                    className="w-full text-xs font-light mt-2 p-2.5 bg-[#0d0a1b] border border-[#2d2252] rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#4ade80] min-h-[80px] resize-y transition-colors"
                  />
                )}
              </div>

              {/* IMPROVED Feature */}
              <div className="bg-[#131024] border border-[#2d2252] rounded-lg p-3 transition-colors">
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
                    className="w-full text-xs font-light mt-2 p-2.5 bg-[#0d0a1b] border border-[#2d2252] rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#60a5fa] min-h-[80px] resize-y transition-colors"
                  />
                )}
              </div>

              {/* FIXED Feature */}
              <div className="bg-[#131024] border border-[#2d2252] rounded-lg p-3 transition-colors">
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
                    className="w-full text-xs font-light mt-2 p-2.5 bg-[#0d0a1b] border border-[#2d2252] rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#f87171] min-h-[80px] resize-y transition-colors"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#2d2252]">
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
                className="px-6 py-2 bg-[#6C72FF] hover:bg-[#5b61f2] disabled:opacity-50 transition-colors rounded text-white font-medium cursor-pointer shadow-[0_0_15px_rgba(108,114,255,0.4)] text-sm"
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
          <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[380px] shadow-2xl p-8 py-10 transform transition-all animate-in fade-in zoom-in duration-200">
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
                className="w-32 h-10 bg-[#D24949] hover:bg-red-500 transition-colors rounded text-white font-light cursor-pointer text-sm"
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
