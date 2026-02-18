import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Clip {
  id: number;
  timestamp: string;
  reason: "Manual Save" | "Impact Event" | "Audio Event" | "Locked Event";
  locked: boolean;
  speed: number;
  gForce: number;
  audioSpike: number;
  date: string;
}

const sampleClips: Clip[] = [
  { id: 1, timestamp: "12:45:10", reason: "Locked Event", locked: true, speed: 67, gForce: 2.1, audioSpike: 9, date: "2026-02-18" },
  { id: 2, timestamp: "12:32:44", reason: "Manual Save", locked: false, speed: 42, gForce: 0.4, audioSpike: 3, date: "2026-02-18" },
  { id: 3, timestamp: "12:01:03", reason: "Impact Event", locked: true, speed: 78, gForce: 3.8, audioSpike: 10, date: "2026-02-18" },
  { id: 4, timestamp: "11:22:17", reason: "Audio Event", locked: false, speed: 35, gForce: 0.3, audioSpike: 8, date: "2026-02-17" },
  { id: 5, timestamp: "10:55:41", reason: "Manual Save", locked: false, speed: 60, gForce: 0.5, audioSpike: 4, date: "2026-02-17" },
];

interface ArchiveScreenProps {
  onBack: () => void;
}

const ArchiveScreen = ({ onBack }: ArchiveScreenProps) => {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  const getReasonColor = (reason: Clip["reason"]) => {
    switch (reason) {
      case "Impact Event":
      case "Locked Event":
        return "text-primary";
      case "Audio Event":
        return "text-warning";
      case "Manual Save":
        return "text-safe";
    }
  };

  // Playback view
  if (selectedClip) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="h-screen flex flex-col bg-background"
      >
        <div className="flex items-center px-4 py-3 border-b border-border">
          <button
            onClick={() => setSelectedClip(null)}
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
          >
            ← Back
          </button>
          <span className="font-display font-semibold text-sm text-foreground">Clip Playback</span>
        </div>

        {/* Video player area */}
        <div className="aspect-video bg-secondary mx-4 mt-4 rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-foreground/20 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-foreground/40 border-b-[10px] border-b-transparent ml-1" />
            </div>
          </div>
          <div className="absolute top-3 left-3 glass-panel px-2 py-1 rounded-md">
            <span className="font-mono text-[10px] text-primary">● REC {selectedClip.timestamp}</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="p-4 space-y-4 mt-2">
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="telemetry-text text-xs">DATE</span>
              <span className="font-mono text-xs text-foreground">{selectedClip.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="telemetry-text text-xs">TIME</span>
              <span className="font-mono text-xs text-foreground">{selectedClip.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="telemetry-text text-xs">TRIGGER</span>
              <span className={`font-mono text-xs font-semibold ${getReasonColor(selectedClip.reason)}`}>
                {selectedClip.reason}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="telemetry-text text-xs">SPEED AT EVENT</span>
              <span className="font-mono text-xs text-foreground">{selectedClip.speed} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="telemetry-text text-xs">G-FORCE PEAK</span>
              <span className="font-mono text-xs text-foreground">{selectedClip.gForce}g</span>
            </div>
            <div className="flex justify-between">
              <span className="telemetry-text text-xs">AUDIO SPIKE</span>
              <span className="font-mono text-xs text-foreground">{selectedClip.audioSpike}/10</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border">
        <button
          onClick={onBack}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
        >
          ← Back
        </button>
        <span className="font-display font-semibold text-sm text-foreground">Archive</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{sampleClips.length} clips</span>
      </div>

      {/* Clips List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sampleClips.map((clip, index) => (
          <motion.button
            key={clip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedClip(clip)}
            className="w-full glass-panel rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/80 transition-colors text-left active:scale-[0.98]"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-foreground">{clip.timestamp}</span>
                {clip.locked && (
                  <span className="text-[10px]">🔒</span>
                )}
              </div>
              <span className={`font-mono text-xs ${getReasonColor(clip.reason)}`}>
                {clip.reason}
              </span>
            </div>
            <div className="text-muted-foreground/40 text-sm">→</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ArchiveScreen;
