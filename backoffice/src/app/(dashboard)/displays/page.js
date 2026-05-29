'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

function BannerEditModal({ isOpen, onClose, bannerIndex, seriesList, onSave, isSaving, currentSeriesId }) {
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (currentSeriesId && seriesList && seriesList.length > 0) {
        const found = seriesList.find(s => String(s.id) === String(currentSeriesId));
        if (found) {
          setSelectedSeriesId(String(found.id));
          setSelectedSeries(found);
          return;
        }
      }

      if (seriesList && seriesList.length > 0) {
        setSelectedSeriesId(String(seriesList[0].id));
        setSelectedSeries(seriesList[0]);
      } else {
        setSelectedSeriesId('');
        setSelectedSeries(null);
      }
    }
  }, [isOpen, seriesList, currentSeriesId]);

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedSeriesId(id);
    const series = seriesList.find(s => String(s.id) === id);
    setSelectedSeries(series || null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] backdrop-grayscale">
      <div className="bg-[#151a3f] border border-[#34407a] rounded-xl w-full max-w-[620px] shadow-2xl p-8 py-10 relative">
        <h2 className="text-2xl font-semibold text-white text-center mb-8 tracking-wide flex items-center justify-center gap-3">
          แบนเนอร์
          <span className="w-9 h-9 rounded-full bg-[#544081] text-white flex items-center justify-center text-[18px] font-medium shadow-md">
            {bannerIndex}
          </span>
        </h2>

        <div className="px-2">
          <span className="block text-[15px] font-light text-gray-300 mb-2">เลือกซีรีส์</span>

          <div className="relative mb-6">
            <select
              value={selectedSeriesId}
              onChange={handleSelectChange}
              disabled={isSaving}
              className="w-full h-11 px-4 bg-white rounded text-black font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#709bf0] appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {seriesList.length === 0 && <option value="" disabled>ไม่มีซีรีส์...</option>}
              {seriesList.map(s => (
                <option key={s.id} value={s.id}>{s.title_th}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Series Detail preview */}
          {selectedSeries && (
            <div className="flex gap-5 mb-8">
              <div className="w-[130px] aspect-[2/3] relative rounded overflow-hidden shadow-md shrink-0 bg-[#171d42]">
                {selectedSeries.poster_url ? (
                  <Image src={selectedSeries.poster_url} alt={selectedSeries.title_th} fill sizes="130px" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No Image</div>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-3.5 py-1 flex-1 overflow-hidden">
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">TH</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_th}>{selectedSeries.title_th || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">EN</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_en}>{selectedSeries.title_en || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">JP</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_jp}>{selectedSeries.title_jp || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-[34px] h-[26px] border border-gray-400 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 shrink-0 bg-white/5">CN</span>
                  <span className="text-gray-200 text-[14px] truncate" title={selectedSeries.title_cn}>{selectedSeries.title_cn || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {!selectedSeries && (
            <div className="h-[195px] mb-8 border border-dashed border-[#34407a] rounded-lg flex items-center justify-center bg-[#202650]/45 text-gray-500 font-light text-[14px]">
              กรุณาเลือกซีรีส์เพื่อดูข้อมูล
            </div>
          )}

          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-[160px] h-11 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => onSave(bannerIndex, selectedSeriesId)}
              disabled={isSaving || !selectedSeriesId}
              className="w-[160px] h-11 bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] transition-all rounded text-white font-medium cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DubbedLanguageModal({ isOpen, onClose, dubbedLanguages, onToggleLanguage, seriesList }) {
  if (!isOpen) return null;

  const counts = {
    th: seriesList.filter(s => s.dub_th).length,
    en: seriesList.filter(s => s.dub_en).length,
    jp: seriesList.filter(s => s.dub_jp).length,
    cn: seriesList.filter(s => s.dub_cn).length,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="bg-[#202650] border border-[#3b2b64] rounded-xl w-full max-w-[500px] shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h2 className="text-[20px] font-medium text-white mb-6">ซีรีส์พากย์ตามภาษา</h2>

        <div className="flex flex-col space-y-3 px-1">
          {dubbedLanguages.map(lang => (
            <div key={lang.id} className="flex items-center justify-between bg-[#2d304e] rounded-lg px-5 py-3 shadow-sm border border-[#3a3d5e]">
               <div className="flex items-center gap-3">
                 <span className="text-white text-[16px] font-medium">{lang.name}</span>
                 <span className="border border-[#4c5075] text-[#9ca3af] text-[12px] px-3 py-0.5 rounded-full font-light">
                   {counts[lang.code] || 0} ซีรีส์
                 </span>
               </div>
               
               <div className="flex items-center gap-4">
                 <span className="border border-[#34d399] text-[#34d399] bg-[#34d399]/5 text-[12px] px-3 py-0.5 rounded-full">
                   {lang.tag}
                 </span>
                 <div className="flex items-center gap-2">
                   <span className={`text-[12px] font-light ${lang.is_published ? 'text-[#34d399]' : 'text-gray-400'}`}>
                      เปิดใช้งาน
                   </span>
                   <div 
                     onClick={() => onToggleLanguage(lang.id, !lang.is_published, lang.code)}
                     className={`relative w-10 h-[22px] rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${lang.is_published ? 'bg-[#34d399]' : 'bg-[#bfc3cf]'}`}
                   >
                      <div className={`w-[16px] h-[16px] bg-[#202650] rounded-full shadow-sm transition-transform ${lang.is_published ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddCategoryModal({ isOpen, onClose, onSave, isSaving }) {
  const [names, setNames] = useState({ th: '', en: '', jp: '', cn: '' });
  const [error, setError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNames({ th: '', en: '', jp: '', cn: '' });
      setErrorVisible(false);
    }
  }, [isOpen]);

  const showErrorMsg = (msg) => {
    setError(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const handleSave = () => {
    if (!names.th.trim() || !names.en.trim() || !names.jp.trim() || !names.cn.trim()) {
      showErrorMsg('กรุณากรอกข้อมูลให้ครบทั้ง 4 ภาษา');
      return;
    }
    onSave(names);
  };

  if (!isOpen) return null;

  const languages = [
    { code: 'th', label: 'TH' },
    { code: 'en', label: 'EN' },
    { code: 'jp', label: 'JP' },
    { code: 'cn', label: 'CN' },
  ];

  return (
    <>
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{error}</span>
        </div>
      </div>

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] backdrop-grayscale">
        <div className="bg-[#121633] border border-[#34407a] rounded-xl w-full max-w-[500px] shadow-2xl p-8 py-10 relative">
          <h2 className="text-xl font-medium text-white text-center mb-8 tracking-wide">
            เพิ่มหมวดคอนเทนต์
          </h2>

          <div className="px-2">
            <span className="block text-[15px] font-light text-gray-300 mb-4">ชื่อหมวดคอนเทนต์</span>
            
            <div className="space-y-4 mb-10">
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center gap-4">
                  <div className="w-[45px] h-[34px] border border-gray-500 rounded flex items-center justify-center text-[13px] font-medium text-gray-300 bg-white/5 shrink-0">
                    {lang.label}
                  </div>
                  <input 
                    type="text"
                    value={names[lang.code]}
                    onChange={(e) => {
                      setNames(prev => ({ ...prev, [lang.code]: e.target.value }));
                      setErrorVisible(false);
                    }}
                    disabled={isSaving}
                    placeholder={`ระบุภาษา ${lang.label}`}
                    className="flex-1 h-11 px-4 bg-white rounded text-black font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-2">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="w-[160px] h-11 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-[160px] h-11 bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] transition-all rounded text-white font-medium cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


function CategoryDeleteModal({ category, isOpen, onClose, onConfirm, isSaving }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 9) + 1);
      setNum2(Math.floor(Math.random() * 9) + 1);
      setAnswer('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCorrect = parseInt(answer) === (num1 + num2);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="bg-[#151a3f] border border-[#3b2b64] rounded-xl w-full max-w-[480px] shadow-2xl p-8 pt-10 relative flex flex-col text-center">
        <h2 className="text-[22px] font-bold text-white mb-4">ยืนยันการลบหมวดคอนเทนต์</h2>
        
        <p className="text-gray-300 text-[15px] mb-2 font-light">
          คุณต้องการลบหมวดคอนเทนต์ <span className="font-semibold text-white">{category?.name}</span> ใช่หรือไม่?
        </p>
        <p className="text-[#f43f5e] text-[14px] mb-8 font-light">
          การดำเนินการนี้จะลบหมวดคอนเทนต์นี้ออกจากระบบและไม่สามารถย้อนกลับได้!
        </p>

        <p className="text-gray-400 text-[13px] mb-4 font-light">เพื่อยืนยันการลบ กรุณาบวกเลขด้านล่างนี้</p>
        
        <div className="flex justify-center items-center gap-4 mb-10">
          <div className="bg-[#242b4d] rounded text-white font-medium text-[20px] px-6 py-2.5 shadow-inner">
            {num1} + {num2} =
          </div>
          <input 
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-[80px] h-[52px] bg-white rounded text-[#222] font-bold text-[20px] text-center focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
            placeholder="?"
            disabled={isSaving}
          />
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => isCorrect && onConfirm()}
            disabled={!isCorrect || isSaving}
            className="w-[140px] h-11 bg-[#8f3a4b] hover:bg-[#a64055] transition-all rounded text-white font-medium cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'กำลังลบ...' : 'ลบหมวดคอนเทนต์'}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-[140px] h-11 border border-gray-600 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryEditModal({ category, onClose, seriesList, onSave, onDelete, user }) {
  const [names, setNames] = useState({ th: '', en: '', jp: '', cn: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [error, setError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  const showErrorMsg = (msg) => {
    setError(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorVisible(false), 4000);
  };

  useEffect(() => {
    if (category) {
      setNames({
        th: category.name_th || category.name || '',
        en: category.name_en || '',
        jp: category.name_jp || '',
        cn: category.name_cn || '',
      });
      setSelectedIds(category.series_ids || []);
      setErrorVisible(false);
    }
  }, [category]);

  if (!category) return null;

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!names.th.trim() || !names.en.trim() || !names.jp.trim() || !names.cn.trim()) {
      showErrorMsg('กรุณากรอกข้อมูลให้ครบทั้ง 4 ภาษา');
      return;
    }
    setIsSaving(true);
    const newBadgeText = `${selectedIds.length} ซีรีส์`;
    const { error: dbError } = await backofficeMutation(
      user,
      'content_categories',
      'update',
      {
        name: names.th.trim(), // Keep name as name_th for compatibility
        name_th: names.th.trim(),
        name_en: names.en.trim(),
        name_jp: names.jp.trim(),
        name_cn: names.cn.trim(),
        series_ids: selectedIds, 
        badge_text: newBadgeText, 
        updated_at: new Date().toISOString() 
      },
      { id: category.id }
    );
      
    setIsSaving(false);
    if (dbError) {
      showErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } else {
      onSave(category.id, names, selectedIds, newBadgeText);
    }
  };

  const handleDeleteRequest = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsSaving(true);
    const { error: dbError } = await backofficeMutation(
      user,
      'content_categories',
      'delete',
      {},
      { id: category.id }
    );
    setIsSaving(false);
    
    if (dbError) {
      showErrorMsg('เกิดข้อผิดพลาดในการลบข้อมูล');
      setIsDeleteModalOpen(false);
    } else {
      setIsDeleteModalOpen(false);
      onDelete(category.id);
    }
  };

  const languages = [
    { code: 'th', label: 'TH' },
    { code: 'en', label: 'EN' },
    { code: 'jp', label: 'JP' },
    { code: 'cn', label: 'CN' },
  ];

  return (
    <>
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{error}</span>
        </div>
      </div>

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
        <div className="bg-[#121633] border border-[#3b2b64] rounded-xl w-full max-w-[650px] shadow-2xl p-8 relative flex flex-col max-h-[90vh]">
          <h2 className="text-[20px] font-medium text-white text-center mb-6 tracking-wide">แก้ไขหมวดคอนเทนต์</h2>

          <div className="mb-6 px-1">
             <span className="block text-[14px] font-light text-gray-300 mb-4">ชื่อหมวดคอนเทนต์</span>
             <div className="grid grid-cols-2 gap-x-6 gap-y-4">
               {languages.map((lang) => (
                 <div key={lang.code} className="flex items-center gap-3">
                   <div className="w-[38px] h-[30px] border border-gray-600 rounded flex items-center justify-center text-[11px] font-medium text-gray-400 bg-white/5 shrink-0">
                     {lang.label}
                   </div>
                   <input 
                     type="text"
                     value={names[lang.code]}
                     onChange={(e) => {
                       setNames(prev => ({ ...prev, [lang.code]: e.target.value }));
                       setErrorVisible(false);
                     }}
                     disabled={isSaving}
                     className="flex-1 h-[38px] px-3 bg-[#dadada] rounded text-[#222] font-medium text-[14px] focus:outline-none focus:ring-2 focus:ring-[#5c85f1]"
                   />
                 </div>
               ))}
             </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden px-1 min-h-[250px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[15px] text-white font-medium">รายชื่อซีรีส์ที่เลือก</span>
              <span className="text-[13px] text-gray-400 font-light">ซีรีส์ที่ถูกเลือก {selectedIds.length} ซีรีส์</span>
            </div>
            
            <div className="flex-1 bg-[#1c2242] rounded-lg overflow-y-auto border border-[#3b436e] p-2 custom-scrollbar">
               {seriesList.map((s, idx) => {
                 const isSelected = selectedIds.includes(s.id);
                 return (
                   <div key={s.id} className={`flex items-center justify-between py-2.5 px-4 rounded ${idx % 2 === 0 ? 'bg-[#2b335a]' : 'bg-transparent'}`}>
                     <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-[13px] w-5">{idx + 1}</span>
                        <span className="text-[#d1d5db] text-[14px] font-light truncate max-w-[300px]">{s.title_th}</span>
                     </div>
                     <div 
                        onClick={() => !isSaving && handleToggle(s.id)}
                        className={`relative w-[34px] h-[20px] rounded-full flex items-center px-[2px] cursor-pointer transition-colors ${isSelected ? 'bg-[#34d399]' : 'bg-[#4c5075]'} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                        <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transition-transform ${isSelected ? 'ml-auto' : 'ml-0'}`}></div>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 px-1">
            <button
               onClick={handleDeleteRequest}
               disabled={isSaving}
               className="text-[#f43f5e] hover:text-[#e11d48] text-[14px] font-light transition-colors cursor-pointer disabled:opacity-50"
            >
               ลบหมวดคอนเทนต์
            </button>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="w-[120px] h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-[120px] h-10 bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] transition-all rounded text-white font-medium cursor-pointer text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CategoryDeleteModal 
        category={{...category, name: names.th}}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isSaving={isSaving}
      />
    </>
  );
}


function TopSeriesModal({ isOpen, onClose, seriesList, user }) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTopSeries, setCurrentTopSeries] = useState([]); 
  const [sortedSeries, setSortedSeries] = useState([]); 
  const [selectedSeriesForRank, setSelectedSeriesForRank] = useState({}); 
  const [dateRangeStr, setDateRangeStr] = useState('');
  
  const [error, setError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  const showErrorMsg = (msg) => {
    setError(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  useEffect(() => {
    if (isOpen) {
      setErrorVisible(false);
      fetchTopSeriesData();
    }
  }, [isOpen]);

  const fetchTopSeriesData = async () => {
    setLoading(true);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 3);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const monthsTh = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = monthsTh[startDate.getMonth()];
    const endMonth = monthsTh[endDate.getMonth()];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    let drStr = '';
    if (startYear !== endYear) {
      drStr = `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    } else if (startMonth !== endMonth) {
      drStr = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
    } else {
      drStr = `${startDay}-${endDay} ${startMonth} ${endYear}`;
    }
    setDateRangeStr(drStr);

    const { data: viewsData, error: viewsError } = await supabase
      .from('episode_daily_views')
      .select('series_id, views')
      .gte('view_date', startStr)
      .lte('view_date', endStr);
      
    const viewsMap = {}; 
    if (viewsData) {
      viewsData.forEach(row => {
        if (!viewsMap[row.series_id]) viewsMap[row.series_id] = 0;
        viewsMap[row.series_id] += (row.views || 0);
      });
    }

    let seriesWithViews = seriesList.map(s => ({
      ...s,
      views: viewsMap[s.id] || 0
    }));
    seriesWithViews.sort((a, b) => b.views - a.views);
    setSortedSeries(seriesWithViews);

    const { data: topSeriesData } = await supabase
      .from('top_series')
      .select('rank, series_id')
      .order('rank', { ascending: true });

    const currentLeft = [];
    const initialSelections = {};
    for (let i = 1; i <= 10; i++) {
        const topData = topSeriesData?.find(t => t.rank === i);
        const seriesId = topData ? topData.series_id : null;
        
        const sData = seriesId ? seriesWithViews.find(s => String(s.id) === String(seriesId)) : null;
        currentLeft.push({
            rank: i,
            series_id: seriesId,
            title: sData ? sData.title_th : '-',
            views: sData ? sData.views : 0
        });

        if (seriesId) {
            initialSelections[i] = String(seriesId);
        } else if (seriesWithViews[i-1]) {
            initialSelections[i] = String(seriesWithViews[i-1].id);
        } else {
            initialSelections[i] = '';
        }
    }
    
    setCurrentTopSeries(currentLeft);
    setSelectedSeriesForRank(initialSelections);
    setLoading(false);
  }

  const handleAutoSort = () => {
    const autoSeletions = {};
    for (let i = 1; i <= 10; i++) {
      autoSeletions[i] = sortedSeries[i - 1] ? String(sortedSeries[i - 1].id) : '';
    }
    setSelectedSeriesForRank(autoSeletions);
  }

  const handleSave = async () => {
    const selectedIds = Object.values(selectedSeriesForRank).filter(id => id !== '');
    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size !== selectedIds.length) {
      showErrorMsg('ห้ามมีเรื่องซ้ำกันเด็ดขาดในลำดับที่จัดเรียง');
      return;
    }

    setIsSaving(true);
    const payload = [];
    for (let i = 1; i <= 10; i++) {
      payload.push({
        rank: i,
        series_id: selectedSeriesForRank[i] ? parseInt(selectedSeriesForRank[i]) : null,
        updated_at: new Date().toISOString()
      });
    }

    const results = await Promise.all(payload.map(item =>
      backofficeMutation(user, 'top_series', 'upsert', item, {}, 'rank')
    ));
    const upsertError = results.find(result => result.error)?.error;

    setIsSaving(false);
    if (upsertError) {
      console.error(upsertError);
      showErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } else {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[70] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{error}</span>
        </div>
      </div>

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
        <div className="bg-[#151a3f] border border-[#3b2b64] rounded-xl w-full max-w-[900px] shadow-2xl p-8 relative flex flex-col max-h-[90vh]">
          
          <div className="mb-6">
             <h2 className="text-[22px] font-medium text-white tracking-wide">อันดับยอดนิยม</h2>
             <p className="text-gray-400 text-[14px] mt-1 font-light">จำนวนตอนที่คนดูในช่วงวันที่ {dateRangeStr}</p>
          </div>

          {loading ? (
             <div className="flex-1 flex justify-center items-center h-[300px]">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c85f1]"></div>
             </div>
          ) : (
            <div className="flex gap-6 overflow-hidden flex-1">
               {/* Left Column */}
               <div className="flex-1 flex flex-col bg-[#242b4d] rounded-lg p-5 overflow-y-auto border border-[#3b436e]">
                 <div className="text-gray-300 mb-4 font-medium text-[15px]">ลำดับในแอปปัจจุบัน</div>
                 <div className="flex flex-col">
                   {currentTopSeries.map((item, idx) => (
                     <div key={item.rank} className={`flex items-center gap-4 py-2 px-3 rounded ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#2b335a]'}`}>
                       <span className="w-[30px] h-[30px] rounded-full bg-[#161a33] text-gray-300 flex items-center justify-center text-[12px] font-medium shrink-0">
                         {item.rank}
                       </span>
                       <span className="text-[#c1c7df] text-[14.5px] font-light flex-1 truncate">{item.title}</span>
                       <span className="text-[#c1c7df] text-[14.5px] font-light shrink-0">{item.views.toLocaleString()} ตอน</span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Right Column */}
               <div className="flex-1 flex flex-col bg-[#242b4d] rounded-lg p-5 overflow-y-auto border border-[#3b436e]">
                 <div className="flex items-center justify-between mb-4">
                   <div className="text-gray-300 font-medium text-[15px]">ลำดับที่จัดเรียง</div>
                   <button onClick={handleAutoSort} className="text-white underline text-[13px] font-light hover:text-gray-300 transition-colors cursor-pointer">
                     เรียงอัตโนมัติ
                   </button>
                 </div>
                 <div className="flex flex-col space-y-2.5">
                   {[1,2,3,4,5,6,7,8,9,10].map(rank => (
                     <div key={rank} className="flex items-center gap-4">
                       <span className="w-[30px] h-[30px] rounded-full bg-[#161a33] text-gray-300 flex items-center justify-center text-[12px] font-medium shrink-0">
                         {rank}
                       </span>
                       <div className="flex-1 relative">
                         <select 
                           value={selectedSeriesForRank[rank] || ''}
                           onChange={(e) => setSelectedSeriesForRank(prev => ({...prev, [rank]: e.target.value}))}
                           className="w-full h-[38px] bg-[#d9d9d9] text-[#222] rounded px-3 text-[14px] focus:outline-none appearance-none cursor-pointer"
                           disabled={isSaving}
                         >
                           <option value="" disabled>-- เลือกซีรีส์ --</option>
                           {sortedSeries.map(s => (
                             <option key={s.id} value={s.id}>
                               {s.title_th} - {s.views.toLocaleString()} ตอน
                             </option>
                           ))}
                         </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-[160px] h-11 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="w-[160px] h-11 bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] transition-all rounded text-white font-medium cursor-pointer text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DisplaysPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('main_banner');
  const [seriesList, setSeriesList] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);

  // Banner state
  const [mainBanners, setMainBanners] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentCategories, setContentCategories] = useState([]);
  
  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Add Category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Dubbed Languages Mode state
  const [dubbedLanguages, setDubbedLanguages] = useState([]);
  const [isDubbedModalOpen, setIsDubbedModalOpen] = useState(false);
  const [isTopSeriesModalOpen, setIsTopSeriesModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Page level error notification
  const [pageError, setPageError] = useState('');
  const [pageErrorVisible, setPageErrorVisible] = useState(false);
  const pageErrorTimeoutRef = useRef(null);

  const showPageErrorMsg = (msg) => {
    setPageError(msg);
    setPageErrorVisible(true);
    if (pageErrorTimeoutRef.current) clearTimeout(pageErrorTimeoutRef.current);
    pageErrorTimeoutRef.current = setTimeout(() => setPageErrorVisible(false), 4000);
  };

  const handleSaveCategoryEdit = (id, newNames, selectedIds, newBadgeText) => {
    setContentCategories(prev => prev.map(c => 
      c.id === id 
        ? { 
            ...c, 
            name: newNames.th.trim(),
            name_th: newNames.th.trim(),
            name_en: newNames.en.trim(),
            name_jp: newNames.jp.trim(),
            name_cn: newNames.cn.trim(),
            series_ids: selectedIds, 
            badge_text: newBadgeText 
          } 
        : c
    ));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id) => {
    setContentCategories(prev => prev.filter(c => c.id !== id));
    setEditingCategory(null);
  };

  const fetchInitialData = async () => {
    if (!user?.id) return;

    setLoading(true);
    // Fetch series
    const { data: sData, error: sError } = await supabase
      .from('series')
      .select('id, title_th, title_en, title_jp, title_cn, poster_url, dub_th, dub_en, dub_jp, dub_cn')
      .eq('status', 'published')
      .order('id', { ascending: false });

    if (!sError && sData) {
      const sortedData = sData.sort((a, b) => (a.title_th || '').localeCompare(b.title_th || '', 'th'));
      setSeriesList(sortedData);
    }

    // Fetch banners
    const { data: bData, error: bError } = await supabase
      .from('main_banner')
      .select('id, series_id, series:series_id(id, title_th, poster_url)');

    if (!bError && bData) {
      const bMap = {};
      bData.forEach(b => {
        bMap[b.id] = b;
      });
      setMainBanners(bMap);
    }

    // Fetch categories
    const { data: cData, error: cError } = await backofficeQuery(user, 'content_categories');
    
    if (!cError && cData) {
      setContentCategories(cData);
    }

    // Fetch dubbed languages
    const { data: dlData, error: dlError } = await backofficeQuery(user, 'dubbed_languages');
      
    if (!dlError && dlData) {
      setDubbedLanguages(dlData);
    }

    setLoading(false);
  };

  const handleToggleDubbedLanguage = async (id, newStatus, code) => {
    // 1. Update local dubbedLanguages
    const updatedLangs = dubbedLanguages.map(l => l.id === id ? { ...l, is_published: newStatus } : l);
    setDubbedLanguages(updatedLangs);
    
    // 2. DB Update
    await backofficeMutation(user, 'dubbed_languages', 'update', { is_published: newStatus }, { id });
    
    // 3. Update "content_categories" badge text and force is_published to false
    const activeTags = updatedLangs.filter(l => l.is_published).map(l => l.code.toUpperCase());
    const newBadgeText = activeTags.length > 0 ? activeTags.join(' / ') : '0 ซีรีส์';
    
    const cat = contentCategories.find(c => c.name === 'ซีรีส์พากย์ตามภาษา');
    if (cat) {
      const updatedCat = { ...cat, badge_text: newBadgeText, is_published: false };
      setContentCategories(prev => prev.map(c => c.id === cat.id ? updatedCat : c));
      await backofficeMutation(user, 'content_categories', 'update', { badge_text: newBadgeText, is_published: false }, { id: cat.id });
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user?.id]);

  const handleSaveBanner = async (bannerIndex, seriesId) => {
    if (!seriesId) return;
    setIsSaving(true);

    const { error } = await backofficeMutation(
      user,
      'main_banner',
      'upsert',
      { id: bannerIndex, series_id: parseInt(seriesId), updated_at: new Date().toISOString() },
      {},
      'id'
    );

    setIsSaving(false);

    if (error) {
      console.error('Error saving banner:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกแบนเนอร์');
    } else {
      setEditingBanner(null);
      fetchInitialData(); // Refresh to get the latest joined series data
    }
  };

  const handleTogglePublishCategory = async (id, currentStatus) => {
    // If we are trying to publish (turn ON)
    if (!currentStatus) {
      const cat = contentCategories.find(c => c.id === id);
      if (cat) {
        if (cat.name === 'อันดับยอดนิยม') {
          // No restrictions
        } else if (cat.name === 'ซีรีส์พากย์ตามภาษา') {
          const hasActiveLanguage = dubbedLanguages.some(l => l.is_published);
          if (!hasActiveLanguage) {
            showPageErrorMsg('ต้องเปิดและเลือกซีรีส์อย่างน้อย 1 ภาษาถึงจะเผยแพร่ได้');
            return;
          }
        }
      }
    }

    const { error } = await backofficeMutation(user, 'content_categories', 'update', { is_published: !currentStatus }, { id });
    if (!error) {
      setContentCategories(prev => prev.map(c => c.id === id ? { ...c, is_published: !currentStatus } : c));
    } else {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleMoveCategoryOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === contentCategories.length - 1) return;

    const newCategories = [...contentCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const currentCat = { ...newCategories[index] };
    const targetCat = { ...newCategories[targetIndex] };
    
    const tempOrder = currentCat.sort_order;
    currentCat.sort_order = targetCat.sort_order;
    targetCat.sort_order = tempOrder;
    
    newCategories[index] = targetCat;
    newCategories[targetIndex] = currentCat;
    setContentCategories(newCategories);

    // Update in DB
    await Promise.all([
      backofficeMutation(user, 'content_categories', 'update', { sort_order: currentCat.sort_order }, { id: currentCat.id }),
      backofficeMutation(user, 'content_categories', 'update', { sort_order: targetCat.sort_order }, { id: targetCat.id })
    ]);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleAddCategory = async (names) => {
    setIsSavingCategory(true);

    const newCategoryObj = {
      name: names.th.trim(),
      name_th: names.th.trim(),
      name_en: names.en.trim(),
      name_jp: names.jp.trim(),
      name_cn: names.cn.trim(),
      badge_text: '0 ซีรีส์',
      is_published: false,
      sort_order: 1 // Temporarily, will be recalculated
    };

    const { data: insertedData, error } = await backofficeMutation(
      user,
      'content_categories',
      'insert',
      newCategoryObj
    );

    if (error || !insertedData || insertedData.length === 0) {
      alert('เกิดข้อผิดพลาดในการเพิ่มหมวดคอนเทนต์');
      setIsSavingCategory(false);
      return;
    }

    const insertedCategory = insertedData[0];
    const newCategories = [insertedCategory, ...contentCategories];
    
    // Recalculate sort_order
    const updatedCategories = newCategories.map((item, idx) => ({
       ...item,
       sort_order: idx + 1
    }));

    setContentCategories(updatedCategories);

    const updates = updatedCategories.map(u => 
      backofficeMutation(user, 'content_categories', 'update', { sort_order: u.sort_order }, { id: u.id })
    );
    await Promise.all(updates);

    setIsSavingCategory(false);
    setIsAddingCategory(false);
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
       setDraggedIndex(null);
       setDragOverIndex(null);
       return;
    }
    
    const newCategories = [...contentCategories];
    const draggedItem = newCategories[draggedIndex];
    
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);
    
    // Update sort_order for all items
    const updatedCategories = newCategories.map((item, idx) => ({
       ...item,
       sort_order: idx + 1
    }));
    
    setContentCategories(updatedCategories);
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Save to DB
    await Promise.all(updatedCategories.map(u => backofficeMutation(user, 'content_categories', 'update', { sort_order: u.sort_order }, { id: u.id })));
  };

  const tabs = [
    { id: 'main_banner', label: 'แบนเนอร์หลัก' },
    { id: 'content_category', label: 'หมวดคอนเทนต์' },
  ];

  return (
    <div className="w-full relative pb-20">
      {/* Page Error Banner */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${pageErrorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{pageError}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-white">
          <div className="relative w-9 h-9">
            <Image src="/displays.svg" alt="Displays" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-xl text-gray-300 font-semibold tracking-wide">การแสดงผล</h1>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="w-full bg-[#151a3f] border border-[#34407a] rounded-lg flex flex-col shadow-lg overflow-hidden">

        {/* Tab Headers */}
        <div className="flex border-b border-[#34407a] bg-[#202650]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3.5 text-[15px] transition-colors relative font-light cursor-pointer ${activeTab === tab.id
                ? 'text-white bg-[#262247] shadow-inner'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-20 h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
              <span className="ml-3 text-gray-300">กำลังโหลดข้อมูล...</span>
            </div>
          ) : activeTab === 'main_banner' && (
            <div className="w-full h-full">
              <div className="flex justify-center gap-4 w-full">
                {[1, 2, 3, 4, 5].map((item) => {
                  const bannerData = mainBanners[item];
                  const hasBanner = bannerData && bannerData.series;

                  return (
                    <div key={item} className="flex flex-col items-center flex-1 max-w-[220px]">
                      {/* Placeholder Card */}
                      <div
                        onClick={() => setEditingBanner(item)}
                        className={`w-full flex flex-col rounded-md relative cursor-pointer overflow-hidden ${item === 3 ? 'border-[5px] border-[#362375]' : 'border-[5px] border-transparent hover:border-[#5c85f1]/50'} shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(92,133,241,0.2)] transition-all`}
                      >
                        {item === 3 && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#362375] text-white px-4 py-0.5 rounded-b text-[18px] font-medium z-30 tracking-wide">
                            กลางจอ
                          </div>
                        )}
                        {/* Number Badge (Always Top Right) */}
                        <div className="absolute top-3 right-3 w-[34px] h-[34px] rounded-full bg-[#544081] text-white flex items-center justify-center text-[15px] font-medium shadow-md z-20">
                          {item}
                        </div>

                        {hasBanner ? (
                          <>
                            {/* Poster Area */}
                            <div className="w-full aspect-[2/3] relative bg-[#171d42]">
                              {bannerData.series.poster_url && (
                                <Image src={bannerData.series.poster_url} alt={bannerData.series.title_th} fill sizes="240px" style={{ objectFit: 'cover' }} className="z-0" />
                              )}
                            </div>
                            {/* Title Area */}
                            <div className="w-full h-[64px] bg-[#222222] flex items-center justify-center px-4 z-10">
                              <span className="text-[#e2e2e2] text-[14px] font-medium tracking-wide truncate block text-center w-full">
                                {bannerData.series.title_th}
                              </span>
                            </div>
                          </>
                        ) : (
                          /* Empty Placeholder Area matching total height */
                          <div className="w-full flex items-center justify-center bg-[#dcdcdc] relative" style={{ paddingBottom: 'calc(150% + 64px)' }}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[140px] font-bold text-[#a0a0a0] leading-none select-none">
                                ?
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'content_category' && (
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-300 font-medium">{contentCategories.length} หมวดคอนเทนต์</span>
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] text-white px-5 py-2 rounded text-[14px] transition-colors shadow-sm cursor-pointer"
                >
                  เพิ่มหมวด
                </button>
              </div>

              <div className="flex flex-col space-y-3">
                {contentCategories.map((cat, idx) => {
                  const isUpDisabled = idx === 0;
                  const isDownDisabled = idx === contentCategories.length - 1;

                  return (
                    <div 
                      key={cat.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnter={(e) => handleDragEnter(e, idx)}
                      onDragOver={handleDragOver}
                      onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`flex items-center justify-between border transition-all rounded-md p-3.5 px-5 shadow-sm 
                        ${draggedIndex === idx ? 'opacity-40 border-dashed border-[#5c85f1] bg-[#1a1c30]' : 'bg-[#282a45] hover:bg-[#2d304e] border-[#383b5b]'}
                        ${dragOverIndex === idx && draggedIndex !== idx ? 'border-t-2 border-t-[#5c85f1] scale-[1.01]' : ''}
                      `}
                    >
                      <div className="flex items-center gap-5 py-1.5 flex-1 min-w-0 mr-10">
                        {/* Drag Handle */}
                        <div className="flex flex-col gap-[3px] text-[#6b6f9e] shrink-0 cursor-grab">
                          <div className="flex gap-[3px]"><div className="w-[3px] h-[3px] rounded-full bg-current"></div><div className="w-[3px] h-[3px] rounded-full bg-current"></div></div>
                          <div className="flex gap-[3px]"><div className="w-[3px] h-[3px] rounded-full bg-current"></div><div className="w-[3px] h-[3px] rounded-full bg-current"></div></div>
                          <div className="flex gap-[3px]"><div className="w-[3px] h-[3px] rounded-full bg-current"></div><div className="w-[3px] h-[3px] rounded-full bg-current"></div></div>
                        </div>

                        {/* Languages Part */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 flex-1 min-w-0">
                            {/* TH */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-[32px] h-[22px] border border-gray-600 rounded flex items-center justify-center text-[10px] font-medium text-gray-400 bg-white/5 shrink-0">TH</span>
                              <span className="text-[#d1d5db] text-[15px] font-normal truncate" title={cat.name_th || cat.name}>{cat.name_th || cat.name}</span>
                            </div>
                            {/* EN */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-[32px] h-[22px] border border-gray-600 rounded flex items-center justify-center text-[10px] font-medium text-gray-400 bg-white/5 shrink-0">EN</span>
                              <span className="text-gray-400 text-[14.5px] font-light truncate" title={cat.name_en}>{cat.name_en || '-'}</span>
                            </div>
                            {/* JP */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-[32px] h-[22px] border border-gray-600 rounded flex items-center justify-center text-[10px] font-medium text-gray-400 bg-white/5 shrink-0">JP</span>
                              <span className="text-gray-400 text-[14.5px] font-light truncate" title={cat.name_jp}>{cat.name_jp || '-'}</span>
                            </div>
                            {/* CN */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-[32px] h-[22px] border border-gray-600 rounded flex items-center justify-center text-[10px] font-medium text-gray-400 bg-white/5 shrink-0">CN</span>
                              <span className="text-gray-400 text-[14.5px] font-light truncate" title={cat.name_cn}>{cat.name_cn || '-'}</span>
                            </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 text-gray-400 shrink-0">
                        {cat.badge_text && (
                          <span className="border border-[#4c5075] text-[#9ca3af] text-[11px] px-3 py-0.5 rounded-full font-light tracking-wide shrink-0 whitespace-nowrap mr-2">
                            {cat.badge_text}
                          </span>
                        )}

                        {/* Edit Icon */}
                        <button 
                          onClick={() => {
                            if (cat.name === 'ซีรีส์พากย์ตามภาษา') {
                              setIsDubbedModalOpen(true);
                            } else if (cat.name === 'อันดับยอดนิยม') {
                              setIsTopSeriesModalOpen(true);
                            } else {
                              setEditingCategory(cat);
                            }
                          }}
                          className="hover:text-white cursor-pointer text-[#a5a9c4] transition-colors"
                        >
                            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>


                        <div className="w-[1px] h-5 bg-[#4c5075]"></div>

                        {/* Arrows */}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleMoveCategoryOrder(idx, 'up')}
                            disabled={isUpDisabled}
                            className={`transition-colors ${!isUpDisabled ? 'text-[#34d399] hover:text-[#10b981] cursor-pointer' : 'text-[#4c5075] cursor-not-allowed'}`}
                          >
                            <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleMoveCategoryOrder(idx, 'down')}
                            disabled={isDownDisabled}
                            className={`transition-colors ${!isDownDisabled ? 'text-[#f43f5e] hover:text-[#e11d48] cursor-pointer' : 'text-[#4c5075] cursor-not-allowed'}`}
                          >
                            <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <div className="w-[1px] h-5 bg-[#4c5075]"></div>

                        {/* Publish Toggle */}
                        <div className="flex items-center gap-3">
                          <span className={`text-[14px] font-medium tracking-wide ${cat.is_published ? 'text-[#34d399]' : 'text-gray-500'}`}>เผยแพร่</span>
                          <div 
                            onClick={() => handleTogglePublishCategory(cat.id, cat.is_published)}
                            className={`relative w-9 h-[20px] rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${cat.is_published ? 'bg-[#34d399]' : 'bg-[#4c5075]'}`}
                          >
                            <div className={`w-[16px] h-[16px] bg-[#202650] rounded-full shadow-sm transition-transform ${cat.is_published ? 'ml-auto' : 'ml-0'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <BannerEditModal
        isOpen={editingBanner !== null}
        onClose={() => setEditingBanner(null)}
        bannerIndex={editingBanner}
        seriesList={seriesList}
        onSave={handleSaveBanner}
        isSaving={isSaving}
        currentSeriesId={editingBanner !== null ? mainBanners[editingBanner]?.series_id : null}
      />

      <AddCategoryModal 
        isOpen={isAddingCategory}
        onClose={() => setIsAddingCategory(false)}
        onSave={handleAddCategory}
        isSaving={isSavingCategory}
      />

      <DubbedLanguageModal
        isOpen={isDubbedModalOpen}
        onClose={() => setIsDubbedModalOpen(false)}
        dubbedLanguages={dubbedLanguages}
        onToggleLanguage={handleToggleDubbedLanguage}
        seriesList={seriesList}
      />

      <TopSeriesModal
        isOpen={isTopSeriesModalOpen}
        onClose={() => setIsTopSeriesModalOpen(false)}
        seriesList={seriesList}
        user={user}
      />

      <CategoryEditModal
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        seriesList={seriesList}
        onSave={handleSaveCategoryEdit}
        onDelete={handleDeleteCategory}
        user={user}
      />
    </div>
  );
}
