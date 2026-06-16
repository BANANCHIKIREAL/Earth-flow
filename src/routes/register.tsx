import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Background } from "@/components/Background";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: RegisterPage,
});

const BANNED = new Set([
  "123456","1234567","12345678","123456789","1234567890",
  "0987654321","987654321","87654321","7654321","654321","54321","4321","321",
  "111111","1111111","11111111","111111111","1111111111",
  "222222","333333","444444","555555","666666","777777","888888","999999","000000",
  "112233","123123","121212","131313","232323","242424","303030","010101",
  "123321","654321","abcdef","abc123","password","password1","password123",
  "qwerty","qwerty123","qwertyuiop","asdfgh","asdfghjkl","zxcvbn","zxcvbnm",
  "qazwsx","qazwsxedc","1q2w3e","1q2w3e4r","iloveyou","letmein","welcome",
  "monkey","dragon","master","sunshine","princess","shadow","superman","batman",
  "football","baseball","soccer","hockey","michael","jessica","ashley","andrew",
]);

function isBanned(p: string): boolean {
  const lower = p.toLowerCase();
  if (BANNED.has(lower)) return true;
  if (/^(.)\1+$/.test(p)) return true;
  if (/^(0123|1234|2345|3456|4567|5678|6789|7890|9876|8765|7654|6543|5432|4321|3210)/.test(p) && p.length <= 12) return true;
  return false;
}

function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score: 1, label: "Слабый",   color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Средний",  color: "bg-orange-400" };
  if (score === 3) return { score: 3, label: "Хороший",  color: "bg-yellow-400" };
  return              { score: 4, label: "Сильный",   color: "bg-green-400" };
}

function RegisterPage() {
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const { email: emailParam } = Route.useSearch();
  const [email, setEmail] = useState(emailParam ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = getStrength(password);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    if (/[а-яёА-ЯЁ]/.test(password)) {
      setError("Пароль не может содержать русские буквы");
      return;
    }
    if (isBanned(password)) {
      setError("Этот пароль слишком распространённый — придумайте что-нибудь уникальное");
      return;
    }
    if (strength.score < 2) {
      setError("Пароль слишком слабый — добавьте цифры или заглавные буквы");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await signUp(email, password);
    if (error) {
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("user already exists")
      ) {
        setError("Аккаунт с этой почтой уже существует. Попробуйте войти.");
      } else {
        setError(error.message);
      }
      setSubmitting(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
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
          <div className="text-4xl">📬</div>
          <h2 className="font-display text-2xl text-foreground">Проверьте почту</h2>
          <p className="text-sm text-muted-foreground">
            Мы отправили письмо на <span className="text-foreground">{email}</span>.<br />
            Перейдите по ссылке для подтверждения аккаунта.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Не видите письмо? Проверьте папку «Спам».<br />
            Если письмо не пришло — возможно эта почта уже зарегистрирована.{" "}
            <Link to="/login" className="underline hover:text-muted-foreground transition-colors">Попробуйте войти.</Link>
          </p>
          <button onClick={() => { setSuccess(false); setSubmitting(false); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Вернуться к регистрации
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Background variant="galaxy" />

      {/* floating orbs */}
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
          <h1 className="font-display text-2xl text-foreground">Создать аккаунт</h1>
          <p className="text-xs text-muted-foreground mt-1">Имя можно добавить позже в настройках</p>
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
              placeholder="Пароль (мин. 6 символов)"
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
              {submitting ? "Создание…" : "Создать аккаунт"}
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
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M43.611 20.083H42V20H24v8h11.303C33.988 32.657 29.455 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.435 0-9.957-3.621-11.297-8.571l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a11.986 11.986 0 01-4.087 5.571l6.19 5.238C42.012 35.67 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
            </svg>
            Продолжить с Google
          </button>

          <div className="text-center pt-1">
            <p className="text-xs text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-foreground hover:text-primary transition-colors">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
