import { NextResponse } from 'next/server';
import vod from '@byteplus/vcloud-sdk-nodejs';
import {
  DEFAULT_PLAY_DOMAIN,
  normalizeVodPlayDomain,
  normalizeVodUrl,
  shouldUseHlsProxy,
  signCdnUrl,
} from '@/lib/byteplusCdn';
import {
  getBackofficeUserFromRequest,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const vodService = vod.vodOpenapi.defaultService;
const DEFAULT_PLAYBACK_PARAMS = {
  FileType: 'video',
  Format: 'hls',
  Codec: 'H264',
  Ssl: '1',
};
const DEFAULT_PLAYBACK_CANDIDATES = [
  { FileType: 'video', Format: 'hls', Codec: 'H264', Ssl: '1' },
  { FileType: 'video', Format: 'hls', Codec: 'h264', Ssl: '1' },
  { FileType: 'video', Format: 'hls', Ssl: '1' },
  { FileType: 'video', Format: 'HLS', Ssl: '1' },
];

function getSubtitleProxyUrl(subtitleUrl) {
  return `/api/vod/subtitle?url=${encodeURIComponent(
    signCdnUrl(normalizeVodUrl(subtitleUrl))
  )}`;
}

function getHlsProxyUrl(playUrl, origin = '') {
  if (!playUrl) return '';

  const params = new URLSearchParams({
    url: normalizeVodUrl(playUrl),
  });

  return `${origin}/api/vod/hls?${params.toString()}`;
}

function getPlayInfoList(playInfoRes) {
  const playInfoList =
    playInfoRes?.Result?.PlayInfoList ||
    playInfoRes?.PlayInfoList ||
    [];

  return Array.isArray(playInfoList) ? playInfoList : [];
}

function getPlaybackUrl(playInfo) {
  return (
    playInfo?.MainPlayUrl ||
    playInfo?.BackupPlayUrl ||
    playInfo?.Url ||
    playInfo?.PlayUrl ||
    playInfo?.PlayURL ||
    playInfo?.PlayUri ||
    ''
  );
}

function getPlaybackSource(playInfo, candidate, playInfoList) {
  return {
    requestedFormat: candidate.Format,
    requestedCodec: candidate.Codec || '',
    selectedFormat: playInfo?.Format || '',
    selectedCodec: playInfo?.Codec || '',
    selectedDefinition: playInfo?.Definition || '',
    availableCount: playInfoList.length,
  };
}

async function resolveDefaultPlayback(baseParams) {
  for (const candidate of DEFAULT_PLAYBACK_CANDIDATES) {
    try {
      const playInfoRes = await vodService.GetPlayInfo({
        ...baseParams,
        ...candidate,
      });
      const playInfoList = getPlayInfoList(playInfoRes);

      if (playInfoList.length > 0) {
        const selectedPlayInfo =
          playInfoList.find((playInfo) => Boolean(getPlaybackUrl(playInfo))) ||
          playInfoList[0] ||
          {};
        const playbackUrl = getPlaybackUrl(selectedPlayInfo);
        const streamType = String(candidate.Format || '').toLowerCase();

        if (playbackUrl) {
          return {
            params: { ...baseParams, ...candidate },
            playbackUrl,
            streamType,
            source: getPlaybackSource(selectedPlayInfo, candidate, playInfoList),
          };
        }
      }
    } catch (error) {
      console.error('Error resolving BytePlus playback candidate:', {
        vid: baseParams.Vid,
        format: candidate.Format,
        error,
      });
    }
  }

  return {
    params: { ...baseParams, ...DEFAULT_PLAYBACK_PARAMS },
    playbackUrl: '',
    streamType: 'hls',
    source: {
      requestedFormat: DEFAULT_PLAYBACK_PARAMS.Format,
      requestedCodec: DEFAULT_PLAYBACK_PARAMS.Codec || '',
      selectedFormat: '',
      selectedCodec: '',
      selectedDefinition: '',
      availableCount: 0,
    },
  };
}

function getSubtitleLabel(sub, idx) {
  const languageId = Number(sub.LanguageId);

  if (languageId === 30) return 'Thai';
  if (languageId === 1) return 'Chinese';

  return (
    sub.Language ||
    sub.Title ||
    sub.Tag ||
    `Subtitle ${idx + 1}`
  );
}

function getSubtitleLanguage(sub) {
  const languageId = Number(sub.LanguageId);

  if (languageId === 30) return 'th';
  if (languageId === 1) return 'zh';

  return String(sub.Language || sub.LanguageId || '');
}

function dedupeSubtitles(subtitleList) {
  const seen = new Set();

  return subtitleList.filter((sub) => {
    const key = [
      sub.SubtitleId || '',
      sub.SubtitleUrl || sub.Url || sub.MainUrl || sub.BackupUrl || sub.FileUrl || '',
      sub.LanguageId || sub.Language || '',
    ].join('|');

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getSubtitleListForVid(subtitleRes, vid) {
  const directSubtitleList =
    subtitleRes?.Result?.SubtitleInfoList ||
    subtitleRes?.Result?.SubtitleInfoListForVid ||
    subtitleRes?.SubtitleInfoList;

  if (Array.isArray(directSubtitleList) && directSubtitleList.length > 0) {
    return directSubtitleList;
  }

  const fileSubtitleInfoList =
    subtitleRes?.Result?.FileSubtitleInfoList || [];

  const matchingFileSubtitleInfo = fileSubtitleInfoList.find(
    (fileSubtitleInfo) => fileSubtitleInfo?.FileId === vid
  );

  if (matchingFileSubtitleInfo?.SubtitleInfoList?.length > 0) {
    return matchingFileSubtitleInfo.SubtitleInfoList;
  }

  return fileSubtitleInfoList.flatMap(
    (fileSubtitleInfo) => fileSubtitleInfo?.SubtitleInfoList || []
  );
}

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const vid = (searchParams.get('vid') || '').trim();

  if (!vid) {
    return NextResponse.json(
      { error: 'Missing vid parameter' },
      { status: 400 }
    );
  }

  const { user } = await getBackofficeUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!user.is_admin && !user.perm_series) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  const accessKeyId =
    process.env.BYTEPLUS_ACCESS_KEY_ID ||
    process.env.AccessKeyId;

  const secretAccessKey =
    process.env.BYTEPLUS_SECRET_ACCESS_KEY ||
    process.env.SecretAccessKey;

  const spaceName =
    process.env.BYTEPLUS_VOD_SPACE_NAME ||
    process.env.VOD_SPACE_NAME ||
    'minchapxtiktok';

  if (!accessKeyId || !secretAccessKey) {
    return NextResponse.json(
      { error: 'BytePlus credentials are not configured' },
      { status: 500 }
    );
  }

  vodService.setAccessKeyId(accessKeyId);
  vodService.setSecretKey(secretAccessKey);

  try {
    const playDomain = normalizeVodPlayDomain(
      process.env.BYTEPLUS_VOD_PLAY_DOMAIN || DEFAULT_PLAY_DOMAIN
    );

    const baseParams = {
      Vid: vid,
      ...(spaceName ? { SpaceName: spaceName } : {}),
      PlayDomain: playDomain,
    };

    const defaultPlayback = await resolveDefaultPlayback(baseParams);

    if (!defaultPlayback?.playbackUrl) {
      return NextResponse.json(
        {
          error: 'HLS playback source is not available for this video',
          code: 'HLS_PLAYBACK_NOT_FOUND',
          playbackSource: defaultPlayback?.source || null,
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const signedPlaybackUrl = signCdnUrl(normalizeVodUrl(defaultPlayback.playbackUrl));
    const proxiedPlaybackSource = getHlsProxyUrl(
      signedPlaybackUrl,
      request.nextUrl.origin
    );
    const playUrl = shouldUseHlsProxy()
      ? proxiedPlaybackSource
      : signedPlaybackUrl;

    let subtitles = [];

    try {
      const subtitleParams = {
        ...baseParams,
        Ssl: '1',
      };

      const subtitleRes = await vodService.GetSubtitleInfoList(subtitleParams);
      const subtitleList = getSubtitleListForVid(subtitleRes, vid);

      subtitles = dedupeSubtitles(subtitleList)
        .filter((sub) => {
          const status = String(sub.Status || '').toLowerCase();

          // ถ้าไม่มี Status ให้ผ่านไว้ก่อน
          if (!status) return true;

          return (
            status === 'enable' ||
            status === 'enabled' ||
            status === 'published'
          );
        })
        .map((sub, idx) => {
          const subtitleUrl =
            sub.SubtitleUrl ||
            sub.Url ||
            sub.MainUrl ||
            sub.BackupUrl ||
            sub.FileUrl ||
            '';

          const proxiedSubtitleUrl = getSubtitleProxyUrl(subtitleUrl);

          return {
            id: String(idx),
            url: proxiedSubtitleUrl,
            src: proxiedSubtitleUrl,
            text: getSubtitleLabel(sub, idx),
            language: getSubtitleLanguage(sub),
            format: 'webvtt',
            isDefault: idx === 0,
            default: idx === 0,
          };
        })
        .filter((sub) => Boolean(sub.src && sub.src.trim()));

    } catch (subError) {
      console.error('Error fetching subtitles from BytePlus:', subError);
    }

    return NextResponse.json({
      defaultPlaybackSource: defaultPlayback.source,
      preferredPlaybackSource: playUrl,
      directPlaybackSource: signedPlaybackUrl,
      proxiedPlaybackSource,
      isHlsProxyEnabled: shouldUseHlsProxy(),
      preferredPlaybackStreamType: defaultPlayback.streamType,
      playFormat: defaultPlayback.streamType,
      playUrl,
      playDomain,
      subtitles,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating play auth token:', error);

    return NextResponse.json(
      { error: 'Failed to generate play auth token' },
      { status: 500 }
    );
  }
}
