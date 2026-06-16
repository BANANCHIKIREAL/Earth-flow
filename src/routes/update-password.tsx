import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, inputCls, btnCls, errorCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/update-password")({
  head: () => ({ meta: [{ title: "Новый пароль — Earth Flow" }] }),
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
    if (password !== confirm) { setError("Пароли не совпадают"); return; }
    if (password.length < 6) { setError("Пароль должен содержать минимум 6 символов"); return; }
    if (/[а-яёА-ЯЁ]/.test(password)) { setError("Пароль не может содержать русские буквы"); return; }
    if (strength.score < 2) { setError("Пароль слишком слабый — добавьте цифры или заглавные буквы"); return; }
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
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Новый пароль</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Придумайте надёжный пароль для аккаунта</p>
        </div>

        <div className="space-y-4">
          {error && <div className={errorCls}>{error}</div>}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Новый пароль (мин. 6 символов)"
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
              {submitting ? "Сохранение…" : "Сохранить пароль"}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
