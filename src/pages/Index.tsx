import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import IntroScreen from "@/components/IntroScreen";
import RecordingScreen from "@/components/RecordingScreen";
import ArchiveScreen from "@/components/ArchiveScreen";

type Screen = "intro" | "recording" | "archive";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("intro");

  return (
    <div className="max-w-md mx-auto h-screen overflow-hidden bg-background relative">
      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <IntroScreen key="intro" onComplete={() => setScreen("recording")} />
        )}
        {screen === "recording" && (
          <RecordingScreen
            key="recording"
            onOpenArchive={() => setScreen("archive")}
          />
        )}
        {screen === "archive" && (
          <ArchiveScreen key="archive" onBack={() => setScreen("recording")} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
