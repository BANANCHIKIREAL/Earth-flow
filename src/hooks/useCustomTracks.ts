import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type CustomTrackSyncStatus =
  | "local"
  | "compressing"
  | "uploading"
  | "synced"
  | "error";

export interface CustomTrack {
  id: string;
  name: string;
  volume: number;
  enabled: boolean;
  src: string;
  source: "local" | "cloud";
  syncStatus: CustomTrackSyncStatus;
  syncProgress: number;
  syncError?: string;
  storagePath?: string;
  compressedBytes?: number;
}

interface StoredTrack {
  id: string;
  name: string;
  type: "file" | "url";
  blob?: Blob;
  url?: string;
  storagePath?: string;
  compressedBytes?: number;
}

interface CloudTrackRow {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  status: "uploading" | "ready";
}

const DB_NAME = "earth-flow-music";
const STORE = "custom-tracks";
const SYNC_BUCKET = "user-audio-sync";
const SYNC_KEY_PREFIX = "ef:custom-sound-sync";
const VOLUME_MULTIPLIER = 1.8;
export const MAX_CLOUD_SOUND_BYTES = 4_500_000;

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

function dbGet(db: IDBDatabase, id: string): Promise<StoredTrack | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredTrack | undefined);
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

function syncKey(userId?: string) {
  return `${SYNC_KEY_PREFIX}:${userId ?? "guest"}`;
}

function syncErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Cloud sync failed";
}

