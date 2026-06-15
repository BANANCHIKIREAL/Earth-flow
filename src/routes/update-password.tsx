import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Background } from "@/components/Background";

export const Route = createFileRoute("/update-password")({
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await updatePassword(password);
    if (error) {
      setError("Не удалось обновить пароль. Попробуйте снова.");
      setSubmitting(false);
    } else {
      void navigate({ to: "/" });
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Background variant="galaxy" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[8%]  left-[10%]  w-72 h-72 rounded-full bg-violet-500/25  blur-3xl animate-orb-1" />
        <div className="absolute top-[55%] right-[8%]  w-56 h-56 rounded-full bg-blue-500/20    blur-3xl animate-orb-2" />
        <div className="absolute bottom-[12%] left-[28%] w-64 h-64 rounded-full bg-fuchsia-500/20 blur-3xl animate-orb-3" />
        <div className="absolute top-[35%] right-[22%] w-44 h-44 rounded-full bg-cyan-400/15    blur-3xl animate-orb-4" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm tracking-wide text-muted-foreground">
              <span className="font-display text-base text-foreground">Earth</span> Flow
            </span>
          </div>
          <h1 className="font-display text-2xl text-foreground">Новый пароль</h1>
          <p className="text-xs text-muted-foreground mt-1">Придумайте новый пароль для аккаунта</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Новый пароль (мин. 6 символов)"
              required
              autoComplete="new-password"
              className="w-full rounded-full border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Повторите пароль"
              required
              autoComplete="new-password"
              className="w-full rounded-full border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {submitting ? "Сохранение…" : "Сохранить пароль"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
