import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: { lat: number; lon: number };
}

export function MapModal({ isOpen, onClose, location }: MapModalProps) {
  const [address, setAddress] = useState<string>("Loading address...");

  useEffect(() => {
    if (isOpen && location) {
      setAddress("Loading address...");
      // Simple reverse geocoding using OpenStreetMap Nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lon}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress("Address not found for this location.");
          }
        })
        .catch(() => {
          setAddress("Could not load address (network error).");
        });
    }
  }, [isOpen, location]);

  const handleShare = async () => {
    if (!location) return;
    const mapsLink = `https://www.google.com/maps?q=${location.lat},${location.lon}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Incident Location",
          text: `Event occurred at: ${address}. View on map:`,
          url: mapsLink,
        });
      } else {
        await navigator.clipboard.writeText(`${address} - ${mapsLink}`);
        alert("Location copied to clipboard! (Sharing not supported natively)");
      }
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && location && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[200] flex flex-col bg-background"
        >
          <div className="flex items-center px-4 py-3 border-b border-border">
            <button
              onClick={onClose}
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
            >
              ← Back
            </button>
            <span className="font-display font-semibold text-sm text-foreground">Incident Location</span>
          </div>

          <div className="flex-1 relative">
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lon - 0.005},${location.lat - 0.005},${location.lon + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lon}`} 
            ></iframe>
          </div>

          <div className="p-4 bg-secondary border-t border-border space-y-4">
            <div className="glass-panel p-3 rounded-xl border border-border/50">
              <span className="telemetry-text text-[10px] block mb-1">ADDRESS / COORDINATES</span>
              <p className="font-mono text-xs text-foreground leading-relaxed">{address}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">
                {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
              </p>
            </div>
            
            <button
              onClick={handleShare}
              className="w-full py-3 rounded-xl font-display font-semibold text-sm tracking-wide bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              Share Location
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
