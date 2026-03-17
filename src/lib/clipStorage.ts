const STORE_NAME = "clips";
const DB_VERSION = 1;

function getDbName(userId: string) {
  return `third-eye-drive-${userId}`;
}

export type ClipReason = "Manual Save" | "Impact Event" | "Audio Event" | "Locked Event";

export interface Clip {
  id: string;
  timestamp: string;
  reason: ClipReason;
  locked: boolean;
  speed: number;
  gForce: number;
  audioSpike: number;
  date: string;
  blob: Blob;
  location?: { lat: number; lon: number };
}

function openDB(userId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(getDbName(userId), DB_VERSION);
    req.onerror = () => {
      console.error("IndexedDB open error:", req.error);
      reject(req.error);
    };
    req.onsuccess = () => {
      console.log("IndexedDB opened successfully");
      resolve(req.result);
    };
    req.onupgradeneeded = (e) => {
      console.log("IndexedDB upgrade needed");
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log("Creating object store:", STORE_NAME);
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function addClip(userId: string, clip: Clip): Promise<void> {
  try {
    const db = await openDB(userId);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.onerror = () => {
        console.error("Transaction error:", tx.error);
        reject(tx.error);
      };
      tx.oncomplete = () => {
        console.log("Clip saved successfully:", clip.id);
        db.close();
        resolve();
      };
      const req = tx.objectStore(STORE_NAME).put(clip);
      req.onerror = () => {
        console.error("Put request error:", req.error);
      };
    });
  } catch (error) {
    console.error("Error in addClip:", error);
    throw error;
  }
}

export async function getAllClips(userId: string): Promise<Clip[]> {
  try {
    const db = await openDB(userId);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onerror = () => {
        console.error("Get all error:", req.error);
        reject(req.error);
      };
      req.onsuccess = () => {
        try {
          const clips = (req.result as Clip[]).sort(
            (a, b) => new Date(b.date + " " + b.timestamp).getTime() - new Date(a.date + " " + a.timestamp).getTime()
          );
          console.log("Loaded clips:", clips.length);
          db.close();
          resolve(clips);
        } catch (error) {
          console.error("Error sorting clips:", error);
          db.close();
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error("Error in getAllClips:", error);
    throw error;
  }
}

export async function deleteClip(userId: string, id: string): Promise<void> {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.objectStore(STORE_NAME).delete(id);
  });
}

export async function clearAllClips(userId: string): Promise<void> {
  const db = await openDB(userId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.objectStore(STORE_NAME).clear();
  });
}
