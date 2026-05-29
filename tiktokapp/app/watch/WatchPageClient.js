"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useLanguage } from "../LanguageContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getApiUrl } from "../lib/apiBaseUrl";
import {
  CUSTOMER_VIP_UPDATED_EVENT,
  isVipSubscriptionActive,
  loadCustomerVipSubscription,
} from "../lib/customerVip";
import {
  isSeriesFavorite,
  loadFavoriteSeriesStatus,
  setSeriesFavorite,
} from "../lib/favoriteSeries";
import { saveRecentSeries } from "../lib/recentSeries";
import { SUPABASE_HEADERS, supabaseRestUrl } from "../lib/supabase";

const BYTEPLUS_LICENSE =
  process.env.NEXT_PUBLIC_BYTEPLUS_LICENSE ||
  "https://sf16-vod-license-multi.byteplusvod.com/obj/vod-license-sgcom/l-1122314769-ch-vod-a-1006938.lic";
const SUBTITLE_OFFSET_BOTTOM_PERCENT = 25;
const PLAYER_AUDIO_GAIN = 1.3;
const ENABLE_AUDIO_TRACK_SWITCHING = true;

const headers = SUPABASE_HEADERS;
let vePlayerModulePromise = null;

const isAppleMobileWebKit = () => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const hasTouch = Number(navigator.maxTouchPoints || 0) > 1;

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && hasTouch)
  );
};

const getAppleMobileOsMajorVersion = () => {
  if (typeof navigator === "undefined") return 0;

  const userAgent = navigator.userAgent || "";
  const match = userAgent.match(/(?:CPU(?: iPhone)? OS|iPhone OS|iPad; CPU OS)\s+(\d+)/i);

  return match ? Number(match[1]) || 0 : 0;
};

function loadVePlayerModule() {
  if (!vePlayerModulePromise) {
    vePlayerModulePromise = import("@byteplus/veplayer");
  }

  return vePlayerModulePromise;
}

function invokeNativeSnapshotProtection(allow) {
  if (typeof window === "undefined") {
    return false;
  }

  const payload = { allow };
  const callbacks = {
    ...payload,
    success: () => {},
    fail: () => {},
    complete: () => {},
  };
  const ttMinis = window.TTMinis;

  try {
    if (typeof ttMinis?.allowSystemSnapshot === "function") {
      ttMinis.allowSystemSnapshot(callbacks);
      return true;
    }

    if (typeof ttMinis?.call === "function") {
      ttMinis.call("allowSystemSnapshot", payload);
      return true;
    }

    if (typeof ttMinis?.invoke === "function") {
      ttMinis.invoke("allowSystemSnapshot", payload);
      return true;
    }

    if (typeof window.my?.call === "function") {
      window.my.call("allowSystemSnapshot", payload);
      return true;
    }
  } catch (error) {
    console.warn("Unable to update native screen capture protection:", error);
  }

  return false;
}

function enableProtectedPlaybackSurface() {
  const nativeApplied = invokeNativeSnapshotProtection(false);

  return () => {
    invokeNativeSnapshotProtection(true);
    return nativeApplied;
  };
}

function recordEpisodeView(targetEpisode) {
  const seriesId = Number(targetEpisode?.series_id);
  const episodeId = Number(targetEpisode?.id);
  const episodeNo = Number(targetEpisode?.episode_no);

  if (
    !Number.isSafeInteger(seriesId) ||
    !Number.isSafeInteger(episodeId) ||
    !Number.isSafeInteger(episodeNo)
  ) {
    return;
  }

  const url = getApiUrl("/api/customer/episode-view");
  const body = JSON.stringify({
    seriesId,
    episodeId,
    episodeNo,
  });

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch((error) => {
    console.warn("Failed to record episode view:", error);
  });
}

const getSubtitleId = (sub, idx) =>
  String(sub?.id || sub?.language || sub?.text || idx);

const getSubtitleLabel = (sub, idx) => {
  const language = String(sub?.language || "").toLowerCase();

  if (language === "th") return "TH";
  if (language === "zh" || language === "cn") return "CN";
  if (language === "en") return "EN";
  if (language === "jp" || language === "ja") return "JP";

  return sub?.text || `Subtitle ${idx + 1}`;
};

const normalizeSubtitle = (sub, idx) => ({
  id: getSubtitleId(sub, idx),
  src: (sub.src || sub.url).trim(),
  text: getSubtitleLabel(sub, idx),
  language: sub.language || getSubtitleLabel(sub, idx).toLowerCase(),
  default: Boolean(sub.default || sub.isDefault) || idx === 0,
});

const getAudioTrackId = (track, idx) =>
  String(
    track?.id ??
      track?.lang ??
      track?.language ??
      track?.name ??
      track?.text ??
      idx,
  );

const normalizeAudioLanguageKey = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  const aliases = {
    tha: "th",
    thai: "th",
    zho: "zh",
    chi: "zh",
    chinese: "zh",
    cn: "zh",
    "zh-cn": "zh",
    eng: "en",
    english: "en",
    jpn: "ja",
    japanese: "ja",
    jp: "ja",
  };

  return aliases[key] || key;
};

const getAudioTrackLabel = (track, idx) => {
  const language = normalizeAudioLanguageKey(track?.lang || track?.language);

  if (language === "th") return "TH";
  if (language === "zh") return "CN";
  if (language === "en") return "EN";
  if (language === "ja") return "JP";

  return track?.text || track?.name || `Audio ${idx + 1}`;
};

const normalizeAudioTrack = (track, idx) => ({
  id: getAudioTrackId(track, idx),
  playerId: track?.playerId ?? track?.id ?? idx,
  text: getAudioTrackLabel(track, idx),
  lang: normalizeAudioLanguageKey(track?.lang || track?.language),
  name: track?.name || track?.text || "",
  uri: track?.uri || track?.url || "",
  default: Boolean(track?.default || track?.isDefault) || idx === 0,
  selected: Boolean(track?.selected),
});

const parseHlsAttributeList = (value) => {
  const attributes = {};
  const pattern = /([A-Z0-9-]+)=("(?:[^"\\]|\\.)*"|[^,]*)/gi;
  let match;

  while ((match = pattern.exec(value || ""))) {
    const rawValue = match[2] || "";
    attributes[match[1].toUpperCase()] = rawValue.startsWith('"')
      ? rawValue.slice(1, -1)
      : rawValue;
  }

  return attributes;
};

const parseHlsAudioTracks = (manifestText) =>
  String(manifestText || "")
    .split(/\r?\n/)
    .filter((line) => /^#EXT-X-MEDIA:/i.test(line) && /TYPE=AUDIO/i.test(line))
    .map((line, idx) => {
      const attributes = parseHlsAttributeList(line.slice(line.indexOf(":") + 1));
      const lang = normalizeAudioLanguageKey(attributes.LANGUAGE);

      return normalizeAudioTrack(
        {
          id: attributes.URI || attributes.NAME || attributes.LANGUAGE || idx,
          playerId: idx,
          lang,
          language: lang,
          name: attributes.NAME || "",
          text: attributes.NAME || "",
          uri: attributes.URI || "",
          default: attributes.DEFAULT === "YES",
          selected: attributes.DEFAULT === "YES",
        },
        idx,
      );
    });

const loadHlsAudioTracks = async (manifestUrls) => {
  const urls = [...new Set((manifestUrls || []).filter(Boolean))];

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) continue;

      const tracks = parseHlsAudioTracks(await response.text());

      if (tracks.length > 0) return tracks;
    } catch {
      // Try the next manifest URL. Direct CDN URLs may not expose CORS.
    }
  }

  return [];
};

const normalizeSubtitleKey = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  const baseKey = key.split("-")[0];
  const aliases = {
    chinese: "zh",
    chi: "zh",
    zho: "zh",
    cn: "zh",
    thai: "th",
    tha: "th",
    english: "en",
    eng: "en",
    japanese: "ja",
    jpn: "ja",
    jp: "ja",
  };

  return aliases[key] || aliases[baseKey] || key;
};

const getSubtitleMatchKeys = (subtitle) => {
  if (!subtitle) return [];

  return [
    subtitle.id,
    subtitle.language,
    subtitle.lang,
    subtitle.text,
    subtitle.name,
    subtitle.title,
    subtitle.src,
    subtitle.url,
  ]
    .filter(Boolean)
    .map(normalizeSubtitleKey);
};

