import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Background } from "@/components/Background";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await resetPassword(email);
    if (error) {
      setError("Не удалось отправить письмо. Проверьте email.");
      setSubmitting(false);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="dark min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <Background variant="galaxy" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[8%]  left-[10%]  w-72 h-72 rounded-full bg-violet-500/25  blur-3xl animate-orb-1" />
          <div className="absolute top-[55%] right-[8%]  w-56 h-56 rounded-full bg-blue-500/20    blur-3xl animate-orb-2" />
          <div className="absolute bottom-[12%] left-[28%] w-64 h-64 rounded-full bg-fuchsia-500/20 blur-3xl animate-orb-3" />
          <div className="absolute top-[35%] right-[22%] w-44 h-44 rounded-full bg-cyan-400/15    blur-3xl animate-orb-4" />
        </div>
        <div className="relative w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h2 className="font-display text-2xl text-foreground">Письмо отправлено</h2>
          <p className="text-sm text-muted-foreground">
            Проверьте почту <span className="text-foreground">{email}</span>.<br />
            Перейдите по ссылке для сброса пароля.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Не видите письмо? Проверьте папку «Спам».
          </p>
          <Link to="/login" className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="font-display text-2xl text-foreground">Восстановить пароль</h1>
          <p className="text-xs text-muted-foreground mt-1">Отправим ссылку для сброса на почту</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ваш email"
              required
              autoComplete="email"
              className="w-full rounded-full border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {submitting ? "Отправка…" : "Отправить ссылку"}
            </button>
          </form>

          <div className="text-center pt-1">
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
