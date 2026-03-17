import { useSettings } from "@/context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function SOSContactsPage() {
  const { settings, update } = useSettings();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="h-full flex flex-col bg-background"
    >
      <div className="flex items-center px-4 py-3 border-b border-border bg-background z-10 sticky top-0">
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mr-4"
        >
          ← Back
        </button>
        <span className="font-display font-semibold text-sm text-foreground">Emergency Contacts</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="glass-panel rounded-2xl p-4 border border-border/50 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              Manage Contacts
            </p>
            <button
              onClick={() => {
                const newContacts = [...(settings.sosContacts || []), { id: `msg-${Date.now()}`, name: "New Contact", phone: "" }];
                update({ sosContacts: newContacts });
              }}
              className="py-1.5 px-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 active:scale-95"
            >
              + Add New
            </button>
          </div>

          <div className="space-y-4">
            {(settings.sosContacts || []).map((contact, idx) => (
              <div key={contact.id} className="flex gap-3 bg-secondary/50 p-3 rounded-xl border border-border/50">
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Contact Name</label>
                    <input
                      value={contact.name}
                      onChange={(e) => {
                        const newContacts = [...settings.sosContacts];
                        newContacts[idx] = { ...contact, name: e.target.value };
                        update({ sosContacts: newContacts });
                      }}
                      placeholder="e.g. Police"
                      className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Phone Number</label>
                    <input
                      value={contact.phone}
                      onChange={(e) => {
                        const newContacts = [...settings.sosContacts];
                        newContacts[idx] = { ...contact, phone: e.target.value };
                        update({ sosContacts: newContacts });
                      }}
                      placeholder="+1 234 567 8900"
                      type="tel"
                      className="w-full bg-background/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <button
                    onClick={() => {
                      const newContacts = settings.sosContacts.filter(c => c.id !== contact.id);
                      update({ sosContacts: newContacts });
                    }}
                    title="Remove Contact"
                    className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors active:scale-95"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {(!settings.sosContacts || settings.sosContacts.length === 0) && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="font-mono text-xs">No emergency contacts saved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
