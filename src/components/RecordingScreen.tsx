import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dashcamRoad from "@/assets/dashcam-road.jpg";
import { useClips } from "@/context/ClipsContext";
import type { Clip, ClipReason } from "@/lib/clipStorage";
import { useSettings } from "@/context/SettingsContext";
import { format } from "date-fns";
import { SOSModal } from "./SOSModal";

interface RecordingScreenProps {
  onOpenArchive: () => void;
}

function generateId() {
  return `clip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const RecordingScreen = ({ onOpenArchive }: RecordingScreenProps) => {
  const { addClip } = useClips();
  const { settings } = useSettings();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [speed, setSpeed] = useState<number | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gyro, setGyro] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoTrigger, setAutoTrigger] = useState(true);
  const [eventDetected, setEventDetected] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [needsGyroPermission, setNeedsGyroPermission] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelAnimationRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastPositionRef = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const peakGyroRef = useRef(0);
  const peakAudioRef = useRef(0);
  const speedRef = useRef<number | null>(null);
  speedRef.current = speed;

  // Camera + mic access + check iOS Gyro Requirements
  useEffect(() => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof (DeviceMotionEvent as any).requestPermission === "function") {
      setNeedsGyroPermission(true);
    }

    let cancelled = false;
    const startMedia = async () => {
      const is1080 = settings.videoQuality === "1080p";
      const width = is1080 ? { ideal: 1920 } : { ideal: 1280 };
      const height = is1080 ? { ideal: 1080 } : { ideal: 720 };
      
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width,
          height,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      };
      try {
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraActive(true);
        setMicActive(stream.getAudioTracks().length > 0);
      } catch (err) {
        if (cancelled) return;
        try {
          const videoOnly = { video: constraints.video, audio: false };
          const stream = await navigator.mediaDevices.getUserMedia(videoOnly);
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setCameraActive(true);
          setMicActive(false);
        } catch (e) {
          if (!cancelled) {
            console.warn("Camera not available:", e);
            setCameraActive(false);
            setMicActive(false);
          }
        }
      }
    };
    startMedia();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [settings.videoQuality]);

  // Attach stream to video when both are ready (video mounts after cameraActive becomes true)
  useEffect(() => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (stream && video) {
      video.srcObject = stream;
      const play = () => video.play().catch(() => {});
      play();
      video.onloadedmetadata = play; // ensure play after stream loads
    }
  }, [cameraActive]);

  // Real-time audio level
  useEffect(() => {
    if (!streamRef.current || !micActive) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(streamRef.current);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.min(10, Math.floor((avg / 128) * 10));
      setAudioLevel(level);
      if (isRecording && level > peakAudioRef.current) peakAudioRef.current = level;
      audioLevelAnimationRef.current = requestAnimationFrame(updateLevel);
    };
    audioLevelAnimationRef.current = requestAnimationFrame(updateLevel);

    return () => {
      if (audioLevelAnimationRef.current)
        cancelAnimationFrame(audioLevelAnimationRef.current);
      audioContext.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [micActive, isRecording]);

  // Speed from Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const now = Date.now();
        const last = lastPositionRef.current;
        if (last && pos.coords.speed !== null && pos.coords.speed >= 0) {
          setSpeed(Math.round(pos.coords.speed * 3.6)); // m/s to km/h
        } else if (last) {
          const dist = Math.sqrt(
            Math.pow((latitude - last.lat) * 111000, 2) +
            Math.pow((longitude - last.lon) * 111000 * Math.cos((latitude * Math.PI) / 180), 2)
          );
          const dt = (now - last.time) / 1000;
          if (dt > 0 && dist > 0) setSpeed(Math.round((dist / 1000) / (dt / 3600)));
        }
        lastPositionRef.current = { lat: latitude, lon: longitude, time: now };
        setLocation({ lat: latitude, lon: longitude });
      },
      () => setSpeed(null),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Gyro from DeviceMotion (Passively bound, awaits permission on iOS)
  useEffect(() => {
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity ?? e.acceleration;
      if (!a || (a.x === null && a.y === null && a.z === null)) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      if (mag === 0) return; // Ignore missing/empty sensor data entirely to prevent 1g false positives
      
      const isGravityIncluded = !!e.accelerationIncludingGravity;
      const gForce = isGravityIncluded ? Math.abs(mag - 9.81) / 9.81 : mag / 9.81;
      
      setGyro(+(gForce.toFixed(2)));
      if (isRecording && gForce > peakGyroRef.current) peakGyroRef.current = gForce;
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [isRecording]);

  const handleRequestGyro = async () => {
    try {
      const p = await (DeviceMotionEvent as any).requestPermission();
      if (p === "granted") {
        setNeedsGyroPermission(false);
      } else {
        alert("Gyroscope permission denied.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to request gyroscope permission.");
    }
  };

  // Battery
  useEffect(() => {
    if (!("getBattery" in navigator)) return;
    (navigator as Navigator & { getBattery: () => Promise<any> })
      .getBattery()
      .then((bat) => {
        const update = () => setBattery(Math.round(bat.level * 100));
        update();
        bat.addEventListener("levelchange", update);
        return () => bat.removeEventListener("levelchange", update);
      })
      .catch(() => setBattery(null));
  }, []);

  // Timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const lastAutoLockRef = useRef(0);
  // Auto event detection (audio spike / impact from gyro) - triggers lock using sensitivities
  useEffect(() => {
    if (!autoTrigger) return;
    const now = Date.now();
    if (now - lastAutoLockRef.current < 5000) return; // debounce 5s
    // 10 = most sensitive (triggers at audio level 1), 1 = least sensitive (triggers at level 10)
    const audioThreshold = Math.max(1, 11 - settings.audioSensitivity); 
    // Map impact sensitivity (1-10) to a g-force threshold (lower slider -> more sensitive)
    const impactThreshold = 0.5 + (11 - settings.impactSensitivity) * 0.25;

    const audioIncident = audioLevel >= audioThreshold;
    const impactIncident = gyro >= impactThreshold;

    if (audioIncident || impactIncident) {
      lastAutoLockRef.current = now;
      setEventDetected(true);
      setTimeout(() => setEventDetected(false), 3000);
      const reason: ClipReason = audioIncident ? "Audio Event" : "Impact Event";
      
      if (!isRecording) {
        // Automatically start recording when an event crosses threshold
        if (cameraActive && streamRef.current && recorderRef.current?.state !== "recording") {
          console.log(`Auto-starting recording due to ${reason}`);
          startRecording();
          // We immediately lock it so we save it a few seconds later, or we can just let it run.
          // By default let's let it run until they manually hit STOP or another trigger locks it.
        }
      } else {
        // We are already recording, so lock & save this clip, then restart
        const rec = recorderRef.current;
        if (rec && rec.state !== "inactive") {
          try {
            rec.stop();
          } catch (e) {
            console.error("Failed to stop recorder cleanly:", e);
          }
          recorderRef.current = null;
          (async () => {
            try {
              if (rec.state !== "inactive") {
                await new Promise<void>((r) => { rec.onstop = () => r(); });
              }
              await saveRecordingAsClip(reason, true);
              if (streamRef.current) startRecording();
            } catch (error) {
              console.error("Error in auto-trigger save:", error);
            }
          })();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrigger, isRecording, audioLevel, gyro, cameraActive, settings.audioSensitivity, settings.impactSensitivity]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const saveRecordingAsClip = async (reason: ClipReason, locked: boolean) => {
    try {
      const chunks = chunksRef.current;
      if (!chunks.length) {
        console.warn("No chunks to save");
        return;
      }

      console.log("Saving recording:", { reason, locked, chunks: chunks.length });
      const blob = new Blob(chunks, { type: "video/webm" });
      console.log("Blob created:", blob.size, "bytes");

      const now = new Date();
      const clip: Clip = {
        id: generateId(),
        timestamp: format(now, "HH:mm:ss"),
        reason,
        locked,
        speed: speedRef.current ?? 0,
        gForce: +(peakGyroRef.current.toFixed(1)),
        audioSpike: peakAudioRef.current,
        date: format(now, "yyyy-MM-dd"),
        blob,
        location: lastPositionRef.current ? {
          lat: lastPositionRef.current.lat,
          lon: lastPositionRef.current.lon,
        } : undefined,
      };
      console.log("Clip object:", { id: clip.id, timestamp: clip.timestamp, reason: clip.reason });
      await addClip(clip);
      console.log("Clip saved successfully");
      chunksRef.current = [];
    } catch (error) {
      console.error("Error saving recording:", error);
      throw error;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    peakGyroRef.current = 0;
    peakAudioRef.current = 0;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(streamRef.current);
    } catch (e) {
      console.error("Failed to start recorder:", e);
      return;
    }
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    rec.start(1000); // Important: Collect chunks every 1 second
    recorderRef.current = rec;
    setIsRecording(true);
    setSeconds(0);
  };

  const stopRecording = async () => {
    try {
      console.log("Stopping recording");
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") {
        console.warn("Recorder not active");
        return;
      }
      rec.stop();
      recorderRef.current = null;
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);

      await new Promise<void>((r) => {
        rec.onstop = () => r();
        if (rec.state === "inactive") r();
      });
      await saveRecordingAsClip("Manual Save", false);
      console.log("Recording stopped successfully");
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const handleLock = async () => {
    try {
      console.log("Locking recording");
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") {
        console.warn("Recorder not active");
        return;
      }
      rec.stop();
      recorderRef.current = null;

      await new Promise<void>((r) => {
        rec.onstop = () => r();
        if (rec.state === "inactive") r();
      });
      await saveRecordingAsClip("Locked Event", true);
      setEventDetected(true);
      setTimeout(() => setEventDetected(false), 3000);
      if (streamRef.current) startRecording();
      console.log("Lock saved and new recording started");
    } catch (error) {
      console.error("Error locking recording:", error);
    }
  };

  const handleStart = () => startRecording();
  const handleStop = () => stopRecording();

  // Battery saver mode
  if (batterySaver) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full bg-background flex flex-col items-center justify-center"
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
      className={`h-full flex flex-col bg-background relative overflow-hidden ${
        eventDetected ? "event-flash" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary rec-pulse" />
              <span className="font-mono text-xs text-primary font-semibold tracking-wider">REC</span>
            </div>
          )}
        </div>
        <span className="font-mono text-sm text-foreground tabular-nums">{formatTime(seconds)}</span>
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
          <span className="font-mono text-xs text-muted-foreground">
            {battery !== null ? `${battery}%` : "—"}
          </span>
        </div>
      </div>

      <div className="flex-1 relative mx-3 rounded-xl overflow-hidden bg-secondary/50">
        <div className="absolute inset-0 min-h-0 min-w-0">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-black"
              style={{ transform: "translateZ(0)" }}
            />
          ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground">Initializing Camera...</span>
        </div>
          )}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground) / 0.1) 2px, hsl(var(--foreground) / 0.1) 3px)`,
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="telemetry-text text-xs">
                  SPEED: <span className="text-foreground font-semibold">{speed !== null ? `${speed} km/h` : "—"}</span>
                </div>
                <div className="telemetry-text text-[10px] opacity-80 mt-0.5">
                  LOC: {location ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}` : "—"}
                </div>
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
                      i < audioLevel ? (i > 7 ? "bg-primary h-full" : "bg-safe h-full") : "bg-muted h-1"
                    }`}
                    style={{ height: i < audioLevel ? `${30 + i * 7}%` : "20%" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

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
                <span className="font-mono text-[10px] text-safe tracking-wider">AUTO-TRIGGER: ENABLED</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setIsSOSOpen(true)}
            className="w-[52px] h-[52px] rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:bg-red-500 active:scale-95 transition-all text-white border-2 border-white/20"
          >
            <span className="font-bold tracking-widest text-[14px]">SOS</span>
          </button>
        </div>

        <AnimatePresence>
          {needsGyroPermission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20"
            >
              <div className="glass-panel p-6 rounded-2xl max-w-sm text-center">
                <h3 className="font-display font-semibold text-foreground mb-2">Enable Device Sensors</h3>
                <p className="font-mono text-xs text-muted-foreground mb-6">
                  Third Eye needs accelerometer permissions to automatically detect impact events such as a crash or sudden braking.
                </p>
                <button
                  onClick={handleRequestGyro}
                  className="w-full py-3 rounded-xl font-mono text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20"
                >
                  Grant Sensor Access
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-5 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={isRecording ? undefined : handleStart}
            disabled={!cameraActive}
            className={`flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide transition-all active:scale-95 ${
              isRecording ? "bg-muted text-muted-foreground" : "bg-safe text-accent-foreground"
            } ${!cameraActive ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            START
          </button>
          <button
            onClick={isRecording ? handleStop : undefined}
            className={`flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide transition-all active:scale-95 ${
              isRecording ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            STOP
          </button>
          <button
            onClick={handleLock}
            disabled={!isRecording}
            className={`flex-1 py-3.5 rounded-xl font-display font-semibold text-sm tracking-wide bg-secondary text-secondary-foreground active:scale-95 border border-border ${
              !isRecording ? "opacity-50 cursor-not-allowed" : ""
            }`}
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

      <SOSModal 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
        location={lastPositionRef.current ? { lat: lastPositionRef.current.lat, lon: lastPositionRef.current.lon } : null} 
      />
    </motion.div>
  );
};

export default RecordingScreen;
