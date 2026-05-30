import {
  createBackofficeSupabaseClient,
  forbiddenResponse,
  getBackofficeToken,
  isSameOriginRequest,
  jsonResponse,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/backofficeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOriginRequest(request)) return forbiddenResponse();

  const token = getBackofficeToken(request);
  if (!token) return unauthorizedResponse();

  const body = await readJsonBody(request);
  if (body.error) {
    return jsonResponse({ error: body.error }, { status: body.status });
  }

  const { resource, params = {} } = body.data || {};
  if (!resource) {
    return jsonResponse({ error: 'Missing resource' }, { status: 400 });
  }

  const supabase = createBackofficeSupabaseClient();
  const { data, error } = await supabase.rpc('backoffice_query', {
    p_session_token: token,
    p_resource: resource,
    p_params: params,
  });

  if (error) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 });
  }

  return jsonResponse({ data });
}
