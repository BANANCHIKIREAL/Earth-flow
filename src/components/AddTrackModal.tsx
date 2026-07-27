import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cloud, HardDrive, Upload, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAddFromFile: (file: File) => Promise<void>;
  syncEnabled: boolean;
  canSync: boolean;
}

function isSupportedAudioFile(file: File) {
  return (
    file.type.startsWith("audio/") ||
    file.type === "video/mp4" ||
    file.name.toLowerCase().endsWith(".mp4")
  );
}

export function AddTrackModal({ open, onClose, onAddFromFile, syncEnabled, canSync }: Props) {
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setPendingFile(null); setFileError(null); setAdding(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (isSupportedAudioFile(file)) {
      setPendingFile(file);
      setFileError(null);
    } else {
      setPendingFile(null);
      setFileError("Choose an audio file or an MP4 containing an audio track.");
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isSupportedAudioFile(file)) {
      setPendingFile(file);
      setFileError(null);
    } else if (file) {
      setPendingFile(null);
      setFileError("Choose an audio file or an MP4 containing an audio track.");
    }
    e.target.value = "";
  }, []);

  const handleAdd = async () => {
    if (!pendingFile) return;
    setAdding(true);
    await onAddFromFile(pendingFile);
    setAdding(false);
    onClose();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onClick={!adding ? onClose : undefined}
        className="custom-track-modal-backdrop"
      />
      <div className="custom-track-modal-layer">
        <div
          aria-labelledby="custom-track-modal-title"
          aria-modal="true"
          className="custom-track-modal-surface glass border border-border rounded-3xl p-6 w-full max-w-sm space-y-5 pointer-events-auto"
          role="dialog"
        >

          <div className="flex items-center justify-between">
            <div
              id="custom-track-modal-title"
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
            >
              Your music
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={adding}
              className="h-8 w-8 rounded-full glass flex items-center justify-center hover:text-primary transition-colors disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </div>

          <div
            onClick={() => !pendingFile && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
            }`}
          >
            <Upload size={22} className="text-muted-foreground" />
            {pendingFile ? (
              <div className="text-center">
                <div className="text-sm font-medium truncate max-w-[200px]">{pendingFile.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(pendingFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-foreground/70">Drag an audio file</div>
                <div className="text-xs text-muted-foreground mt-0.5">or click to browse</div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp4,video/mp4"
            className="hidden"
            onChange={handleFileInput}
          />

          {fileError && (
            <p className="rounded-2xl border border-rose-300/10 bg-rose-300/[0.06] px-3 py-2 text-[11px] leading-relaxed text-rose-100/75">
              {fileError}
            </p>
          )}

          {pendingFile ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                disabled={adding}
                className="flex-1 h-9 rounded-full glass border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={adding}
                className="flex-1 h-9 rounded-full bg-foreground text-background text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {adding ? "Adding…" : "Add"}
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted-foreground">
                {syncEnabled && canSync ? <Cloud size={14} /> : <HardDrive size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-foreground/75">
                  {syncEnabled && canSync ? "Local original, optional cloud copy" : "Stored on this device"}
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/60">
                  {syncEnabled && canSync
                    ? "Your original stays local. A compressed private copy will be created automatically."
                    : canSync
                      ? "Cloud Sound Library is off. You can enable it in Sound settings."
                      : "Sign in to make private cloud copies available on your other devices."}
                </p>
              </div>
              <div
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] ${
                  syncEnabled && canSync
                    ? "border-sky-300/20 bg-sky-300/[0.08] text-sky-200"
                    : "border-white/10 bg-white/[0.025] text-muted-foreground/50"
                }`}
                role="status"
                aria-live="polite"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    syncEnabled && canSync
                      ? "bg-sky-200 shadow-[0_0_9px_rgba(186,230,253,0.75)]"
                      : "bg-white/20"
                  }`}
                  aria-hidden="true"
                />
                {syncEnabled && canSync ? "Cloud on" : canSync ? "Cloud off" : "Local only"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
