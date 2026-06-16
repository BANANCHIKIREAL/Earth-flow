import { useEffect, useRef, useState } from "react";
import { Camera, Check, LogOut, User, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  onUpdateDisplayName: (name: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<{ error: Error | null }>;
  onSignOut: () => Promise<void>;
}

export function ProfileModal({
  open,
  onClose,
  email,
  displayName,
  avatarUrl,
  onUpdateDisplayName,
  onUploadAvatar,
  onSignOut,
}: Props) {
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(displayName); }, [displayName]);
  useEffect(() => { setImgError(false); }, [avatarUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const avatarLetter = (displayName || email).charAt(0).toUpperCase();

  const handleSave = async () => {
    if (draft === displayName) return;
    setSaving(true);
    await onUpdateDisplayName(draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadError(null);
    setUploading(true);
    const { error } = await onUploadAvatar(file);
    setUploading(false);
    if (error) setUploadError("Не удалось загрузить фото. Попробуйте ещё раз.");
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="glass border border-border rounded-3xl p-6 w-full max-w-sm space-y-6 pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Профиль
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full glass flex items-center justify-center hover:text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <button
                onClick={() => fileRef.current?.click()}
                className="h-20 w-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors relative block"
              >
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-foreground/10 flex items-center justify-center text-2xl font-semibold">
                    {avatarLetter}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white" />
                  )}
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatarFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="text-center">
              {displayName && (
                <div className="text-sm font-medium text-foreground">{displayName}</div>
              )}
              <div className="text-xs text-muted-foreground">{email}</div>
              {uploadError && (
                <div className="text-[11px] text-red-400 mt-1">{uploadError}</div>
              )}
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <User size={11} /> Имя
            </label>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
                placeholder="Добавить имя"
                className="flex-1 min-w-0 rounded-full border border-border bg-foreground/5 px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                onClick={() => void handleSave()}
                disabled={saving || draft === displayName}
                className="h-9 w-9 rounded-full glass border border-border inline-flex items-center justify-center transition-colors hover:border-primary disabled:opacity-40"
              >
                {saved ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Check size={14} />
                )}
              </button>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => void onSignOut()}
            className="w-full h-9 rounded-full glass border border-border text-sm inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-red-400 hover:border-red-400/40 transition-colors"
          >
            <LogOut size={14} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  );
}