const subtitlesMatch = (left, right) => {
  const leftKeys = getSubtitleMatchKeys(left);
  const rightKeys = getSubtitleMatchKeys(right);

  return leftKeys.some((key) => rightKeys.includes(key));
};

const SUBTITLE_LANGUAGE_ORDER = ["th", "en", "ja", "zh"];
const AUDIO_LANGUAGE_ORDER = ["th", "zh", "en", "ja"];

const getOrderedSubtitleOptions = (subtitles) =>
  SUBTITLE_LANGUAGE_ORDER.map((languageKey) =>
    subtitles.find((subtitle) =>
      getSubtitleMatchKeys(subtitle).includes(languageKey),
    ),
  ).filter(Boolean);

const getSubtitleDisplayName = (subtitle, language) => {
  const subtitleLanguage = String(
    subtitle?.language || subtitle?.text || "",
  ).toLowerCase();
  const names = {
    th: { TH: "ไทย", EN: "Thai", CN: "泰语", JP: "タイ語" },
    zh: { TH: "จีน", EN: "Chinese", CN: "中文", JP: "中国語" },
    cn: { TH: "จีน", EN: "Chinese", CN: "中文", JP: "中国語" },
    en: { TH: "อังกฤษ", EN: "English", CN: "英语", JP: "英語" },
    jp: { TH: "ญี่ปุ่น", EN: "Japanese", CN: "日语", JP: "日本語" },
    ja: { TH: "ญี่ปุ่น", EN: "Japanese", CN: "日语", JP: "日本語" },
  };

  return (
    names[subtitleLanguage]?.[language] || subtitle?.text || subtitle?.language
  );
};

const getSubtitlePreference = (subtitle) =>
  subtitle
    ? normalizeSubtitleKey(subtitle.language || subtitle.text || subtitle.id)
    : "off";

const getOrderedSubtitleDisplayName = (subtitle, language) => {
  const subtitleLanguage = normalizeSubtitleKey(
    subtitle?.language || subtitle?.text || "",
  );
  const names = {
    th: {
      TH: "\u0e44\u0e17\u0e22",
      EN: "Thai",
      CN: "\u6cf0\u8bed",
      JP: "\u30bf\u30a4\u8a9e",
    },
    en: {
      TH: "\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29",
      EN: "English",
      CN: "\u82f1\u8bed",
      JP: "\u82f1\u8a9e",
    },
    ja: {
      TH: "\u0e0d\u0e35\u0e48\u0e1b\u0e38\u0e48\u0e19",
      EN: "Japanese",
      CN: "\u65e5\u8bed",
      JP: "\u65e5\u672c\u8a9e",
    },
    zh: {
      TH: "\u0e08\u0e35\u0e19",
      EN: "Chinese",
      CN: "\u4e2d\u6587",
      JP: "\u4e2d\u56fd\u8a9e",
    },
  };

  return (
    names[subtitleLanguage]?.[language] ||
    getSubtitleDisplayName(subtitle, language)
  );
};

const findSubtitleByPreference = (subtitles, preference) => {
  const normalizedPreference = normalizeSubtitleKey(preference);

  if (!normalizedPreference || normalizedPreference === "off") return null;

  return (
    subtitles.find((subtitle) =>
      getSubtitleMatchKeys(subtitle).includes(normalizedPreference),
    ) || null
  );
};

const getOrderedAudioTrackOptions = (audioTracks) =>
  [
    ...AUDIO_LANGUAGE_ORDER.map((languageKey) =>
      audioTracks.find((track) => track.lang === languageKey),
    ).filter(Boolean),
    ...audioTracks.filter(
      (track) => !AUDIO_LANGUAGE_ORDER.includes(track.lang),
    ),
  ];

const getAudioTrackMatchKeys = (track) => {
  if (!track) return [];

  return [
    track.lang,
    track.language,
    track.text,
    track.name,
    track.id,
    track.uri,
    track.url,
  ]
    .filter(Boolean)
    .map(normalizeAudioLanguageKey);
};

const getAudioTrackPreference = (track) =>
  getAudioTrackMatchKeys(track)[0] || "";

const findAudioTrackByPreference = (audioTracks, preference) => {
  const normalizedPreference = normalizeAudioLanguageKey(preference);

  if (!normalizedPreference) return null;

  return (
    audioTracks.find((track) =>
      getAudioTrackMatchKeys(track).includes(normalizedPreference),
    ) || null
  );
};

const getAudioTrackDisplayName = (track, language) => {
  const trackLanguage = normalizeAudioLanguageKey(
    track?.lang || track?.language || track?.text || "",
  );
  const names = {
    th: {
      TH: "\u0e44\u0e17\u0e22",
      EN: "Thai",
      CN: "\u6cf0\u8bed",
      JP: "\u30bf\u30a4\u8a9e",
    },
    zh: {
      TH: "\u0e08\u0e35\u0e19",
      EN: "Chinese",
      CN: "\u4e2d\u6587",
      JP: "\u4e2d\u56fd\u8a9e",
    },
    en: {
      TH: "\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29",
      EN: "English",
      CN: "\u82f1\u8bed",
      JP: "\u82f1\u8a9e",
    },
    ja: {
      TH: "\u0e0d\u0e35\u0e48\u0e1b\u0e38\u0e48\u0e19",
      EN: "Japanese",
      CN: "\u65e5\u8bed",
      JP: "\u65e5\u672c\u8a9e",
    },
  };

  return names[trackLanguage]?.[language] || track?.text || track?.name;
};

const getSeriesTitle = (series, language) => {
  if (!series) return "";

  switch (language) {
    case "EN":
      return series.title_en || series.title_th || "";
    case "JP":
      return series.title_jp || series.title_th || series.title_en || "";
    case "CN":
      return series.title_cn || series.title_th || series.title_en || "";
    default:
      return series.title_th || series.title_en || "";
  }
};

const interactivePlayerSelector = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "[role='button']",
  ".xgplayer-controls",
  ".xgplayer-progress",
  ".xgplayer-volume",
  ".xgplayer-definition",
  ".xgplayer-fullscreen",
  ".xgplayer-play",
  ".xgplayer-pause",
  ".xgplayer-start",
].join(",");

const isKnownVePlayerDevWarning = (value) => {
  const message =
    typeof value === "string"
      ? value
      : value?.message || value?.stack || String(value || "");

  return (
    message.includes("getPrivateDrmInfo is not a function") ||
    message.includes("Cannot read properties of undefined (reading 'abr')") ||
    message.includes('Cannot read properties of undefined (reading "abr")')
  );
};

const isKnownVePlayerDevWarningArgs = (args) => {
  const values = Array.from(args || []);

  return (
    values.some(isKnownVePlayerDevWarning) ||
    isKnownVePlayerDevWarning(
      values
        .map((value) =>
          typeof value === "string"
            ? value
            : value?.message || value?.stack || String(value || ""),
        )
        .join(" "),
    )
  );
};

function getLabels(language) {
  switch (language) {
    case "EN":
      return {
        loading: "Loading video",
        missing: "No video available",
        tokenError: "Unable to load video",
        hlsMissingTitle: "HLS not available",
        hlsMissing:
          "This video does not have an HLS transcode yet. Please create the HLS transcode before playback.",
        back: "Back",
        favorite: "Favorite",
        list: "List",
        settings: "Settings",
        audioDubs: "Audio",
        subtitles: "Subtitles",
        subtitlesOff: "Subtitles off",
      };
    case "JP":
      return {
        loading: "動画を読み込み中",
        missing: "動画がありません",
        tokenError: "動画を読み込めません",
        hlsMissingTitle: "HLS not available",
        hlsMissing:
          "This video does not have an HLS transcode yet. Please create the HLS transcode before playback.",
        back: "戻る",
      };
    case "CN":
      return {
        loading: "正在加载视频",
        missing: "暂无视频",
        tokenError: "无法加载视频",
        hlsMissingTitle: "HLS not available",
        hlsMissing:
          "This video does not have an HLS transcode yet. Please create the HLS transcode before playback.",
        back: "返回",
      };
    default:
      return {
        loading: "กำลังโหลดวิดีโอ",
        missing: "ยังไม่มีวิดีโอ",
        tokenError: "ไม่สามารถโหลดวิดีโอได้",
        hlsMissingTitle: "HLS not available",
        hlsMissing:
          "วิดีโอนี้ยังไม่มี HLS transcode กรุณาสร้าง HLS transcode ก่อนเล่นวิดีโอ",
        back: "ย้อนกลับ",
      };
  }
}

