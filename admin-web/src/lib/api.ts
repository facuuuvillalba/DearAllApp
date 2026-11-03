const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export const SESSION_KEY = 'admin_session';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as { token: string }).token : null;
}

type Options = { method?: string; body?: unknown };

/** Cliente fetch tipado; adjunta el JWT y normaliza errores. */
export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.location.assign('/login');
    }
    throw new ApiError(res.status, data.error ?? 'Error inesperado', data.details);
  }
  return data as T;
}
