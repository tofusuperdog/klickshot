"use client";

import { useLanguage } from "../LanguageContext";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { SUPABASE_HEADERS, supabaseRestUrl } from "../lib/supabase";

export default function CategoryDetail() {
  const { language } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id || searchParams.get("id");

  const [category, setCategory] = useState(null);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = SUPABASE_HEADERS;

  useEffect(() => {
    async function fetchData() {
      if (!id || id === "undefined") return;
      
      try {
        setLoading(true);
        // Fetch Category
        const catRes = await fetch(
          supabaseRestUrl(`content_categories?select=*&id=eq.${id}`),
          { headers },
        );
        
        if (!catRes.ok) {
          const errText = await catRes.text();
          console.error(`API Error: ${catRes.status}`, errText);
          throw new Error(`API request failed: ${catRes.status}`);
        }
        
        const cats = await catRes.json();
        if (!Array.isArray(cats) || cats.length === 0) {
          router.push("/");
          return;
        }

        const cat = cats[0];
        setCategory(cat);

        let finalSeries = [];

        // Check if it's a dubbed category (by name or some other field)
        // Usually the user identifies them as "หมวดพากย์ไทย/จีน..."
        // In our main page we check for "ซีรีส์พากย์ตามภาษา"
        if (cat.name === "ซีรีส์พากย์ตามภาษา" || cat.id === "feacb8fe-2f7d-4e35-afae-4cdb8bc6e069") {
          const currentLangCode = language.toLowerCase();
          const srRes = await fetch(
            supabaseRestUrl(
              `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&dub_${currentLangCode}=eq.true&order=id.desc`,
            ),
            { headers }
          );
          if (!srRes.ok) throw new Error(`Series fetch failed: ${srRes.status}`);
          finalSeries = await srRes.json();
        } else {
          // Normal category using series_ids from the row
          if (cat.series_ids && cat.series_ids.length > 0) {
            const seriesRes = await fetch(
              supabaseRestUrl(
                `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&id=in.(${cat.series_ids.join(",")})`,
              ),
              { headers }
            );
            if (!seriesRes.ok) throw new Error(`Series fetch failed: ${seriesRes.status}`);
            const rawSeries = await seriesRes.json();
            const seriesMap = {};
            rawSeries.forEach(s => { seriesMap[s.id] = s; });
            finalSeries = cat.series_ids.map(sid => seriesMap[sid]).filter(Boolean);
          }
        }

        setSeriesList(finalSeries);
      } catch (err) {
        console.error("fetchData error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, language]);

  const getCategoryTitle = (cat) => {
    if (!cat) return "";
    switch (language) {
      case "EN": return cat.name_en || cat.name_th || cat.name;
      case "JP": return cat.name_jp || cat.name_th || cat.name;
      case "CN": return cat.name_cn || cat.name_th || cat.name;
      default: return cat.name_th || cat.name;
    }
  };

  const getPrimaryTitle = (series) => {
    switch (language) {
      case "EN": return series.title_en || series.title_th;
      case "JP": return series.title_jp || series.title_th;
      case "CN": return series.title_cn || series.title_th;
      default: return series.title_th || series.title_en;
    }
  };

  const getSecondaryTitle = (series) => {
    if (language === "TH") return series.title_en || "";
    return series.title_th || "";
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-black text-white pb-10">
      {/* Category Title */}
      <h1 className="text-[20px] font-bold text-center mt-6 mb-8">{getCategoryTitle(category)}</h1>

      {/* Series Grid */}
      {loading ? (
        <div className="flex flex-1 justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#BF8EFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 px-4">
          {seriesList.map((series) => (
            <div key={series.id} className="bg-[#1A1A1A] rounded-md overflow-hidden flex flex-col shadow-lg border border-white/5 cursor-pointer active:scale-95 transition-transform">
              <div className="w-full aspect-[2/3] relative bg-[#222]">
                {series.poster_url && <img src={series.poster_url} className="object-cover w-full h-full" alt={getPrimaryTitle(series)} />}
              </div>
              <div className="p-2 py-1.5 flex items-center justify-center min-h-[36px]">
                 <p className="text-[10px] text-white/90 text-center leading-tight line-clamp-2">{getPrimaryTitle(series)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && seriesList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 text-sm italic">
           <p>No titles available in this category</p>
        </div>
      )}
    </div>
  );
}
