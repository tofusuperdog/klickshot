import { NextResponse } from "next/server";
import { signCdnUrl } from "../../../lib/byteplusCdn";
import { corsOptionsResponse, withCorsHeaders } from "../../../lib/cors";

export const dynamic = "force-dynamic";

const ALLOWED_HLS_HOSTS = new Set([
  "vod.minchapseries.com",
  "bytepluscdn.com",
  "byteplusapi.com",
  "byteplusvod.com",
]);

function isAllowedHlsUrl(url) {
  const hostname = url.hostname.toLowerCase();

  return (
    ALLOWED_HLS_HOSTS.has(hostname) ||
    Array.from(ALLOWED_HLS_HOSTS).some((allowedHost) =>
      hostname.endsWith(`.${allowedHost}`),
    )
  );
}

function getProxiedHlsUrl(url, origin) {
  return `${origin}/api/vod/hls?url=${encodeURIComponent(signCdnUrl(url).href)}`;
}

function resolvePlaylistUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl);
  } catch {
    return null;
  }
}

function rewritePlaylistLine(line, baseUrl, origin) {
  if (!line || line.startsWith("#EXTM3U")) {
    return line;
  }

  if (line.startsWith("#")) {
    return line.replace(/\bURI="([^"]+)"/g, (match, uri) => {
      const resolvedUrl = resolvePlaylistUrl(uri, baseUrl);

      if (!resolvedUrl || !isAllowedHlsUrl(resolvedUrl)) {
        return match;
      }

      return `URI="${getProxiedHlsUrl(resolvedUrl, origin)}"`;
    });
  }

  const resolvedUrl = resolvePlaylistUrl(line.trim(), baseUrl);

  if (!resolvedUrl || !isAllowedHlsUrl(resolvedUrl)) {
    return line;
  }

  return getProxiedHlsUrl(resolvedUrl, origin);
}

function rewritePlaylist(playlist, sourceUrl, origin) {
  return playlist
    .split(/\r?\n/)
    .map((line) => rewritePlaylistLine(line, sourceUrl, origin))
    .join("\n");
}

function isPlaylistResponse(url, contentType) {
  return (
    contentType.includes("mpegurl") ||
    contentType.includes("application/vnd.apple") ||
    url.pathname.toLowerCase().endsWith(".m3u8")
  );
}

export async function GET(request) {
  const source = request.nextUrl.searchParams.get("url") || "";
  let sourceUrl;

  try {
    sourceUrl = new URL(source);
  } catch {
    return NextResponse.json(
      { error: "Invalid HLS URL" },
      { status: 400, headers: withCorsHeaders(request) },
    );
  }

  if (!isAllowedHlsUrl(sourceUrl)) {
    return NextResponse.json(
      { error: "HLS URL is not allowed" },
      { status: 400, headers: withCorsHeaders(request) },
    );
  }

  const upstreamHeaders = {
    Accept: "*/*",
  };
  const range = request.headers.get("range");

  if (range) {
    upstreamHeaders.Range = range;
  }

  const upstreamResponse = await fetch(sourceUrl, {
    headers: upstreamHeaders,
    cache: "no-store",
  });
  const contentType =
    upstreamResponse.headers.get("content-type") || "application/octet-stream";
  const responseHeaders = withCorsHeaders(request, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });
  const contentLength = upstreamResponse.headers.get("content-length");
  const contentRange = upstreamResponse.headers.get("content-range");
  const acceptRanges = upstreamResponse.headers.get("accept-ranges");

  if (contentLength) {
    responseHeaders["Content-Length"] = contentLength;
  }

  if (contentRange) {
    responseHeaders["Content-Range"] = contentRange;
  }

  if (acceptRanges) {
    responseHeaders["Accept-Ranges"] = acceptRanges;
  }

  if (!upstreamResponse.ok) {
    return new NextResponse(await upstreamResponse.text(), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  if (isPlaylistResponse(sourceUrl, contentType)) {
    const playlist = await upstreamResponse.text();

    return new NextResponse(
      rewritePlaylist(playlist, sourceUrl, request.nextUrl.origin),
      {
      status: 200,
      headers: withCorsHeaders(request, {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      }),
      },
    );
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export function OPTIONS(request) {
  return corsOptionsResponse(request);
}
