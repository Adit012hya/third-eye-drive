import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import logoImage from "@/assets/third-eye-logo.png";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail) {
      setError("Enter a valid email address");
      return;
    }

    if (!password) {
      setError(authMode === "forgot" ? "Please enter your existing password" : "Please enter a password");
      return;
    }

    if (authMode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }
    
    if (authMode === "forgot") {
      if (!newPassword) {
        setError("Please enter a new password");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });
        if (error) throw error;
        
        // Supabase returns an empty identities array if the user already exists
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError("This email is already registered. Please sign in.");
          setAuthMode("signin");
          return;
        }

        if (!data.session) {
          alert("Account created successfully! Please check your email inbox to verify your account before logging in. (If you disabled email confirmations in Supabase, try signing in now).");
          setAuthMode("signin");
          return; // Do not proceed to login
        }
        
        console.log("Signup successful and logged in");
      } else if (authMode === "forgot") {
        // Sign in first with existing password to catch any error before updating
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (signInError) {
          throw new Error("Invalid existing password. Cannot change password.");
        }
        
        // Update user's password using Supabase API
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (updateError) throw updateError;
        
        console.log("Password updated successfully");
        alert("Password updated successfully! You are now logged in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        console.log("Login successful");
      }

      login(email.trim()); // Keep existing auth context working
      navigate("/home", { replace: true });
    } catch (e: any) {
      console.error(e);
      // Friendlier error messages
      if (e.message?.includes("Invalid login credentials")) {
         setError("Invalid email or password. (Or email is not verified yet!)");
      } else {
         setError(e.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!isValidEmail || !password) return false;
    if (authMode === "signup") {
      if (!name.trim() || !confirmPassword || password !== confirmPassword) return false;
    }
    if (authMode === "forgot") {
      if (!newPassword || !confirmPassword || newPassword !== confirmPassword) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6 py-8">
        <div className="flex flex-col items-center mb-8">
          <img src={logoImage} alt="Third Eye" className="w-14 h-14 rounded-2xl mb-3" />
          <h1 className="font-display text-xl font-semibold text-foreground">
            Third Eye Drive
          </h1>
          <p className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase mt-1">
            {authMode === "signin" ? "Secure Login" : authMode === "signup" ? "Create Account" : "Change Password"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-4 border border-border/50 space-y-4">
          {authMode !== "forgot" ? (
            <div className="flex p-1 bg-background/50 rounded-lg border border-border/50">
              <button
                type="button"
                onClick={() => { 
                  setAuthMode("signin"); 
                  setError(""); 
                  setPassword("");
                  setConfirmPassword("");
                  setNewPassword("");
                }}
                className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${authMode === "signin" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { 
                  setAuthMode("signup"); 
                  setError(""); 
                  setPassword("");
                  setConfirmPassword("");
                  setNewPassword("");
                }}
                className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${authMode === "signup" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="flex p-1 bg-background/50 rounded-lg border border-border/50">
              <button
                type="button"
                onClick={() => { 
                  setAuthMode("signin"); 
                  setError(""); 
                  setPassword("");
                  setConfirmPassword("");
                  setNewPassword("");
                }}
                className="flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-all text-muted-foreground hover:text-foreground"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {authMode === "signup" && (
            <div>
              <label className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                placeholder="John Doe"
                className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
          )}

          <div>
            <label className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase block mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  setError("");
                }
              }}
              placeholder="you@example.com"
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase block">
                {authMode === "forgot" ? "Existing Password" : "Password"}
              </label>
              {authMode === "signin" && (
                <button 
                  type="button" 
                  onClick={() => {
                    setAuthMode("forgot");
                    setError("");
                    setPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={loading}
                  className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors mb-2 disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authMode === "signup" && confirmPassword && e.target.value !== confirmPassword) {
                  setError("Passwords do not match");
                } else {
                  setError("");
                }
              }}
              placeholder="••••••••"
              className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          {authMode === "forgot" && (
            <>
              <div>
                <label className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase block mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (confirmPassword && e.target.value !== confirmPassword) {
                      setError("New passwords do not match");
                    } else {
                      setError("");
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
                />
              </div>
              
              <div>
                <label className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase block mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (newPassword && e.target.value !== newPassword) {
                      setError("New passwords do not match");
                    } else {
                      setError("");
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
                />
              </div>
            </>
          )}

          {authMode === "signup" && (
            <div>
              <label className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase block mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (password && e.target.value !== password) {
                    setError("Passwords do not match");
                  } else {
                    setError("");
                  }
                }}
                placeholder="••••••••"
                className="w-full bg-background/40 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
          )}

          {error && (
            <p className="font-mono text-[11px] text-destructive mt-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="w-full py-3 rounded-xl font-display font-semibold text-sm bg-primary text-primary-foreground rec-glow hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? "Processing..." : (authMode === "signin" ? "Sign In" : authMode === "signup" ? "Sign Up" : "Update Password")}
          </button>
        </form>
      </div>
    </div>
  );
}
