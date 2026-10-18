export class ApiError extends Error {
  constructor(message, status = 0, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function api(path, options = {}) {
  const { body, headers, ...rest } = options;
  const config = {
    credentials: 'same-origin',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(headers || {})
    }
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      config.body = body;
    } else {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(path, config);
  } catch {
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && data.error
        ? data.error
        : `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status, data?.details);
  }

  return data;
}

export async function getCurrentUser() {
  try {
    const data = await api('/api/auth/me');
    return data?.user || null;
  } catch {
    return null;
  }
}

export function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return '?';
  return parts.map((part) => part[0]).join('').toUpperCase();
}
