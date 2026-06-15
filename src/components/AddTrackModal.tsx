import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAddFromFile: (file: File) => Promise<void>;
}

export function AddTrackModal({ open, onClose, onAddFromFile }: Props) {
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setPendingFile(null); setAdding(false); }
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
    if (file?.type.startsWith("audio/")) setPendingFile(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  }, []);

  const handleAdd = async () => {
    if (!pendingFile) return;
    setAdding(true);
    await onAddFromFile(pendingFile);
    setAdding(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div onClick={!adding ? onClose : undefined} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="glass border border-border rounded-3xl p-6 w-full max-w-sm space-y-5 pointer-events-auto">

          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Своя музыка
            </div>
            <button
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
                  {(pendingFile.size / 1024 / 1024).toFixed(1)} МБ
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-foreground/70">Перетащите аудиофайл</div>
                <div className="text-xs text-muted-foreground mt-0.5">или нажмите для выбора</div>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileInput}
          />

          {pendingFile ? (
            <div className="flex gap-2">
              <button
                onClick={() => setPendingFile(null)}
                disabled={adding}
                className="flex-1 h-9 rounded-full glass border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                Убрать
              </button>
              <button
                onClick={() => void handleAdd()}
                disabled={adding}
                className="flex-1 h-9 rounded-full bg-foreground text-background text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {adding ? "Добавление…" : "Добавить"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-9 rounded-full glass border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Выбрать файл
            </button>
          )}

          <p className="text-center text-[11px] text-muted-foreground/50">
            Треки хранятся локально и не синхронизируются между устройствами
          </p>
        </div>
      </div>
    </>
  );
}
