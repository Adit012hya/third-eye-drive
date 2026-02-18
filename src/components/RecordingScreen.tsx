import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dashcamRoad from "@/assets/dashcam-road.jpg";

interface RecordingScreenProps {
  onOpenArchive: () => void;
}

const RecordingScreen = ({ onOpenArchive }: RecordingScreenProps) => {
  const [isRecording, setIsRecording] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [speed, setSpeed] = useState(54);
  const [gyro, setGyro] = useState(0.62);
  const [audioLevel, setAudioLevel] = useState(6);
  const [autoTrigger, setAutoTrigger] = useState(true);
  const [eventDetected, setEventDetected] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [battery, setBattery] = useState(82);
  const [cameraActive, setCameraActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera access
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.log("Camera not available, using fallback image");
        setCameraActive(false);
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  // Simulate telemetry
  useEffect(() => {
    const t = window.setInterval(() => {
      if (isRecording) {
        setSpeed(Math.floor(45 + Math.random() * 30));
        setGyro(+(0.2 + Math.random() * 0.8).toFixed(2));
        setAudioLevel(Math.floor(3 + Math.random() * 7));
        setBattery((b) => Math.max(5, b - (Math.random() > 0.9 ? 1 : 0)));
      }
    }, 2000);
    return () => clearInterval(t);
  }, [isRecording]);

  // Simulate event trigger
  useEffect(() => {
    if (!autoTrigger || !isRecording) return;
    const t = window.setInterval(() => {
      if (Math.random() > 0.92) {
        setEventDetected(true);
        setTimeout(() => setEventDetected(false), 3000);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [autoTrigger, isRecording]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsRecording(true);
    setSeconds(0);
  };

  const handleStop = () => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleLock = () => {
    setEventDetected(true);
    setTimeout(() => setEventDetected(false), 3000);
  };

  // Battery saver mode
  if (batterySaver) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen bg-background flex flex-col items-center justify-center"
        onClick={() => setBatterySaver(false)}
      >
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-primary rec-pulse mx-auto mb-6" />
          <p className="font-mono text-sm text-muted-foreground tracking-widest uppercase">
            Third Eye Active
          </p>
          <p className="font-mono text-xs text-muted-foreground/50 mt-2">
            Recording in background
          </p>
          <p className="font-mono text-xs text-muted-foreground/30 mt-8">
            Tap to exit battery saver
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`h-screen flex flex-col bg-background relative overflow-hidden ${
        eventDetected ? "event-flash" : ""
      }`}
    >
      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary rec-pulse" />
              <span className="font-mono text-xs text-primary font-semibold tracking-wider">
                REC
              </span>
            </div>
          )}
        </div>
        <span className="font-mono text-sm text-foreground tabular-nums">
          {formatTime(seconds)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBatterySaver(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Battery Saver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="12" height="18" rx="2" />
              <line x1="10" y1="2" x2="14" y2="2" />
              <line x1="12" y1="10" x2="12" y2="16" />
              <line x1="9" y1="13" x2="15" y2="13" />
            </svg>
          </button>
          <span className="font-mono text-xs text-muted-foreground">{battery}%</span>
        </div>
      </div>

      {/* Live Video Feed Area */}
      <div className="flex-1 relative mx-3 rounded-xl overflow-hidden bg-secondary/50">
        {/* Live camera feed or fallback */}
        <div className="absolute inset-0">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={dashcamRoad}
              alt="Live dashcam feed"
              className="w-full h-full object-cover"
            />
          )}
          {/* Subtle scanline overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground) / 0.1) 2px, hsl(var(--foreground) / 0.1) 3px)`,
            }}
          />
        </div>

        {/* Telemetry Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="telemetry-text text-xs">
                SPEED: <span className="text-foreground font-semibold">{speed} km/h</span>
              </div>
              <div className="telemetry-text text-xs">
                GYRO: <span className="text-foreground font-semibold">{gyro}g</span>
              </div>
            </div>
            <div className="telemetry-text text-xs flex items-center gap-2">
              <span>AUDIO:</span>
              <div className="flex gap-0.5 items-end h-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-sm transition-all duration-150 ${
                      i < audioLevel
                        ? i > 7
                          ? "bg-primary h-full"
                          : "bg-safe h-full"
                        : "bg-muted h-1"
                    }`}
                    style={{ height: i < audioLevel ? `${30 + i * 7}%` : "20%" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Trigger Indicator */}
        <div className="absolute top-4 left-4">
          <AnimatePresence mode="wait">
            {eventDetected ? (
              <motion.div
                key="event"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-panel px-3 py-1.5 rounded-lg"
              >
                <span className="font-mono text-[10px] text-primary font-semibold tracking-wider">
                  EVENT DETECTED — RECORDING LOCKED
                </span>
              </motion.div>
            ) : autoTrigger ? (
              <motion.div
                key="trigger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel px-3 py-1.5 rounded-lg"
              >
                <span className="font-mono text-[10px] text-safe tracking-wider">
                  AUTO-TRIGGER: ENABLED
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls Bottom Bar */}
      <div className="px-4 py-5 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={isRecording ? undefined : handleStart}
            className={`flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide transition-all active:scale-95 ${
              isRecording
                ? "bg-muted text-muted-foreground"
                : "bg-safe text-accent-foreground"
            }`}
          >
            START
          </button>
          <button
            onClick={isRecording ? handleStop : undefined}
            className={`flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide transition-all active:scale-95 ${
              isRecording
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            STOP
          </button>
          <button
            onClick={handleLock}
            className="flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide bg-secondary text-secondary-foreground transition-all active:scale-95 border border-border"
          >
            LOCK
          </button>
        </div>
        <button
          onClick={onOpenArchive}
          className="w-full py-2.5 rounded-lg font-mono text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase"
        >
          View Archive →
        </button>
      </div>
    </motion.div>
  );
};

export default RecordingScreen;
