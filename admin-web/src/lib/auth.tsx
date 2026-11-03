'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, SESSION_KEY } from './api';
import type { SessionUser } from './types';

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * La sesión vive en sessionStorage (se descarta al cerrar la pestaña).
 * Para endurecerlo más, el backend puede emitir el JWT en una cookie httpOnly.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) setUser((JSON.parse(raw) as { user: SessionUser }).user);
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ token: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.user.role !== 'Admin') {
      throw new ApiError(403, 'Acceso restringido a administradores');
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
