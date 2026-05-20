import { NextResponse } from 'next/server';
import {
  createBackofficeSupabaseClient,
  publicUser,
  setBackofficeSessionCookie,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { username = '', password = '' } = await request.json().catch(() => ({}));
  const trimmedUsername = String(username).trim();
  const trimmedPassword = String(password).trim();

  if (!trimmedUsername || !trimmedPassword) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase
    .rpc('backoffice_login', {
      p_username: trimmedUsername,
      p_password: trimmedPassword,
    })
    .maybeSingle();

  if (error || !data?.session_token) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ user: publicUser(data) });
  setBackofficeSessionCookie(response, data.session_token, data.session_expires_at);
  return response;
}
