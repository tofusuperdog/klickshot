'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

// Helper for pill toggles
function LangToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-7 text-xs border rounded flex items-center justify-center transition-colors cursor-pointer font-medium ${
        active 
          ? 'bg-green-500 border-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
          : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

export default function CreateSeriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [contentProducers, setContentProducers] = useState([]);
  const [loadingContentProducers, setLoadingContentProducers] = useState(true);
  
  const [formData, setFormData] = useState({
    title_th: '',
    title_en: '',
    title_jp: '',
    title_cn: '',
    content_producer_id: '',
    genre_ids: [],
    total_episodes: 1,
    dub_th: false,
    dub_en: false,
    dub_jp: false,
    dub_cn: false,
    sub_th: false,
    sub_en: false,
    sub_jp: false,
    sub_cn: false,
  });
  
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  // Fetch Genres and content producers
  useEffect(() => {
    async function fetchOptions() {
      if (!user?.id) return;

      const { data: genresData, error: genresError } = await backofficeQuery(user, 'genres');
        
      if (!genresError && genresData) {
        setGenres(genresData);
      }
      setLoadingGenres(false);

      const { data: producerData, error: producerError } = await backofficeQuery(user, 'content_producers');

      if (!producerError && producerData) {
        setContentProducers(producerData);
      }
      setLoadingContentProducers(false);
    }
    fetchOptions();
  }, [user]);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (id) => {
    setFormData(prev => {
      const isSelected = prev.genre_ids.includes(id);
      if (isSelected) {
        return { ...prev, genre_ids: prev.genre_ids.filter(gId => gId !== id) };
      } else {
        return { ...prev, genre_ids: [...prev.genre_ids, id] };
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check extension
    if (!file.name.toLowerCase().endsWith('.webp') && file.type !== 'image/webp') {
      showError('กรุณาอัปโหลดไฟล์ นามสกุล .webp เท่านั้น');
      e.target.value = '';
      return;
    }
    
    setPosterFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPosterPreview(objectUrl);
  };

  const handleSave = async () => {
    if (!formData.title_th.trim() || !formData.title_en.trim() || !formData.title_jp.trim() || !formData.title_cn.trim()) {
      showError('กรุณากรอกชื่อเรื่องให้ครบทั้ง 4 ภาษา');
      return;
    }

    if (formData.genre_ids.length === 0) {
      showError('กรุณาเลือกแนวหนังอย่างน้อย 1 แนว');
      return;
    }

    if (!formData.content_producer_id) {
      showError('กรุณาเลือกผู้ผลิต');
      return;
    }

    if (!formData.dub_th && !formData.dub_en && !formData.dub_jp && !formData.dub_cn) {
      showError('กรุณาเลือกเสียงพากย์อย่างน้อย 1 ภาษา');
      return;
    }

    if (!posterFile) {
      showError('กรุณาอัปโหลดรูปภาพโปสเตอร์');
      return;
    }
    
    setIsSaving(true);
    
    let poster_url = null;
    
    // 1. Upload Poster if exists
    if (posterFile) {
      const fileExt = posterFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posters/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, posterFile);
        
      if (uploadError) {
        console.error('Error uploading poster:', uploadError);
        showError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        setIsSaving(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);
        
      poster_url = publicUrlData.publicUrl;
    }
    
    // 2. Insert to DB
    const { data: seriesData, error: dbError } = await backofficeMutation(
      user,
      'series',
      'insert',
      {
        title_th: formData.title_th,
        title_en: formData.title_en,
        title_jp: formData.title_jp,
        title_cn: formData.title_cn,
        content_producer_id: parseInt(formData.content_producer_id, 10),
        genre_ids: formData.genre_ids,
        total_episodes: parseInt(formData.total_episodes),
        dub_th: formData.dub_th,
        dub_en: formData.dub_en,
        dub_jp: formData.dub_jp,
        dub_cn: formData.dub_cn,
        sub_th: formData.sub_th,
        sub_en: formData.sub_en,
        sub_jp: formData.sub_jp,
        sub_cn: formData.sub_cn,
        poster_url: poster_url
      }
    );
      
    if (dbError) {
      console.error('Error saving series:', dbError);
      showError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSaving(false);
      return;
    }
    
    setIsSaving(false);
    router.push('/series');
  };

  const selectedGenreNames = formData.genre_ids
    .map(id => genres.find(g => g.id === id)?.name_th)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="w-full pb-20 relative">
      {/* Error Notification */}
      <div 
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}
        style={{ display: errorMsg ? 'block' : 'none' }}
      >
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z"/>
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3 mb-8 text-white">
        <div className="relative w-9 h-9">
          <Image src="/series.svg" alt="Series" fill sizes="36px" style={{ objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl text-gray-300 font-semibold tracking-wide flex items-center gap-2">
          <Link href="/series" className="hover:text-white transition-colors underline underline-offset-4">ซีรีส์</Link>
          <span className="text-gray-500 font-light text-[15px]">&gt;</span>
          <span className="text-white font-light">เพิ่มซีรีส์ใหม่</span>
        </h1>
      </div>

      <div className="bg-[#202650] border border-[#34407a] rounded-lg p-8 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12">
        {/* Left: Poster */}
        <div className="flex flex-col items-center">
          <div className="w-[220px] h-[300px] border border-dashed border-gray-600 rounded bg-transparent flex flex-col items-center justify-center relative overflow-hidden mb-4">
            {posterPreview ? (
              <Image src={posterPreview} alt="Poster preview" fill className="object-contain" />
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center">
                <div className="mb-12">ภาพโปสเตอร์</div>
                <div className="w-16 h-12 relative mb-3 opacity-60">
                  <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    <path d="M14 10.5l-3 4-1.5-2-2.5 3h10z"/>
                  </svg>
                </div>
                <div className="text-xs">webp - 360x490 px</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-300 hover:text-white underline text-sm transition-colors cursor-pointer"
          >
            เพิ่มรูปภาพ
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".webp,image/webp"
            onChange={handleFileChange}
          />
        </div>

        {/* Right: Form */}
        <div className="space-y-6">
          <div className="flex items-start">
            <span className="w-[120px] text-base font-light text-white shrink-0 pt-2">ชื่อเรื่อง</span>
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">TH</span>
                <input type="text" value={formData.title_th} onChange={(e) => handleInputChange('title_th', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">EN</span>
                <input type="text" value={formData.title_en} onChange={(e) => handleInputChange('title_en', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">JP</span>
                <input type="text" value={formData.title_jp} onChange={(e) => handleInputChange('title_jp', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-9 h-7 border border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-300 tracking-wider">CN</span>
                <input type="text" value={formData.title_cn} onChange={(e) => handleInputChange('title_cn', e.target.value)} className="flex-1 h-9 px-3 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0]" />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[120px] text-base font-light text-white shrink-0">แนวหนัง</span>
            <div className="flex-1 relative">
              <div 
                onClick={() => setIsGenreOpen(!isGenreOpen)}
                className="w-full h-9 px-3 py-1 bg-white rounded flex items-center cursor-pointer text-black"
              >
                <div className="flex-1 truncate text-sm font-medium">
                  {selectedGenreNames || <span className="text-gray-300"></span>}
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              
              {isGenreOpen && (
                <div className="absolute top-10 left-0 w-full bg-white rounded shadow-lg max-h-60 overflow-y-auto z-10 p-2 text-black border border-gray-200">
                  {loadingGenres ? (
                    <div className="px-3 py-2 text-sm text-gray-500">กำลังโหลด...</div>
                  ) : genres.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">ยังไม่มีแนวหนัง</div>
                  ) : (
                    genres.map(genre => (
                      <div 
                        key={genre.id} 
                        onClick={() => toggleGenre(genre.id)}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                      >
                        <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${formData.genre_ids.includes(genre.id) ? 'bg-[#5c85f1] border-[#5c85f1]' : 'border-gray-400'}`}>
                          {formData.genre_ids.includes(genre.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm font-medium">{genre.name_th}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[120px] text-base font-light text-white shrink-0">ผู้ผลิต</span>
            <div className="flex-1">
              <select
                value={formData.content_producer_id}
                onChange={(e) => handleInputChange('content_producer_id', e.target.value)}
                disabled={loadingContentProducers || contentProducers.length === 0}
                className="w-full h-9 pl-3 pr-8 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem_1rem]"
              >
                <option value="">
                  {loadingContentProducers
                    ? 'กำลังโหลด...'
                    : contentProducers.length === 0
                      ? 'ยังไม่มีผู้ผลิต'
                      : 'เลือกผู้ผลิต'}
                </option>
                {contentProducers.map((producer) => (
                  <option key={producer.id} value={producer.id}>
                    {producer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[120px] text-base font-light text-white shrink-0">จำนวนตอน</span>
            <div className="w-[100px]">
              <select 
                value={formData.total_episodes}
                onChange={(e) => handleInputChange('total_episodes', e.target.value)}
                className="w-[70px] h-9 pl-4 pr-2 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.2rem_center] bg-[length:1rem_1rem]"
              >
                {Array.from({ length: 299 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[120px] text-base font-light text-white shrink-0">เสียงพากย์</span>
            <div className="flex space-x-2">
              <LangToggle label="TH" active={formData.dub_th} onClick={() => handleInputChange('dub_th', !formData.dub_th)} />
              <LangToggle label="EN" active={formData.dub_en} onClick={() => handleInputChange('dub_en', !formData.dub_en)} />
              <LangToggle label="JP" active={formData.dub_jp} onClick={() => handleInputChange('dub_jp', !formData.dub_jp)} />
              <LangToggle label="CN" active={formData.dub_cn} onClick={() => handleInputChange('dub_cn', !formData.dub_cn)} />
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[120px] text-base font-light text-white shrink-0">บรรยาย</span>
            <div className="flex space-x-2">
              <LangToggle label="TH" active={formData.sub_th} onClick={() => handleInputChange('sub_th', !formData.sub_th)} />
              <LangToggle label="EN" active={formData.sub_en} onClick={() => handleInputChange('sub_en', !formData.sub_en)} />
              <LangToggle label="JP" active={formData.sub_jp} onClick={() => handleInputChange('sub_jp', !formData.sub_jp)} />
              <LangToggle label="CN" active={formData.sub_cn} onClick={() => handleInputChange('sub_cn', !formData.sub_cn)} />
            </div>
          </div>
        </div>

        {/* Action Buttons (Full width) */}
        <div className="flex justify-center space-x-4 pt-6 pb-0 col-span-1 md:col-span-2 border-t border-white/5 -mt-8">
          <Link
            href="/series"
            className="w-28 h-10 border border-gray-600 hover:bg-white/5 transition-colors rounded flex items-center justify-center text-gray-300 font-light text-[15px] cursor-pointer"
          >
            ยกเลิก
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-28 h-10 bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] transition-all rounded text-white font-light text-[15px] cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
