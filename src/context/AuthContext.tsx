import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthState {
  phone?: string | null;
  loggedIn: boolean;
}

interface AuthContextValue {
  auth: AuthState;
  ready: boolean;
  login: (phone: string) => void;
  logout: () => void;
}

const KEY = "third-eye-auth-v1";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ phone: null, loggedIn: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuthState;
      setAuth(parsed);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(auth));
    } catch {
      // ignore
    }
  }, [auth]);

  const login = useCallback((phone: string) => {
    setAuth({ phone, loggedIn: true });
  }, []);

  const logout = useCallback(() => {
    setAuth({ phone: null, loggedIn: false });
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ auth, ready, login, logout }), [auth, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

