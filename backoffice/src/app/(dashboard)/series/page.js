"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { backofficeMutation, backofficeQuery } from "@/lib/backoffice";

// Minor badges for language
function LangBadge({ label, active }) {
  if (!active) return null;
  return (
    <span className="inline-flex h-[22px] min-w-[30px] items-center justify-center rounded border border-[#6670a3] bg-[#1f2755] px-2 text-[10px] font-semibold text-[#d6dcff]">
      {label}
    </span>
  );
}

// Render lang row
function renderLangs(item, prefix) {
  const langs = ["th", "en", "jp", "cn"];
  const activeLangs = langs.filter((lang) => item[`${prefix}_${lang}`]);

  if (activeLangs.length === 0) return <span className="text-gray-500">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {activeLangs.map((lang) => (
        <LangBadge key={lang} label={lang.toUpperCase()} active={true} />
      ))}
    </div>
  );
}

function StatusColumn({
  status,
  missingEpisodes,
  seriesId,
  onPublish,
  onUnpublish,
}) {
  const linkClass =
    "cursor-pointer text-[#cbd3ff] hover:text-white underline text-[13px] font-light transition-colors";

  if (status === "published") {
    return (
      <div className="flex w-[170px] flex-col items-center justify-center gap-3">
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#34d981] bg-[#123f35]/45 py-2 text-[13px] font-semibold tracking-wide text-[#5BE05B]">
          <Image src="/onair.svg" alt="Published" width={20} height={20} />
          <span>เผยแพร่แล้ว</span>
        </div>
        <Link href={`/series/${seriesId}`} className={linkClass}>
          รายละเอียด
        </Link>
        <Link href={`/series/${seriesId}/episodes`} className={linkClass}>
          จัดการตอน
        </Link>
        <button
          onClick={() => onUnpublish(seriesId)}
          className="cursor-pointer text-[13px] font-semibold text-[#ff6b79] underline transition-colors hover:text-[#ff9aa4]"
        >
          ยกเลิกการเผยแพร่
        </button>
      </div>
    );
  } else if (status === "ready") {
    return (
      <div className="flex w-[170px] flex-col items-center justify-center gap-3">
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#FDE047] bg-[#4c3f16]/40 py-2 text-[13px] font-semibold tracking-wide text-[#FDE047]">
          <Image src="/ready.svg" alt="Ready" width={20} height={20} />
          <span>พร้อมเผยแพร่</span>
        </div>
        <Link href={`/series/${seriesId}`} className={linkClass}>
          รายละเอียด
        </Link>
        <Link href={`/series/${seriesId}/episodes`} className={linkClass}>
          จัดการตอน
        </Link>
        <button
          onClick={() => onPublish(seriesId)}
          className="cursor-pointer text-[13px] font-semibold text-[#8f8cff] underline transition-colors hover:text-white"
        >
          เผยแพร่ซีรีส์
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex w-[170px] flex-col items-center justify-center gap-3">
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#F95050] bg-[#4a1a28]/45 py-2 text-[13px] font-semibold tracking-wide text-[#ff6674]">
          <Image src="/notready.svg" alt="Not Ready" width={20} height={20} />
          <span>ไม่พร้อมเผยแพร่</span>
        </div>
        <Link href={`/series/${seriesId}`} className={linkClass}>
          รายละเอียด
        </Link>
        <Link href={`/series/${seriesId}/episodes`} className={linkClass}>
          จัดการตอน
        </Link>
        <div className="text-center text-[12px] font-light text-[#ff8490]">
          ขาดวิดีโอ {missingEpisodes} ตอน
        </div>
      </div>
    );
  }
}

