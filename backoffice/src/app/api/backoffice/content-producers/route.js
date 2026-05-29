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
    rpcName = 'backoffice_content_producers_create_secure';
    args = {
      p_session_token: token,
      p_name: body.name,
      p_username: body.username,
      p_password: body.password,
    };
  } else if (body.action === 'update') {
    rpcName = 'backoffice_content_producers_update_secure';
    args = {
      p_session_token: token,
      p_content_producer_id: body.content_producer_id,
      p_name: body.name,
      p_username: body.username,
      p_password: body.password || '',
    };
  } else if (body.action === 'delete') {
    rpcName = 'backoffice_content_producers_delete_secure';
    args = {
      p_session_token: token,
      p_content_producer_id: body.content_producer_id,
    };
  } else if (body.action === 'set_status') {
    rpcName = 'backoffice_content_producers_set_status_secure';
    args = {
      p_session_token: token,
      p_content_producer_id: body.content_producer_id,
      p_status: body.status,
    };
  } else {
    return NextResponse.json({ error: 'Unsupported content producer action' }, { status: 400 });
  }

  const { error } = await supabase.rpc(rpcName, args);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
