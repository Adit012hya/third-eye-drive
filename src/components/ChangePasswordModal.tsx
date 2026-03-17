import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { auth } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const email = auth.phone; // Using the 'phone' property mapped to email from AuthContext
      if (!email) throw new Error("User email not found");

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: oldPassword
      });

      if (signInError) throw new Error("Invalid current password");

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      alert("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border/50 shadow-lg relative glow-effect animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4 text-center">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/70"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/70"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/70"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="font-mono text-[11px] text-destructive text-center">{error}</p>}
          <div className="flex gap-3 mt-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl font-mono text-xs bg-secondary text-secondary-foreground border border-border hover:brightness-110 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-mono font-semibold text-xs bg-primary text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
