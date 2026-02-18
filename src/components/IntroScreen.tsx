import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import logoImage from "@/assets/third-eye-logo.png";

const features = [
  {
    title: "Loop Recording",
    description: "Continuous recording that overwrites the oldest footage automatically. Never run out of storage.",
    icon: "↻",
  },
  {
    title: "Emergency Clip Lock",
    description: "Instantly locks and protects critical footage when an event is detected. Your evidence stays safe.",
    icon: "🔒",
  },
  {
    title: "Background Recording",
    description: "Keeps recording even when minimized. A floating controller stays accessible at all times.",
    icon: "◉",
  },
];

interface IntroScreenProps {
  onComplete: () => void;
}

const FeatureSection = ({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.9]);

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center px-8">
      <motion.div
        style={{ opacity, y, scale }}
        className="text-center max-w-sm"
      >
        <div className="text-5xl mb-6">{feature.icon}</div>
        <h2 className="text-2xl font-bold font-display mb-4 text-foreground">
          {feature.title}
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          {feature.description}
        </p>
        <div className="mt-8 flex justify-center gap-2">
          {features.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === index ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  const logoOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const logoScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.8]);

  const ctaOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.85, 0.95], [40, 0]);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto bg-background"
    >
      {/* Logo Reveal */}
      <motion.div className="min-h-screen flex flex-col items-center justify-center px-8">
        <motion.div
          style={{ opacity: logoOpacity, scale: logoScale }}
          className="text-center"
        >
          <motion.img
            src={logoImage}
            alt="Third Eye Logo"
            className="w-24 h-24 mx-auto mb-6 rounded-2xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.h1
            className="text-4xl font-bold font-display tracking-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Third Eye
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm mt-3 tracking-widest uppercase font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Smart Dashcam Protection
          </motion.p>
          <motion.div
            className="mt-12 text-muted-foreground/50 text-xs font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            Scroll to explore ↓
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Feature Sections */}
      {features.map((feature, index) => (
        <FeatureSection key={index} feature={feature} index={index} />
      ))}

      {/* CTA to enter app */}
      <div className="min-h-screen flex items-center justify-center px-8">
        <motion.div style={{ opacity: ctaOpacity, y: ctaY }} className="text-center">
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-8">
            Ready to record
          </p>
          <button
            onClick={onComplete}
            className="bg-primary text-primary-foreground font-display font-semibold text-lg px-10 py-4 rounded-xl rec-glow hover:brightness-110 transition-all active:scale-95"
          >
            Start Third Eye
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroScreen;
