export type SessionEntry = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  language?: string;
};

type SessionRecord = {
  sessionId: string;
  tokenId: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
};

type SessionResponse = {
  session: SessionRecord;
  files: SessionEntry[];
};

const API_BASE_URL = 'http://localhost:3000';

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function createSession(): Promise<SessionResponse> {
  const response = await fetch(buildUrl('/sessions'), {
    method: 'POST',
    credentials: 'include',
  });

  return parseJsonResponse<SessionResponse>(response);
}

export async function fetchCurrentSession(): Promise<SessionResponse> {
  const response = await fetch(buildUrl('/sessions/current'), {
    credentials: 'include',
  });

  return parseJsonResponse<SessionResponse>(response);
}

export async function initializeSession(): Promise<SessionResponse> {
  try {
    return await fetchCurrentSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (
      message.includes('401') ||
      message.includes('404') ||
      message.includes('missing') ||
      message.includes('valid')
    ) {
      return createSession();
    }

    throw error;
  }
}

export async function fetchSessionEntries(sessionId: string): Promise<SessionEntry[]> {
  const response = await fetch(buildUrl(`/sessions/${sessionId}`), {
    credentials: 'include',
  });

  const data = await parseJsonResponse<SessionResponse>(response);
  return Array.isArray(data.files) ? data.files : [];
}

export async function saveSessionEntries(sessionId: string, files: SessionEntry[]): Promise<void> {
  const response = await fetch(buildUrl(`/sessions/${sessionId}/files`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });

  await parseJsonResponse(response);
}
