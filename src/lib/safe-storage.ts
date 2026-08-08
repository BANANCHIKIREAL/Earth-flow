// Browsers don't just return null when storage is unavailable — they throw.
// Safari's tracking prevention blocks storage for cross-origin iframes, which
// is exactly how /embed is loaded inside Notion on mobile, and private mode can
// throw on write once the quota is reached. An unguarded `localStorage.getItem`
// during render therefore takes the whole app down instead of degrading.
//
// Every storage access goes through here so a blocked store falls back to an
// in-memory one that lasts for the session.

const memory = new Map<string, string>();

let backing: Storage | null | undefined;

function store(): Storage | null {
  if (backing !== undefined) return backing;

  backing = null;
  if (typeof window !== "undefined") {
    try {
      // Reading the property is enough to throw when storage is blocked, but a
      // write is what fails in private mode, so probe with both.
      const candidate = window.localStorage;
      const probe = "__earthflow_probe__";
      candidate.setItem(probe, "1");
      candidate.removeItem(probe);
      backing = candidate;
    } catch {
      backing = null;
    }
  }

  return backing;
}

export const safeStorage = {
  getItem(key: string): string | null {
    const s = store();
    if (s) {
      try {
        return s.getItem(key);
      } catch {
        // fall through to the in-memory copy
      }
    }
    return memory.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    const s = store();
    if (s) {
      try {
        s.setItem(key, value);
        return;
      } catch {
        // quota exceeded or blocked mid-session — keep it in memory instead
      }
    }
    memory.set(key, value);
  },

  removeItem(key: string): void {
    memory.delete(key);
    const s = store();
    if (!s) return;
    try {
      s.removeItem(key);
    } catch {
      // nothing to do — the value is already gone from the memory fallback
    }
  },
};
