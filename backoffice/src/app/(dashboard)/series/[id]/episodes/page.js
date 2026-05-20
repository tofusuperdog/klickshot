'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { backofficeMutation, backofficeQuery } from '@/lib/backoffice';
import '@byteplus/veplayer/index.min.css';

const getSubtitleId = (sub, idx) =>
  String(sub?.id || sub?.language || sub?.text || idx);

const getSubtitleLabel = (sub, idx) => {
  const language = String(sub?.language || '').toLowerCase();

  if (language === 'th') return 'TH';
  if (language === 'zh' || language === 'cn') return 'CN';
  if (language === 'en') return 'EN';
  if (language === 'jp' || language === 'ja') return 'JP';

  return sub?.text || `Subtitle ${idx + 1}`;
};

const normalizeSubtitle = (sub, idx) => ({
  id: getSubtitleId(sub, idx),
  src: (sub.src || sub.url).trim(),
  text: getSubtitleLabel(sub, idx),
  language: sub.language || getSubtitleLabel(sub, idx).toLowerCase(),
  default: Boolean(sub.default || sub.isDefault) || idx === 0,
});

const SUBTITLE_OFFSET_BOTTOM_PERCENT = 25;

// Helper component for BytePlus VePlayer
const VePlayerComponent = forwardRef(function VePlayerComponent({
  vid,
  playUrl,
  lineAppId,
  lineUserId,
  subtitles,
}, ref) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const subtitlePluginRef = useRef(null);
  const pendingSubtitleRef = useRef(undefined);

  const resolveSubtitlePlugin = () => {
    if (subtitlePluginRef.current) return subtitlePluginRef.current;

    const player = playerRef.current;
    if (!player) return null;

    const plugin =
      player.getPlugin?.('Subtitle') ||
      player.getPlugin?.('subtitle') ||
      player.getPlugin?.('subTitle') ||
      Object.values(player.plugins || {}).find(
        (item) =>
          item &&
          typeof item === 'object' &&
          (typeof item.switchSubTitle === 'function' ||
            typeof item.switchOffSubtitle === 'function')
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
      (typeof subtitlePlugin.getList === 'function'
        ? subtitlePlugin.getList()
        : subtitlePlugin.curList || subtitlePlugin.list || []) || [];
    const pluginSubtitle = Array.isArray(list)
      ? list.find(
        (item) =>
          String(item?.id) === String(subtitle.id) ||
          String(item?.language) === String(subtitle.language)
      )
      : null;

    subtitlePlugin.openSubtitle?.();
    subtitlePlugin.switchSubTitle?.(pluginSubtitle || subtitle);
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      switchSubtitle(subtitle) {
        applySubtitle(subtitle);
      },
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current || !vid || !playUrl) return;

    let cancelled = false;

    const initPlayer = async () => {
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        containerRef.current.innerHTML = '';

        const VePlayerModule = await import('@byteplus/veplayer');
        const VePlayer = VePlayerModule.default || VePlayerModule;

        const playerId = `veplayer-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;

        containerRef.current.id = playerId;

        const license = process.env.NEXT_PUBLIC_BYTEPLUS_LICENSE;

        const parsedLineAppId = Number(lineAppId);

        const vodLogOpts =
          Number.isFinite(parsedLineAppId) && parsedLineAppId > 0
            ? {
              line_app_id: parsedLineAppId,
              line_user_id: lineUserId || `web-${Date.now()}`,
              vtype: 'HLS',
            }
            : undefined;

        if (license && typeof VePlayer.setLicenseConfig === 'function') {
          await VePlayer.setLicenseConfig({ license });
        }

        if (cancelled) return;

        const validSubtitles = Array.isArray(subtitles)
          ? subtitles.filter(
            (sub) =>
              sub &&
              typeof (sub.url || sub.src) === 'string' &&
              (sub.url || sub.src).trim().length > 0
          )
          : [];
        const normalizedSubtitles = validSubtitles.map(normalizeSubtitle);

        const playerConfig = {
          root: containerRef.current,
          streamType: 'hls',
          codec: 'h264',
          lang: 'en',
          width: '100%',
          height: '100%',
          license: license || undefined,
          ...(vodLogOpts ? { vodLogOpts } : {}),
          autoplay: true,
          enableMenu: true,
          controls: true,
          controlBar: {
            visible: true,
          },
          url: playUrl,
        };

        if (normalizedSubtitles.length > 0 && VePlayer.Subtitle) {
          playerConfig.plugins = [VePlayer.Subtitle];

          playerConfig.Subtitle = {
            isDefaultOpen: true,
            list: normalizedSubtitles,
            style: {
              offsetBottom: SUBTITLE_OFFSET_BOTTOM_PERCENT,
            },
          };
        } else {
          console.warn('No valid subtitles or VePlayer.Subtitle plugin missing', {
            validSubtitles: normalizedSubtitles,
            hasSubtitlePlugin: Boolean(VePlayer.Subtitle),
          });
        }

        playerRef.current = new VePlayer(playerConfig);
        subtitlePluginRef.current = null;

        const retryResolvePlugin = (attempt = 0) => {
          if (cancelled) return;

          const plugin = resolveSubtitlePlugin();
          if (plugin) {
            if (pendingSubtitleRef.current !== undefined) {
              applySubtitle(pendingSubtitleRef.current);
              pendingSubtitleRef.current = undefined;
            }
            return;
          }

          if (attempt < 10) {
            window.setTimeout(() => retryResolvePlugin(attempt + 1), 100);
          }
        };

        retryResolvePlugin();
      } catch (error) {
        console.error('Failed to initialize BytePlus player:', error);
      }
    };

    initPlayer();

    return () => {
      cancelled = true;

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      subtitlePluginRef.current = null;
    };
  }, [vid, playUrl, lineAppId, lineUserId, subtitles]);

  return (
    <div
      ref={containerRef}
      className="veplayer-raised-subtitle h-full w-full bg-black"
    />
  );
});

function LangBadge({ label, active }) {
  if (!active) return null;

  return (
    <span className="border border-gray-500 text-[#f3f4f6] text-[11px] w-8 h-5 rounded flex items-center justify-center font-medium opacity-90">
      {label}
    </span>
  );
}

function LangPrefix({ label, active }) {
  if (!active) return null;

  return (
    <span className="w-9 h-6 border border-gray-500 rounded flex items-center justify-center text-[11px] text-gray-300 tracking-wider mr-3 shrink-0">
      {label}
    </span>
  );
}

const XIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PlayIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="10 8 16 12 10 16 10 8"></polygon>
  </svg>
);

const EditIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const LockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#d97706"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default function EpisodesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id: seriesId } = useParams();

  const [series, setSeries] = useState(null);
  const [genres, setGenres] = useState([]);
  const [savedEpisodes, setSavedEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [videoLink, setVideoLink] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transcodeAlert, setTranscodeAlert] = useState(null);

  const [playingVid, setPlayingVid] = useState(null);
  const [playingEpisode, setPlayingEpisode] = useState(null);
  const [playUrl, setPlayUrl] = useState('');
  const [playingSubtitles, setPlayingSubtitles] = useState([]);
  const [activeSubtitleId, setActiveSubtitleId] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);
  const playerControlRef = useRef(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setErrorVisible(true);

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const closeVideoModal = () => {
    setPlayingVid(null);
    setPlayingEpisode(null);
    setPlayUrl('');
    setPlayingSubtitles([]);
    setActiveSubtitleId(null);
  };

  const playVideo = async (episode) => {
    const vid = episode?.video_url || '';
    const cleanVid = typeof vid === 'string' ? vid.trim() : '';

    if (!cleanVid) return;

    setIsVideoLoading(true);
    setPlayingVid(cleanVid);
    setPlayingEpisode(episode);
    setPlayingSubtitles([]);
    setActiveSubtitleId(null);
    setPlayUrl('');

    try {
      const res = await fetch(
        `/api/vod/playauth?vid=${encodeURIComponent(cleanVid)}`,
        {
          cache: 'no-store',
          credentials: 'include',
        }
      );

      const data = await res.json();

      const hlsPlaybackUrl = data.preferredPlaybackSource || data.playUrl || '';

      if (res.ok && hlsPlaybackUrl) {
        const validSubtitles = Array.isArray(data.subtitles)
          ? data.subtitles.filter(
            (sub) =>
              sub &&
              typeof (sub.url || sub.src) === 'string' &&
              (sub.url || sub.src).trim().length > 0
          )
          : [];

        setPlayingSubtitles(validSubtitles);
        setActiveSubtitleId(
          validSubtitles.length > 0 ? getSubtitleId(validSubtitles[0], 0) : null
        );
        setPlayUrl(hlsPlaybackUrl);
      } else {
        const message =
          data.code === 'HLS_PLAYBACK_NOT_FOUND'
            ? 'วิดีโอนี้ยังไม่มีไฟล์ HLS กรุณา Transcode เป็น HLS ก่อนเล่น'
            : data.error || 'ไม่สามารถดึงไฟล์ HLS สำหรับเล่นวิดีโอได้';

        setTranscodeAlert({
          title:
            data.code === 'HLS_PLAYBACK_NOT_FOUND'
              ? 'ต้อง Transcode ก่อน'
              : 'โหลดไฟล์ HLS ไม่สำเร็จ',
          message,
          episodeNo: episode?.episode_no,
          vid: cleanVid,
          playbackSource: data.playbackSource || null,
        });
        closeVideoModal();
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ (Error fetching token)');
      closeVideoModal();
    } finally {
      setIsVideoLoading(false);
    }
  };

  const switchPlayerSubtitle = (subtitle) => {
    playerControlRef.current?.switchSubtitle(subtitle);
    setActiveSubtitleId(subtitle ? subtitle.id : null);
  };

  const confirmDeleteEpisode = async () => {
    if (!episodeToDelete) return;

    setIsDeleting(true);

    const { error } = await backofficeMutation(
      user,
      'episode',
      'delete',
      {},
      { series_id: seriesId, episode_no: episodeToDelete }
    );

    if (!error) {
      setSavedEpisodes((prev) =>
        prev.filter((e) => e.episode_no !== episodeToDelete)
      );
      setShowDeleteModal(false);
      setEpisodeToDelete(null);
    } else {
      alert('ลบไม่สำเร็จ: ' + error.message);
    }

    setIsDeleting(false);
  };

  const openModal = (epNum) => {
    setSelectedEpisode(epNum);

    const existing = savedEpisodes.find((e) => e.episode_no === epNum);

    setVideoLink(existing ? existing.video_url || '' : '');
    setIsFree(existing ? existing.is_free : false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setVideoLink('');
    setIsFree(false);
    setSelectedEpisode(null);
  };

  const saveEpisode = async () => {
    const cleanedVideoLink = videoLink.trim();
    const numericSeriesId = Number(seriesId);
    const numericEpisodeNo = Number(selectedEpisode);

    if (!cleanedVideoLink) {
      showError('กรุณากรอก vid');
      return;
    }

    if (!Number.isInteger(numericSeriesId) || !Number.isInteger(numericEpisodeNo)) {
      showError('ข้อมูลตอนไม่ถูกต้อง');
      return;
    }

    setIsSaving(true);

    const payload = {
      series_id: numericSeriesId,
      episode_no: numericEpisodeNo,
      video_url: cleanedVideoLink,
      is_free: isFree,
    };

    try {
      const { data, error } = await backofficeMutation(
        user,
        'episode',
        'upsert',
        payload,
        {},
        'series_id,episode_no'
      );

      if (error) {
        alert('บันทึกผิดพลาด: ' + error.message);
        return;
      }

      const { data: refreshedEpisodes, error: refreshError } =
        await backofficeQuery(user, 'episodes_by_series', {
          series_id: numericSeriesId,
        });

      if (refreshError) {
        const savedEpisode =
          Array.isArray(data) && data.length > 0 ? data[0] : payload;

        setSavedEpisodes((prev) => {
          const others = prev.filter(
            (e) => Number(e.episode_no) !== numericEpisodeNo
          );

          return [...others, savedEpisode].sort(
            (a, b) => Number(a.episode_no) - Number(b.episode_no)
          );
        });
      } else if (Array.isArray(refreshedEpisodes)) {
        setSavedEpisodes(refreshedEpisodes);
      }

      closeModal();
    } catch (error) {
      console.error('Error saving episode:', error);
      alert(
        'บันทึกผิดพลาด: ' +
          (error?.message || 'Request failed')
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!seriesId) return;

      if (user?.id) {
        setCurrentUserId(String(user.id));
      }

      const { data: gData } = await backofficeQuery(user, 'genres');

      if (gData) setGenres(gData);

      const { data: sData, error: sError } = await backofficeQuery(user, 'series_by_id', { id: seriesId });

      if (sError || !sData) {
        console.error('Error fetching series data:', sError);
        alert('ไม่พบข้อมูลซีรีส์');
        router.push('/series');
        return;
      }

      const { data: epData } = await backofficeQuery(user, 'episodes_by_series', { series_id: seriesId });

      if (epData) setSavedEpisodes(epData);

      setSeries(sData);
      setLoading(false);
    }

    fetchData();
  }, [seriesId, router, user]);

  if (loading || !series) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C72FF]"></div>
        <span className="ml-4 text-gray-300">กำลังโหลด...</span>
      </div>
    );
  }

  const genreNames = (series.genre_ids || [])
    .map((id) => genres.find((g) => g.id === id)?.name_th)
    .filter(Boolean);

  const episodes = Array.from(
    { length: series.total_episodes },
    (_, i) => i + 1
  );
  const availableSubtitles = playingSubtitles.map(normalizeSubtitle);

  return (
    <div className="w-full pb-20 relative">
      <div
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${errorVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-8 pointer-events-none'
          }`}
        style={{ display: errorMsg ? 'block' : 'none' }}
      >
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z" />
          </svg>
          <span className="font-medium tracking-wide">{errorMsg}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-8 text-white">
        <div className="relative w-9 h-9">
          <Image
            src="/series.svg"
            alt="Series"
            fill
            sizes="36px"
            style={{ objectFit: 'contain' }}
          />
        </div>

        <h1 className="text-xl text-gray-300 font-semibold tracking-wide flex items-center gap-2 truncate">
          <Link
            href="/series"
            className="hover:text-white transition-colors underline underline-offset-4 shrink-0"
          >
            ซีรีส์
          </Link>

          <span className="text-gray-500 font-light text-[15px] shrink-0">
            &gt;
          </span>

          <Link
            href={`/series/${seriesId}`}
            className="hover:text-white transition-colors underline underline-offset-4 truncate"
            title={series.title_th}
          >
            {series.title_th}
          </Link>

          <span className="text-gray-500 font-light text-[15px] shrink-0">
            &gt;
          </span>

          <span className="text-white font-light shrink-0">จัดการตอน</span>
        </h1>
      </div>

      <div className="bg-[#181236]/70 border border-[#2d2252] rounded-lg p-8 shadow-lg space-y-8">
        <div className="flex gap-8">
          <div className="w-[200px] h-[280px] shrink-0 bg-[#0d0a1b] rounded overflow-hidden relative border border-gray-700 shadow-lg">
            {series.poster_url ? (
              <Image
                src={series.poster_url}
                alt={series.title_th}
                fill
                sizes="200px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                No Image
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col pt-1">
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-xl text-white tracking-wide font-medium">
                <LangPrefix label="TH" active={true} />
                {series.title_th}
              </div>

              {series.title_en && (
                <div className="flex items-center text-[15px] text-gray-300 font-light">
                  <LangPrefix label="EN" active={true} />
                  {series.title_en}
                </div>
              )}

              {series.title_jp && (
                <div className="flex items-center text-[15px] text-gray-300 font-light">
                  <LangPrefix label="JP" active={true} />
                  {series.title_jp}
                </div>
              )}

              {series.title_cn && (
                <div className="flex items-center text-[15px] text-gray-300 font-light">
                  <LangPrefix label="CN" active={true} />
                  {series.title_cn}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {genreNames.map((name, idx) => (
                <span
                  key={idx}
                  className="border border-gray-500 text-gray-200 text-[13px] px-3 py-1 rounded-md"
                >
                  {name}
                </span>
              ))}
            </div>

            <div className="space-y-3 flex flex-col">
              <div className="flex items-center text-[15px] text-gray-300 font-light space-x-3">
                <span className="w-20">เสียงพากย์</span>

                <div className="flex space-x-2">
                  {['th', 'en', 'jp', 'cn'].map((lang) => (
                    <LangBadge
                      key={lang}
                      label={lang.toUpperCase()}
                      active={series[`dub_${lang}`]}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center text-[15px] text-gray-300 font-light space-x-3">
                <span className="w-20">บรรยาย</span>

                <div className="flex space-x-2">
                  {['th', 'en', 'jp', 'cn'].map((lang) => (
                    <LangBadge
                      key={lang}
                      label={lang.toUpperCase()}
                      active={series[`sub_${lang}`]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#2d2252] rounded-lg overflow-hidden bg-[#12102f]/80 shadow-xl">
          <table className="w-full text-center text-sm font-light text-gray-300">
            <thead>
              <tr className="border-b border-[#2d2252]">
                <th className="font-light py-4 w-[15%]">ตอน</th>
                <th className="font-light py-4 w-[25%]">สถานะ</th>
                <th className="font-light py-4 w-[20%]">เล่น</th>
                <th className="font-light py-4 w-[20%]">แก้ไข</th>
                <th className="font-light py-4 w-[20%]">ลบ</th>
              </tr>
            </thead>

            <tbody>
              {episodes.map((ep, idx) => {
                const savedEp = savedEpisodes.find(
                  (e) => e.episode_no === ep
                );

                return (
                  <tr
                    key={ep}
                    className={`transition-colors h-14 ${idx % 2 === 0 ? 'bg-white/5' : ''
                      } hover:bg-[#28214f]/50`}
                  >
                    <td className="py-3 font-medium">{ep}</td>

                    {savedEp ? (
                      <>
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center text-gray-300">
                            {savedEp.is_free ? (
                              <span className="text-[13px] font-medium">
                                ฟรี
                              </span>
                            ) : (
                              <LockIcon />
                            )}
                          </div>
                        </td>

                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            {savedEp.video_url ? (
                              <button
                                onClick={() => playVideo(savedEp)}
                                className="text-green-500 hover:text-green-400 transition-colors cursor-pointer outline-none"
                              >
                                <PlayIcon />
                              </button>
                            ) : (
                              <span className="text-gray-600 cursor-not-allowed">
                                <PlayIcon />
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => openModal(ep)}
                              className="text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
                            >
                              <EditIcon />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => {
                                setEpisodeToDelete(ep);
                                setShowDeleteModal(true);
                              }}
                              className="text-[#a1a1aa] hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="py-3">
                        <button
                          onClick={() => openModal(ep)}
                          className="text-[#a1a1aa] underline underline-offset-4 cursor-pointer hover:text-white transition-colors text-[13px]"
                        >
                          เพิ่มวิดีโอ
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {episodes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-gray-500">
                    ไม่มีตอนในระบบ (จำนวนตอนเป็น 0)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm backdrop-grayscale">
          <div className="bg-[#12102f] border border-[#2d2252] w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-white">
            <div className="flex items-center justify-center px-6 py-4 border-b border-[#2d2252] relative">
              <h2 className="text-lg font-medium tracking-wide">
                {savedEpisodes.some(
                  (e) => e.episode_no === selectedEpisode
                )
                  ? 'แก้ไขวีดีโอ'
                  : 'เพิ่มวีดีโอ'}
              </h2>
            </div>

            <div className="p-6">
              <div className="flex gap-5 mb-6">
                <div className="w-[100px] h-[140px] shrink-0 bg-[#0d0a1b] rounded overflow-hidden relative border border-gray-700 shadow">
                  {series.poster_url ? (
                    <Image
                      src={series.poster_url}
                      alt={series.title_th}
                      fill
                      sizes="100px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-2">
                  <div className="flex items-center text-[16px] font-medium">
                    <LangPrefix label="TH" active={true} />
                    <span className="line-clamp-1 break-all">
                      {series.title_th}
                    </span>
                  </div>

                  {series.title_en && (
                    <div className="flex items-center text-[14px] text-gray-300">
                      <LangPrefix label="EN" active={true} />
                      <span className="line-clamp-1 break-all">
                        {series.title_en}
                      </span>
                    </div>
                  )}

                  {series.title_jp && (
                    <div className="flex items-center text-[14px] text-gray-300">
                      <LangPrefix label="JP" active={true} />
                      <span className="line-clamp-1 break-all">
                        {series.title_jp}
                      </span>
                    </div>
                  )}

                  {series.title_cn && (
                    <div className="flex items-center text-[14px] text-gray-300">
                      <LangPrefix label="CN" active={true} />
                      <span className="line-clamp-1 break-all">
                        {series.title_cn}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#1a1738] rounded-md text-center py-2.5 mb-6 border border-[#2d2252] shadow-inner">
                <span className="text-gray-200 text-[15px] font-medium tracking-wide">
                  ตอนที่ {selectedEpisode}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="w-24 text-[13px] text-gray-300">
                    vid
                  </label>

                  <input
                    type="text"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="flex-1 bg-white text-black px-3 py-2 rounded text-[13px] outline-none w-full shadow-sm"
                  />
                </div>

                <div className="flex items-center pb-2">
                  <label className="w-24 text-[13px] text-gray-300">
                    สถานะ
                  </label>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center cursor-pointer space-x-2">
                      <input
                        type="radio"
                        name="status"
                        checked={!isFree}
                        onChange={() => setIsFree(false)}
                        className="w-4 h-4 bg-transparent border-gray-500 cursor-pointer accent-[#5c67f2]"
                      />
                      <span className="text-[13px] text-gray-300">
                        จ่ายเงิน
                      </span>
                    </label>

                    <label className="flex items-center cursor-pointer space-x-2">
                      <input
                        type="radio"
                        name="status"
                        checked={isFree}
                        onChange={() => setIsFree(true)}
                        className="w-4 h-4 bg-transparent border-gray-500 cursor-pointer accent-[#5c67f2]"
                      />
                      <span className="text-[13px] text-gray-300">
                        ฟรี
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-center pt-2 gap-4">
                  <button
                    onClick={closeModal}
                    className="px-8 py-2 border border-gray-600 hover:bg-white/5 text-white rounded-md transition-colors text-[14px] cursor-pointer"
                  >
                    ยกเลิก
                  </button>

                  <button
                    onClick={saveEpisode}
                    disabled={isSaving}
                    className="px-8 py-2 bg-[#5c67f2] hover:bg-[#4a54c4] text-white rounded-md transition-colors disabled:opacity-50 text-[14px] cursor-pointer"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm backdrop-grayscale">
          <div className="bg-[#12102f] border border-[#2d2252] w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-white">
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <h2 className="text-xl font-medium text-center tracking-wide">
                ยืนยันการลบ
              </h2>

              <p className="text-[13px] text-gray-300 text-center leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอตอนที่{' '}
                <span className="text-white font-medium">
                  {episodeToDelete}
                </span>
                ? <br />
                หากลบแล้วจะไม่สามารถกู้คืนข้อมูลของตอนนี้ได้
              </p>

              <div className="flex w-full space-x-4 pt-6">
                <button
                  onClick={confirmDeleteEpisode}
                  disabled={isDeleting}
                  className="flex-1 bg-[#D24949] hover:bg-red-500 text-white px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 text-[14px]"
                >
                  {isDeleting ? 'กำลังลบ...' : 'ลบข้อมูล'}
                </button>

                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEpisodeToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 border border-gray-600 hover:bg-white/5 text-white px-4 py-2.5 rounded-md transition-colors disabled:opacity-50 text-[14px]"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {transcodeAlert && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm backdrop-grayscale">
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-xl border border-[#6b5cff]/70 bg-[#111833] text-white shadow-[0_0_42px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => setTranscodeAlert(null)}
              className="absolute right-4 top-4 z-10 cursor-pointer text-white/70 transition-colors hover:text-white"
              aria-label="Close transcode notice"
            >
              <XIcon />
            </button>

            <div className="px-7 pb-7 pt-8">
              <div className="mb-5 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#f6c45b]/60 bg-[#f6c45b]/15 text-[#f6c45b] shadow-[0_0_24px_rgba(246,196,91,0.16)]">
                  <svg
                    width="30"
                    height="30"
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
              </div>

              <h2 className="text-center text-xl font-semibold tracking-wide">
                {transcodeAlert.title}
              </h2>

              <p className="mx-auto mt-3 max-w-[330px] text-center text-[14px] leading-6 text-gray-300">
                {transcodeAlert.message}
              </p>

              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-[12px] text-gray-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">Episode</span>
                  <span className="font-medium text-white">
                    {transcodeAlert.episodeNo || '-'}
                  </span>
                </div>

                <div className="mt-2 flex items-start justify-between gap-4">
                  <span className="shrink-0 text-gray-500">vid</span>
                  <span className="break-all text-right font-mono text-[11px] text-gray-100">
                    {transcodeAlert.vid}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setTranscodeAlert(null)}
                  className="h-10 min-w-[150px] cursor-pointer rounded-md bg-[#5c67f2] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#4a54c4]"
                >
                  รับทราบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {playingVid && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm backdrop-grayscale px-4 py-6"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="relative w-full max-w-[500px] max-h-[calc(100vh-48px)] overflow-y-auto rounded-md border-2 border-[#4c65b4] bg-[#101a3c] px-4 py-4 text-white shadow-[0_0_40px_rgba(0,0,0,0.45)] sm:px-5"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onMouseDown={(e) => {
              if (e.button === 2) e.preventDefault();
            }}
          >
            <button
              onClick={closeVideoModal}
              className="absolute right-3 top-3 z-[80] cursor-pointer text-white/90 transition-colors hover:text-white outline-none"
              aria-label="Close video player"
            >
              <XIcon />
            </button>

            <div className="mb-3 pr-10 text-center text-lg font-light tracking-wide">
              ตอนที่ {playingEpisode?.episode_no}
            </div>

            <div className="mb-8 flex items-start gap-4">
              <div className="relative h-[120px] w-[86px] shrink-0 overflow-hidden rounded bg-[#0d0a1b]">
                {series.poster_url ? (
                  <Image
                    src={series.poster_url}
                    alt={series.title_th || 'Series poster'}
                    fill
                    sizes="86px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                    No Image
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-1 pt-2 text-[15px] leading-6 text-gray-100">
                {[
                  ['TH', series.title_th],
                  ['EN', series.title_en],
                  ['JP', series.title_jp],
                  ['CN', series.title_cn],
                ].map(([label, title]) => (
                  <div key={label} className="flex min-w-0 items-center">
                    <LangPrefix label={label} active={true} />
                    <span className="truncate">{title || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            {availableSubtitles.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                <span className="mr-1 text-[13px] text-gray-200">
                  คำบรรยาย
                </span>

                <button
                  type="button"
                  onClick={() => switchPlayerSubtitle(null)}
                  className={`h-8 min-w-12 cursor-pointer rounded border px-3 text-[12px] transition-colors ${activeSubtitleId === null
                      ? 'border-white bg-white text-[#101a3c]'
                      : 'border-white/40 text-white hover:bg-white/10'
                    }`}
                >
                  OFF
                </button>

                {availableSubtitles.map((subtitle) => (
                  <button
                    key={subtitle.id}
                    type="button"
                    onClick={() => switchPlayerSubtitle(subtitle)}
                    className={`h-8 min-w-12 cursor-pointer rounded border px-3 text-[12px] transition-colors ${activeSubtitleId === subtitle.id
                        ? 'border-white bg-white text-[#101a3c]'
                        : 'border-white/40 text-white hover:bg-white/10'
                      }`}
                  >
                    {subtitle.text}
                  </button>
                ))}
              </div>
            )}

            <div className="mx-auto h-[480px] w-[270px] overflow-hidden bg-black select-none">
              {isVideoLoading || !playUrl ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#5c67f2]"></div>
                </div>
              ) : (
                <VePlayerComponent
                  ref={playerControlRef}
                  vid={playingVid}
                  playUrl={playUrl}
                  lineAppId={1006938}
                  lineUserId={currentUserId}
                  subtitles={playingSubtitles}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
