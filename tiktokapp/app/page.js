"use client";

import { useLanguage } from "./LanguageContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUPABASE_HEADERS, supabaseRestUrl } from "./lib/supabase";

export default function AppHome() {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const headers = SUPABASE_HEADERS;

  useEffect(() => {
    async function fetchBanners() {
      try {
        const bannerRes = await fetch(
          supabaseRestUrl("main_banner?select=id,series_id&order=id"),
          { headers }
        );
        const bannersData = await bannerRes.json();
        const seriesIds = bannersData.map(b => b.series_id).filter(id => id);

        if (seriesIds.length === 0) return;

        const seriesRes = await fetch(
          supabaseRestUrl(
            `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&id=in.(${seriesIds.join(",")})&status=eq.published`,
          ),
          { headers }
        );
        const seriesData = await seriesRes.json();

        const seriesMap = {};
        seriesData.forEach(s => { seriesMap[s.id] = s; });

        const combined = bannersData
          .map(b => ({
            id: b.id,
            series: seriesMap[b.series_id]
          }))
          .filter(b => b.series);

        setBanners(combined);
        
        const targetIndex = combined.findIndex(b => b.id === 3);
        if (targetIndex !== -1) {
          setActiveIndex(targetIndex);
        }

      } catch (err) {
        console.error("Failed to fetch banners:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanners();
  }, []);

  useEffect(() => {
    async function fetchSections() {
      try {
        const catRes = await fetch(
          supabaseRestUrl(
            "content_categories?select=*&is_published=eq.true&order=sort_order",
          ),
          { headers }
        );
        const categories = await catRes.json();

        let allSeriesIdsToFetch = new Set();
        
        const promises = categories.map(async (cat) => {
          if (cat.name === "อันดับยอดนิยม") {
            const topRes = await fetch(
              supabaseRestUrl("top_series?select=rank,series_id&order=rank&limit=10"),
              { headers }
            );
            const topData = await topRes.json();
            topData.forEach(t => allSeriesIdsToFetch.add(t.series_id));
            return {
              id: cat.id,
              type: "top",
              name_th: cat.name_th || cat.name,
              name_en: cat.name_en,
              name_jp: cat.name_jp,
              name_cn: cat.name_cn,
              itemsData: topData
            };
          } else if (cat.name === "ซีรีส์พากย์ตามภาษา") {
            const currentLangCode = language.toLowerCase();
            const langRes = await fetch(
              supabaseRestUrl(
                `dubbed_languages?select=*&is_published=eq.true&code=eq.${currentLangCode}`,
              ),
              { headers }
            );
            const langsData = await langRes.json();
            
            if (langsData.length > 0) {
              const lang = langsData[0];
              const sr = await fetch(
                supabaseRestUrl(
                  `series?select=id&dub_${lang.code}=eq.true&status=eq.published&limit=30`,
                ),
                { headers }
              );
              const sdata = await sr.json();
              const shuffled = sdata.sort(() => 0.5 - Math.random());
              const selectedIds = shuffled.slice(0, 6).map(s => s.id);
              selectedIds.forEach(id => allSeriesIdsToFetch.add(id));
              
              return {
                id: cat.id,
                type: "normal",
                name_th: cat.name_th || cat.name,
                name_en: cat.name_en,
                name_jp: cat.name_jp,
                name_cn: cat.name_cn,
                itemsData: selectedIds.map(id => ({ series_id: id }))
              };
            }
            return [];
          } else {
            let selectedIds = [];
            if (cat.series_ids && cat.series_ids.length > 0) {
              const shuffled = [...cat.series_ids].sort(() => 0.5 - Math.random());
              selectedIds = shuffled.slice(0, 6);
              selectedIds.forEach(id => allSeriesIdsToFetch.add(id));
            }
            return {
              id: cat.id,
              type: "normal",
              name_th: cat.name_th || cat.name,
              name_en: cat.name_en,
              name_jp: cat.name_jp,
              name_cn: cat.name_cn,
              itemsData: selectedIds.map(id => ({ series_id: id }))
            };
          }
        });

        const rawSections = await Promise.all(promises);
        
        // Fetch Genres
        const genreRes = await fetch(
          supabaseRestUrl("genre?select=*&is_published=eq.true&order=sort_order"),
          { headers }
        );
        const genres = await genreRes.json();
        
        const genrePromises = genres.map(async (g) => {
          const srRes = await fetch(
            supabaseRestUrl(
              `series?select=id&genre_ids=cs.{${g.id}}&status=eq.published&limit=50`,
            ),
            { headers }
          );
          const sdata = await srRes.json();
          if (sdata.length > 0) {
            const shuffled = sdata.sort(() => 0.5 - Math.random());
            const selectedIds = shuffled.slice(0, 6).map(s => s.id);
            selectedIds.forEach(id => allSeriesIdsToFetch.add(id));
            
            return {
              id: `genre_${g.id}`,
              isGenre: true,
              rawId: g.id,
              type: "normal",
              name_th: g.name_th,
              name_en: g.name_en,
              name_jp: g.name_jp,
              name_cn: g.name_cn,
              itemsData: selectedIds.map(id => ({ series_id: id }))
            };
          }
          return [];
        });
        
        const rawGenreSections = await Promise.all(genrePromises);
        
        const sectionsConfig = [...rawSections.flat(), ...rawGenreSections.flat()];

        const idsArr = Array.from(allSeriesIdsToFetch);
        const seriesMap = {};
        if (idsArr.length > 0) {
          const seriesRes = await fetch(
            supabaseRestUrl(
              `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&id=in.(${idsArr.join(",")})&status=eq.published`,
            ),
            { headers }
          );
          const seriesData = await seriesRes.json();
          seriesData.forEach(s => { seriesMap[s.id] = s; });
        }

        const finalSections = sectionsConfig.map(sec => {
          const populatedItems = sec.itemsData.map(i => seriesMap[i.series_id]).filter(Boolean);
          return {
            ...sec,
            items: populatedItems
          };
        }).filter(sec => sec.items.length > 0);

        setSections(finalSections);
      } catch (err) {
        console.error("Failed to fetch sections:", err);
      } finally {
        setLoadingSections(false);
      }
    }
    fetchSections();
  }, [language]);

  useEffect(() => {
    if (!scrollRef.current || banners.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.index));
          }
        });
      },
      { root: scrollRef.current, threshold: 0.6 }
    );
    const children = scrollRef.current.children;
    for (let i = 0; i < children.length; i++) {
      observer.observe(children[i]);
    }
    return () => observer.disconnect();
  }, [banners]);

  useEffect(() => {
    if (!loading && banners.length > 0 && scrollRef.current) {
      const targetIndex = banners.findIndex(b => b.id === 3);
      if (targetIndex !== -1) {
        const targetEl = scrollRef.current.children[targetIndex];
        if (targetEl) {
          scrollRef.current.style.scrollBehavior = 'auto';
          const containerCenter = scrollRef.current.offsetWidth / 2;
          const targetCenter = targetEl.offsetLeft + targetEl.offsetWidth / 2;
          scrollRef.current.scrollLeft = targetCenter - containerCenter;
          scrollRef.current.style.scrollBehavior = 'smooth';
        }
      }
    }
  }, [loading, banners]);

  const getTitle = (series) => {
    switch (language) {
      case "EN": return series.title_en || series.title_th;
      case "JP": return series.title_jp || series.title_th;
      case "CN": return series.title_cn || series.title_th;
      default: return series.title_th || series.title_en;
    }
  };

  const getCategoryTitle = (sec) => {
    if (sec.name_th || sec.name_en || sec.name_jp || sec.name_cn) {
      switch (language) {
        case "EN": return sec.name_en || sec.name_th;
        case "JP": return sec.name_jp || sec.name_th;
        case "CN": return sec.name_cn || sec.name_th;
        default: return sec.name_th;
      }
    }
    return sec.title || "";
  };

  const playLabel = language === "EN" ? "Play" :
    language === "JP" ? "再生" :
    language === "CN" ? "播放" : "เล่น";

  const openPlayer = (seriesId) => {
    if (seriesId) router.push(`/watch?id=${encodeURIComponent(seriesId)}`);
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-black text-white pt-6 pb-20">
      
      {/* Banners Slider Display */}
      {loading ? (
        <div className="flex w-full justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#BF8EFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          <div 
            ref={scrollRef}
            className="flex w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-4 px-[10%] pb-4 scroll-smooth hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {banners.map((item, index) => (
              <div 
                key={item.id} 
                data-index={index}
                onClick={() => openPlayer(item.series.id)}
                className="relative snap-center flex-shrink-0 w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                {item.series.poster_url ? (
                  <img src={item.series.poster_url} alt={getTitle(item.series)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center"><span className="text-white/20">No Image</span></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 flex h-1/3 flex-col items-center justify-end bg-gradient-to-t from-black/90 via-black/62 to-transparent px-4 pb-4 text-center">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPlayer(item.series.id);
                    }}
                    className="mb-2 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#C27AFF] to-[#7B1ED6] px-5 text-[14px] font-extrabold text-white shadow-[0_8px_22px_rgba(123,30,214,0.45),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform active:scale-95"
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7L8 5Z" />
                    </svg>
                    {playLabel}
                  </button>
                  <h2 className="text-[16px] font-medium text-white/90 drop-shadow-md line-clamp-1">{getTitle(item.series)}</h2>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-1.5 mt-2">
            {banners.map((_, index) => (
              <span key={index} className={`h-1.5 transition-all duration-300 ${activeIndex === index ? "w-6 bg-[#BF8EFF] rounded-full" : "w-1.5 bg-white/40 rounded-full"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Sections (Categories & Top Ranking) */}
      {loadingSections ? (
        <div className="flex w-full justify-center items-center py-16">
          <div className="w-6 h-6 border-2 border-[#BF8EFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col w-full pb-10">
          {sections.map((sec) => {
            if (sec.type === "top") {
              return (
                <div key={sec.id} className="flex flex-col mt-8">
                  <div className="flex items-center mb-3 px-4">
                    <h2 className="text-[17px] font-bold text-white tracking-wide">{getCategoryTitle(sec)}</h2>
                  </div>
                  <div className="flex overflow-x-auto overflow-y-hidden gap-2 px-4 pb-4 pt-4 hide-scrollbar snap-x">
                    {sec.items.map((item, index) => (
                      <div key={item.id} onClick={() => openPlayer(item.id)} className="relative flex items-end w-[155px] flex-none snap-start cursor-pointer group">
                        <span className={`absolute left-0 -bottom-1 text-[90px] font-black shadow-sm pointer-events-none z-0 select-none ${index + 1 === 10 ? 'flex flex-col items-center' : ''}`} 
                              style={{ WebkitTextStroke: "1.1px rgba(255,255,255,0.8)", color: "transparent", lineHeight: "0.8" }}>
                          {index + 1 === 10 ? (
                            <div className="flex flex-col items-center -space-y-4 h-min">
                              <span>1</span>
                              <span>0</span>
                            </div>
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div className={`bg-[#1A1A1A] rounded-md overflow-hidden w-[115px] flex flex-col ${index + 1 === 10 ? 'ml-10' : 'ml-8'} relative z-10 shadow-lg border border-white/5 group-active:scale-95 transition-transform`}>
                          <div className="w-full aspect-[2/3] bg-[#222]">
                             {item.poster_url && <img src={item.poster_url} className="object-cover w-full h-full" alt={getTitle(item)} />}
                          </div>
                          <div className="w-full p-2 py-1.5 flex items-center justify-center min-h-[36px]">
                             <p className="text-[10px] text-white/90 text-center leading-tight line-clamp-2">{getTitle(item)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={sec.id} className="flex flex-col mt-8 px-4">
                  <Link 
                    href={
                      sec.isGenre
                        ? `/genre?id=${encodeURIComponent(sec.rawId)}`
                        : `/category?id=${encodeURIComponent(sec.id)}`
                    }
                    className="flex items-center justify-between mb-3 cursor-pointer group"
                  >
                    <h2 className="text-[17px] font-bold text-white tracking-wide group-active:opacity-70">{getCategoryTitle(sec)}</h2>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-active:text-white/100"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </Link>
                  <div className="grid grid-cols-3 gap-2.5">
                    {sec.items.map((item) => (
                      <div key={item.id} onClick={() => openPlayer(item.id)} className="bg-[#1A1A1A] rounded-md overflow-hidden flex flex-col shadow-lg border border-white/5 cursor-pointer active:scale-95 transition-transform">
                        <div className="w-full aspect-[2/3] relative bg-[#222]">
                          {item.poster_url && <img src={item.poster_url} className="object-cover w-full h-full" alt={getTitle(item)} />}
                        </div>
                        <div className="p-2 py-1.5 flex items-center justify-center min-h-[36px]">
                          <p className="text-[10px] text-white/90 text-center leading-tight line-clamp-2">{getTitle(item)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