export function useCustomTracks(userId?: string) {
  const [tracks, setTracks] = useState<CustomTrack[]>([]);
  const [syncEnabled, setSyncEnabledState] = useState(() => {
    if (!userId || typeof window === "undefined") return false;
    return localStorage.getItem(syncKey(userId)) === "true";
  });
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudCount, setCloudCount] = useState(0);
  const [cloudBytes, setCloudBytes] = useState(0);
  const dbRef = useRef<IDBDatabase | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const blobUrlsRef = useRef<string[]>([]);

  const updateTrack = useCallback((id: string, patch: Partial<CustomTrack>) => {
    setTracks((prev) => prev.map((track) => (track.id === id ? { ...track, ...patch } : track)));
  }, []);

  useEffect(() => {
    if (!userId) {
      setSyncEnabledState(false);
      setCloudCount(0);
      setCloudBytes(0);
      return;
    }
    setSyncEnabledState(localStorage.getItem(syncKey(userId)) === "true");
    void supabase
      .from("user_custom_tracks")
      .select("size_bytes")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to read cloud sound usage", error);
          return;
        }
        const rows = (data ?? []) as Pick<CloudTrackRow, "size_bytes">[];
        setCloudCount(rows.length);
        setCloudBytes(rows.reduce((total, row) => total + row.size_bytes, 0));
      });
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    openDB()
      .then(async (db) => {
        if (cancelled) return;
        dbRef.current = db;
        const stored = await dbGetAll(db);
        if (cancelled) return;
        const loaded: CustomTrack[] = stored.map((item) => {
          let src = item.url ?? "";
          if (item.blob) {
            src = URL.createObjectURL(item.blob);
            blobUrlsRef.current.push(src);
          }
          return {
            id: item.id,
            name: item.name,
            volume: 0.75,
            enabled: false,
            src,
            source: "local",
            syncStatus: item.storagePath ? "synced" : "local",
            syncProgress: item.storagePath ? 1 : 0,
            storagePath: item.storagePath,
            compressedBytes: item.compressedBytes,
          };
        });
        setTracks((current) => {
          const cloudById = new Map(current.map((track) => [track.id, track]));
          return loaded
            .map((localTrack) => {
              const cloudTrack = cloudById.get(localTrack.id);
              if (!cloudTrack) return localTrack;
              cloudById.delete(localTrack.id);
              return {
                ...cloudTrack,
                ...localTrack,
                syncStatus: cloudTrack.syncStatus,
                syncProgress: cloudTrack.syncProgress,
                storagePath: cloudTrack.storagePath,
                compressedBytes: cloudTrack.compressedBytes,
              };
            })
            .concat([...cloudById.values()]);
        });
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    tracks.forEach((track) => {
      if (!track.src) return;
      let audio = audioRefs.current[track.id];
      if (!audio) {
        audio = new Audio(track.src);
        audio.loop = true;
        audioRefs.current[track.id] = audio;
      } else if (audio.src !== track.src) {
        audio.pause();
        audio.src = track.src;
      }
      audio.volume = Math.min(1, track.volume * VOLUME_MULTIPLIER);
      if (track.enabled) void audio.play().catch(() => {});
      else audio.pause();
    });
  }, [tracks]);

  useEffect(() => {
    const audioElements = audioRefs.current;
    const blobUrls = blobUrlsRef.current;
    return () => {
      Object.values(audioElements).forEach((audio) => audio.pause());
      blobUrls.forEach(URL.revokeObjectURL);
    };
  }, []);

  const loadCloudTracks = useCallback(async () => {
    if (!userId || !syncEnabled) return;
    setCloudLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_custom_tracks")
        .select("id,name,storage_path,size_bytes,status")
        .eq("user_id", userId)
        .eq("status", "ready")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const cloudTracks = (
        await Promise.all(
          ((data ?? []) as CloudTrackRow[]).map(async (row) => {
            const { data: signed, error: signedError } = await supabase.storage
              .from(SYNC_BUCKET)
              .createSignedUrl(row.storage_path, 60 * 60 * 24);
            if (signedError) throw signedError;
            return {
              id: row.id,
              name: row.name,
              volume: 0.75,
              enabled: false,
              src: signed.signedUrl,
              source: "cloud" as const,
              syncStatus: "synced" as const,
              syncProgress: 1,
              storagePath: row.storage_path,
              compressedBytes: row.size_bytes,
            };
          }),
        )
      ).filter(Boolean);
      setCloudCount(cloudTracks.length);
      setCloudBytes(
        cloudTracks.reduce((total, track) => total + (track.compressedBytes ?? 0), 0),
      );

      setTracks((current) => {
        const next = new Map(current.map((track) => [track.id, track]));
        cloudTracks.forEach((cloudTrack) => {
          const localTrack = next.get(cloudTrack.id);
          next.set(
            cloudTrack.id,
            localTrack?.source === "local"
              ? {
                  ...localTrack,
                  syncStatus: "synced",
                  syncProgress: 1,
                  storagePath: cloudTrack.storagePath,
                  compressedBytes: cloudTrack.compressedBytes,
                }
              : cloudTrack,
          );
        });
        return [...next.values()];
      });
    } catch (error) {
      console.error("Failed to load cloud sounds", error);
    } finally {
      setCloudLoading(false);
    }
  }, [syncEnabled, userId]);

  useEffect(() => {
    void loadCloudTracks();
  }, [loadCloudTracks]);

  const syncFile = useCallback(
    async (id: string, file: File, name: string) => {
      if (!userId || !syncEnabled) return;
      updateTrack(id, { syncStatus: "compressing", syncProgress: 0.02, syncError: undefined });
      let metadataCreated = false;
      const storagePath = `${userId}/${id}.m4a`;

      try {
        const remainingBytes = Math.max(0, MAX_CLOUD_SOUND_BYTES - cloudBytes);
        if (remainingBytes === 0) {
          throw new Error("Cloud Sound Library is full (4.5 MB used).");
        }
        const { compressAudioForSync } = await import("@/lib/compressAudioForSync");
        const compressed = await compressAudioForSync(
          file,
          (progress) => {
            updateTrack(id, { syncStatus: "compressing", syncProgress: progress * 0.82 });
          },
          remainingBytes,
        );
        if (cloudBytes + compressed.blob.size > MAX_CLOUD_SOUND_BYTES) {
          throw new Error(
            `Not enough cloud space. ${Math.round(remainingBytes / 1000)} KB remaining.`,
          );
        }
        updateTrack(id, { syncStatus: "uploading", syncProgress: 0.86 });

        const { error: metadataError } = await supabase.from("user_custom_tracks").insert({
          id,
          user_id: userId,
          name: name.slice(0, 120),
          storage_path: storagePath,
          mime_type: compressed.blob.type,
          size_bytes: compressed.blob.size,
          duration_seconds: Number(compressed.durationSeconds.toFixed(2)),
          status: "uploading",
        });
        if (metadataError) throw metadataError;
        metadataCreated = true;

        const { error: uploadError } = await supabase.storage
          .from(SYNC_BUCKET)
          .upload(storagePath, compressed.blob, {
            contentType: "audio/mp4",
            upsert: false,
            cacheControl: "3600",
          });
        if (uploadError) throw uploadError;
        updateTrack(id, { syncProgress: 0.96 });

        const { error: readyError } = await supabase
          .from("user_custom_tracks")
          .update({ status: "ready", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId);
        if (readyError) throw readyError;

        const db = dbRef.current;
        if (db) {
          const stored = await dbGet(db, id);
          if (stored) {
            await dbPut(db, {
              ...stored,
              storagePath,
              compressedBytes: compressed.blob.size,
            });
          }
        }
        updateTrack(id, {
          syncStatus: "synced",
          syncProgress: 1,
          storagePath,
          compressedBytes: compressed.blob.size,
          syncError: undefined,
        });
        setCloudCount((current) => current + 1);
        setCloudBytes((current) => current + compressed.blob.size);
      } catch (error) {
        if (metadataCreated) {
          await supabase.storage.from(SYNC_BUCKET).remove([storagePath]);
          await supabase
            .from("user_custom_tracks")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
        }
        updateTrack(id, {
          syncStatus: "error",
          syncProgress: 0,
          syncError: syncErrorMessage(error),
        });
      }
    },
    [cloudBytes, syncEnabled, updateTrack, userId],
  );

  const addFromFile = useCallback(
    async (file: File) => {
      const db = dbRef.current;
      if (!db) return;
      const id = crypto.randomUUID();
      const name = file.name.replace(/\.[^/.]+$/, "").slice(0, 120) || "Custom sound";
      await dbPut(db, { id, name, type: "file", blob: file });
      const src = URL.createObjectURL(file);
      blobUrlsRef.current.push(src);
      setTracks((prev) => [
        ...prev,
        {
          id,
          name,
          volume: 0.75,
          enabled: false,
          src,
          source: "local",
          syncStatus: "local",
          syncProgress: 0,
        },
      ]);
      if (syncEnabled && userId) void syncFile(id, file, name);
    },
    [syncEnabled, syncFile, userId],
  );

  const addFromUrl = useCallback(async (name: string, url: string) => {
    const db = dbRef.current;
    if (!db) return;
    const id = crypto.randomUUID();
    await dbPut(db, { id, name, type: "url", url });
    setTracks((prev) => [
      ...prev,
      {
        id,
        name,
        volume: 0.75,
        enabled: false,
        src: url,
        source: "local",
        syncStatus: "local",
        syncProgress: 0,
      },
    ]);
  }, []);

  const syncTrack = useCallback(
    async (id: string) => {
      if (!userId || !syncEnabled) return;
      const db = dbRef.current;
      if (!db) return;
      const stored = await dbGet(db, id);
      if (!stored?.blob) {
        updateTrack(id, {
          syncStatus: "error",
          syncError: "Only locally uploaded files can be synced",
        });
        return;
      }
      await syncFile(id, new File([stored.blob], stored.name, { type: stored.blob.type }), stored.name);
    },
    [syncEnabled, syncFile, updateTrack, userId],
  );

  const removeTrack = useCallback(
    async (id: string) => {
      const track = tracks.find((item) => item.id === id);
      if (track?.storagePath && userId) {
        const { error: storageError } = await supabase.storage
          .from(SYNC_BUCKET)
          .remove([track.storagePath]);
        const { error: metadataError } = await supabase
          .from("user_custom_tracks")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
        if (!storageError && !metadataError) {
          setCloudCount((current) => Math.max(0, current - 1));
          setCloudBytes((current) =>
            Math.max(0, current - (track.compressedBytes ?? 0)),
          );
        }
      }

      const db = dbRef.current;
      if (db) await dbDelete(db, id);
      const audio = audioRefs.current[id];
      if (audio) {
        audio.pause();
        delete audioRefs.current[id];
      }
      setTracks((prev) => {
        const removed = prev.find((item) => item.id === id);
        if (removed?.src.startsWith("blob:")) URL.revokeObjectURL(removed.src);
        return prev.filter((item) => item.id !== id);
      });
    },
    [tracks, userId],
  );

  const toggle = useCallback((id: string) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === id ? { ...track, enabled: !track.enabled } : track)),
    );
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === id ? { ...track, volume } : track)),
    );
  }, []);

  const stopAll = useCallback(() => {
    setTracks((prev) => prev.map((track) => ({ ...track, enabled: false })));
  }, []);

  const setSyncEnabled = useCallback(
    (enabled: boolean) => {
      if (!userId) return;
      localStorage.setItem(syncKey(userId), String(enabled));
      setSyncEnabledState(enabled);
    },
    [userId],
  );

  const isSyncBusy = cloudLoading || tracks.some((track) =>
    track.syncStatus === "compressing" || track.syncStatus === "uploading",
  );

  return {
    tracks,
    addFromFile,
    addFromUrl,
    removeTrack,
    toggle,
    setVolume,
    stopAll,
    syncEnabled,
    setSyncEnabled,
    syncTrack,
    cloudCount,
    cloudBytes,
    maxCloudBytes: MAX_CLOUD_SOUND_BYTES,
    isSyncBusy,
    cloudLoading,
  };
}
