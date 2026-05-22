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

  const body = await request.json().catch(() => ({}));
  const supabase = createBackofficeSupabaseClient();
  let rpcName = '';
  let args = {};

  if (body.action === 'create') {
    rpcName = 'backoffice_users_create_secure';
    args = {
      p_session_token: token,
      p_username: body.username,
      p_password: body.password,
      p_perm_series: !!body.perm_series,
      p_perm_genres: !!body.perm_genres,
      p_perm_displays: !!body.perm_displays,
      p_perm_content_producers: !!body.perm_content_producers,
      p_perm_sales: !!body.perm_sales,
      p_perm_reports: !!body.perm_reports,
      p_perm_customers: !!body.perm_customers,
      p_perm_users: !!body.perm_users,
    };
  } else if (body.action === 'update') {
    rpcName = 'backoffice_users_update_secure';
    args = {
      p_session_token: token,
      p_user_id: body.user_id,
      p_username: body.username,
      p_password: body.password || '',
      p_perm_series: !!body.perm_series,
      p_perm_genres: !!body.perm_genres,
      p_perm_displays: !!body.perm_displays,
      p_perm_content_producers: !!body.perm_content_producers,
      p_perm_sales: !!body.perm_sales,
      p_perm_reports: !!body.perm_reports,
      p_perm_customers: !!body.perm_customers,
      p_perm_users: !!body.perm_users,
    };
  } else if (body.action === 'delete') {
    rpcName = 'backoffice_users_delete_secure';
    args = {
      p_session_token: token,
      p_user_id: body.user_id,
    };
  } else {
    return NextResponse.json({ error: 'Unsupported user action' }, { status: 400 });
  }

  const { error } = await supabase.rpc(rpcName, args);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