export default function SeriesPage() {
  const { user } = useAuth();
  const [series, setSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [contentProducers, setContentProducers] = useState([]);
  const [episodeCounts, setEpisodeCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [producerFilter, setProducerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [errorMsg, setErrorMsg] = useState("");
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
  }, [searchTerm, statusFilter, producerFilter]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch genres
      const { data: genresData } = await backofficeQuery(user, "genres");
      if (genresData) setGenres(genresData);

      // Fetch content producers
      const { data: producerData } = await backofficeQuery(
        user,
        "content_producers",
      );
      if (producerData) setContentProducers(producerData);

      // Fetch series
      const { data: seriesData } = await backofficeQuery(user, "series");
      if (seriesData) setSeries(seriesData);

      // Fetch episode counts
      const { data: epData } = await backofficeQuery(user, "episode_counts");
      if (epData) {
        const counts = {};
        epData.forEach((item) => {
          counts[item.series_id] = item.count || 0;
        });
        setEpisodeCounts(counts);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const handlePublish = async (id) => {
    const { error } = await backofficeMutation(
      user,
      "series",
      "update",
      { status: "published" },
      { id },
    );
    if (!error) {
      setSeries((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "published" } : s)),
      );
    }
  };

  const handleUnpublish = async (id) => {
    // Check if it's assigned to any main_banner slot
    const { data: bannerData, error: bannerError } = await supabase
      .from("main_banner")
      .select("id")
      .eq("series_id", id);

    if (bannerError) {
      showError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูลแบนเนอร์");
      return;
    }

    if (bannerData && bannerData.length > 0) {
      showError(
        "ไม่สามารถยกเลิกการเผยแพร่ได้ คุณต้องนำซีรีส์เรื่องนี้ออกจาก แบนเนอร์หลัก ก่อน",
      );
      return;
    }

    const { error } = await backofficeMutation(
      user,
      "series",
      "update",
      { status: "not_ready" },
      { id },
    );
    if (error) {
      showError("เกิดข้อผิดพลาดในการยกเลิกการเผยแพร่");
      return;
    }

    const cleanupTargets = [
      "customer_favorite_series",
      "customer_recent_series",
    ];

    for (const table of cleanupTargets) {
      const { error: cleanupError } = await backofficeMutation(
        user,
        table,
        "delete",
        {},
        { series_id: id },
      );

      if (cleanupError) {
        console.error(`Error deleting ${table}:`, cleanupError);
        showError(
          "ยกเลิกการเผยแพร่แล้ว แต่ไม่สามารถลบข้อมูลลูกค้าที่เกี่ยวข้องได้",
        );
        return;
      }
    }

    setSeries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "not_ready" } : s)),
    );
  };

  const getGenreNames = (genreIds) => {
    if (!genreIds || !Array.isArray(genreIds)) return [];
    return genreIds
      .map((id) => genres.find((g) => g.id === id)?.name_th)
      .filter(Boolean);
  };

  const getContentProducerName = (producerId) => {
    if (!producerId) return "";
    return (
      contentProducers.find(
        (producer) => String(producer.id) === String(producerId),
      )?.name || ""
    );
  };

  const getComputedStatus = (item) => {
    const readyEpisodes = episodeCounts[item.id] || 0;
    const missingEpisodes = Math.max(
      0,
      (item.total_episodes || 0) - readyEpisodes,
    );
    if (item.status === "published") return "published";
    return missingEpisodes <= 0 ? "ready" : "not_ready";
  };

  const statusCounts = useMemo(() => {
    return series.reduce(
      (counts, item) => {
        const computedStatus = getComputedStatus(item);
        counts.all += 1;
        counts[computedStatus] += 1;
        return counts;
      },
      {
        all: 0,
        published: 0,
        ready: 0,
        not_ready: 0,
      },
    );
  }, [series, episodeCounts]);

  const producerOptions = useMemo(() => {
    return [...contentProducers].sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameA.localeCompare(nameB, "th");
    });
  }, [contentProducers]);

  const filteredSeries = useMemo(() => {
    let filtered = series;

    // Filter by Search
    if (searchTerm.trim()) {
      filtered = filtered.filter((s) =>
        s.title_th?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (producerFilter !== "all") {
      filtered = filtered.filter(
        (s) => String(s.content_producer_id) === producerFilter,
      );
    }

    // Filter by Status
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => getComputedStatus(s) === statusFilter);
    }

    // Sort logic (Thai Alphabetical)
    return [...filtered].sort((a, b) => {
      const titleA = a.title_th || "";
      const titleB = b.title_th || "";
      return titleA.localeCompare(titleB, "th");
    });
  }, [series, searchTerm, producerFilter, statusFilter, episodeCounts]);

  const statusTabs = [
    {
      id: "all",
      label: "ทั้งหมด",
      count: statusCounts.all,
      className: "text-[#d8dcff]",
      activeClassName:
        "border-[#4a3aa0] bg-gradient-to-r from-[#6869ff] to-[#7657f4] text-white",
    },
    {
      id: "published",
      label: "เผยแพร่แล้ว",
      count: statusCounts.published,
      className: "text-[#5BE05B]",
      activeClassName: "bg-[#163f35] text-[#78f08a] border-[#34d981]/50",
    },
    {
      id: "ready",
      label: "พร้อมเผยแพร่",
      count: statusCounts.ready,
      className: "text-[#FDE047]",
      activeClassName: "bg-[#4c3f16] text-[#FDE047] border-[#FDE047]/50",
    },
    {
      id: "not_ready",
      label: "ไม่พร้อมเผยแพร่",
      count: statusCounts.not_ready,
      className: "text-[#ff6674]",
      activeClassName: "bg-[#4a1a28] text-[#ff8490] border-[#ff6674]/50",
    },
  ];
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const startItem =
    filteredSeries.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredSeries.length);

  return (
    <div className="relative w-full pb-20">
      {/* Error Notification */}
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"}`}
      >
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded-lg shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      {/* Sticky Header & Filter container */}
      <div className="sticky top-0 z-40 bg-[#171a3d] pb-3 mb-3 -mx-10 px-10 before:content-[''] before:absolute before:inset-x-0 before:bottom-full before:h-[40px] before:bg-[#171a3d]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 text-white">
            <div className="relative w-9 h-9">
              <Image
                src="/series.svg"
                alt="Series"
                fill
                sizes="36px"
                style={{ objectFit: "contain" }}
              />
            </div>
            <h1 className="text-xl font-semibold tracking-wide text-gray-300">
              ซีรีส์
            </h1>
          </div>
          <Link
            href="/series/create"
            className="bg-gradient-to-r from-[#6869ff] to-[#7657f4] hover:from-[#7778ff] hover:to-[#8466ff] transition-all text-white px-5 py-2 rounded font-medium text-sm cursor-pointer"
          >
            + เพิ่มซีรีส์
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="overflow-hidden rounded-lg border border-[#34407a] bg-[#202650]/90 shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#263163] text-[#9bb8ff]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16v12H4z" />
                  <path d="M8 10h8M8 14h5" />
                </svg>
              </div>
              <div>
                <div className="text-[12px] text-[#aab4d6]">ทั้งหมด</div>
                <div className="text-[20px] font-semibold leading-none text-white">
                  {filteredSeries.length} ซีรีส์
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 md:max-w-[620px] md:flex-row md:justify-end">
              {/* Search Box */}
              <div className="relative w-full md:w-[260px]">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเรื่อง"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded border border-[#34407a] bg-[#171d42] pl-4 pr-10 text-sm text-white placeholder:text-[#8f99bc] focus:outline-none focus:ring-1 focus:ring-[#8f8cff]"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c5c3ff]">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Producer Dropdown */}
              <div className="relative w-full md:w-[220px]">
                <select
                  value={producerFilter}
                  onChange={(e) => setProducerFilter(e.target.value)}
                  className="h-10 w-full cursor-pointer appearance-none rounded border border-[#34407a] bg-[#171d42] pl-4 pr-9 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#8f8cff]"
                >
                  <option value="all">ทุกผู้ผลิต</option>
                  {producerOptions.map((producer) => (
                    <option key={producer.id} value={String(producer.id)}>
                      {producer.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c5c3ff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="border-t border-[#34407a] px-3 py-2">
            <div className="flex min-w-0 gap-2 overflow-x-auto custom-scrollbar">
              {statusTabs.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 rounded px-4 py-2 text-[13px] font-medium transition-all ${
                      isActive
                        ? `border ${tab.activeClassName} shadow-[0_8px_18px_rgba(0,0,0,0.18)]`
                        : `border border-[#34407a] bg-[#171d42] ${tab.className} hover:bg-[#202650]`
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-black/20 px-2 py-0.5 text-[11px] text-current">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
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
          <div className="text-center py-20 text-gray-500 bg-[#202650]/60 border border-[#34407a] rounded-md">
            {series.length === 0
              ? "ยังไม่มีซีรีส์ในระบบ กรุณาเพิ่มซีรีส์ใหม่"
              : "ไม่พบซีรีส์ที่ค้นหา"}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredSeries
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage,
                )
                .map((s, index) => {
                  const readyEpisodes = episodeCounts[s.id] || 0;
                  const missingEpisodes = Math.max(
                    0,
                    s.total_episodes - readyEpisodes,
                  );
                  let computedStatus = s.status;
                  if (s.status !== "published") {
                    computedStatus =
                      missingEpisodes <= 0 ? "ready" : "not_ready";
                  }
                  const contentProducerName = getContentProducerName(
                    s.content_producer_id,
                  );

                  return (
                    <div
                      key={s.id}
                      className="relative flex min-h-[176px] gap-6 rounded-lg border border-[#34407a] bg-[linear-gradient(135deg,#202650_0%,#171d42_55%,#151a3f_100%)] p-5 shadow-[0_18px_40px_rgba(10,14,42,0.24)] transition-colors hover:border-[#6C72FF]/60 hover:bg-[#202650]/90"
                    >
                      <div className="absolute left-0 top-1/2 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-[#5362b7] bg-[#263163] px-2 text-[14px] font-bold text-[#d9e0ff] shadow-lg">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </div>

                      {/* Poster */}
                      <div className="relative h-[154px] w-[110px] shrink-0 overflow-hidden rounded bg-[#171d42] shadow-[0_10px_24px_rgba(0,0,0,0.24)] ring-1 ring-[#455189]">
                        {s.poster_url ? (
                          <Image
                            src={s.poster_url}
                            alt={s.title_th}
                            fill
                            sizes="110px"
                            loading={index === 0 ? "eager" : "lazy"}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-xs text-gray-600">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Titles & Genres */}
                      <div className="flex min-w-0 flex-[1.05] flex-col justify-between py-1">
                        <div>
                          <h2 className="mb-2 truncate text-[21px] font-semibold leading-tight tracking-wide text-white">
                            {s.title_th}
                          </h2>
                          <div className="space-y-[2px]">
                            {s.title_en && (
                              <div className="truncate text-[13px] font-light text-[#c7d0ef]">
                                <span className="text-[#8f99bc] tracking-wider">
                                  EN:
                                </span>{" "}
                                {s.title_en}
                              </div>
                            )}
                            {s.title_jp && (
                              <div className="truncate text-[13px] font-light text-[#c7d0ef]">
                                <span className="text-[#8f99bc] tracking-wider">
                                  JP:
                                </span>{" "}
                                {s.title_jp}
                              </div>
                            )}
                            {s.title_cn && (
                              <div className="truncate text-[13px] font-light text-[#c7d0ef]">
                                <span className="text-[#8f99bc] tracking-wider">
                                  CN:
                                </span>{" "}
                                {s.title_cn}
                              </div>
                            )}
                            <div className="truncate text-[13px] font-light text-[#c7d0ef]">
                              <span className="text-[#8f99bc] tracking-wider">
                                ผู้ผลิต:
                              </span>{" "}
                              {contentProducerName || "-"}
                            </div>
                          </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {getGenreNames(s.genre_ids).map((genre, idx) => (
                            <span
                              key={idx}
                              className="whitespace-nowrap rounded-full border border-[#8f8cff]/70 bg-[#2a2c66]/55 px-3 py-1 text-[12px] text-[#d7d5ff]"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="my-1 w-px bg-[#34407a]"></div>

                      {/* Statistics */}
                      <div className="flex w-[380px] shrink-0 flex-col justify-center py-1 text-[#c7d0ef]">
                        <div className="grid grid-cols-3 gap-5 mb-5">
                          <div>
                            <div className="mb-1 flex items-center gap-2 text-[12px] text-[#aab4d6]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M5 5h14v14H5z" />
                                <path d="M9 9h6v6H9z" />
                              </svg>
                              ตอน
                            </div>
                            <div className="text-[20px] font-semibold leading-none text-white">
                              {s.total_episodes}{" "}
                              <span className="text-[13px] font-light">
                                ตอน
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-[#9ca7c8]">
                              ทั้งหมด
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center gap-2 text-[12px] text-[#aab4d6]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="9" />
                                <path d="m8.5 12 2.2 2.2 4.8-5" />
                              </svg>
                            </div>
                            <div className="text-[20px] font-semibold leading-none text-[#34d981]">
                              {readyEpisodes}{" "}
                              <span className="text-[13px] font-light">
                                ตอน
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-[#9ca7c8]">
                              พร้อม
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 h-[14px]" />
                            <div
                              className={`text-[20px] font-semibold leading-none ${missingEpisodes > 0 ? "text-[#FDE047]" : "text-[#9ca7c8]"}`}
                            >
                              {missingEpisodes}{" "}
                              <span className="text-[13px] font-light">
                                ตอน
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-[#9ca7c8]">
                              ขาด
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-[#34407a] pt-4">
                          <div className="mb-2 flex items-center gap-5 text-[12px]">
                            <span className="flex w-[92px] items-center gap-2 text-[#aab4d6]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 18.5A6.5 6.5 0 1 0 12 5.5" />
                                <path d="M4 12H2M22 12h-2M12 2v2M12 20v2" />
                              </svg>
                              เสียงพากย์
                            </span>
                            {renderLangs(s, "dub")}
                          </div>
                          <div className="flex items-center gap-5 text-[12px]">
                            <span className="flex w-[92px] items-center gap-2 text-[#aab4d6]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M4 5h16v14H4z" />
                                <path d="M8 11h3M13 11h3M8 15h8" />
                              </svg>
                              คำบรรยาย
                            </span>
                            {renderLangs(s, "sub")}
                          </div>
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="my-1 w-px bg-[#34407a]"></div>

                      {/* Status & Actions */}
                      <div className="flex w-[170px] shrink-0 items-center justify-center py-1">
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
              <div className="mt-4 flex flex-col items-center justify-between gap-3 px-3 text-[12px] text-[#b6c0e4] md:flex-row">
                <div>
                  <span>
                    แสดง {startItem}-{endItem} จาก {filteredSeries.length} รายการ
                  </span>
                  <span className="hidden">
                  แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง{" "}
                  {Math.min(currentPage * itemsPerPage, filteredSeries.length)}{" "}
                  จากทั้งหมด {filteredSeries.length} รายการ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="หน้าก่อนหน้า"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#34407a] bg-[#171d42] text-[#c7d0ef] transition-colors hover:border-[#6f63ff] hover:bg-[#202650] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <div className="custom-scrollbar flex max-w-[220px] items-center gap-2 overflow-x-auto sm:max-w-none">
                    {Array.from(
                      {
                        length: totalPages,
                      },
                      (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          aria-current={
                            currentPage === i + 1 ? "page" : undefined
                          }
                          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border text-[13px] font-semibold transition-all ${
                            currentPage === i + 1
                              ? "border-[#6f63ff] bg-gradient-to-r from-[#6869ff] to-[#7657f4] text-white shadow-[0_8px_18px_rgba(104,105,255,0.22)]"
                              : "border-[#34407a] bg-[#171d42] text-[#b6c0e4] hover:border-[#6f63ff] hover:bg-[#202650] hover:text-white"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(
                          totalPages,
                          p + 1,
                        ),
                      )
                    }
                    disabled={currentPage === totalPages}
                    aria-label="หน้าถัดไป"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#34407a] bg-[#171d42] text-[#c7d0ef] transition-colors hover:border-[#6f63ff] hover:bg-[#202650] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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
