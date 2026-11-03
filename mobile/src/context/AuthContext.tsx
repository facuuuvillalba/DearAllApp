import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { tokenStorage } from '@/storage/tokenStorage';
import { authApi } from '@/api/endpoints';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import type { User } from '@/api/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await tokenStorage.clear().catch(() => undefined);
  }, []);

  // Restaura la sesión al abrir la app: lee el JWT del almacenamiento seguro y lo valida en el servidor.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });

    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          setAuthToken(token);
          const { user: me } = await authApi.me();
          setUser(me);
        }
      } catch {
        // Token inválido o servidor inalcanzable: se exige volver a iniciar sesión.
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();

    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user: me } = await authApi.login(email, password);
    await tokenStorage.set(token);
    setAuthToken(token);
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut: clearSession }),
    [user, loading, signIn, clearSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
