'use client';
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { backofficeMutation, backofficeQuery } from "@/lib/backoffice";

function GenreModal({ isOpen, title, formData, setFormData, onClose, onSave, isSaving }) {
  const [error, setError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);

  if (!isOpen) return null;

  const showErrorMsg = (msg) => {
    setError(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.th.trim() || !formData.en.trim() || !formData.jp.trim() || !formData.cn.trim()) {
      showErrorMsg('กรุณากรอกชื่อแนวเรื่องให้ครบทั้ง 4 ภาษา');
      return;
    }
    onSave();
  };

  const languages = [
    { key: 'th', label: 'TH' },
    { key: 'en', label: 'EN' },
    { key: 'jp', label: 'JP' },
    { key: 'cn', label: 'CN' },
  ];

  return (
    <>
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{error}</span>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] backdrop-grayscale">
        <div className="bg-[#12102f] border border-[#504481] rounded-xl w-full max-w-[480px] shadow-2xl p-8 py-10">
          <h2 className="text-2xl font-semibold text-white text-center mb-10 tracking-wide">
            {title}
          </h2>

          <form onSubmit={handleSubmit} className="px-4">
            <span className="block text-[16px] font-light text-white mb-4">ชื่อแนวเรื่อง</span>

            <div className="space-y-4 mb-10">
              {languages.map((lang) => (
                <div key={lang.key} className="flex items-center space-x-3">
                  <div className="w-10 h-10 border border-gray-400 rounded flex items-center justify-center text-sm font-medium text-white shrink-0 bg-white/5">
                    {lang.label}
                  </div>
                  <input
                    type="text"
                    value={formData[lang.key]}
                    onChange={(e) => setFormData({ ...formData, [lang.key]: e.target.value })}
                    className="flex-1 h-10 px-3 bg-white rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="w-36 h-10 border border-gray-500 hover:bg-white/5 transition-colors rounded text-gray-300 font-light disabled:opacity-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-36 h-10 bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors rounded text-white font-light disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function DeleteConfirmModal({ isOpen, genre, onClose, onConfirm, isDeleting }) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setAnswer('');
      setIsValid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsValid(parseInt(answer) === num1 + num2);
  }, [answer, num1, num2]);

  if (!isOpen || !genre) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      <div className="bg-[#12102f] border border-[#2d2252] rounded-xl w-full max-w-[480px] shadow-2xl p-8 py-10 flex flex-col items-center">

        <h2 className="text-[20px] font-semibold text-white mb-4">ยืนยันการลบแนวเรื่อง</h2>

        <p className="text-gray-300 font-light mb-3 text-[15px] text-center">
          คุณต้องการลบแนวเรื่อง <span className="font-semibold text-white">{genre.name_th}</span> ใช่หรือไม่?
        </p>

        <p className="text-[#FF9999] text-[14px] font-light mb-8 text-center">
          การดำเนินการนี้จะนำแนวเรื่องนี้ออกจากซีรีส์ทั้งหมดที่เกี่ยวข้องและไม่สามารถย้อนกลับได้!
        </p>

        <div className="w-full flex flex-col items-center mb-10">
          <p className="text-gray-300 text-[14px] font-light mb-4 text-center">
            เพื่อยืนยันการลบ กรุณาบวกเลขด้านล่างนี้
          </p>
          <div className="flex items-center space-x-3">
            <div className="bg-[#24213a] text-white font-semibold text-xl px-4 py-2 rounded-md min-w-[100px] text-center tracking-wider">
              {num1} + {num2} =
            </div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-16 h-[44px] bg-white text-black text-xl font-medium text-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#D24949]"
              placeholder="?"
              maxLength={2}
            />
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isValid || isDeleting}
            className={`w-32 h-10 rounded text-white font-light transition-colors ${!isValid ? 'bg-[#8c353b]/50 cursor-not-allowed text-white/50' : 'bg-[#8c353b] hover:bg-[#a53c45] cursor-pointer'}`}
          >
            {isDeleting ? 'กำลังลบ...' : 'ลบแนวเรื่อง'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-32 h-10 border border-[#443868] hover:bg-white/5 transition-colors rounded text-gray-300 font-light disabled:opacity-50 cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GenresPage() {
  const { user } = useAuth();
  const [genres, setGenres] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingGenre, setEditingGenre] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ th: '', en: '', jp: '', cn: '' });

  const [deleteConfirmGenre, setDeleteConfirmGenre] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [globalError, setGlobalError] = useState('');
  const [globalErrorVisible, setGlobalErrorVisible] = useState(false);
  const globalErrorTimeoutRef = useRef(null);

  const showGlobalError = (msg) => {
    setGlobalError(msg);
    setGlobalErrorVisible(true);
    if (globalErrorTimeoutRef.current) clearTimeout(globalErrorTimeoutRef.current);
    globalErrorTimeoutRef.current = setTimeout(() => {
      setGlobalErrorVisible(false);
    }, 5000); // give enough time to read
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch genres
    const { data: gData, error: gError } = await backofficeQuery(user, 'genres');

    if (!gError && gData) {
      setGenres(gData);
    }

    // Fetch series
    const { data: sData, error: sError } = await supabase
      .from('series')
      .select('id, title_th, title_en, poster_url, genre_ids, status')
      .order('id', { ascending: false });

    if (!sError && sData) {
      setAllSeries(sData);
    }

    setLoading(false);
  };

  // Fetch when mounted
  useState(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setFormData({ th: '', en: '', jp: '', cn: '' });
    setEditingGenre(null);
    setModalMode('add');
  };

  const openEdit = (genre) => {
    setFormData({
      th: genre.name_th || '',
      en: genre.name_en || '',
      jp: genre.name_jp || '',
      cn: genre.name_cn || '',
    });
    setEditingGenre(genre);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    let error;

    if (modalMode === 'add') {
      const maxSortOrder = genres.length > 0 ? Math.max(...genres.map(g => g.sort_order || 0)) : 0;
      const { error: insertError } = await backofficeMutation(user, 'genre', 'insert', {
        name_th: formData.th.trim(),
        name_en: formData.en.trim() || null,
        name_jp: formData.jp.trim() || null,
        name_cn: formData.cn.trim() || null,
        is_published: false,
        sort_order: maxSortOrder + 1
      });
      error = insertError;
    } else if (modalMode === 'edit' && editingGenre) {
      const { error: updateError } = await backofficeMutation(user, 'genre', 'update', {
        name_th: formData.th.trim(),
        name_en: formData.en.trim() || null,
        name_jp: formData.jp.trim() || null,
        name_cn: formData.cn.trim() || null,
      }, { id: editingGenre.id });
      error = updateError;
    }

    setIsSaving(false);

    if (error) {
      console.error('Error saving genre:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถบันทึกแนวเรื่องได้'));
    } else {
      closeModal();
      fetchData(); // Refresh list after saving
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmGenre) return;
    setIsDeleting(true);

    const genreId = deleteConfirmGenre.id;

    // 1. Find series that have this genre
    const seriesToUpdate = allSeries.filter(s => s.genre_ids?.includes(genreId));
    
    // Check if any series has NO other genres
    const seriesWithOnlyThisGenre = seriesToUpdate.filter(s => s.genre_ids?.length === 1);
    if (seriesWithOnlyThisGenre.length > 0) {
      setIsDeleting(false);
      setDeleteConfirmGenre(null);
      const seriesNames = seriesWithOnlyThisGenre.map(s => `"${s.title_th}"`).join(', ');
      showGlobalError(`ไม่สามารถลบได้ เนื่องจากซีรีส์ ${seriesNames} มีแนวเรื่องนี้เพียงแนวเดียว กรุณาเข้าไปเพิ่มแนวเรื่องอื่นให้ซีรีส์เหล่านี้ก่อนลบครับ`);
      return;
    }

    // 2. Update each series
    if (seriesToUpdate.length > 0) {
      const updatePromises = seriesToUpdate.map(s => {
        const newGenreIds = s.genre_ids.filter(id => id !== genreId);
        return backofficeMutation(user, 'series', 'update', { genre_ids: newGenreIds }, { id: s.id });
      });
      await Promise.all(updatePromises);
    }

    // 3. Delete genre
    const { error } = await backofficeMutation(user, 'genre', 'delete', {}, { id: genreId });

    setIsDeleting(false);

    if (error) {
      console.error('Error deleting genre:', error);
      alert('เกิดข้อผิดพลาดในการลบแนวเรื่อง');
    } else {
      setDeleteConfirmGenre(null);
      fetchData(); // Refresh list after deleting
    }
  };

  const handleTogglePublish = async (genre) => {
    const newStatus = !genre.is_published;

    // Optimistic update
    setGenres(genres.map(g => g.id === genre.id ? { ...g, is_published: newStatus } : g));

    const { error } = await backofficeMutation(user, 'genre', 'update', { is_published: newStatus }, { id: genre.id });

    if (error) {
      console.error('Error toggling publish:', error);
      fetchData(); // Revert on error
    }
  };

  const handleMove = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === genres.length - 1) return;

    const newGenres = [...genres];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap items locally
    const temp = newGenres[index];
    newGenres[index] = newGenres[targetIndex];
    newGenres[targetIndex] = temp;
    setGenres(newGenres);

    // Update sort_order for all items
    const updates = newGenres.map((g, i) => ({
      ...g,
      sort_order: i
    }));

    const results = await Promise.all(updates.map(g =>
      backofficeMutation(user, 'genre', 'upsert', g, {}, 'id')
    ));
    const error = results.find(result => result.error)?.error;

    if (error) {
      console.error('Error updating order:', error);
      fetchData(); // Revert on error
    }
  };

  return (
    <div className="pb-20">
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[80] transition-all duration-500 ease-out ${globalErrorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px] max-w-[800px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide leading-relaxed">{globalError}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 text-white">
            <div className="relative w-7 h-7">
              <Image src="/genres.svg" alt="Genres" fill sizes="28px" style={{ objectFit: 'contain' }} />
            </div>
            <h1 className="text-[26px] font-semibold tracking-wide">แนวเรื่อง</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors text-white px-5 py-2.5 rounded font-medium text-[15px] cursor-pointer shadow-lg"
        >
          เพิ่มแนวเรื่อง
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
          <span className="ml-3 text-gray-300">กำลังโหลด...</span>
        </div>
      ) : (
        /* List Container */
        <div className="space-y-6">
          {genres.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-[#12102f] rounded-lg border border-[#2d2252]">ยังไม่มีกลุ่มแนวเรื่อง</div>
          ) : (
            genres.map((genre, index) => {
              const names = [genre.name_en, genre.name_jp, genre.name_cn].filter(Boolean).join(' - ');
              const genreSeries = allSeries.filter(s => s.genre_ids?.includes(genre.id));

              return (
                <div key={genre.id} className="bg-[#12102f] shadow-lg border border-[#2d2252] rounded-lg p-6 flex flex-col group transition-colors">

                  {/* Genre Header Section */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-xl font-medium text-white tracking-wide">{genre.name_th}</h3>
                        <div className="border border-gray-600 rounded-full px-2.5 py-0.5 text-[11px] text-gray-300 bg-white/5">
                          {genreSeries.length} ซีรีส์
                        </div>
                      </div>
                      {names && (
                        <p className="text-[14px] font-light text-gray-300">{names}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-8">
                      {/* Group 1: Reorder */}
                      <div className="flex items-center space-x-1">
                        {/* Up button */}
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className={`p-1 cursor-pointer hover:bg-white/10 rounded transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'text-[#3ceb8b]'}`}
                        >
                          <svg className="w-7 h-7 stroke-[4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>

                        {/* Down button */}
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === genres.length - 1}
                          className={`p-1 cursor-pointer hover:bg-white/10 rounded transition-colors ${index === genres.length - 1 ? 'opacity-30 cursor-not-allowed' : 'text-[#eb6161]'}`}
                        >
                          <svg className="w-7 h-7 stroke-[4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Group 2: Edit & Delete */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEdit(genre)}
                          className="p-2 cursor-pointer hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white"
                          title="แก้ไข"
                        >
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmGenre(genre)}
                          className="p-2 cursor-pointer hover:bg-red-500/20 rounded transition-colors text-gray-300 hover:text-[#eb6161]"
                          title="ลบ"
                        >
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Group 3: Toggle */}
                      <div className="flex flex-col items-center justify-center pt-1 min-w-[50px]">
                        {/* Toggle switch for is_published */}
                        <div
                          onClick={() => handleTogglePublish(genre)}
                          className={`w-[42px] h-6 rounded-full relative cursor-pointer transition-colors ${genre.is_published ? 'bg-[#3ceb8b]' : 'bg-gray-500'}`}
                          title="เปิด/ปิดการเผยแพร่"
                        >
                          <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[3px] transition-transform ${genre.is_published ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
                        </div>
                        <span className={`text-[12px] mt-1.5 font-light tracking-wide ${genre.is_published ? 'text-[#3ceb8b]' : 'text-gray-400'}`}>แสดงในแอป</span>
                      </div>
                    </div>
                  </div>

                  {/* Series Posters Strip */}
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {genreSeries.map(s => {
                      const isUnpublished = s.status !== 'published';
                      return (
                        <Link href={`/series/${s.id}`} key={s.id} className="flex-shrink-0 w-[145px] flex flex-col group cursor-pointer hover:opacity-80 transition-opacity rounded-md overflow-hidden border border-[#2d2252] shadow-md bg-[#1D1D1D]">
                          <div className="w-full h-[204px] relative bg-[#0d0a1b]">
                            {s.poster_url ? (
                              <Image src={s.poster_url} alt={s.title_th} fill sizes="145px" style={{ objectFit: 'cover' }} className={isUnpublished ? "grayscale" : ""} />
                            ) : (
                              <div className="w-full h-full text-[10px] flex items-center justify-center text-gray-600">No Image</div>
                            )}

                            {/* Banner Info */}
                            {isUnpublished && (
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#a37926] text-white px-2 py-1 rounded w-[85%] text-center text-[13px] tracking-wide shadow-md shadow-black/80 z-10 font-medium">
                                ยังไม่เผยแพร่
                              </div>
                            )}
                          </div>
                          <div className="text-[12px] text-gray-200 w-full p-2 text-center tracking-wide line-clamp-2 min-h-[48px] flex items-center justify-center font-light leading-snug" title={s.title_th}>
                            {s.title_th}
                          </div>
                        </Link>
                      )
                    })}
                    {genreSeries.length === 0 && (
                      <div className="w-full py-8 text-center text-sm text-gray-600 border border-dashed border-[#2d2252] rounded">
                        ยังไม่มีซีรีส์ในแนวเรื่องนี้
                      </div>
                    )}
                  </div>

                </div>
              )
            })
          )}
        </div>
      )}

      <GenreModal
        isOpen={modalMode !== null}
        title={modalMode === 'add' ? 'เพิ่มแนวเรื่อง' : 'แก้ไขแนวเรื่อง'}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmGenre !== null}
        genre={deleteConfirmGenre}
        onClose={() => setDeleteConfirmGenre(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
