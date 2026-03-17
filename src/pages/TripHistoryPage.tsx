import { useMemo } from "react";
import { useClips } from "@/context/ClipsContext";

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function TripHistoryPage() {
  const { clips } = useClips();

  const trips = useMemo(() => {
    // Demo “trips”: group by date
    const map = new Map<string, { date: string; start: string; end: string; distanceKm: number; events: number; points: { lat: number; lon: number }[] }>();
    for (const c of clips) {
      const samples = c.samples ?? [];
      const startPt = samples[0];
      const endPt = samples[samples.length - 1];
      const points = samples.map((s) => ({ lat: s.lat, lon: s.lon }));
      let distanceKm = 0;
      for (let i = 1; i < points.length; i++) {
        distanceKm += haversineKm(points[i - 1], points[i]);
      }
      const prev =
        map.get(c.date) ??
        {
          date: c.date,
          start: c.timestamp,
          end: c.timestamp,
          distanceKm: 0,
          events: 0,
          points: [],
        };
      prev.start = prev.start < c.timestamp ? prev.start : c.timestamp;
      prev.end = prev.end > c.timestamp ? prev.end : c.timestamp;
      prev.distanceKm += distanceKm;
      prev.events += c.reason === "Manual Save" ? 0 : 1;
      if (startPt && endPt) prev.points.push({ lat: startPt.lat, lon: startPt.lon }, { lat: endPt.lat, lon: endPt.lon });
      map.set(c.date, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [clips]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h1 className="font-display font-bold text-xl text-foreground">Trip History</h1>

      {trips.length === 0 ? (
        <div className="glass-panel rounded-2xl p-4 border border-border/50">
          <p className="font-mono text-xs text-muted-foreground">
            Record clips to generate demo trip sessions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t.date} className="glass-panel rounded-2xl p-4 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-sm text-foreground">{t.date}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {t.start} → {t.end}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Distance</p>
                  <p className="font-mono text-sm text-foreground mt-1 tabular-nums">{t.distanceKm.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Events</p>
                  <p className="font-mono text-sm text-foreground mt-1 tabular-nums">{t.events}</p>
                </div>
              </div>
              {/* Simulated route polyline (mini sparkline style) */}
              <div className="h-12 flex gap-1 items-end">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-safe/30"
                    style={{ height: `${20 + ((i * 7) % 30)}%` }}
                    title={`segment ${i}`}
                  />
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                Route is simulated from stored GPS drift samples.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

