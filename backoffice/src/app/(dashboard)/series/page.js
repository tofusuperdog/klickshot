'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';

// Minor badges for language
function LangBadge({ label, active }) {
  if (!active) return null;
  return (
    <span className="w-[32px] h-[22px] border border-gray-500 rounded flex items-center justify-center text-[11px] font-medium text-gray-300 bg-white/5 mx-[2px]">
      {label}
    </span>
  );
}

// Render lang row
function renderLangs(item, prefix) {
  const langs = ['th', 'en', 'jp', 'cn'];
  const activeLangs = langs.filter(lang => item[`${prefix}_${lang}`]);

  if (activeLangs.length === 0) return <span className="text-gray-500">-</span>;

  return (
    <div className="flex space-x-1">
      {activeLangs.map(lang => (
        <LangBadge key={lang} label={lang.toUpperCase()} active={true} />
      ))}
    </div>
  );
}

function StatusColumn({ status, missingEpisodes, seriesId, onPublish, onUnpublish }) {
  const linkClass = "text-gray-300 hover:text-white underline text-[15px] font-light transition-colors";

  if (status === 'published') {
    return (
      <div className="w-[160px] flex flex-col items-center justify-center space-y-3">
        <div className="border border-[#5BE05B] text-[#5BE05B] font-semibold text-[15px] py-[6px] w-full flex items-center justify-center gap-2 rounded-md tracking-wide">
          <Image src="/onair.svg" alt="Published" width={22} height={22} />
          <span>เผยแพร่แล้ว</span>
        </div>
        <button onClick={() => onUnpublish(seriesId)} className="text-gray-300 hover:text-white underline font-light text-[15px] cursor-pointer transition-colors">ยกเลิกการเผยแพร่</button>
        <Link href={`/series/${seriesId}`} className={linkClass}>รายละเอียด</Link>
        <Link href={`/series/${seriesId}/episodes`} className={linkClass}>จัดการตอน</Link>
      </div>
    );
  } else if (status === 'ready') {
    return (
      <div className="w-[160px] flex flex-col items-center justify-center space-y-3">
        <div className="border border-[#FDE047] text-[#FDE047] font-semibold text-[15px] py-[6px] w-full flex items-center justify-center gap-2 rounded-md tracking-wide">
          <Image src="/ready.svg" alt="Ready" width={22} height={22} />
          <span>พร้อมเผยแพร่</span>
        </div>
        <button onClick={() => onPublish(seriesId)} className="text-gray-300 hover:text-white underline font-light text-[15px] cursor-pointer transition-colors">เผยแพร่ซีรีส์</button>
        <Link href={`/series/${seriesId}`} className={linkClass}>รายละเอียด</Link>
        <Link href={`/series/${seriesId}/episodes`} className={linkClass}>จัดการตอน</Link>
      </div>
    );
  } else {
    return (
      <div className="w-[160px] flex flex-col items-center justify-center space-y-3">
        <div className="border border-[#F95050] text-[#F95050] font-semibold text-[15px] py-[6px] w-full flex items-center justify-center gap-2 rounded-md tracking-wide">
          <Image src="/notready.svg" alt="Not Ready" width={22} height={22} />
          <span>ไม่พร้อมเผยแพร่</span>
        </div>
        <div className="text-[#F95050] font-light text-[15px] text-center">ขาดวีดีโอ {missingEpisodes} ตอน</div>
        <Link href={`/series/${seriesId}`} className={linkClass}>รายละเอียด</Link>
        <Link href={`/series/${seriesId}/episodes`} className={linkClass}>จัดการตอน</Link>
      </div>
    );
  }
}

