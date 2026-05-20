import { NextResponse } from 'next/server';
import {
  clearBackofficeSessionCookie,
  getBackofficeUserFromRequest,
  publicUser,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { user, error } = await getBackofficeUserFromRequest(request);

  if (error || !user) {
    const response = NextResponse.json({ user: null }, { status: 401 });
    clearBackofficeSessionCookie(response);
    return response;
  }

  return NextResponse.json({ user: publicUser(user) });
}
