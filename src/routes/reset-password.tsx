import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, inputCls, btnCls, errorCls } from "@/components/AuthLayout";

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
      <AuthLayout>
        <div className="space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto">
            ✉️
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground">Письмо отправлено</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Проверьте почту{" "}
              <span className="text-foreground font-medium">{email}</span>.<br />
              Перейдите по ссылке для сброса пароля.
            </p>
          </div>
          <p className="text-xs text-muted-foreground/50">
            Не видите письмо? Проверьте папку «Спам».
          </p>
          <Link to="/login" className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Вернуться к входу
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Восстановить пароль</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Отправим ссылку для сброса на почту</p>
        </div>

        <div className="space-y-4">
          {error && <div className={errorCls}>{error}</div>}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ваш email"
              required
              autoComplete="email"
              className={inputCls}
            />
            <button type="submit" disabled={submitting} className={btnCls}>
              {submitting ? "Отправка…" : "Отправить ссылку"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
