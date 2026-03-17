import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export type VideoQuality = "720p" | "1080p";

export interface SettingsState {
  videoQuality: VideoQuality;
  segmentDurationSec: 15 | 30 | 60;
  loopStorageLimitMb: number;
  impactSensitivity: number; // 1-10
  audioSensitivity: number; // 1-10
  theme: "dark" | "red";
  sosContacts: { id: string; name: string; phone: string }[];
}

const DEFAULTS: SettingsState = {
  videoQuality: "720p",
  segmentDurationSec: 15,
  loopStorageLimitMb: 250,
  impactSensitivity: 7,
  audioSensitivity: 5,
  theme: "dark",
  sosContacts: [
    { id: "msg-1", name: "Emergency Services", phone: "8848045383" },
    { id: "msg-2", name: "Police", phone: "8848045383" },
    { id: "msg-3", name: "Women Helpline", phone: "8848045383" },
    { id: "msg-4", name: "Friend", phone: "8848045383" },
  ],
};

const getSettingsKey = (userId: string) => `third-eye-settings-v1-${userId}`;

const SettingsContext = createContext<{
  settings: SettingsState;
  update: (patch: Partial<SettingsState>) => void;
  reset: () => void;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { auth, ready } = useAuth();
  const userId = auth.phone || "anonymous";
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);

  useEffect(() => {
    if (!ready) return;
    try {
      const raw = localStorage.getItem(getSettingsKey(userId));
      if (!raw) {
        setSettings(DEFAULTS);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setSettings((s) => ({ ...DEFAULTS, ...parsed }));
    } catch {
      setSettings(DEFAULTS);
    }
  }, [userId, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(getSettingsKey(userId), JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, userId, ready]);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-red", settings.theme === "red");
  }, [settings.theme]);

  const update = useCallback((patch: Partial<SettingsState>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

