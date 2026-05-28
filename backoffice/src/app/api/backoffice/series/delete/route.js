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

  const { seriesId } = await request.json().catch(() => ({}));
  const numericSeriesId = Number(seriesId);

  if (!Number.isSafeInteger(numericSeriesId) || numericSeriesId <= 0) {
    return NextResponse.json({ error: 'Invalid series id' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_delete_series', {
    p_session_token: token,
    p_series_id: numericSeriesId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ data });
}
