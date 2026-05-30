import {
  clearBackofficeSessionCookie,
  getBackofficeUserFromRequest,
  jsonResponse,
  publicUser,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { user, error } = await getBackofficeUserFromRequest(request);

  if (error || !user) {
    const response = jsonResponse({ user: null }, { status: 401 });
    clearBackofficeSessionCookie(response);
    return response;
  }

  return jsonResponse({ user: publicUser(user) });
}
