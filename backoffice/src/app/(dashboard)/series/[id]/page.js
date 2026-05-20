'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

// Helper for pill toggles
function LangToggle({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-7 text-xs border rounded flex items-center justify-center transition-colors cursor-pointer font-medium ${active
          ? 'bg-green-500 border-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]'
          : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400'
        }`}
    >
      {label}
    </button>
  );
}

export default function EditSeriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id: seriesId } = useParams();

  // State
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);

  const [formData, setFormData] = useState({
    title_th: '',
    title_en: '',
    title_jp: '',
    title_cn: '',
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
  const [deleteOldImage, setDeleteOldImage] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mathChallenge, setMathChallenge] = useState({ num1: 0, num2: 0 });
  const [mathAnswer, setMathAnswer] = useState('');

  const openDeleteModal = () => {
    setMathChallenge({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
    });
    setMathAnswer('');
    setShowDeleteModal(true);
  };

  // Notification State
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

  const fileInputRef = useRef(null);

  // Fetch Genres & Series Data
  useEffect(() => {
    async function fetchData() {
      // Fetch genres
      const { data: gData, error: gError } = await backofficeQuery(user, 'genres');

      if (!gError && gData) {
        setGenres(gData);
      }
      setLoadingGenres(false);

      // Fetch series by ID
      if (seriesId) {
        const { data: sData, error: sError } = await supabase
          .from('series')
          .select('*')
          .eq('id', seriesId)
          .single();

        if (sError || !sData) {
          console.error("Error fetching series data:", sError);
          router.push('/series');
          return;
        }

        setFormData({
          title_th: sData.title_th || '',
          title_en: sData.title_en || '',
          title_jp: sData.title_jp || '',
          title_cn: sData.title_cn || '',
          genre_ids: sData.genre_ids || [],
          total_episodes: sData.total_episodes || 1,
          dub_th: !!sData.dub_th,
          dub_en: !!sData.dub_en,
          dub_jp: !!sData.dub_jp,
          dub_cn: !!sData.dub_cn,
          sub_th: !!sData.sub_th,
          sub_en: !!sData.sub_en,
          sub_jp: !!sData.sub_jp,
          sub_cn: !!sData.sub_cn,
        });

        if (sData.poster_url) {
          setPosterPreview(sData.poster_url);
        }
      }
      setLoadingSeries(false);
    }
    fetchData();
  }, [seriesId, router]);

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
    setDeleteOldImage(false);
  };

  const handleDeleteImage = () => {
    setPosterPreview(null);
    setPosterFile(null);
    setDeleteOldImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    if (!formData.dub_th && !formData.dub_en && !formData.dub_jp && !formData.dub_cn) {
      showError('กรุณาเลือกเสียงพากย์อย่างน้อย 1 ภาษา');
      return;
    }

    if (!posterFile && !posterPreview) {
      showError('กรุณาอัปโหลดรูปภาพโปสเตอร์');
      return;
    }

    setIsSaving(true);

    let updateFields = {
      title_th: formData.title_th,
      title_en: formData.title_en,
      title_jp: formData.title_jp,
      title_cn: formData.title_cn,
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
    };

    // Check if new poster is uploaded
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

      updateFields.poster_url = publicUrlData.publicUrl;
    } else if (deleteOldImage) {
      // If image is deleted and no new one is uploaded
      updateFields.poster_url = null;
    }

    // Update DB
    const { error: dbError } = await backofficeMutation(user, 'series', 'update', updateFields, { id: seriesId });

    if (dbError) {
      console.error('Error updating series:', dbError);
      showError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.push('/series');
  };

  const handleDeleteSeries = async () => {
    setIsDeleting(true);

    try {
      // 1. Fetch categories that contain this series in their series_ids array
      const { data: allCategories, error: fetchError } = await backofficeQuery(user, 'content_categories');
      const categories = (allCategories || []).filter(cat => cat.series_ids?.includes(parseInt(seriesId)));

      if (!fetchError && categories && categories.length > 0) {
        // 2. Update each affected category
        for (const cat of categories) {
          const updatedIds = cat.series_ids.filter(id => String(id) !== String(seriesId));
          const newBadgeText = `${updatedIds.length} ซีรีส์`;
          
          await backofficeMutation(
            user,
            'content_categories',
            'update',
            {
              series_ids: updatedIds,
              badge_text: newBadgeText,
              updated_at: new Date().toISOString()
            },
            { id: cat.id }
          );
        }
      }

      // Attempt explicit child-row removal to satisfy foreign-key constraints if cascade is off
      const childDeleteTargets = [
        'customer_recent_series',
        'episode',
      ];

      for (const table of childDeleteTargets) {
        const { error: childDeleteError } = await backofficeMutation(user, table, 'delete', {}, { series_id: seriesId });

        if (childDeleteError) {
          console.error(`Error deleting ${table}:`, childDeleteError);
          showError('ไม่สามารถลบข้อมูลที่เกี่ยวข้องกับซีรีส์ได้: ' + (childDeleteError.message || ''));
          setIsDeleting(false);
          setShowDeleteModal(false);
          return;
        }
      }

      const { error } = await backofficeMutation(user, 'series', 'delete', {}, { id: seriesId });
      if (error) {
        console.error('Error deleting series:', error);
        showError('ไม่สามารถลบซีรีส์ได้ เนื่องจากเกิดข้อผิดพลาด: ' + (error.message || ''));
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      setIsDeleting(false);
      setShowDeleteModal(false);
      router.push('/series');
    } catch (err) {
      console.error('Error in handleDeleteSeries:', err);
      showError('เกิดข้อผิดพลาดที่ไม่คาดคิดในการลบซีรีส์');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loadingSeries) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
        <span className="ml-4 text-gray-300">กำลังโหลด...</span>
      </div>
    );
  }

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
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
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
          <span className="text-white font-light">รายละเอียด</span>
        </h1>
      </div>

      <div className="bg-[#181236]/70 border border-[#2d2252] rounded-lg p-8 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-14 shadow-lg">
        {/* Left: Poster */}
        <div className="flex flex-col items-center pt-2">
          <div className="w-[200px] h-[280px] border border-dashed border-gray-600 rounded bg-transparent flex flex-col items-center justify-center relative overflow-hidden mb-3">
            {posterPreview ? (
              <Image src={posterPreview} alt="Poster preview" fill sizes="200px" className="object-cover" />
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center">
                <div className="mb-12 text-sm">ภาพโปสเตอร์</div>
                <div className="w-16 h-12 relative mb-3 opacity-60">
                  <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                    <path d="M14 10.5l-3 4-1.5-2-2.5 3h10z" />
                  </svg>
                </div>
                <div className="text-[11px] font-light">webp - 360x490 px</div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".webp,image/webp"
            onChange={handleFileChange}
          />

          {/* Delete or Update Image Links */}
          <div className="flex flex-col items-center space-y-1">
            {posterPreview ? (
              <button
                type="button"
                onClick={handleDeleteImage}
                className="text-[#6495ED] hover:text-[#4a72d7] underline text-sm transition-colors cursor-pointer font-light"
              >
                ลบรูปภาพ
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#6495ED] hover:text-[#4a72d7] underline text-sm transition-colors cursor-pointer font-light"
              >
                เพิ่มรูปภาพ
              </button>
            )}
          </div>
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
            <span className="w-[120px] text-base font-light text-white shrink-0">จำนวนตอน</span>
            <div className="w-[100px]">
              <select
                value={formData.total_episodes}
                onChange={(e) => handleInputChange('total_episodes', e.target.value)}
                className="w-[70px] h-9 pl-4 pr-2 bg-white rounded text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#709bf0] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.2rem_center] bg-[length:1rem_1rem]"
              >
                {Array.from({ length: 99 }, (_, i) => i + 1).map(num => (
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
            className="w-28 h-10 border border-[#504481] hover:bg-white/5 transition-colors rounded flex items-center justify-center text-gray-300 font-light text-[15px] cursor-pointer"
          >
            ยกเลิก
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-28 h-10 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-light text-[15px] cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-lg"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-[#181236]/70 border border-[#2d2252] rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2d2252]">
          <h2 className="text-base font-semibold text-white tracking-wide">โซนอันตราย</h2>
        </div>
        <div className="p-6 pb-8">
          <p className="text-[14px] text-gray-300 font-light mb-4">การลบซีรีส์นี้จะทำให้ข้อมูลและตอนที่เกี่ยวข้องหายถาวร</p>
          <button
            type="button"
            onClick={openDeleteModal}
            className="px-6 h-9 border border-[#D24949] text-[#D24949] hover:bg-[#D24949]/10 transition-colors rounded font-medium cursor-pointer text-sm flex items-center justify-center"
          >
            ลบซีรีส์
          </button>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] backdrop-grayscale transition-all duration-300">
          <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[520px] shadow-2xl p-8 py-10">
            <h2 className="text-xl font-semibold text-white text-center mb-3 tracking-wide">
              ยืนยันการลบซีรีส์
            </h2>
            <p className="text-gray-300 text-center text-[15px] mb-6 font-light px-2">
              คุณต้องการลบข้อซีรีส์ <span className="text-white font-medium">{formData.title_th}</span> ใช่หรือไม่?<br />
              <span className="text-red-400 text-sm mt-3 block">การดำเนินการนี้จะลบวิดีโอตอนย่อยทั้งหมดและไม่สามารถย้อนกลับได้!</span>
            </p>

            <div className="flex flex-col items-center mb-8">
              <span className="text-gray-300 text-[14px] mb-2 font-light">เพื่อยืนยันการลบ กรุณาบวกเลขด้านล่างนี้</span>
              <div className="flex items-center space-x-3">
                <span className="text-xl font-medium text-white bg-white/10 px-4 py-2 rounded shadow-inner tracking-widest">{mathChallenge.num1} + {mathChallenge.num2} = </span>
                <input
                  type="text"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  placeholder="?"
                  className="w-16 h-11 px-2 text-center bg-white rounded-lg text-black font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-[#D24949] transition-all"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleDeleteSeries}
                disabled={isDeleting || parseInt(mathAnswer) !== (mathChallenge.num1 + mathChallenge.num2)}
                className="w-32 h-10 bg-[#D24949] hover:bg-red-500 transition-colors rounded text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? 'กำลังลบ...' : 'ลบซีรีส์'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-32 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light cursor-pointer disabled:opacity-50"
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
