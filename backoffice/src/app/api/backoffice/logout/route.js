import { NextResponse } from 'next/server';
import {
  clearBackofficeSessionCookie,
  createBackofficeSupabaseClient,
  forbiddenResponse,
  getBackofficeToken,
  isSameOriginRequest,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);

  if (token) {
    const supabase = createBackofficeSupabaseClient();
    await supabase.rpc('backoffice_logout', { p_session_token: token });
  }

  const response = NextResponse.json({ ok: true });
  clearBackofficeSessionCookie(response);
  return response;
}
