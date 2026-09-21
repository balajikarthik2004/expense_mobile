import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, tokens, setAuthFailureHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Logging out server-side is best-effort; the local session goes regardless.
    }
    await tokens.clear();
    setUser(null);
  }, []);

  // A refresh failure deep in the client clears the session here too.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const access = await tokens.getAccess();
        if (!access) return;
        const data = await api.me();
        if (!cancelled) setUser(data.user ?? data);
      } catch {
        await tokens.clear();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(async (fn) => {
    const data = await fn();
    await tokens.save({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      settings: user?.settings ?? { currency: 'INR', weekStart: 'sun', theme: 'warm' },
      signIn: (credentials) => authenticate(() => api.login(credentials)),
      signUp: (payload) => authenticate(() => api.register(payload)),
      signOut,
      setUser,
    }),
    [user, bootstrapping, authenticate, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