export default function SeriesPage() {
  const { user } = useAuth();
  const [series, setSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [episodeCounts, setEpisodeCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch genres
      const { data: genresData } = await backofficeQuery(user, 'genres');
      if (genresData) setGenres(genresData);

      // Fetch series
      const { data: seriesData } = await backofficeQuery(user, 'series');
      if (seriesData) setSeries(seriesData);

      // Fetch episode counts
      const { data: epData } = await backofficeQuery(user, 'episode_counts');
      if (epData) {
        const counts = {};
        epData.forEach(item => {
          counts[item.series_id] = item.count || 0;
        });
        setEpisodeCounts(counts);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const handlePublish = async (id) => {
    const { error } = await backofficeMutation(user, 'series', 'update', { status: 'published' }, { id });
    if (!error) {
      setSeries(prev => prev.map(s => s.id === id ? { ...s, status: 'published' } : s));
    }
  };

  const handleUnpublish = async (id) => {
    // Check if it's assigned to any main_banner slot
    const { data: bannerData, error: bannerError } = await supabase
      .from('main_banner')
      .select('id')
      .eq('series_id', id);

    if (bannerError) {
      showError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลแบนเนอร์');
      return;
    }

    if (bannerData && bannerData.length > 0) {
      showError('ไม่สามารถยกเลิกการเผยแพร่ได้ คุณต้องนำซีรีส์เรื่องนี้ออกจาก แบนเนอร์หลัก ก่อน');
      return;
    }

    const { error } = await backofficeMutation(user, 'series', 'update', { status: 'not_ready' }, { id });
    if (error) {
      showError('เกิดข้อผิดพลาดในการยกเลิกการเผยแพร่');
      return;
    }

    const cleanupTargets = [
      'customer_favorite_series',
      'customer_recent_series',
    ];

    for (const table of cleanupTargets) {
      const { error: cleanupError } = await backofficeMutation(user, table, 'delete', {}, { series_id: id });

      if (cleanupError) {
        console.error(`Error deleting ${table}:`, cleanupError);
        showError('ยกเลิกการเผยแพร่แล้ว แต่ไม่สามารถลบข้อมูลลูกค้าที่เกี่ยวข้องได้');
        return;
      }
    }

    setSeries(prev => prev.map(s => s.id === id ? { ...s, status: 'not_ready' } : s));
  };

  const getGenreNames = (genreIds) => {
    if (!genreIds || !Array.isArray(genreIds)) return [];
    return genreIds.map(id => genres.find(g => g.id === id)?.name_th).filter(Boolean);
  };

  const filteredSeries = useMemo(() => {
    let filtered = series;

    // Filter by Search
    if (searchTerm.trim()) {
      filtered = filtered.filter(s => s.title_th?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => {
        const readyEpisodes = episodeCounts[s.id] || 0;
        const missingEpisodes = Math.max(0, s.total_episodes - readyEpisodes);
        let computedStatus = s.status;
        if (s.status !== 'published') {
          computedStatus = missingEpisodes <= 0 ? 'ready' : 'not_ready';
        }
        return computedStatus === statusFilter;
      });
    }

    // Sort logic (Thai Alphabetical)
    return [...filtered].sort((a, b) => {
      const titleA = a.title_th || '';
      const titleB = b.title_th || '';
      return titleA.localeCompare(titleB, 'th');
    });
  }, [series, searchTerm, statusFilter, episodeCounts]);

  return (
    <div className="w-full pb-20 relative">
      {/* Error Notification */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded-lg shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z"/>
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      {/* Sticky Header & Filter container */}
      <div className="sticky top-0 z-40 bg-[#110d29] pb-3 mb-3 -mx-10 px-10 before:content-[''] before:absolute before:inset-x-0 before:bottom-full before:h-[40px] before:bg-[#110d29]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 text-white">
            <div className="relative w-9 h-9">
              <Image src="/series.svg" alt="Series" fill sizes="36px" style={{ objectFit: 'contain' }} />
            </div>
            <h1 className="text-xl text-gray-300 font-semibold tracking-wide">ซีรีส์</h1>
          </div>
          <Link
            href="/series/create"
            className="bg-[#5c85f1] hover:bg-[#4a72d7] transition-colors text-white px-5 py-2 rounded font-medium text-sm cursor-pointer"
          >
            เพิ่มซีรีส์ใหม่
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#181236]/90 border border-[#2d2252] rounded-md px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-gray-300 font-light text-[15px]">
            ทั้งหมด {filteredSeries.length} ซีรีส์
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative w-[240px]">
              <input
                type="text"
                placeholder="ชื่อเรื่อง"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-4 pr-10 bg-[#3a305d] border border-[#2d2252] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#709bf0] placeholder-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="relative w-[180px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 pl-4 pr-8 bg-[#3a305d] border border-[#2d2252] rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#709bf0] appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem_1rem]"
              >
                <option value="all">ทุกประเภท</option>
                <option value="not_ready">ยังไม่พร้อมเผยแพร่</option>
                <option value="ready">พร้อมเผยแพร่</option>
                <option value="published">เผยแพร่แล้ว</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* End Sticky Header */}

      {/* Series List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF] mr-3"></div>
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#181236]/40 border border-[#2d2252] rounded-md">
            {series.length === 0 ? 'ยังไม่มีซีรีส์ในระบบ กรุณาเพิ่มซีรีส์ใหม่' : 'ไม่พบซีรีส์ที่ค้นหา'}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredSeries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((s) => {
              const readyEpisodes = episodeCounts[s.id] || 0;
              const missingEpisodes = Math.max(0, s.total_episodes - readyEpisodes);
              let computedStatus = s.status;
              if (s.status !== 'published') {
                computedStatus = missingEpisodes <= 0 ? 'ready' : 'not_ready';
              }

              return (
                <div key={s.id} className="bg-[#181236]/60 border border-[#2d2252] rounded-lg p-5 flex gap-6 hover:bg-[#181236]/90 transition-colors shadow-lg">

                  {/* Poster */}
                  <div className="w-[120px] h-[168px] shrink-0 bg-[#0d0a1b] rounded overflow-hidden relative border border-gray-700">
                    {s.poster_url ? (
                      <Image src={s.poster_url} alt={s.title_th} fill sizes="120px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Image</div>
                    )}
                  </div>

                  {/* Titles & Genres */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h2 className="text-[22px] font-medium text-white mb-2 leading-tight tracking-wide">{s.title_th}</h2>
                      <div className="space-y-[2px]">
                        {s.title_en && <div className="text-[16px] text-gray-300 font-light"><span className="text-gray-500 tracking-wider">EN:</span> {s.title_en}</div>}
                        {s.title_jp && <div className="text-[16px] text-gray-300 font-light"><span className="text-gray-500 tracking-wider">JP:</span> {s.title_jp}</div>}
                        {s.title_cn && <div className="text-[16px] text-gray-300 font-light"><span className="text-gray-500 tracking-wider">CN:</span> {s.title_cn}</div>}
                      </div>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {getGenreNames(s.genre_ids).map((genre, idx) => (
                        <span key={idx} className="border border-gray-500 text-gray-300 text-[12px] px-3 py-1 rounded-full whitespace-nowrap">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-px bg-[#2d2252] my-1 mx-2"></div>

                  {/* Statistics */}
                  <div className="w-[230px] shrink-0 py-1 text-[16px] text-gray-300 font-light flex flex-col justify-center space-y-2">
                    {s.status === 'published' ? (
                      <div className="flex justify-between">
                        <span>เผยแพร่</span>
                        <span>3 วัน</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>ทั้งหมด</span>
                        <span>{s.total_episodes} ตอน</span>
                      </div>
                    )}
                    {s.status === 'published' ? (
                      <>
                        <div className="flex justify-between">
                          <span>ยอดวิว</span>
                          <span className="text-white">999 ตอน</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>ยอดซื้อ</span>
                          <span className="text-white">300 ตอน</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>พร้อม</span>
                          <span>{readyEpisodes} ตอน</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>ขาด</span>
                          <span className={missingEpisodes > 0 ? "text-[#F95050]" : ""}>{missingEpisodes} ตอน</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center">
                      <span>เสียงพากย์</span>
                      <div className="flex justify-end">{renderLangs(s, 'dub')}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>คำบรรยาย</span>
                      <div className="flex justify-end">{renderLangs(s, 'sub')}</div>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-px bg-[#2d2252] my-1 mx-2"></div>

                  {/* Status & Actions */}
                  <div className="w-[160px] shrink-0 py-1 flex items-center justify-center">
                    <StatusColumn
                      status={computedStatus}
                      missingEpisodes={missingEpisodes}
                      seriesId={s.id}
                      onPublish={handlePublish}
                      onUnpublish={handleUnpublish}
                    />
                  </div>

                </div>
              );
            })}
            </div>

            {/* Pagination Controls */}
            {filteredSeries.length > itemsPerPage && (
              <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-[#181236]/60 border border-[#2d2252] rounded-lg p-4 gap-4">
                <div className="text-gray-400 text-sm">
                  แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredSeries.length)} จากทั้งหมด {filteredSeries.length} รายการ
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-[#2d2252] text-gray-300 rounded hover:bg-[#3a305d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
                  >
                    ก่อนหน้า
                  </button>
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                    {Array.from({ length: Math.ceil(filteredSeries.length / itemsPerPage) }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded text-sm transition-colors cursor-pointer ${currentPage === i + 1 ? 'bg-[#709bf0] text-white cursor-default' : 'bg-[#2d2252] text-gray-300 hover:bg-[#3a305d]'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSeries.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(filteredSeries.length / itemsPerPage)}
                    className="px-4 py-2 bg-[#2d2252] text-gray-300 rounded hover:bg-[#3a305d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
