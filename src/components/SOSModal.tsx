import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useSettings } from "@/context/SettingsContext";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lon: number } | null;
}

export function SOSModal({ isOpen, onClose, location }: SOSModalProps) {
  const { settings } = useSettings();
  const contacts = settings.sosContacts || [];

  const getMapsLink = () => {
    if (!location) return "";
    return `https://www.openstreetmap.org/?m&mlat=${location.lat}&mlon=${location.lon}`;
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleSMS = (phone: string) => {
    window.open(`sms:${phone.replace(/\s+/g, "")}?body=Emergency! I need help. ${getMapsLink()}`);
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=Emergency! I need help. ${getMapsLink()}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-background border-t border-x border-border sm:border sm:rounded-2xl rounded-t-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Emergency</h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Location Card */}
              <div className="border border-border/50 rounded-xl p-4 bg-secondary mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Current Location</span>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/70 tracking-wider mb-1 uppercase">Latitude</p>
                    <p className="text-safe font-mono font-medium tracking-wide">
                      {location ? location.lat.toFixed(6) : "Fetching..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground/70 tracking-wider mb-1 uppercase">Longitude</p>
                    <p className="text-safe font-mono font-medium tracking-wide">
                      {location ? location.lon.toFixed(6) : "Fetching..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Actions */}
              <div className="mb-6">
                <button 
                  onClick={() => handleCall(contacts[0]?.phone || "112")}
                  className="w-full flex items-center justify-center gap-3 bg-destructive hover:bg-destructive/90 active:scale-[0.98] transition-all text-white py-4 rounded-xl font-bold text-lg"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call Primary Contact
                </button>
              </div>

              {/* Contacts */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider mb-3 uppercase">Send Updates to Contacts</p>
                <div className="space-y-2">
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center p-3 rounded-xl border border-border/50 bg-secondary">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-3 text-white ${idx === 0 || idx === 1 ? 'bg-destructive' : 'bg-primary'}`}>
                        {idx === 0 && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        )}
                        {(idx === 1 || idx === 2) && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        )}
                        {idx >= 3 && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleWhatsApp(contact.phone)}
                          className="w-10 h-10 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 flex items-center justify-center text-green-500 transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleSMS(contact.phone)}
                          className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 flex items-center justify-center text-blue-500 transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleCall(contact.phone)}
                          className="w-10 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 flex items-center justify-center text-primary transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
