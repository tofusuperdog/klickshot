"use client";

import { useLanguage } from "../LanguageContext";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { SUPABASE_HEADERS, supabaseRestUrl } from "../lib/supabase";

export default function GenreDetail() {
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
        // Fetch Genre
        const genreRes = await fetch(
          supabaseRestUrl(`genre?select=*&id=eq.${id}`),
          { headers },
        );
        
        if (!genreRes.ok) {
          const errText = await genreRes.text();
          console.error(`API Error: ${genreRes.status}`, errText);
          throw new Error(`API request failed: ${genreRes.status}`);
        }
        
        const genresInfo = await genreRes.json();
        if (!Array.isArray(genresInfo) || genresInfo.length === 0) {
          router.push("/");
          return;
        }

        const genre = genresInfo[0];
        setCategory(genre);

        // Fetch Series with this genre
        const seriesRes = await fetch(
          supabaseRestUrl(
            `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&genre_ids=cs.{${genre.id}}&order=id.desc`,
          ),
          { headers }
        );
        if (!seriesRes.ok) throw new Error(`Series fetch failed: ${seriesRes.status}`);
        const finalSeries = await seriesRes.json();

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
           <p>No titles available in this genre</p>
        </div>
      )}
    </div>
  );
}
