import { API_URL } from '@/config';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** El AuthContext registra aquí cómo reaccionar ante un 401 (token vencido/usuario desactivado). */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

const TIMEOUT_MS = 15000;

export async function request<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    const hint = __DEV__ ? ` (${API_URL})` : '';
    throw new ApiError(0, `No se pudo conectar con el servidor. Revisa tu conexión${hint}`);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Un 401 con sesión activa significa token inválido; en el login significa credenciales erróneas.
    if (res.status === 401 && authToken) onUnauthorized?.();
    throw new ApiError(res.status, data.error ?? 'Ocurrió un error inesperado');
  }
  return data as T;
}
