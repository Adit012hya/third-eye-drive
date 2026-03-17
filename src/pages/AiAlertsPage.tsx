import { useMemo } from "react";
import { useClips } from "@/context/ClipsContext";

type AlertType =
  | "Harsh braking"
  | "Sudden acceleration"
  | "Overspeed"
  | "Distraction";

export default function AiAlertsPage() {
  const { clips } = useClips();

  const alerts = useMemo(() => {
    // Simulate “AI alerts” deterministically from clip ids + telemetry
    const out: { id: string; type: AlertType; date: string; time: string; severity: 1 | 2 | 3 }[] = [];
    for (const c of clips) {
      const seed = c.id.length + (c.samples?.length ?? 0);
      const roll = seed % 4;
      const type: AlertType =
        roll === 0 ? "Harsh braking" : roll === 1 ? "Sudden acceleration" : roll === 2 ? "Overspeed" : "Distraction";
      const severity = ((seed % 3) + 1) as 1 | 2 | 3;
      // Only show for some clips
      if (seed % 2 === 0) out.push({ id: c.id, type, date: c.date, time: c.timestamp, severity });
    }
    return out.slice(0, 30);
  }, [clips]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h1 className="font-display font-bold text-xl text-foreground">AI Alerts</h1>

      {alerts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-4 border border-border/50">
          <p className="font-mono text-xs text-muted-foreground">
            Record a few clips to populate simulated alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="glass-panel rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-sm text-foreground">{a.type}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {a.date} {a.time}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">Severity</span>
                <span className="font-mono text-xs text-foreground">
                  {a.severity}/3
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

