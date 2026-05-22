import { NextResponse } from 'next/server';
import { normalizeVodUrl, signCdnUrl } from '@/lib/byteplusCdn';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOST_SUFFIXES = [
  'bytepluscdn.com',
  'byteplusapi.com',
  'byteplusvod.com',
  'minchapseries.com',
];

function isAllowedVodUrl(url) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }

  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`)
  );
}

function getProxyUrl(sourceUrl) {
  return `/api/vod/hls?url=${encodeURIComponent(signCdnUrl(sourceUrl).href)}`;
}

function resolvePlaylistUrl(value, baseUrl) {
  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.startsWith('#')) {
    return value;
  }

  const resolvedUrl = normalizeVodUrl(new URL(trimmedValue, baseUrl));

  if (!isAllowedVodUrl(resolvedUrl)) {
    return value;
  }

  return getProxyUrl(resolvedUrl);
}

function rewriteAttributeUris(line, baseUrl) {
  return line.replace(/URI="([^"]+)"/g, (_match, value) => {
    const resolvedUrl = normalizeVodUrl(new URL(value, baseUrl));

    if (!isAllowedVodUrl(resolvedUrl)) {
      return `URI="${value}"`;
    }

    const proxiedUrl = getProxyUrl(resolvedUrl);

    return `URI="${proxiedUrl}"`;
  });
}

function rewritePlaylist(text, baseUrl) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith('#')) {
        return rewriteAttributeUris(line, baseUrl);
      }

      return resolvePlaylistUrl(line, baseUrl);
    })
    .join('\n');
}

function isPlaylistResponse(url, response) {
  const contentType = response.headers.get('content-type') || '';

  return (
    url.pathname.toLowerCase().endsWith('.m3u8') ||
    contentType.includes('mpegurl') ||
    contentType.includes('vnd.apple.mpegurl')
  );
}

export async function GET(request) {
  const source = request.nextUrl.searchParams.get('url') || '';

  let sourceUrl;

  try {
    sourceUrl = signCdnUrl(normalizeVodUrl(new URL(source)));
  } catch {
    return NextResponse.json(
      { error: 'Invalid HLS URL' },
      { status: 400 }
    );
  }

  if (!isAllowedVodUrl(sourceUrl)) {
    return NextResponse.json(
      { error: 'HLS URL host is not allowed' },
      { status: 400 }
    );
  }

  const headers = {};
  const range = request.headers.get('range');

  if (range) {
    headers.Range = range;
  }

  try {
    const upstreamResponse = await fetch(sourceUrl, {
      headers: {
        Accept: '*/*',
        ...headers,
      },
      cache: 'no-store',
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return NextResponse.json(
        { error: 'Failed to fetch HLS resource' },
        { status: upstreamResponse.status }
      );
    }

    if (isPlaylistResponse(sourceUrl, upstreamResponse)) {
      const playlist = await upstreamResponse.text();

      return new Response(rewritePlaylist(playlist, sourceUrl), {
        status: upstreamResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const responseHeaders = new Headers();
    const contentType = upstreamResponse.headers.get('content-type');
    const contentLength = upstreamResponse.headers.get('content-length');
    const contentRange = upstreamResponse.headers.get('content-range');
    const acceptRanges = upstreamResponse.headers.get('accept-ranges');

    if (contentType) responseHeaders.set('Content-Type', contentType);
    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (contentRange) responseHeaders.set('Content-Range', contentRange);
    if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-store');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error proxying HLS resource:', error);

    return NextResponse.json(
      { error: 'Failed to proxy HLS resource' },
      { status: 500 }
    );
  }
}
