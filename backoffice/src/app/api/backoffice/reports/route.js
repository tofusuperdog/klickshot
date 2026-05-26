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

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const supabase = createBackofficeSupabaseClient();
  const reportId = request.nextUrl.searchParams.get('id');

  const rpcName = reportId
    ? 'backoffice_partner_revenue_report_detail'
    : 'backoffice_partner_revenue_reports';
  const args = reportId
    ? { p_session_token: token, p_report_id: reportId }
    : { p_session_token: token };

  const { data, error } = await supabase.rpc(rpcName, args);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ data });
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const action = body.action || 'create';
  const supabase = createBackofficeSupabaseClient();

  if (action === 'create') {
    const payload = body.payload || {};
    const { data, error } = await supabase.rpc('backoffice_create_partner_revenue_report', {
      p_session_token: token,
      p_report_name: payload.report_name,
      p_start_date: payload.start_date,
      p_end_date: payload.end_date,
      p_tiktok_revenue: payload.tiktok_revenue,
      p_platform_expense: payload.platform_expense,
      p_free_episode_weight: payload.free_episode_weight,
      p_paid_episode_weight: payload.paid_episode_weight,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  }

  if (!['send', 'cancel', 'delete'].includes(action)) {
    return badRequest('Unsupported action');
  }

  if (!body.report_id) {
    return badRequest('Missing report id');
  }

  const { data, error } = await supabase.rpc('backoffice_update_partner_revenue_report_status', {
    p_session_token: token,
    p_report_id: body.report_id,
    p_action: action,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
