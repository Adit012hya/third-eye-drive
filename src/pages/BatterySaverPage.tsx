import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function BatterySaverPage() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="w-3 h-3 rounded-full bg-primary rec-pulse mx-auto mb-6" />
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Battery Saver
        </p>
        <p className="font-mono text-3xl text-foreground tabular-nums mt-4">
          {mm}:{ss}
        </p>
        <p className="font-mono text-xs text-muted-foreground/60 mt-4">
          Recording status: active
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-10 bg-primary text-primary-foreground font-display font-semibold text-base px-8 py-3 rounded-xl rec-glow hover:brightness-110 transition-all active:scale-95"
        >
          Wake Screen
        </button>
      </div>
    </div>
  );
}

