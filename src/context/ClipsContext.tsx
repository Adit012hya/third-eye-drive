import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Clip, addClip as addClipToDb, getAllClips, deleteClip as deleteClipFromDb, clearAllClips } from "@/lib/clipStorage";
import { useAuth } from "./AuthContext";

interface ClipsContextValue {
  clips: Clip[];
  refreshClips: () => Promise<void>;
  addClip: (clip: Clip) => Promise<void>;
  deleteClip: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const ClipsContext = createContext<ClipsContextValue | null>(null);

export function ClipsProvider({ children }: { children: ReactNode }) {
  const { auth, ready } = useAuth();
  const userId = auth.phone || "anonymous";
  const [clips, setClips] = useState<Clip[]>([]);

  const refreshClips = useCallback(async () => {
    if (!ready || !auth.loggedIn) {
      setClips([]);
      return;
    }
    try {
      console.log("Refreshing clips for user:", userId);
      const data = await getAllClips(userId);
      console.log("Clips refreshed:", data.length);
      setClips(data);
    } catch (error) {
      console.error("Error refreshing clips:", error);
    }
  }, [userId, ready, auth.loggedIn]);

  const addClip = useCallback(async (clip: Clip) => {
    try {
      console.log("Adding clip:", clip.id, "for user:", userId);
      await addClipToDb(userId, clip);
      console.log("Clip added, refreshing...");
      await refreshClips();
    } catch (error) {
      console.error("Error adding clip:", error);
      throw error;
    }
  }, [userId, refreshClips]);

  const deleteClip = useCallback(async (id: string) => {
    await deleteClipFromDb(userId, id);
    await refreshClips();
  }, [userId, refreshClips]);

  const clearAll = useCallback(async () => {
    await clearAllClips(userId);
    await refreshClips();
  }, [userId, refreshClips]);

  useEffect(() => {
    refreshClips();
  }, [refreshClips]);

  return (
    <ClipsContext.Provider value={{ clips, refreshClips, addClip, deleteClip, clearAll }}>
      {children}
    </ClipsContext.Provider>
  );
}

export function useClips() {
  const ctx = useContext(ClipsContext);
  if (!ctx) throw new Error("useClips must be used within ClipsProvider");
  return ctx;
}
