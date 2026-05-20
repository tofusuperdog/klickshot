"use client";

import { useLanguage } from "../LanguageContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUPABASE_HEADERS, supabaseRestUrl } from "../lib/supabase";

const headers = SUPABASE_HEADERS;

function formatViews(num) {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
  if (num >= 1000) return `${Math.round(num / 1000)}k`;
  return `${num}`;
}

export default function AppSearch() {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [topSeries, setTopSeries] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Fetch top 6 series from top_series joined with series + total views
  useEffect(() => {
    async function fetchTopSeries() {
      try {
        // 1) Fetch top_series (rank 1-6)
        const topRes = await fetch(
          supabaseRestUrl("top_series?select=rank,series_id&order=rank&limit=6"),
          { headers }
        );
        const topData = await topRes.json();
        const seriesIds = topData.map(t => t.series_id);

        if (seriesIds.length === 0) return;

        // 2) Fetch series details
        const seriesRes = await fetch(
          supabaseRestUrl(
            `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&id=in.(${seriesIds.join(",")})&status=eq.published`,
          ),
          { headers }
        );
        const seriesData = await seriesRes.json();

        // 3) Fetch total views per series_id from series_daily_views
        const viewsRes = await fetch(
          supabaseRestUrl(
            `series_daily_views?select=series_id,views_th,views_en,views_jp,views_cn&series_id=in.(${seriesIds.join(",")})`,
          ),
          { headers }
        );
        const viewsData = await viewsRes.json();

        // Sum views per series
        const viewsMap = {};
        viewsData.forEach(row => {
          const total = (row.views_th || 0) + (row.views_en || 0) + (row.views_jp || 0) + (row.views_cn || 0);
          viewsMap[row.series_id] = (viewsMap[row.series_id] || 0) + total;
        });

        // Map series by id
        const seriesMap = {};
        seriesData.forEach(s => { seriesMap[s.id] = s; });

        // Build result sorted by rank
        const combined = topData
          .map(t => ({
            rank: t.rank,
            series: seriesMap[t.series_id],
            totalViews: viewsMap[t.series_id] || 0,
          }))
          .filter(item => item.series);

        setTopSeries(combined);
      } catch (err) {
        console.error("Failed to fetch top series:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopSeries();
  }, []);

  // Search series by title
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          supabaseRestUrl(
            `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&status=eq.published&or=(title_th.ilike.*${encodeURIComponent(query)}*,title_en.ilike.*${encodeURIComponent(query)}*,title_jp.ilike.*${encodeURIComponent(query)}*,title_cn.ilike.*${encodeURIComponent(query)}*)&limit=20`,
          ),
          { headers }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const getTitle = (series) => {
    switch (language) {
      case "EN": return series.title_en || series.title_th;
      case "JP": return series.title_jp || series.title_th;
      case "CN": return series.title_cn || series.title_th;
      default: return series.title_th || series.title_en;
    }
  };

  const searchLabel = language === "EN" ? "Search series" :
    language === "JP" ? "シリーズを検索" :
    language === "CN" ? "搜索剧集" : "ค้นหาชื่อซีรีส์";

  const topSearchedLabel = language === "EN" ? "Popular Searches" :
    language === "JP" ? "人気の検索" :
    language === "CN" ? "热门搜索" : "ค้นหายอดนิยม";

  const searchResultLabel = language === "EN" ? `Search Results ${searchResults.length} items` :
    language === "JP" ? `検索結果 ${searchResults.length}件` :
    language === "CN" ? `搜索结果 ${searchResults.length}项` : `ผลการค้นหา ${searchResults.length} รายการ`;

  const isSearching = query.trim().length > 0;

  const openPlayer = (seriesId) => {
    if (seriesId) router.push(`/watch?id=${encodeURIComponent(seriesId)}`);
  };

  return (
    <div className="flex flex-col w-full min-h-full bg-black text-white px-4 pt-4 pb-6">

      {/* Search Bar */}
      <div className="relative w-full mb-5">
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={searchLabel}
          className="w-full h-11 rounded-full bg-[#1A1A1A] border border-[#BF8EFF]/55 pl-10 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#BF8EFF] transition-colors"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-3.5 flex items-center text-white/40 hover:text-white/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="flex flex-col">
          <h2 className="text-[15px] font-bold mb-4">{searchResultLabel}</h2>
          {searching ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-6 h-6 border-2 border-[#BF8EFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-60">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm">
                {language === "EN" ? "No results found" :
                  language === "JP" ? "結果が見つかりません" :
                  language === "CN" ? "未找到结果" : "ไม่พบผลการค้นหา"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {searchResults.map(series => (
                <div key={series.id} onClick={() => openPlayer(series.id)} className="bg-[#1A1A1A] rounded-md overflow-hidden flex flex-col shadow-lg border border-white/5 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-full aspect-[2/3] relative bg-[#222]">
                    {series.poster_url && <img src={series.poster_url} alt={getTitle(series)} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-2 py-1.5 flex items-center justify-center min-h-[36px]">
                    <p className="text-[10px] text-white/90 text-center leading-tight line-clamp-2">{getTitle(series)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Top Series Section */
        <div className="flex flex-col">
          <h2 className="text-[15px] font-bold mb-4">{topSearchedLabel}</h2>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-6 h-6 border-2 border-[#BF8EFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {topSeries.map(({ series }) => (
                <div key={series.id} onClick={() => openPlayer(series.id)} className="bg-[#1A1A1A] rounded-md overflow-hidden flex flex-col shadow-lg border border-white/5 cursor-pointer active:scale-95 transition-transform">
                  <div className="w-full aspect-[2/3] relative bg-[#222]">
                    {series.poster_url && <img src={series.poster_url} alt={getTitle(series)} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-2 py-1.5 flex items-center justify-center min-h-[36px]">
                    <p className="text-[10px] text-white/90 text-center leading-tight line-clamp-2">{getTitle(series)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
