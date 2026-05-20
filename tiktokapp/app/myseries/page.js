"use client";

import { useLanguage } from "../LanguageContext";
import { loadFavoriteSeries } from "../lib/favoriteSeries";
import { loadRecentSeries } from "../lib/recentSeries";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppMySeries() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("recent"); // recent or favorite
  const [recentSeries, setRecentSeries] = useState([]);
  const [favoriteSeries, setFavoriteSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(true);

  const tabs = [
    { id: "recent", label: t("recent_series") },
    { id: "favorite", label: t("favorite_series") },
  ];

  useEffect(() => {
    let cancelled = false;

    const loadAuthoritativeSeries = async () => {
      setLoadingSeries(true);

      const [recentItems, favoriteItems] = await Promise.all([
        loadRecentSeries({ fallbackToCache: false, syncLocal: false }),
        loadFavoriteSeries({ fallbackToCache: false }),
      ]);

      if (cancelled) return;

      setRecentSeries(recentItems);
      setFavoriteSeries(favoriteItems);
      setLoadingSeries(false);
    };

    loadAuthoritativeSeries();

    const handleRecentSeriesUpdated = () => {
      loadRecentSeries({ fallbackToCache: false, syncLocal: false }).then(
        (items) => {
          if (!cancelled) setRecentSeries(items);
        },
      );
    };
    const handleFavoriteSeriesUpdated = () => {
      loadFavoriteSeries({ fallbackToCache: false }).then((items) => {
        if (!cancelled) setFavoriteSeries(items);
      });
    };
    const handleTikTokUserUpdated = loadAuthoritativeSeries;
    const handleStoredSeriesUpdated = () => {
      handleRecentSeriesUpdated();
      handleFavoriteSeriesUpdated();
    };

    window.addEventListener("storage", handleStoredSeriesUpdated);
    window.addEventListener(
      "minchap_recent_series_updated",
      handleRecentSeriesUpdated,
    );
    window.addEventListener(
      "minchap_favorite_series_updated",
      handleFavoriteSeriesUpdated,
    );
    window.addEventListener(
      "minchap:tiktok-user-updated",
      handleTikTokUserUpdated,
    );

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStoredSeriesUpdated);
      window.removeEventListener(
        "minchap_recent_series_updated",
        handleRecentSeriesUpdated,
      );
      window.removeEventListener(
        "minchap_favorite_series_updated",
        handleFavoriteSeriesUpdated,
      );
      window.removeEventListener(
        "minchap:tiktok-user-updated",
        handleTikTokUserUpdated,
      );
    };
  }, []);

  const getTitle = (series) => {
    switch (language) {
      case "EN":
        return series.title_en || series.title_th;
      case "JP":
        return series.title_jp || series.title_th;
      case "CN":
        return series.title_cn || series.title_th;
      default:
        return series.title_th || series.title_en;
    }
  };

  const openPlayer = (seriesId) => {
    if (seriesId) router.push(`/watch?id=${encodeURIComponent(seriesId)}`);
  };

  const isRecentEmpty = activeTab === "recent" && recentSeries.length === 0;
  const isFavoriteTab = activeTab === "favorite";
  const visibleSeries = isFavoriteTab ? favoriteSeries : recentSeries;

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-70px)] bg-black text-white pb-20">
      
      {/* Tabs Header */}
      <div className="flex w-full border-b border-white/5 px-4 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-sm font-medium transition-all relative ${
              activeTab === tab.id ? "text-white" : "text-white/40"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#BF8EFF] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loadingSeries ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#BF8EFF] border-t-transparent" />
        </div>
      ) : visibleSeries.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5 p-4">
          {visibleSeries.map((series) => (
            <button
              type="button"
              key={series.id}
              onClick={() => openPlayer(series.id)}
              className="overflow-hidden rounded-md border border-white/5 bg-[#1A1A1A] text-left shadow-lg transition-transform active:scale-95"
            >
              <div className="aspect-[2/3] w-full bg-[#222]">
                {series.poster_url ? (
                  <img
                    src={series.poster_url}
                    className="h-full w-full object-cover"
                    alt={getTitle(series)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-white/25">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex min-h-[44px] items-center justify-center p-2 py-1.5">
                <p className="line-clamp-2 text-center text-[12px] leading-tight text-white/90">
                  {getTitle(series)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white/20"
          >
            {isRecentEmpty ? (
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            )}
          </svg>
        </div>
        <h3 className="text-[17px] font-bold text-white/90 mb-1">
          {isFavoriteTab ? t("favorite_series") : t("recent_series")}
        </h3>
        <p className="text-sm text-white/40 max-w-[200px] leading-relaxed">
          {t("no_data")}
        </p>
      </div>
      )}

    </div>
  );
}
