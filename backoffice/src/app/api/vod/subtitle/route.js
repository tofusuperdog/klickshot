import { NextResponse } from 'next/server';

const ALLOWED_HOST_SUFFIXES = [
  'bytepluscdn.com',
  'byteplusapi.com',
  'byteplusvod.com',
  'minchapseries.com',
];

function isAllowedSubtitleUrl(url) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }

  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`)
  );
}

function looksLikeSrt(text) {
  return /^\s*\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/m.test(
    text
  );
}

function srtToWebVtt(text) {
  const normalizedText = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(
      /(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})/g,
      '$1.$2 --> $3.$4'
    );

  return `WEBVTT\n\n${normalizedText}`;
}

function timestampToMs(timestamp) {
  const match = timestamp.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);

  if (!match) return 0;

  const [, hours, minutes, seconds, milliseconds] = match;

  return (
    Number(hours) * 60 * 60 * 1000 +
    Number(minutes) * 60 * 1000 +
    Number(seconds) * 1000 +
    Number(milliseconds)
  );
}

function msToTimestamp(value) {
  const ms = Math.max(0, Math.round(value));
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':') + `.${String(milliseconds).padStart(3, '0')}`;
}

function shiftWebVtt(text, offsetMs) {
  if (!offsetMs) return text;

  return text.replace(
    /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/g,
    (_match, start, end) =>
      `${msToTimestamp(timestampToMs(start) + offsetMs)} --> ${msToTimestamp(
        timestampToMs(end) + offsetMs
      )}`
  );
}

function getFirstCueStartMs(text) {
  const match = text.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->/);

  return match ? timestampToMs(match[1]) : 0;
}

function getCueCount(text) {
  return (
    text.match(
      /\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/g
    ) || []
  ).length;
}

async function readSubtitleText(response) {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes);
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes);
  }

  return new TextDecoder('utf-8').decode(bytes);
}

export async function GET(request) {
  const source = request.nextUrl.searchParams.get('url') || '';
  const sync = request.nextUrl.searchParams.get('sync') || '';

  let subtitleUrl;

  try {
    subtitleUrl = new URL(source);
  } catch {
    return NextResponse.json(
      { error: 'Invalid subtitle URL' },
      { status: 400 }
    );
  }

  if (!isAllowedSubtitleUrl(subtitleUrl)) {
    return NextResponse.json(
      { error: 'Subtitle URL host is not allowed' },
      { status: 400 }
    );
  }

  try {
    const subtitleRes = await fetch(subtitleUrl, {
      cache: 'no-store',
    });

    if (!subtitleRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch subtitle' },
        { status: subtitleRes.status }
      );
    }

    const subtitleText = await readSubtitleText(subtitleRes);
    const convertedText = looksLikeSrt(subtitleText)
      ? srtToWebVtt(subtitleText)
      : subtitleText;
    const firstCueStartMs = getFirstCueStartMs(convertedText);
    const cueCount = getCueCount(convertedText);
    const offsetMs = sync === 'start' ? -firstCueStartMs : 0;
    const responseText = shiftWebVtt(convertedText, offsetMs);

    return new Response(responseText, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'private, max-age=300',
        'X-Subtitle-Converted': String(looksLikeSrt(subtitleText)),
        'X-Subtitle-Cue-Count': String(cueCount),
        'X-Subtitle-First-Cue-Ms': String(firstCueStartMs),
        'X-Subtitle-Offset-Ms': String(offsetMs),
      },
    });
  } catch (error) {
    console.error('Error proxying subtitle:', error);

    return NextResponse.json(
      { error: 'Failed to proxy subtitle' },
      { status: 500 }
    );
  }
}
