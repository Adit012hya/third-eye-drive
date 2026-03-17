import { useNavigate, useParams } from "react-router-dom";
import { useClips } from "@/context/ClipsContext";

export default function IncidentReportPage() {
  const navigate = useNavigate();
  const { clipId } = useParams();
  const { clips } = useClips();
  const clip = clips.find((c) => c.id === clipId);
  const first = clip?.samples?.[0];
  const last = clip?.samples?.[clip.samples.length - 1];

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
        >
          ← Back
        </button>
        <span className="font-display font-semibold text-sm text-foreground">Incident Report</span>
      </div>
      <div className="p-4 space-y-4">
        {!clip ? (
          <p className="font-mono text-sm text-muted-foreground">Clip not found.</p>
        ) : (
          <>
            <div className="glass-panel rounded-xl p-4 border border-border/50 space-y-2">
              <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                Insurance-ready incident summary
              </p>
              <div className="flex justify-between">
                <span className="telemetry-text text-xs">TIME</span>
                <span className="font-mono text-xs text-foreground">
                  {clip.date} {clip.timestamp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="telemetry-text text-xs">TRIGGER</span>
                <span className="font-mono text-xs text-foreground">{clip.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="telemetry-text text-xs">PEAK G-FORCE</span>
                <span className="font-mono text-xs text-foreground">{clip.gForce}g</span>
              </div>
              <div className="flex justify-between">
                <span className="telemetry-text text-xs">AUDIO SPIKE</span>
                <span className="font-mono text-xs text-foreground">{clip.audioSpike}/10</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="telemetry-text text-xs">LOCATION</span>
                <span className="font-mono text-xs text-foreground">
                  {first ? `${first.lat.toFixed(5)}, ${first.lon.toFixed(5)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="telemetry-text text-xs">END</span>
                <span className="font-mono text-xs text-foreground">
                  {last ? `${last.lat.toFixed(5)}, ${last.lon.toFixed(5)}` : "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  // PDF simulation: download a text report
                  const text = [
                    "THIRD EYE — INCIDENT REPORT",
                    `Clip: ${clip.id}`,
                    `Time: ${clip.date} ${clip.timestamp}`,
                    `Trigger: ${clip.reason}`,
                    `Peak G: ${clip.gForce}g`,
                    `Audio Spike: ${clip.audioSpike}/10`,
                    `Start: ${first ? `${first.lat}, ${first.lon}` : "—"}`,
                    `End: ${last ? `${last.lat}, ${last.lon}` : "—"}`,
                  ].join("\\n");
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `incident-${clip.id}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className="py-3 rounded-xl font-display font-semibold text-sm bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Export (PDF sim)
              </button>
              <button
                onClick={async () => {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const navAny: any = navigator;
                    await navAny.share?.({
                      title: "Incident Report",
                      text: `Incident at ${clip.date} ${clip.timestamp} — ${clip.reason}`,
                    });
                  } catch (e) {
                    console.error("Share failed:", e);
                  }
                }}
                className="py-3 rounded-xl font-display font-semibold text-sm bg-primary text-primary-foreground rec-glow hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Share
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

