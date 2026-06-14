import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Background } from "@/components/Background";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.988 32.657 29.455 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.435 0-9.957-3.621-11.297-8.571l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a11.986 11.986 0 01-4.087 5.571l6.19 5.238C42.012 35.67 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

function LoginPage() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError("Неверный email или пароль");
      setSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Background variant="galaxy" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm tracking-wide text-muted-foreground">
              <span className="font-display text-base text-foreground">Earth</span> Flow
            </span>
          </div>
          <h1 className="font-display text-2xl text-foreground">Войдите в аккаунт</h1>
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
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-full border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              required
              autoComplete="current-password"
              className="w-full rounded-full border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {submitting ? "Вход…" : "Войти"}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-[11px] text-muted-foreground">или</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <button
            onClick={() => void signInWithGoogle()}
            className="w-full h-10 rounded-full glass border border-border text-sm inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <GoogleIcon />
            Продолжить с Google
          </button>

          <div className="text-center space-y-1 pt-1">
            <div className="text-xs">
              <Link to="/reset-password" className="text-muted-foreground hover:text-foreground transition-colors">
                Забыли пароль?
              </Link>
            </div>
            <div className="text-xs text-muted-foreground">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-foreground hover:text-primary transition-colors">
                Создать
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
