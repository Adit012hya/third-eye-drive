import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClips } from "@/context/ClipsContext";
import logoImage from "@/assets/third-eye-logo.png";

export default function HomePage() {
  const navigate = useNavigate();
  const { clips } = useClips();
  const latest = clips[0];
  const [storagePct, setStoragePct] = useState<number | null>(null);

  useEffect(() => {
    if (!("storage" in navigator) || !navigator.storage?.estimate) return;
    navigator.storage
      .estimate()
      .then((e) => {
        if (!e.quota || !e.usage) return;
        setStoragePct(Math.round((e.usage / e.quota) * 100));
      })
      .catch(() => setStoragePct(null));
  }, []);

  const previewUrl = useMemo(() => {
    if (!latest) return null;
    return URL.createObjectURL(latest.blob);
  }, [latest]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Third Eye" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-tight">
              Third Eye Drive
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Smart Dashcam Demo
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/record")}
          className="px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 font-mono text-[10px] tracking-wider uppercase hover:bg-primary/15 transition-colors"
        >
          Record
        </button>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Large live preview */}
        <div className="col-span-2 glass-panel rounded-2xl overflow-hidden border border-border/50">
          <div className="aspect-video bg-secondary relative">
            {previewUrl ? (
              <video src={previewUrl} muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="font-mono text-xs text-muted-foreground">
                  No clips yet — record your first clip
                </p>
              </div>
            )}
            <div className="absolute top-3 left-3 glass-panel px-2 py-1 rounded-md">
              <span className="font-mono text-[10px] text-safe tracking-wider">
                STATUS: READY
              </span>
            </div>
          </div>
          <div className="p-4">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Latest clip
            </p>
            <p className="font-display text-sm text-foreground mt-1">
              {latest ? `${latest.date} • ${latest.timestamp} • ${latest.reason}` : "—"}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Speed (demo)
          </p>
          <p className="font-mono text-2xl text-foreground mt-2 tabular-nums">
            {latest?.samples?.length ? latest.samples[latest.samples.length - 1].speedKmh : "—"}
            <span className="text-sm text-muted-foreground"> km/h</span>
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70 mt-2">
            Live telemetry samples
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Storage
          </p>
          <p className="font-mono text-2xl text-foreground mt-2 tabular-nums">
            {storagePct !== null ? storagePct : "—"}
            <span className="text-sm text-muted-foreground">%</span>
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70 mt-2">
            Browser IndexedDB usage
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Clips
          </p>
          <p className="font-mono text-2xl text-foreground mt-2 tabular-nums">
            {clips.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70 mt-2">
            Saved to Archive
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Quick actions
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate("/archive")}
              className="py-2.5 rounded-xl font-mono text-[10px] tracking-wider uppercase bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
            >
              Archive
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="py-2.5 rounded-xl font-mono text-[10px] tracking-wider uppercase bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
            >
              Analytics
            </button>
            <button
              onClick={() => navigate("/ai-alerts")}
              className="py-2.5 rounded-xl font-mono text-[10px] tracking-wider uppercase bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
            >
              AI Alerts
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="py-2.5 rounded-xl font-mono text-[10px] tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors active:scale-[0.98]"
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

