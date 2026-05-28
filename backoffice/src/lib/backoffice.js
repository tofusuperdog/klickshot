export function getSessionToken() {
  return null;
}

async function postBackoffice(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { data: null, error: { message: result.error || 'Request failed' } };
  }

  return { data: result.data ?? null, error: null };
}

export async function backofficeQuery(user, resource, params = {}) {
  if (!user) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return postBackoffice('/api/backoffice/query', { resource, params });
}

export async function backofficeMutation(
  user,
  table,
  action,
  payload = {},
  filter = {},
  onConflict = null
) {
  if (!user) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return postBackoffice('/api/backoffice/mutation', {
    table,
    action,
    payload,
    filter,
    onConflict,
  });
}

export async function backofficeDeleteSeries(user, seriesId) {
  if (!user) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return postBackoffice('/api/backoffice/series/delete', { seriesId });
}

export async function backofficeUserMutation(user, action, payload = {}) {
  if (!user) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return postBackoffice('/api/backoffice/users', { action, ...payload });
}

export async function backofficeContentProducerMutation(user, action, payload = {}) {
  if (!user) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return postBackoffice('/api/backoffice/content-producers', { action, ...payload });
}
