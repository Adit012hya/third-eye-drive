import { useClips } from "@/context/ClipsContext";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { PasswordModal } from "@/components/PasswordModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { clearAll } = useClips();
  const { settings, update, reset } = useSettings();
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [userName, setUserName] = useState("Loading...");
  const [userEmail, setUserEmail] = useState(auth.phone || "...");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        if (data.user.email) setUserEmail(data.user.email);
        if (data.user.user_metadata?.full_name) {
          setUserName(data.user.user_metadata.full_name);
        } else if (data.user.email) {
          setUserName(data.user.email.split("@")[0]);
        } else {
          setUserName("Dashcam User");
        }
      } else {
        setUserName("Local User");
      }
    });
  }, []);

  const handleClearStorageRequest = () => {
    if (window.confirm("Clear all stored clips?")) {
      setIsPasswordModalOpen(true);
    }
  };

  const handleClearStorage = async () => {
    await clearAll();
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-4">
      <h1 className="font-display font-bold text-xl text-foreground">Settings</h1>

      <div className="glass-panel rounded-2xl p-4 border border-border/50 flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-xl uppercase border border-primary/30 shrink-0">
          {userName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-lg text-foreground truncate leading-tight">{userName}</h2>
          <p className="font-mono text-xs text-muted-foreground truncate mt-0.5">{userEmail}</p>
        </div>
        <button
          onClick={() => setIsChangePasswordModalOpen(true)}
          className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg active:scale-95 shrink-0"
        >
          Password
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-border/50 space-y-4">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Recording settings
        </p>

        <div className="space-y-2">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Video quality
          </p>
          <div className="flex gap-2">
            {(["720p", "1080p"] as const).map((q) => (
              <button
                key={q}
                onClick={() => update({ videoQuality: q })}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] tracking-wider uppercase border transition-colors ${
                  settings.videoQuality === q
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Segment duration
          </p>
          <div className="flex gap-2">
            {([15, 30, 60] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ segmentDurationSec: s })}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] tracking-wider uppercase border transition-colors ${
                  settings.segmentDurationSec === s
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Loop storage limit
            </p>
            <span className="font-mono text-[10px] text-foreground">
              {settings.loopStorageLimitMb} MB
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={1000}
            step={25}
            value={settings.loopStorageLimitMb}
            onChange={(e) => update({ loopStorageLimitMb: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-border/50 space-y-4">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Detection settings
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Impact sensitivity
            </p>
            <span className="font-mono text-[10px] text-foreground">{settings.impactSensitivity}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={settings.impactSensitivity}
            onChange={(e) => update({ impactSensitivity: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Audio sensitivity
            </p>
            <span className="font-mono text-[10px] text-foreground">{settings.audioSensitivity}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={settings.audioSensitivity}
            onChange={(e) => update({ audioSensitivity: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-border/50 space-y-4">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          App settings
        </p>

        <div className="space-y-2">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Theme
          </p>
          <div className="flex gap-2">
            {(["dark", "red"] as const).map((t) => (
              <button
                key={t}
                onClick={() => update({ theme: t })}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] tracking-wider uppercase border transition-colors ${
                  settings.theme === t
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={reset}
            className="py-3 rounded-xl font-display font-semibold text-sm bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
          >
            Reset settings
          </button>
          <button
            onClick={handleClearStorageRequest}
            className="py-3 rounded-xl font-display font-semibold text-sm bg-destructive text-destructive-foreground border border-destructive/30 hover:brightness-110 transition-all active:scale-[0.98]"
          >
            Clear storage
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-border/50 space-y-3">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Emergency
        </p>
        <button
          onClick={() => navigate("/settings/sos")}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl font-display font-semibold text-sm bg-secondary text-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            SOS Contacts
          </div>
          <span className="text-muted-foreground">→</span>
        </button>
      </div>

      <button
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
        className="w-full py-3.5 mt-2 rounded-xl font-display font-semibold text-sm bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all active:scale-[0.98]"
      >
        Sign Out
      </button>

      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleClearStorage}
        title="Enter Password to Clear Storage"
      />

      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
}

