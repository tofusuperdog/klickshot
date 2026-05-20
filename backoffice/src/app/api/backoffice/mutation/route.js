import { NextResponse } from 'next/server';
import {
  createBackofficeSupabaseClient,
  forbiddenResponse,
  getBackofficeToken,
  isSameOriginRequest,
  unauthorizedResponse,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const {
    table,
    action,
    payload = {},
    filter = {},
    onConflict = null,
  } = await request.json().catch(() => ({}));

  if (!table || !action) {
    return NextResponse.json({ error: 'Missing mutation target' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_mutation', {
    p_session_token: token,
    p_table: table,
    p_action: action,
    p_payload: payload,
    p_filter: filter,
    p_on_conflict: onConflict,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ data });
}
