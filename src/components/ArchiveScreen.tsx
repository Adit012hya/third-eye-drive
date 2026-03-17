import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClips } from "@/context/ClipsContext";
import type { Clip } from "@/lib/clipStorage";
import { PasswordModal } from "./PasswordModal";
import { MapModal } from "./MapModal";

interface ArchiveScreenProps {
  onBack: () => void;
}

const ArchiveScreen = ({ onBack }: ArchiveScreenProps) => {
  const { clips, deleteClip } = useClips();
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState<"All" | "Manual" | "Impact" | "Audio" | "Locked">("All");
  const [queryDate, setQueryDate] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const longPressTimer = useRef<number | null>(null);

  const filteredClips = useMemo(() => {
    return clips.filter((c) => {
      const matchesDate = queryDate ? c.date.includes(queryDate) : true;
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Manual"
            ? c.reason === "Manual Save"
            : filter === "Impact"
              ? c.reason === "Impact Event"
              : filter === "Audio"
                ? c.reason === "Audio Event"
                : c.locked;
      return matchesDate && matchesFilter;
    });
  }, [clips, filter, queryDate]);

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

  const handleDeleteRequest = (e: React.MouseEvent, ids: string[]) => {
    e.stopPropagation();
    setPendingDeleteIds(ids);
    setIsPasswordModalOpen(true);
  };

  const executeDelete = async () => {
    if (pendingDeleteIds.length === 0) return;
    for (const id of pendingDeleteIds) {
      setDeletingId(id);
      await deleteClip(id);
      if (selectedClip?.id === id) setSelectedClip(null);
    }
    setDeletingId(null);
    setPendingDeleteIds([]);
    setIsSelectionMode(false);
    setSelectedIds([]);
    setIsPasswordModalOpen(false);
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (isSelectionMode) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = window.setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedIds([id]);
      if (navigator.vibrate) navigator.vibrate(50);
      longPressTimer.current = null;
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleItemClick = (e: React.MouseEvent, clip: Clip) => {
    clearLongPress();
    if (isSelectionMode) {
      e.stopPropagation();
      const isSel = selectedIds.includes(clip.id);
      if (isSel) {
        setSelectedIds(selectedIds.filter(i => i !== clip.id));
      } else {
        setSelectedIds([...selectedIds, clip.id]);
      }
    } else {
      setSelectedClip(clip);
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (selectedClip) {
      const url = URL.createObjectURL(selectedClip.blob);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setVideoUrl(null);
      };
    }
  }, [selectedClip]);

  // Playback view
  if (selectedClip && videoUrl) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="h-full flex flex-col bg-background relative"
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

        <div className="flex-1 overflow-y-auto">
          <div className="aspect-video bg-secondary mx-4 mt-4 rounded-xl overflow-hidden relative shrink-0">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 glass-panel px-2 py-1 rounded-md pointer-events-none">
              <span className="font-mono text-[10px] text-primary">
                ● REC {selectedClip.timestamp}
              </span>
            </div>
            
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = videoUrl;
                  a.download = `${selectedClip.id}.webm`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                title="Download Video"
                className="glass-panel p-2 rounded-lg hover:brightness-110 active:scale-95 transition-all text-white shadow-lg backdrop-blur bg-black/40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button
                onClick={async () => {
                  try {
                    const file = new File([selectedClip.blob], `${selectedClip.id}.webm`, {
                      type: "video/webm",
                    });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const navAny: any = navigator;
                    if (navAny.canShare?.({ files: [file] })) {
                      await navAny.share({
                        title: "Third Eye Clip",
                        text: `${selectedClip.date} ${selectedClip.timestamp} — ${selectedClip.reason}`,
                        files: [file],
                      });
                    } else {
                      alert("Native file sharing is not supported on this device/browser.");
                    }
                  } catch (e) {
                    console.error("Share failed:", e);
                  }
                }}
                title="Share Video"
                className="glass-panel p-2 rounded-lg hover:brightness-110 active:scale-95 transition-all text-white shadow-lg backdrop-blur bg-black/40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-8">
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
              
              {selectedClip.location && (
                <>
                  <div className="h-px bg-border" />
                  <div className="space-y-2 mt-2">
                    <span className="telemetry-text text-xs">EVENT LOCATION PINPOINT (TAP TO ZOOM)</span>
                    <button 
                      onClick={() => setIsMapModalOpen(true)}
                      className="w-full rounded-lg overflow-hidden border border-border bg-secondary aspect-[2/1] relative hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        className="pointer-events-none"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedClip.location.lon - 0.005},${selectedClip.location.lat - 0.005},${selectedClip.location.lon + 0.005},${selectedClip.location.lat + 0.005}&layer=mapnik&marker=${selectedClip.location.lat},${selectedClip.location.lon}`} 
                      ></iframe>
                      <div className="absolute inset-0 z-10 bg-transparent flex items-center justify-center">
                        <span className="glass-panel text-white text-[10px] font-mono font-bold px-2 py-1 rounded shadow-lg backdrop-blur bg-black/50">
                          View Map →
                        </span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={(e) => handleDeleteRequest(e, [selectedClip.id])}
              disabled={!!deletingId}
              className="w-full py-2.5 rounded-lg font-mono text-xs text-destructive hover:bg-destructive/10 transition-colors border border-destructive/50"
            >
              {deletingId === selectedClip.id ? "Deleting..." : "Delete Clip"}
            </button>
          </div>
        </div>

        <PasswordModal 
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPendingDeleteIds([]);
          }}
          onSuccess={executeDelete}
          title="Enter Password to Delete"
        />

        <MapModal 
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          location={selectedClip.location}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="h-full flex flex-col bg-background relative"
    >
      <div className="flex items-center px-4 py-3 border-b border-border">
        <button
          onClick={onBack}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
        >
          ← Back
        </button>
        <span className="font-display font-semibold text-sm text-foreground">Archive</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{filteredClips.length} clips</span>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="glass-panel rounded-xl p-3 border border-border/50">
          <div className="flex gap-2">
            {(["All", "Manual", "Impact", "Audio", "Locked"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`flex-1 py-2 rounded-lg font-mono text-[10px] tracking-wider uppercase border transition-colors ${
                  filter === k
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <input
              value={queryDate}
              onChange={(e) => setQueryDate(e.target.value)}
              placeholder="Search by date (YYYY-MM-DD)"
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${isSelectionMode ? "pb-24" : ""}`}>
        {filteredClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-mono text-sm text-muted-foreground">No clips yet</p>
            <p className="font-mono text-xs text-muted-foreground/70 mt-2">
              Start recording and stop to save clips
            </p>
          </div>
        ) : (
          filteredClips.map((clip, index) => {
            const isSelected = selectedIds.includes(clip.id);
            return (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onPointerDown={(e) => handlePointerDown(clip.id, e)}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onClick={(e) => handleItemClick(e, clip)}
                className={`w-full glass-panel rounded-xl p-4 flex items-center gap-4 transition-colors cursor-pointer select-none ${
                  isSelected ? "bg-primary/20 border border-primary/50" : "hover:bg-secondary/80 border border-border/50"
                }`}
              >
                {isSelectionMode && (
                  <div className={`shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"}`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="flex-1 text-left pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-foreground">{clip.timestamp}</span>
                    {clip.locked && <span className="text-[10px]">🔒</span>}
                  </div>
                  <span className={`font-mono text-xs ${getReasonColor(clip.reason)}`}>
                    {clip.reason}
                  </span>
                </div>
                {!isSelectionMode && (
                  <>
                    <span className="text-muted-foreground/40 text-sm mr-2 pointer-events-none">→</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(e, [clip.id]);
                      }}
                      disabled={!!deletingId}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors relative z-10"
                      title="Delete"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-20 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <button
              onClick={cancelSelection}
              className="flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide bg-secondary text-secondary-foreground border border-border"
            >
              Cancel
            </button>
            <button
              onClick={(e) => handleDeleteRequest(e, selectedIds)}
              disabled={selectedIds.length === 0}
              className="flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide bg-destructive text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete ({selectedIds.length})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PasswordModal 
        isOpen={isPasswordModalOpen && !selectedClip}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingDeleteIds([]);
        }}
        onSuccess={executeDelete}
        title="Enter Password to Delete"
      />
    </motion.div>
  );
};

export default ArchiveScreen;
