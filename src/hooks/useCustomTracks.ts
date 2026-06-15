import { useCallback, useEffect, useRef, useState } from "react";

export interface CustomTrack {
  id: string;
  name: string;
  volume: number;
  enabled: boolean;
  src: string; // blob URL or remote URL
}

interface StoredTrack {
  id: string;
  name: string;
  type: "file" | "url";
  blob?: Blob;
  url?: string;
}

const DB_NAME = "earth-flow-music";
const STORE = "custom-tracks";
const VOLUME_MULTIPLIER = 1.8;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(db: IDBDatabase): Promise<StoredTrack[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as StoredTrack[]);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, record: StoredTrack): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function useCustomTracks() {
  const [tracks, setTracks] = useState<CustomTrack[]>([]);
  const dbRef = useRef<IDBDatabase | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    openDB().then(async (db) => {
      if (cancelled) return;
      dbRef.current = db;
      const stored = await dbGetAll(db);
      if (cancelled) return;
      const loaded: CustomTrack[] = stored.map((s) => {
        let src = s.url ?? "";
        if (s.blob) {
          src = URL.createObjectURL(s.blob);
          blobUrlsRef.current.push(src);
        }
        return { id: s.id, name: s.name, volume: 0.75, enabled: false, src };
      });
      setTracks(loaded);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, []);

  // Sync audio elements
  useEffect(() => {
    tracks.forEach((t) => {
      if (!t.src) return;
      let el = audioRefs.current[t.id];
      if (!el) {
        el = new Audio(t.src);
        el.loop = true;
        audioRefs.current[t.id] = el;
      }
      el.volume = Math.min(1, t.volume * VOLUME_MULTIPLIER);
      if (t.enabled) el.play().catch(() => {});
      else el.pause();
    });
  }, [tracks]);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((a) => a.pause());
      blobUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const addFromFile = useCallback(async (file: File) => {
    const db = dbRef.current;
    if (!db) return;
    const id = crypto.randomUUID();
    const name = file.name.replace(/\.[^/.]+$/, "");
    await dbPut(db, { id, name, type: "file", blob: file });
    const src = URL.createObjectURL(file);
    blobUrlsRef.current.push(src);
    setTracks((prev) => [...prev, { id, name, volume: 0.75, enabled: false, src }]);
  }, []);

  const addFromUrl = useCallback(async (name: string, url: string) => {
    const db = dbRef.current;
    if (!db) return;
    const id = crypto.randomUUID();
    await dbPut(db, { id, name, type: "url", url });
    setTracks((prev) => [...prev, { id, name, volume: 0.75, enabled: false, src: url }]);
  }, []);

  const removeTrack = useCallback(async (id: string) => {
    const db = dbRef.current;
    if (!db) return;
    await dbDelete(db, id);
    const el = audioRefs.current[id];
    if (el) { el.pause(); delete audioRefs.current[id]; }
    setTracks((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t?.src.startsWith("blob:")) URL.revokeObjectURL(t.src);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setTracks((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    setTracks((prev) => prev.map((t) => t.id === id ? { ...t, volume } : t));
  }, []);

  const stopAll = useCallback(() => {
    setTracks((prev) => prev.map((t) => ({ ...t, enabled: false })));
  }, []);

  return { tracks, addFromFile, addFromUrl, removeTrack, toggle, setVolume, stopAll };
}
