import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export function PasswordModal({ isOpen, onClose, onSuccess, title = "Enter Password" }: PasswordModalProps) {
  const { auth } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const email = auth.phone; // Email is stored in 'phone' in AuthContext
      if (!email) throw new Error("User email not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (signInError) throw signInError;
      
      onSuccess();
      setPassword("");
    } catch (err: any) {
      console.error(err);
      setError("Incorrect password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border/50 shadow-lg relative glow-effect animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4 text-center">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sign-in Password"
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-3 font-mono text-sm text-foreground text-center tracking-widest placeholder:text-muted-foreground/70 outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          {error && <p className="font-mono text-[11px] text-destructive text-center">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setError("");
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl font-mono text-xs bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-2.5 rounded-xl font-mono font-semibold text-xs bg-primary text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
