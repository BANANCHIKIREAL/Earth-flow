import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, GoogleIcon, Divider, inputCls, btnCls, ghostBtnCls, errorCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Регистрация — Earth Flow" }] }),
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
    if (password.length < 6) { setError("Пароль должен содержать минимум 6 символов"); return; }
    if (/[а-яёА-ЯЁ]/.test(password)) { setError("Пароль не может содержать русские буквы"); return; }
    if (isBanned(password)) { setError("Этот пароль слишком распространённый — придумайте что-нибудь уникальное"); return; }
    if (strength.score < 2) { setError("Пароль слишком слабый — добавьте цифры или заглавные буквы"); return; }
    if (password !== confirm) { setError("Пароли не совпадают"); return; }
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
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto">
            📬
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">Проверьте почту</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Мы отправили письмо на{" "}
              <span className="text-foreground font-medium">{email}</span>.<br />
              Перейдите по ссылке для подтверждения аккаунта.
            </p>
          </div>
          <p className="text-xs text-muted-foreground/50 leading-relaxed">
            Не видите письмо? Проверьте папку «Спам».<br />
            Если письмо не пришло — возможно эта почта уже зарегистрирована.{" "}
            <Link to="/login" className="underline hover:text-muted-foreground transition-colors">
              Попробуйте войти.
            </Link>
          </p>
          <button
            onClick={() => { setSuccess(false); setSubmitting(false); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Вернуться к регистрации
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Создать аккаунт</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Имя можно добавить позже в настройках</p>
        </div>

        <div className="space-y-4">
          {error && <div className={errorCls}>{error}</div>}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className={inputCls}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (мин. 6 символов)"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            {password && (
              <div className="px-1 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : "bg-foreground/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground/60">Надёжность пароля</span>
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
              className={inputCls}
            />
            <button type="submit" disabled={submitting} className={btnCls}>
              {submitting ? "Создание…" : "Создать аккаунт"}
            </button>
          </form>

          <Divider />

          <button onClick={() => void signInWithGoogle()} className={ghostBtnCls}>
            <GoogleIcon />
            Продолжить с Google
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-foreground hover:text-primary transition-colors font-medium">
            Войти
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
