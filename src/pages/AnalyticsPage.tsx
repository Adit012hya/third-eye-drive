import { useMemo } from "react";
import { useClips } from "@/context/ClipsContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AnalyticsPage() {
  const { clips } = useClips();

  const stats = useMemo(() => {
    const totalClips = clips.length;
    const avgSpeed =
      clips.length === 0
        ? 0
        : Math.round(
          clips.reduce((acc, c) => acc + (c.speed ?? 0), 0) / clips.length
        );
    const maxG = clips.reduce((m, c) => Math.max(m, c.gForce ?? 0), 0);
    const eventCount = clips.filter((c) => c.reason !== "Manual Save").length;
    return { totalClips, avgSpeed, maxG: +maxG.toFixed(1), eventCount };
  }, [clips]);

  const byDay = useMemo(() => {
    const map = new Map<string, { date: string; driveMin: number; events: number; avgSpeed: number; maxG: number }>();
    for (const c of clips) {
      const key = c.date;
      const prev = map.get(key) ?? { date: key, driveMin: 0, events: 0, avgSpeed: 0, maxG: 0 };
      prev.driveMin += 1;
      prev.events += c.reason === "Manual Save" ? 0 : 1;
      prev.avgSpeed = Math.round((prev.avgSpeed + (c.speed ?? 0)) / 2);
      prev.maxG = Math.max(prev.maxG, c.gForce ?? 0);
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [clips]);

  // Heatmap-style speed intensity: bucket each clip's speed into 10 bins per day
  const heat = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const c of clips) {
      const key = c.date;
      const bins = map.get(key) ?? Array.from({ length: 10 }, () => 0);
      const speedKmh = c.speed ?? 0;
      const idx = Math.max(0, Math.min(9, Math.floor((speedKmh / 120) * 10)));
      bins[idx] += 1;
      map.set(key, bins);
    }
    return Array.from(map.entries())
      .map(([date, bins]) => ({ date, bins }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [clips]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h1 className="font-display font-bold text-xl text-foreground">Analytics</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Total clips
          </p>
          <p className="font-mono text-xl text-foreground mt-2 tabular-nums">
            {stats.totalClips}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Average speed
          </p>
          <p className="font-mono text-xl text-foreground mt-2 tabular-nums">
            {stats.avgSpeed} km/h
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Max G-force
          </p>
          <p className="font-mono text-xl text-foreground mt-2 tabular-nums">
            {stats.maxG}g
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4 border border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Event count
          </p>
          <p className="font-mono text-xl text-foreground mt-2 tabular-nums">
            {stats.eventCount}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 border border-border/50">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-3">
          Events by day
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="events" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 border border-border/50">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-3">
          Speed intensity heatmap
        </p>
        <div className="space-y-3">
          {heat.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              Record some clips to populate analytics.
            </p>
          ) : (
            heat.map((row) => (
              <div key={row.date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">{row.date}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">0 → 120 km/h</span>
                </div>
                <div className="flex gap-1">
                  {row.bins.map((v, i) => {
                    const intensity = Math.min(1, v / 10);
                    return (
                      <div
                        key={i}
                        className="h-4 flex-1 rounded-sm"
                        style={{
                          background: `hsl(var(--safe-green) / ${0.08 + intensity * 0.6})`,
                        }}
                        title={`bin ${i} count ${v}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
