import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClips } from "@/context/ClipsContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function PlaybackPage() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const { clips } = useClips();

  const clip = clips.find((c) => c.id === clipId);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!clip) return;
    const url = URL.createObjectURL(clip.blob);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setVideoUrl(null);
    };
  }, [clip]);

  const chartData = useMemo(() => {
    const samples = clip?.samples ?? [];
    return samples.map((s) => ({
      t: Math.round(s.tMs / 1000),
      speed: s.speedKmh,
      g: s.gForce,
      audio: s.audioLevel,
    }));
  }, [clip]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
        >
          ← Back
        </button>
        <span className="font-display font-semibold text-sm text-foreground">Playback</span>
      </div>

      <div className="p-4 space-y-4">
        {!clip ? (
          <p className="font-mono text-sm text-muted-foreground">Clip not found.</p>
        ) : (
          <>
            <div className="glass-panel rounded-xl p-4 border border-border/50">
              <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                {clip.date} • {clip.timestamp}
              </p>
              <p className="font-display text-base text-foreground mt-1">
                {clip.reason} {clip.locked ? "• Locked" : ""}
              </p>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border border-border/50">
              <div className="aspect-video bg-secondary">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-mono text-xs text-muted-foreground">Loading video…</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel rounded-xl p-4 border border-border/50">
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                  Peak G
                </p>
                <p className="font-mono text-xl text-foreground mt-2 tabular-nums">
                  {clip.gForce}g
                </p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-border/50">
                <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                  Audio spike
                </p>
                <p className="font-mono text-xl text-foreground mt-2 tabular-nums">
                  {clip.audioSpike}/10
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                  Speed graph
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {clip.durationSec ?? Math.max(0, chartData.at(-1)?.t ?? 0)}s
                </p>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="speed" stroke="hsl(var(--safe-green))" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                  G-force graph
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {chartData.length} pts
                </p>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="t" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="g" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                  Event timeline (demo)
                </p>
              </div>
              <div className="flex gap-1 items-center">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 flex-1 rounded-sm ${
                      i === 8 || i === 18 ? "bg-primary" : "bg-muted"
                    }`}
                    title={`t=${i}s`}
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground mt-3">
                Markers become real once we label events per-sample.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/incident/${clip.id}`)}
                className="py-3 rounded-xl font-display font-semibold text-sm bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Incident Report
              </button>
              <button
                onClick={() => {
                  if (!videoUrl) return;
                  const a = document.createElement("a");
                  a.href = videoUrl;
                  a.download = `${clip.id}.webm`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                className="py-3 rounded-xl font-display font-semibold text-sm bg-primary text-primary-foreground rec-glow hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Download
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

