import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const BACKOFFICE_SESSION_COOKIE = 'bo_session';

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
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get('origin');

  if (!origin) return true;

  return origin === request.nextUrl.origin;
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
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
