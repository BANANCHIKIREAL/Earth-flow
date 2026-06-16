import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Background } from "@/components/Background";

export const Route = createFileRoute("/update-password")({
  component: UpdatePasswordPage,
});

function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score: 1, label: "Слабый",  color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Средний", color: "bg-orange-400" };
  if (score === 3) return { score: 3, label: "Хороший", color: "bg-yellow-400" };
  return              { score: 4, label: "Сильный", color: "bg-green-400" };
}

function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = getStrength(password);

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
    if (/[а-яёА-ЯЁ]/.test(password)) {
      setError("Пароль не может содержать русские буквы");
      return;
    }
    if (strength.score < 2) {
      setError("Пароль слишком слабый — добавьте цифры или заглавные буквы");
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
            {password && (
              <div className="px-1 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : "bg-foreground/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">Надёжность пароля</span>
                  <span className={`text-[11px] font-medium transition-colors ${
                    strength.score <= 1 ? "text-red-400" :
                    strength.score === 2 ? "text-orange-400" :
                    strength.score === 3 ? "text-yellow-400" : "text-green-400"
                  }`}>{strength.label}</span>
                </div>
              </div>
            )}
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
