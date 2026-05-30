import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const BACKOFFICE_SESSION_COOKIE = 'bo_session';
export const JSON_BODY_LIMIT_BYTES = 32 * 1024;

export const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export function createBackofficeSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function getBackofficeToken(request) {
  return request.cookies.get(BACKOFFICE_SESSION_COOKIE)?.value || '';
}

export function unauthorizedResponse() {
  return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get('origin');
  const secFetchSite = request.headers.get('sec-fetch-site');

  if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    return false;
  }

  if (!origin) return true;

  return origin === request.nextUrl.origin;
}

export function forbiddenResponse(message = 'Forbidden') {
  return jsonResponse({ error: message }, { status: 403 });
}

export function jsonResponse(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...SECURITY_HEADERS,
      ...(init.headers || {}),
    },
  });
}

export async function readJsonBody(request, maxBytes = JSON_BODY_LIMIT_BYTES) {
  const contentLength = Number(request.headers.get('content-length') || 0);

  if (contentLength > maxBytes) {
    return { data: null, error: 'Request body too large', status: 413 };
  }

  const rawBody = await request.text().catch(() => '');

  if (!rawBody) {
    return { data: {}, error: null, status: 200 };
  }

  if (Buffer.byteLength(rawBody, 'utf8') > maxBytes) {
    return { data: null, error: 'Request body too large', status: 413 };
  }

  try {
    return { data: JSON.parse(rawBody), error: null, status: 200 };
  } catch {
    return { data: null, error: 'Invalid JSON body', status: 400 };
  }
}

export async function getBackofficeUserFromRequest(request) {
  const token = getBackofficeToken(request);

  if (!token) {
    return { token: '', user: null, error: { message: 'Missing session' } };
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase
    .rpc('backoffice_current_user', { p_session_token: token })
    .maybeSingle();

  return { token, user: data || null, error };
}

export function publicUser(user) {
  if (!user) return null;

  const { session_token, ...safeUser } = user;
  return safeUser;
}

export function setBackofficeSessionCookie(response, token, expiresAt) {
  response.cookies.set(BACKOFFICE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
}

export function clearBackofficeSessionCookie(response) {
  response.cookies.set(BACKOFFICE_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