function getWatchOverlayLabels(language) {
  switch (language) {
    case "EN":
      return {
        favorite: "Favorite",
        list: "List",
        settings: "Settings",
        audioDubs: "Audio",
        subtitles: "Subtitles",
        subtitlesOff: "Subtitles off",
      };
    case "JP":
      return {
        favorite: "お気に入り",
        list: "リスト",
        settings: "設定",
        audioDubs: "音声",
        subtitles: "字幕",
        subtitlesOff: "字幕オフ",
      };
    case "CN":
      return {
        favorite: "收藏",
        list: "列表",
        settings: "设置",
        audioDubs: "配音",
        subtitles: "字幕",
        subtitlesOff: "关闭字幕",
      };
    default:
      return {
        favorite: "รายการโปรด",
        list: "รายการ",
        settings: "ตั้งค่า",
        audioDubs: "พากย์เสียง",
        subtitles: "คำบรรยาย",
        subtitlesOff: "ปิดคำบรรยาย",
      };
  }
}

const VePlayerComponent = forwardRef(function VePlayerComponent(
  {
    vid,
    playback,
    subtitles,
    activeSubtitle,
    onPausedChange,
    onEnded,
    onAudioTracksChange,
    lineAppId,
    lineUserId,
  },
  ref,
) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const onPausedChangeRef = useRef(onPausedChange);
  const onEndedRef = useRef(onEnded);
  const onAudioTracksChangeRef = useRef(onAudioTracksChange);
  const subtitlePluginRef = useRef(null);
  const pendingSubtitleRef = useRef(undefined);
  const audioBoostRef = useRef({
    audioContext: null,
    sourceNode: null,
    gainNode: null,
    videoElement: null,
    resumeHandler: null,
  });

  useEffect(() => {
    onPausedChangeRef.current = onPausedChange;
  }, [onPausedChange]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onAudioTracksChangeRef.current = onAudioTracksChange;
  }, [onAudioTracksChange]);

  const resolveSubtitlePlugin = () => {
    if (subtitlePluginRef.current) return subtitlePluginRef.current;

    const player = playerRef.current;
    if (!player) return null;

    const plugin =
      player.getPlugin?.("Subtitle") ||
      player.getPlugin?.("subtitle") ||
      player.getPlugin?.("subTitle") ||
      Object.values(player.plugins || {}).find(
        (item) =>
          item &&
          typeof item === "object" &&
          (typeof item.switchSubTitle === "function" ||
            typeof item.switchOffSubtitle === "function"),
      ) ||
      null;

    subtitlePluginRef.current = plugin;
    return plugin;
  };

  const applySubtitle = (subtitle) => {
    const subtitlePlugin = resolveSubtitlePlugin();

    if (!subtitlePlugin) {
      pendingSubtitleRef.current = subtitle;
      return false;
    }

    if (!subtitle) {
      subtitlePlugin.switchOffSubtitle?.();
      subtitlePlugin.noShowSubtitle?.();
      return true;
    }

    const list =
      (typeof subtitlePlugin.getList === "function"
        ? subtitlePlugin.getList()
        : subtitlePlugin.curList || subtitlePlugin.list || []) || [];
    const pluginSubtitle = Array.isArray(list)
      ? list.find((item) => subtitlesMatch(item, subtitle))
      : null;

    if (Array.isArray(list) && list.length === 0) {
      pendingSubtitleRef.current = subtitle;
      return false;
    }

    if (Array.isArray(list) && list.length > 0 && !pluginSubtitle) {
      pendingSubtitleRef.current = subtitle;
      return false;
    }

    subtitlePlugin.openSubtitle?.();
    subtitlePlugin.switchSubTitle?.(pluginSubtitle || subtitle);
    return true;
  };

  const getPlayerAudioTracks = () => {
    const player = playerRef.current;

    const nativeTracks =
      player?.video?.audioTracks ||
      player?.media?.audioTracks ||
      player?.root?.querySelector?.("video")?.audioTracks ||
      containerRef.current?.querySelector("video")?.audioTracks;
    const normalizedNativeTracks = nativeTracks?.length
      ? Array.from({ length: nativeTracks.length }, (_, idx) => {
          const track = nativeTracks[idx];

          return {
            id: track.id || idx,
            playerId: track.id || idx,
            lang: track.language || "",
            language: track.language || "",
            name: track.label || track.name || "",
            text: track.label || track.name || "",
            selected: Boolean(track.enabled),
          };
        })
      : [];

    if (!player || typeof player.getAudioTracks !== "function") {
      return normalizedNativeTracks;
    }

    const playerTracks = player.getAudioTracks() || [];

    if (playerTracks.length > 0) return playerTracks;

    const hls = findInternalHls(player);
    const hlsTracks = hls?.audioTracks?.length
      ? hls.audioTracks.map((track, idx) => ({
          id: track.id ?? idx,
          playerId: idx,
          lang: track.lang || "",
          language: track.lang || "",
          name: track.name || "",
          text: track.name || "",
          selected: Number(hls.audioTrack) === idx,
        }))
      : [];

    return hlsTracks.length > 0 ? hlsTracks : normalizedNativeTracks;
  };

  const getCurrentPlayerAudioTrack = () => {
    const player = playerRef.current;

    if (!player || typeof player.getCurrentAudioTrack !== "function") {
      return null;
    }

    return player.getCurrentAudioTrack();
  };

  const emitAudioTracks = (audioTracks = getPlayerAudioTracks()) => {
    const currentTrack = getCurrentPlayerAudioTrack();

    onAudioTracksChangeRef.current?.(
      audioTracks.map((track) => ({
        ...track,
        selected:
          Boolean(track.selected) ||
          (currentTrack ? String(track.id) === String(currentTrack.id) : false),
      })),
    );
  };

  const findInternalHls = (value, depth = 0, seen = new Set()) => {
    if (!value || typeof value !== "object" || seen.has(value) || depth > 8) {
      return null;
    }

    seen.add(value);

    if (Array.isArray(value.audioTracks) && "audioTrack" in value) {
      return value;
    }

    return Object.values(value).reduce(
      (found, item) => found || findInternalHls(item, depth + 1, seen),
      null,
    );
  };

  const switchNativeAudioTrack = (audioTrack) => {
    const player = playerRef.current;
    const nativeTracks =
      player?.video?.audioTracks ||
      player?.media?.audioTracks ||
      player?.root?.querySelector?.("video")?.audioTracks ||
      containerRef.current?.querySelector("video")?.audioTracks;

    if (!nativeTracks?.length) return false;

    let switched = false;

    for (let idx = 0; idx < nativeTracks.length; idx += 1) {
      const nativeTrack = nativeTracks[idx];
      const isTarget =
        String(nativeTrack.id) === String(audioTrack.playerId ?? audioTrack.id) ||
        String(nativeTrack.language || "").toLowerCase() ===
          String(audioTrack.lang || "").toLowerCase() ||
        String(nativeTrack.label || nativeTrack.name || "") ===
          String(audioTrack.name || audioTrack.text || "");

      nativeTrack.enabled = isTarget;
      switched = switched || isTarget;
    }

    return switched;
  };

  const switchHlsAudioTrack = (audioTrack) => {
    const hls = findInternalHls(playerRef.current);
    const targetId = audioTrack.playerId ?? audioTrack.id;

    if (!hls?.audioTracks?.length) return false;

    const targetIndex = hls.audioTracks.findIndex(
      (track, idx) =>
        idx === targetId ||
        String(idx) === String(targetId) ||
        String(track.id) === String(targetId) ||
        String(track.lang || "").toLowerCase() ===
          String(audioTrack.lang || "").toLowerCase() ||
        String(track.name || "") === String(audioTrack.name || audioTrack.text || ""),
    );

    if (targetIndex < 0) return false;

    hls.audioTrack = targetIndex;
    return true;
  };

  const getVideoElement = () =>
    playerRef.current?.video ||
    playerRef.current?.media ||
    playerRef.current?.root?.querySelector?.("video") ||
    containerRef.current?.querySelector("video");

  const cleanupAudioBoost = () => {
    const audioBoost = audioBoostRef.current;

    if (audioBoost.videoElement && audioBoost.resumeHandler) {
      audioBoost.videoElement.removeEventListener("play", audioBoost.resumeHandler);
    }

    audioBoost.sourceNode?.disconnect?.();
    audioBoost.gainNode?.disconnect?.();
    audioBoost.audioContext?.close?.()?.catch?.(() => {});

    audioBoostRef.current = {
      audioContext: null,
      sourceNode: null,
      gainNode: null,
      videoElement: null,
      resumeHandler: null,
    };
  };

  const applyAudioBoost = () => {
    if (typeof window === "undefined") return false;

    const videoElement = getVideoElement();
    if (!videoElement) return false;

    videoElement.volume = 1;

    if (audioBoostRef.current.videoElement === videoElement) {
      audioBoostRef.current.gainNode.gain.value = PLAYER_AUDIO_GAIN;
      return true;
    }

    cleanupAudioBoost();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;

    try {
      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaElementSource(videoElement);
      const gainNode = audioContext.createGain();
      const resumeHandler = () => {
        audioContext.resume?.()?.catch?.(() => {});
      };

      gainNode.gain.value = PLAYER_AUDIO_GAIN;
      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      videoElement.addEventListener("play", resumeHandler);
      resumeHandler();

      audioBoostRef.current = {
        audioContext,
        sourceNode,
        gainNode,
        videoElement,
        resumeHandler,
      };

      return true;
    } catch (error) {
      console.warn("Unable to apply 30% audio boost to VePlayer video element:", error);
      cleanupAudioBoost();
      return false;
    }
  };

  const recoverAppleNativeAudioSwitch = (video, state) => {
    if (!video || !state) return;

    const resumePlayback = () => {
      try {
        if (Number.isFinite(state.currentTime)) {
          video.currentTime = Math.max(0, state.currentTime);
        }
      } catch {}

      if (!state.wasPaused) {
        video.play?.().catch?.(() => {});
      }
    };

    window.setTimeout(resumePlayback, 120);

    window.setTimeout(() => {
      const isLikelyStalled =
        video.readyState < 2 ||
        (!state.wasPaused && video.paused) ||
        (Number.isFinite(state.currentTime) &&
          Math.abs(video.currentTime - state.currentTime) > 3);

      if (!isLikelyStalled) return;

      try {
        video.load?.();
      } catch {}

      window.setTimeout(resumePlayback, 180);
    }, 900);
  };

  const applyAudioTrack = (audioTrack) => {
    const player = playerRef.current;

    if (!player || !audioTrack) return false;

    const isAppleMobile = isAppleMobileWebKit();
    const useAppleNativeRecovery =
      isAppleMobile && getAppleMobileOsMajorVersion() >= 26;
    const video = useAppleNativeRecovery ? getVideoElement() : null;
    const appleSwitchState = video
      ? {
          wasPaused: video.paused,
          currentTime: video.currentTime,
        }
      : null;

    if (video && !appleSwitchState.wasPaused) {
      video.pause?.();
    }

    const currentTracks = getPlayerAudioTracks();
    const targetTrack =
      currentTracks.find(
        (track) => String(track.id) === String(audioTrack.playerId ?? audioTrack.id),
      ) ||
      currentTracks.find(
        (track) =>
          audioTrack.lang &&
          String(track.lang || "").toLowerCase() ===
            String(audioTrack.lang).toLowerCase(),
      ) ||
      currentTracks.find(
        (track) =>
          String(track.name || "") === String(audioTrack.name || audioTrack.text || ""),
      ) ||
      audioTrack;
    const targetId = targetTrack.id ?? audioTrack.playerId ?? audioTrack.id;
    const switchPayload = {
      ...targetTrack,
      id: targetId,
      lang: targetTrack.lang || audioTrack.lang,
      name: targetTrack.name || audioTrack.name || audioTrack.text,
    };
    const hasPlayerTrackMatch = currentTracks.some(
      (track) =>
        String(track.id) === String(switchPayload.id) ||
        String(track.id) === String(switchPayload.playerId) ||
        (switchPayload.lang &&
          String(track.lang || "").toLowerCase() ===
            String(switchPayload.lang).toLowerCase()) ||
        String(track.name || "") === String(switchPayload.name || ""),
    );
    const nativeSwitched = switchNativeAudioTrack(switchPayload);
    const hlsSwitched = nativeSwitched
      ? false
      : switchHlsAudioTrack(switchPayload);

    if (!nativeSwitched && !hlsSwitched && !isAppleMobile) {
      player.switchAudioTrack?.(switchPayload);
    }

    if (useAppleNativeRecovery && (nativeSwitched || hlsSwitched)) {
      recoverAppleNativeAudioSwitch(video, appleSwitchState);
    }

    window.setTimeout(() => emitAudioTracks(), 800);
    return nativeSwitched || hlsSwitched || (!isAppleMobile && hasPlayerTrackMatch);
  };

  const handlePlayerClick = (event) => {
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest(interactivePlayerSelector)
    ) {
      return;
    }

    const player = playerRef.current?.player || playerRef.current;
    const video = containerRef.current?.querySelector("video");
    const isPaused =
      typeof player?.paused === "boolean"
        ? player.paused
        : typeof video?.paused === "boolean"
          ? video.paused
          : false;

    if (isPaused) return;

    if (typeof player?.pause === "function") {
      player.pause();
      onPausedChangeRef.current?.(true);
      return;
    }

    video?.pause?.();
    onPausedChangeRef.current?.(true);
  };

  useImperativeHandle(ref, () => ({
    switchSubtitle(subtitle) {
      applySubtitle(subtitle);
    },
    switchAudioTrack(audioTrack) {
      applyAudioTrack(audioTrack);
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !vid || !playback?.url) {
      return;
    }

    let cancelled = false;
    let restoreConsoleError = null;
    let removeDevErrorListeners = null;
    let removeVideoPlaybackListeners = null;
    let videoListenerTimer = null;

    if (process.env.NODE_ENV === "development") {
      const originalConsoleError = console.error;

      const patchedConsoleError = (...args) => {
        if (isKnownVePlayerDevWarningArgs(args)) return;

        originalConsoleError(...args);
      };

      console.error = patchedConsoleError;

      restoreConsoleError = () => {
        if (console.error !== patchedConsoleError) return;
        console.error = originalConsoleError;
      };

      const handleError = (event) => {
        if (
          isKnownVePlayerDevWarning(event.message) ||
          isKnownVePlayerDevWarning(event.error)
        ) {
          event.preventDefault();
        }
      };
      const handleUnhandledRejection = (event) => {
        if (isKnownVePlayerDevWarning(event.reason)) {
          event.preventDefault();
        }
      };

      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
      removeDevErrorListeners = () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection,
        );
      };
    }

    async function initPlayer() {
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        containerRef.current.innerHTML = "";

        const VePlayerModule = await loadVePlayerModule();
        const VePlayer = VePlayerModule.default || VePlayerModule;
        const playerId = `veplayer-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;

        containerRef.current.id = playerId;

        if (
          BYTEPLUS_LICENSE &&
          typeof VePlayer.setLicenseConfig === "function"
        ) {
          await VePlayer.setLicenseConfig({ license: BYTEPLUS_LICENSE });
        }

        if (cancelled) return;

        const parsedLineAppId = Number(lineAppId);
        const vodLogOpts =
          Number.isFinite(parsedLineAppId) && parsedLineAppId > 0
            ? {
                line_app_id: parsedLineAppId,
                line_user_id: lineUserId || `web-${Date.now()}`,
              }
            : undefined;
        const normalizedSubtitles = Array.isArray(subtitles)
          ? subtitles
              .filter(
                (sub) =>
                  sub &&
                  typeof (sub.url || sub.src) === "string" &&
                  (sub.url || sub.src).trim().length > 0,
              )
              .map(normalizeSubtitle)
          : [];
        const selectedSubtitle =
          activeSubtitle === null
            ? null
            : activeSubtitle
              ? normalizedSubtitles.find((subtitle) =>
                  subtitlesMatch(subtitle, activeSubtitle),
                ) || activeSubtitle
              : null;
        const playerSubtitles =
          selectedSubtitle === null || activeSubtitle === undefined
            ? normalizedSubtitles
            : normalizedSubtitles.map((subtitle) => ({
                ...subtitle,
                default: subtitlesMatch(subtitle, selectedSubtitle),
                isDefault: subtitlesMatch(subtitle, selectedSubtitle),
              }));

        const playerConfig = {
          id: playerId,
          root: containerRef.current,
          url: playback.url,
          streamType: playback.streamType || "hls",
          codec: playback.codec || "h264",
          lang: "en",
          width: "100%",
          height: "100%",
          license: BYTEPLUS_LICENSE || undefined,
          ...(vodLogOpts ? { vodLogOpts } : {}),
          autoplay: true,
          enableMenu: true,
          controls: true,
          ...(playback.enableHlsMSE && !isAppleMobileWebKit()
            ? { enableHlsMSE: true }
            : {}),
          controlBar: {
            visible: true,
          },
          ignores: ["audioTrack", "AudioTrack", "audio", "definition"],
        };

        if (playerSubtitles.length > 0 && VePlayer.Subtitle) {
          playerConfig.plugins = [VePlayer.Subtitle];
          playerConfig.Subtitle = {
            isDefaultOpen: activeSubtitle !== null,
            list: playerSubtitles,
            style: {
              offsetBottom: SUBTITLE_OFFSET_BOTTOM_PERCENT,
            },
          };
        }

        playerRef.current = new VePlayer(playerConfig);
        subtitlePluginRef.current = null;
        onPausedChangeRef.current?.(false);

        const retryAudioBoost = (attempt = 0) => {
          if (cancelled) return;
          if (applyAudioBoost()) return;

          if (attempt < 20) {
            window.setTimeout(() => retryAudioBoost(attempt + 1), 150);
          }
        };

        retryAudioBoost();

        if (ENABLE_AUDIO_TRACK_SWITCHING) {
          const audioTracksUpdatedEvent = VePlayer.Events?.AUDIO_TRACKS_UPDATED;
          const audioTrackChangeEvent = VePlayer.Events?.AUDIO_TRACK_CHANGE;

          if (audioTracksUpdatedEvent) {
            playerRef.current.on?.(
              audioTracksUpdatedEvent,
              ({ audioTracks } = {}) => {
                emitAudioTracks(audioTracks || getPlayerAudioTracks());
              },
            );
          }

          if (audioTrackChangeEvent) {
            playerRef.current.on?.(audioTrackChangeEvent, () => {
              emitAudioTracks();
            });
          }
        }

        let videoLookupAttempts = 0;
        const attachVideoPlaybackListeners = () => {
          const video = containerRef.current?.querySelector("video");

          if (!video) {
            videoLookupAttempts += 1;
            if (videoLookupAttempts > 50) {
              clearInterval(videoListenerTimer);
              videoListenerTimer = null;
            }
            return;
          }

          clearInterval(videoListenerTimer);
          videoListenerTimer = null;

          const handlePause = () => onPausedChangeRef.current?.(true);
          const handlePlay = () => onPausedChangeRef.current?.(false);
          const handleEnded = () => onEndedRef.current?.();

          video.addEventListener("pause", handlePause);
          video.addEventListener("play", handlePlay);
          video.addEventListener("ended", handleEnded);
          onPausedChangeRef.current?.(video.paused);

          removeVideoPlaybackListeners = () => {
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("ended", handleEnded);
          };
        };

        videoListenerTimer = window.setInterval(
          attachVideoPlaybackListeners,
          100,
        );
        attachVideoPlaybackListeners();

        const retrySubtitleSwitch = (attempt = 0) => {
          const subtitleToApply =
            pendingSubtitleRef.current !== undefined
              ? pendingSubtitleRef.current
              : activeSubtitle;

          if (subtitleToApply !== undefined && applySubtitle(subtitleToApply)) {
            pendingSubtitleRef.current = undefined;
            return;
          }

          if (!cancelled && subtitleToApply !== undefined && attempt < 20) {
            window.setTimeout(() => retrySubtitleSwitch(attempt + 1), 150);
          }
        };

        window.setTimeout(retrySubtitleSwitch, 0);

        if (ENABLE_AUDIO_TRACK_SWITCHING) {
          const retryAudioTracks = (attempt = 0) => {
            if (cancelled) return;

            const audioTracks = getPlayerAudioTracks();
            emitAudioTracks(audioTracks);

            if (audioTracks.length === 0 && attempt < 20) {
              window.setTimeout(() => retryAudioTracks(attempt + 1), 250);
            }
          };

          retryAudioTracks();
        }
      } catch (error) {
        console.error("Failed to initialize BytePlus player:", error);
      }
    }

    initPlayer();

    return () => {
      cancelled = true;

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      if (videoListenerTimer) {
        clearInterval(videoListenerTimer);
      }

      removeVideoPlaybackListeners?.();
      cleanupAudioBoost();
      subtitlePluginRef.current = null;
      removeDevErrorListeners?.();
      restoreConsoleError?.();
    };
  }, [
    vid,
    playback,
    lineAppId,
    lineUserId,
    subtitles,
  ]);

  return (
    <div
      ref={containerRef}
      onClick={handlePlayerClick}
      className="w-full h-full bg-black veplayer-raised-subtitle"
    />
  );
});

export default function WatchPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const labels = { ...getLabels(language), ...getWatchOverlayLabels(language) };
  const seriesId = params?.id || searchParams.get("id");
  const playerControlRef = useRef(null);
  const subtitlePreferenceRef = useRef("");
  const audioTrackPreferenceRef = useRef("");

  const [episode, setEpisode] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [playback, setPlayback] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEpisodeLoading, setIsEpisodeLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState("");
  const [activeSubtitle, setActiveSubtitle] = useState(undefined);
  const [audioTracks, setAudioTracks] = useState([]);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState("");
  const [isSubtitleMenuOpen, setIsSubtitleMenuOpen] = useState(false);
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = useState(false);
  const [activeEpisodeRangeStart, setActiveEpisodeRangeStart] = useState(1);
  const [vipLockedEpisode, setVipLockedEpisode] = useState(null);
  const [playbackAlert, setPlaybackAlert] = useState(null);
  const [currentSeries, setCurrentSeries] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteSaving, setIsFavoriteSaving] = useState(false);
  const [privacyOverlayVisible, setPrivacyOverlayVisible] = useState(false);
  const [hasActiveVip, setHasActiveVip] = useState(false);

  useEffect(() => {
    loadVePlayerModule().catch(() => {});
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return undefined;

    const originalConsoleError = console.error;
    const patchedConsoleError = (...args) => {
      if (isKnownVePlayerDevWarningArgs(args)) return;

      originalConsoleError(...args);
    };

    console.error = patchedConsoleError;

    return () => {
      if (console.error === patchedConsoleError) {
        console.error = originalConsoleError;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshVipStatus = () => {
      loadCustomerVipSubscription()
        .then((payload) => {
          if (!cancelled) {
            setHasActiveVip(isVipSubscriptionActive(payload.subscription));
          }
        })
        .catch(() => {
          if (!cancelled) setHasActiveVip(false);
        });
    };

    refreshVipStatus();
    window.addEventListener("storage", refreshVipStatus);
    window.addEventListener("minchap:tiktok-user-updated", refreshVipStatus);
    window.addEventListener(CUSTOMER_VIP_UPDATED_EVENT, refreshVipStatus);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", refreshVipStatus);
      window.removeEventListener("minchap:tiktok-user-updated", refreshVipStatus);
      window.removeEventListener(CUSTOMER_VIP_UPDATED_EVENT, refreshVipStatus);
    };
  }, []);

  useEffect(() => {
    const restoreProtectedSurface = enableProtectedPlaybackSurface();

    const protectInactiveSurface = () => {
      if (document.visibilityState === "hidden") {
        setPrivacyOverlayVisible(true);
        playerControlRef.current?.pause?.();
      } else {
        setPrivacyOverlayVisible(false);
      }
    };

    const handleBlur = () => {
      setPrivacyOverlayVisible(true);
      playerControlRef.current?.pause?.();
    };

    const handleFocus = () => {
      setPrivacyOverlayVisible(false);
    };

    document.addEventListener("visibilitychange", protectInactiveSurface);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      restoreProtectedSurface();
      document.removeEventListener("visibilitychange", protectInactiveSurface);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const subtitleOptions = Array.isArray(subtitles)
    ? subtitles
        .filter(
          (sub) =>
            sub &&
            typeof (sub.url || sub.src) === "string" &&
            (sub.url || sub.src).trim().length > 0,
        )
        .map(normalizeSubtitle)
    : [];
  const orderedSubtitleOptions = getOrderedSubtitleOptions(subtitleOptions);

  const subtitleMenuOptions = [
    ...orderedSubtitleOptions.map((subtitle) => ({
      id: subtitle.id,
      label: getOrderedSubtitleDisplayName(subtitle, language),
      subtitle,
    })),
    {
      id: "off",
      label: labels.subtitlesOff,
      subtitle: null,
    },
  ];
  const audioTrackOptions = getOrderedAudioTrackOptions(audioTracks);

  const handleSubtitleSelect = (option) => {
    playerControlRef.current?.switchSubtitle(option.subtitle);
    setSelectedSubtitleId(option.id);
    setActiveSubtitle(option.subtitle);
    subtitlePreferenceRef.current = getSubtitlePreference(option.subtitle);
  };

  const handleAudioTrackSelect = (track) => {
    if (!track) return;

    setActiveAudioTrackId(track.id);
    audioTrackPreferenceRef.current = getAudioTrackPreference(track);
    playerControlRef.current?.switchAudioTrack(track);
  };

  const handleAudioTracksChange = useCallback((playerAudioTracks) => {
    const normalizedAudioTracks = Array.isArray(playerAudioTracks)
      ? playerAudioTracks.map(normalizeAudioTrack)
      : [];

    if (normalizedAudioTracks.length === 0) {
      return;
    }

    const playerSelectedAudioTrack =
      normalizedAudioTracks.find((track) => track.selected) ||
      normalizedAudioTracks.find((track) => track.default) ||
      normalizedAudioTracks[0] ||
      null;
    const preferredAudioTrack =
      findAudioTrackByPreference(
        normalizedAudioTracks,
        audioTrackPreferenceRef.current,
      ) || null;
    const activeAudioTrack = preferredAudioTrack || playerSelectedAudioTrack;

    setAudioTracks(normalizedAudioTracks);
    setActiveAudioTrackId(activeAudioTrack?.id || "");

    if (
      preferredAudioTrack &&
      preferredAudioTrack.id !== playerSelectedAudioTrack?.id
    ) {
      window.setTimeout(() => {
        playerControlRef.current?.switchAudioTrack(preferredAudioTrack);
      }, 0);
    }
  }, []);

  const handleFavoriteToggle = async () => {
    if (!currentSeries?.id || isFavoriteSaving) return;

    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setIsFavoriteSaving(true);

    try {
      await setSeriesFavorite(currentSeries, nextFavorite);
    } catch (err) {
      console.error("Failed to update favorite series:", err);
      setIsFavorite(!nextFavorite);
    } finally {
      setIsFavoriteSaving(false);
    }
  };

  const applyFetchedSubtitles = useCallback(
    (fetchedSubtitles) => {
      const normalizedSubtitles = fetchedSubtitles
        .filter(
          (sub) =>
            sub &&
            typeof (sub.url || sub.src) === "string" &&
            (sub.url || sub.src).trim().length > 0,
        )
        .map(normalizeSubtitle);
      const orderedSubtitles = getOrderedSubtitleOptions(normalizedSubtitles);
      const defaultSubtitle =
        orderedSubtitles.find((subtitle) => subtitle.default) ||
        orderedSubtitles[0] ||
        null;
      const preferredSubtitle =
        subtitlePreferenceRef.current === ""
          ? defaultSubtitle
          : findSubtitleByPreference(
              normalizedSubtitles,
              subtitlePreferenceRef.current,
            );
      const subtitleToUse =
        subtitlePreferenceRef.current === "off" ? null : preferredSubtitle;

      setSubtitles(fetchedSubtitles);
      setActiveSubtitle(subtitleToUse);
      setSelectedSubtitleId(subtitleToUse?.id || "off");
    },
    [setSubtitles, setSelectedSubtitleId, setActiveSubtitle],
  );

  const loadEpisodeVideo = useCallback(
    async (targetEpisode) => {
      const vid = targetEpisode?.video_url?.trim();

      setEpisode(targetEpisode);
      setError("");
      setPlayback(null);
      setSubtitles([]);
      setAudioTracks([]);
      setSelectedSubtitleId("");
      setActiveSubtitle(undefined);
      setActiveAudioTrackId("");
      setVipLockedEpisode(null);
      setPlaybackAlert(null);

      if (!vid) {
        setError(labels.missing);
        return false;
      }

      const playAuthPath = `/api/vod/playauth?vid=${encodeURIComponent(vid)}`;
      const playAuthUrls = [getApiUrl(playAuthPath)];
      let playAuthResponse = null;
      let playAuthData = null;

      for (const playAuthUrl of playAuthUrls) {
        try {
          const response = await fetch(playAuthUrl);
          const payload = await response.json().catch(() => ({}));

          playAuthResponse = response;
          playAuthData = payload;

          if (response.ok && payload?.preferredPlaybackSource) {
            break;
          }
        } catch (fetchError) {
          playAuthResponse = null;
          playAuthData = {
            error: fetchError?.message || labels.tokenError,
          };
        }
      }

      if (!playAuthData) {
        playAuthData = { error: labels.tokenError };
      }

      const hlsPlaybackUrl =
        playAuthData.directPlaybackSource ||
        playAuthData.preferredPlaybackSource ||
        "";

      if (!playAuthResponse?.ok || !hlsPlaybackUrl) {
        const isHlsMissing =
          playAuthData.code === "HLS_PLAYBACK_NOT_FOUND";
        const message = isHlsMissing
          ? labels.hlsMissing
          : playAuthData.error || labels.tokenError;

        setError(message);
        if (isHlsMissing) {
          setPlaybackAlert({
            title: labels.hlsMissingTitle,
            message,
          });
        }
        return false;
      }

      setPlayback({
        url: hlsPlaybackUrl,
        streamType: playAuthData.preferredPlaybackStreamType || "hls",
        codec: "h264",
        enableHlsMSE: ENABLE_AUDIO_TRACK_SWITCHING,
      });

      if (ENABLE_AUDIO_TRACK_SWITCHING) {
        loadHlsAudioTracks([
          playAuthData.directPlaybackSource,
          playAuthData.preferredPlaybackSource,
        ]).then((manifestAudioTracks) => {
          if (manifestAudioTracks.length === 0) return;

          const preferredAudioTrack =
            findAudioTrackByPreference(
              manifestAudioTracks,
              audioTrackPreferenceRef.current,
            ) || null;
          const activeAudioTrack =
            preferredAudioTrack ||
            manifestAudioTracks.find((track) => track.selected) ||
            manifestAudioTracks.find((track) => track.default) ||
            manifestAudioTracks[0];

          setAudioTracks(manifestAudioTracks);
          setActiveAudioTrackId(activeAudioTrack?.id || "");

          if (preferredAudioTrack) {
            window.setTimeout(() => {
              playerControlRef.current?.switchAudioTrack(preferredAudioTrack);
            }, 300);
          }
        }).catch(() => {});
      }
      applyFetchedSubtitles(
        Array.isArray(playAuthData.subtitles) ? playAuthData.subtitles : [],
      );
      recordEpisodeView(targetEpisode);
      return true;
    },
    [
      applyFetchedSubtitles,
      labels.hlsMissing,
      labels.hlsMissingTitle,
      labels.missing,
      labels.tokenError,
    ],
  );

  const handleEpisodeSelect = async (targetEpisode) => {
    if (!targetEpisode || isEpisodeLoading) {
      return;
    }

    if (targetEpisode.is_free === false && !hasActiveVip) {
      setVipLockedEpisode(targetEpisode);
      setIsEpisodeMenuOpen(false);
      setIsSubtitleMenuOpen(false);
      setIsVideoPaused(true);
      return;
    }

    setIsEpisodeLoading(true);
    setIsEpisodeMenuOpen(false);
    setIsSubtitleMenuOpen(false);
    setIsVideoPaused(false);
    setVipLockedEpisode(null);

    try {
      await loadEpisodeVideo(targetEpisode);
    } catch (err) {
      console.error("Failed to load selected episode:", err);
      setError(labels.tokenError);
    } finally {
      setIsEpisodeLoading(false);
    }
  };

  useEffect(() => {
    if (!hasActiveVip || !vipLockedEpisode) return;

    let cancelled = false;

    async function unlockCurrentVipEpisode() {
      setIsEpisodeLoading(true);
      try {
        await loadEpisodeVideo(vipLockedEpisode);
        if (!cancelled) {
          setVipLockedEpisode(null);
          setIsVideoPaused(false);
        }
      } catch (err) {
        console.error("Failed to unlock VIP episode:", err);
        if (!cancelled) setError(labels.tokenError);
      } finally {
        if (!cancelled) setIsEpisodeLoading(false);
      }
    }

    unlockCurrentVipEpisode();

    return () => {
      cancelled = true;
    };
  }, [hasActiveVip, labels.tokenError, loadEpisodeVideo, vipLockedEpisode]);

  useEffect(() => {
    if (!isVideoPaused) {
      setIsSubtitleMenuOpen(false);
      setIsEpisodeMenuOpen(false);
    }
  }, [isVideoPaused]);

  const handleVideoEnded = useCallback(async () => {
    if (!episode || isEpisodeLoading) return;

    const currentEpisodeIndex = episodes.findIndex(
      (item) => item?.id === episode.id,
    );
    const nextEpisode =
      currentEpisodeIndex >= 0 ? episodes[currentEpisodeIndex + 1] : null;

    if (!nextEpisode) return;

    setIsEpisodeMenuOpen(false);
    setIsSubtitleMenuOpen(false);

    if (nextEpisode.is_free === false && !hasActiveVip) {
      setVipLockedEpisode(nextEpisode);
      setIsVideoPaused(true);
      return;
    }

    setIsEpisodeLoading(true);
    setIsVideoPaused(false);

    try {
      await loadEpisodeVideo(nextEpisode);
    } catch (err) {
      console.error("Failed to autoplay next episode:", err);
      setError(labels.tokenError);
    } finally {
      setIsEpisodeLoading(false);
    }
  }, [
    episode,
    episodes,
    isEpisodeLoading,
    hasActiveVip,
    labels.tokenError,
    loadEpisodeVideo,
  ]);

  const episodeRangeStarts = Array.from(
    { length: Math.max(1, Math.ceil(episodes.length / 25)) },
    (_, index) => index * 25 + 1,
  );
  const activeEpisodeRangeIndex = Math.max(
    0,
    episodeRangeStarts.indexOf(activeEpisodeRangeStart),
  );
  const visibleEpisodes = episodes.slice(
    activeEpisodeRangeIndex * 25,
    activeEpisodeRangeIndex * 25 + 25,
  );
  const paddedVisibleEpisodes = [
    ...visibleEpisodes,
    ...Array.from({ length: Math.max(0, 25 - visibleEpisodes.length) }),
  ];

  useEffect(() => {
    if (!seriesId) return;

    async function fetchPlayerData() {
      setLoading(true);
      setError("");
      setPlaybackAlert(null);
      setIsVideoPaused(false);
      setIsSubtitleMenuOpen(false);
      setIsEpisodeMenuOpen(false);
      setSelectedSubtitleId("");
      setActiveSubtitle(undefined);
      setAudioTracks([]);
      setActiveAudioTrackId("");
      setEpisodes([]);
      setSeriesTitle("");
      setCurrentSeries(null);
      setIsFavorite(false);
      setActiveEpisodeRangeStart(1);
      setVipLockedEpisode(null);

      try {
        const [episodeResponse, seriesResponse, vipStatusPayload] = await Promise.all([
          fetch(
            supabaseRestUrl(
              `episode?select=id,series_id,episode_no,video_url,is_free&series_id=eq.${encodeURIComponent(seriesId)}&order=episode_no.asc`,
            ),
            { headers },
          ),
          fetch(
            supabaseRestUrl(
              `series?select=id,title_th,title_en,title_jp,title_cn,poster_url&id=eq.${encodeURIComponent(seriesId)}&limit=1`,
            ),
            { headers },
          ),
          loadCustomerVipSubscription().catch(() => ({
            is_active: false,
            subscription: null,
          })),
        ]);
        const episodeData = await episodeResponse.json();
        const seriesData = await seriesResponse.json();
        const firstEpisode = episodeData?.[0] || null;
        const latestHasActiveVip = isVipSubscriptionActive(
          vipStatusPayload?.subscription,
        );

        setHasActiveVip(latestHasActiveVip);
        setEpisodes(Array.isArray(episodeData) ? episodeData : []);
        const fetchedSeries = seriesData?.[0] || null;
        setCurrentSeries(fetchedSeries);
        setSeriesTitle(getSeriesTitle(fetchedSeries, language));
        setIsFavorite(isSeriesFavorite(fetchedSeries?.id));
        saveRecentSeries(fetchedSeries);
        loadFavoriteSeriesStatus(fetchedSeries?.id).then((favoriteStatus) => {
          setIsFavorite(favoriteStatus);
        });
        if (firstEpisode?.is_free === false && !latestHasActiveVip) {
          setEpisode(firstEpisode);
          setVipLockedEpisode(firstEpisode);
          setIsVideoPaused(true);
        } else {
          await loadEpisodeVideo(firstEpisode);
        }
      } catch (err) {
        console.error("Failed to load player data:", err);
        setError(labels.tokenError);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerData();
  }, [seriesId, language, labels.tokenError, loadEpisodeVideo]);

  const showPlayer =
    episode?.video_url && playback?.url && !error;

  return (
    <div
      className="fixed inset-0 z-[100] flex select-none bg-black text-white"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {privacyOverlayVisible ? (
        <div className="pointer-events-none absolute inset-0 z-[95] flex items-center justify-center bg-black text-center text-white">
          <div className="rounded-2xl border border-white/12 bg-white/8 px-6 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.46)] backdrop-blur-md">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" />
                <path d="m9 12 2 2 4-5" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold">Protected playback</p>
            <p className="mt-1 text-[12px] text-white/62">Video is hidden while the app is inactive.</p>
          </div>
        </div>
      ) : null}

      {showPlayer && isVideoPaused && !vipLockedEpisode ? (
        <div className="absolute bottom-[72px] right-4 z-20 flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={handleFavoriteToggle}
            disabled={!currentSeries?.id || isFavoriteSaving}
            aria-label={labels.favorite}
            aria-pressed={isFavorite}
            className={`flex h-9 w-9 items-center justify-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] active:scale-95 ${
              isFavorite ? "text-[#FF2D55]" : "text-white"
            } ${isFavoriteSaving ? "opacity-70" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 0 1 7.1-7.1l.4.4.4-.4a5 5 0 0 1 7.1 7.1Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEpisodeMenuOpen(true);
              setIsSubtitleMenuOpen(false);
            }}
            aria-label={labels.list}
            className="flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 6h12" />
              <path d="M8 12h12" />
              <path d="M8 18h12" />
              <path d="m3 8 3-2-3-2v4Z" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSubtitleMenuOpen(true);
              setIsEpisodeMenuOpen(false);
            }}
            aria-label={labels.settings}
            className="flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
              <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2.1 2.1 0 0 1-3 3l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2a2.1 2.1 0 0 1-4.2 0v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1a2.1 2.1 0 0 1-3-3l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.7-1.1H2a2.1 2.1 0 0 1 0-4.2h.2a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1a2.1 2.1 0 0 1 3-3l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1.1-1.7V2a2.1 2.1 0 0 1 4.2 0v.2a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1a2.1 2.1 0 0 1 3 3l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2a2.1 2.1 0 0 1 0 4.2h-.2A1.8 1.8 0 0 0 19.4 15Z" />
            </svg>
          </button>
        </div>
      ) : null}

      {showPlayer && isVideoPaused && isEpisodeMenuOpen && !vipLockedEpisode ? (
        <div className="absolute inset-0 z-30 flex items-end">
          <button
            type="button"
            aria-label={labels.back}
            onClick={() => setIsEpisodeMenuOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div className="relative w-full bg-[#2B2B3A] px-3.5 pb-4 pt-3.5 text-white shadow-[0_-10px_28px_rgba(0,0,0,0.36)]">
            <h2 className="mb-3 truncate text-[16px] font-medium leading-5 tracking-normal text-white">
              {seriesTitle || labels.list}
            </h2>

            <div className="mb-3 grid grid-cols-5 gap-2">
              {episodeRangeStarts.map((rangeStart) => {
                const rangeEnd = rangeStart + 24;
                const isActive = activeEpisodeRangeStart === rangeStart;

                return (
                  <button
                    type="button"
                    key={rangeStart}
                    onClick={() => setActiveEpisodeRangeStart(rangeStart)}
                    className={`h-6 border-b-2 px-1 text-center text-[10px] font-medium leading-none transition ${
                      isActive
                        ? "border-white text-white"
                        : "border-transparent text-white/75"
                    }`}
                  >
                    {rangeStart}-{rangeEnd}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-5 grid-rows-5 gap-2">
              {paddedVisibleEpisodes.map((item, index) => {
                const cellKey =
                  item?.id || `empty-${activeEpisodeRangeStart}-${index}`;
                const isCurrent = item && episode?.id === item.id;
                const isLocked = item?.is_free === false && !hasActiveVip;

                if (!item) {
                  return (
                    <div
                      key={cellKey}
                      aria-hidden="true"
                      className="h-[38px] rounded border border-transparent"
                    />
                  );
                }

                return (
                  <button
                    type="button"
                    key={cellKey}
                    onClick={() => handleEpisodeSelect(item)}
                    disabled={isEpisodeLoading}
                    aria-label={`Episode ${item.episode_no}${
                      isLocked ? " locked" : ""
                    }`}
                    className={`relative flex h-[38px] items-center justify-center rounded border text-[12px] font-medium leading-none transition ${
                      isCurrent
                        ? "border-[#7C4DFF] bg-[#7C4DFF] text-white shadow-[0_0_14px_rgba(124,77,255,0.28)]"
                        : "border-white/45 bg-transparent text-white/90"
                    } ${
                      isLocked
                        ? "text-white/80 active:scale-95"
                        : "active:scale-95"
                    }`}
                  >
                    {isCurrent ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7-11-7Z" />
                      </svg>
                    ) : (
                      item.episode_no
                    )}

                    {isLocked ? (
                      <span className="absolute right-1 top-0.5 text-[#F59E0B]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="7"
                          height="7"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="5" y="10" width="14" height="11" rx="2" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {showPlayer &&
      isVideoPaused &&
      isSubtitleMenuOpen &&
      !vipLockedEpisode ? (
        <div className="absolute inset-0 z-30 flex items-end">
          <button
            type="button"
            aria-label={labels.back}
            onClick={() => setIsSubtitleMenuOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div className="relative w-full bg-[#2b2b3d] px-4 pb-6 pt-5 text-white">
            {audioTrackOptions.length > 0 ? (
              <>
                <h2 className="mb-3 px-3 text-[20px] font-medium leading-none">
                  {labels.audioDubs}
                </h2>
                <div className="mb-5 overflow-hidden rounded-lg bg-[#1d1d29]">
                  {audioTrackOptions.map((track, index) => {
                    const isSelected = activeAudioTrackId === track.id;

                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={() => handleAudioTrackSelect(track)}
                        className={`flex h-10 w-full items-center justify-between px-3 text-left text-[16px] ${
                          index > 0 ? "border-t border-white/15" : ""
                        }`}
                      >
                        <span>{getAudioTrackDisplayName(track, language)}</span>
                        {isSelected ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m20 6-11 11-5-5" />
                          </svg>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            <h2 className="mb-3 px-3 text-[20px] font-medium leading-none">
              {labels.subtitles}
            </h2>
            <div className="overflow-hidden rounded-lg bg-[#1d1d29]">
              {subtitleMenuOptions.map((option, index) => {
                const isSelected = selectedSubtitleId === option.id;

                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => handleSubtitleSelect(option)}
                    className={`flex h-10 w-full items-center justify-between px-3 text-left text-[16px] ${
                      index > 0 ? "border-t border-white/15" : ""
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {vipLockedEpisode ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/62 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-[310px] overflow-hidden rounded-2xl border border-[#C15CFF] bg-[#12051F] px-5 pb-5 pt-5 text-white shadow-[0_0_30px_rgba(193,92,255,0.3)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(138,43,226,0.34),transparent_36%),radial-gradient(circle_at_88%_18%,rgba(193,92,255,0.2),transparent_24%)]" />
            <div className="relative flex flex-col items-center text-center">
              <h2 className="text-[23px] font-semibold leading-none tracking-normal">
                MinChap <span className="text-[#B85CFF]">VIP</span>
              </h2>
              <img
                src="/popcorn.svg"
                alt=""
                aria-hidden="true"
                className="mt-2.5 h-[58px] w-[58px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.42)]"
              />
              <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-[#B85CFF]/70 bg-[#6F2CB8]/35 px-3 py-1 text-[12px] font-medium text-[#E5C6FF]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                ตอนที่ {vipLockedEpisode.episode_no} • VIP เท่านั้น
              </div>

              <div className="mt-4 text-[27px] font-bold leading-none">
                ดูต่อด้วย <span className="text-[#B85CFF]">VIP</span>
              </div>
              <p className="mt-1.5 text-[15px] font-medium leading-5 text-[#D3B8F5]">
                คุณดูฟรีครบ 10 ตอนแล้ว
              </p>

              <div className="mt-5 grid w-full gap-2.5 text-left text-[14px] text-white/92">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#B85CFF] text-[#B85CFF]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7-11-7Z" />
                    </svg>
                  </span>
                  ดูต่อได้ทันที
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#B85CFF] text-[11px] font-bold text-[#B85CFF]">
                    AD
                  </span>
                  ไม่มีโฆษณา
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center text-[#B85CFF]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="m3 9 18-4" />
                      <path d="m7 5 2 4" />
                      <path d="m13 5 2 4" />
                    </svg>
                  </span>
                  ดูครบทุกตอน
                </div>
              </div>

              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVipLockedEpisode(null)}
                  className="h-[48px] rounded-xl border border-white/28 bg-black/18 text-[14px] font-medium text-white/90 active:scale-95"
                >
                  ไว้ทีหลัง
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/vip")}
                  className="h-[48px] rounded-xl bg-gradient-to-br from-[#B653FF] to-[#7C35FF] text-[14px] font-semibold text-white shadow-[0_0_22px_rgba(184,92,255,0.44)] active:scale-95"
                >
                  สมัคร VIP
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {playbackAlert ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[320px] rounded-2xl border border-white/14 bg-[#151019] p-5 text-center text-white shadow-[0_18px_48px_rgba(0,0,0,0.44)]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#F6C35B]/45 bg-[#F6C35B]/14 text-[#F6C35B]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h2 className="mt-4 text-[18px] font-semibold leading-6">
              {playbackAlert.title}
            </h2>
            <p className="mt-2 text-[14px] leading-5 text-white/72">
              {playbackAlert.message}
            </p>
            <button
              type="button"
              onClick={() => setPlaybackAlert(null)}
              className="mt-5 h-11 w-full rounded-xl bg-[#7B1ED6] text-[14px] font-semibold text-white active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {loading || isEpisodeLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BF8EFF] border-t-transparent" />
          <p className="text-sm text-white/60">{labels.loading}</p>
        </div>
      ) : showPlayer ? (
        <VePlayerComponent
          key={playback.url}
          ref={playerControlRef}
          vid={episode.video_url.trim()}
          playback={playback}
          subtitles={subtitles}
          activeSubtitle={activeSubtitle}
          onPausedChange={setIsVideoPaused}
          onEnded={handleVideoEnded}
          onAudioTracksChange={handleAudioTracksChange}
          lineAppId={1006938}
          lineUserId={`web-watch-${seriesId || "unknown"}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-4 px-6 text-center">
          <p className="text-lg font-bold">{error || labels.missing}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-[#7B1ED6] px-6 py-2.5 text-sm font-bold text-white"
          >
            {labels.back}
          </button>
        </div>
      )}
    </div>
  );
}
