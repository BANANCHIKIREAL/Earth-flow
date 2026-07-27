import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, inputCls, btnCls, errorCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/update-password")({
  head: () => ({ meta: [{ title: "New Password — Earth Flow" }] }),
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
  if (score <= 1) return { score: 1, label: "Weak",   color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair",   color: "bg-orange-400" };
  if (score === 3) return { score: 3, label: "Good",   color: "bg-yellow-400" };
  return              { score: 4, label: "Strong",  color: "bg-green-400" };
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
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (/[\u0400-\u04ff]/.test(password)) { setError("Password cannot contain Cyrillic characters"); return; }
    if (strength.score < 2) { setError("Password too weak — add numbers or uppercase letters"); return; }
    setSubmitting(true);
    setError(null);
    const { error } = await updatePassword(password);
    if (error) {
      setError("Failed to update password. Please try again.");
      setSubmitting(false);
    } else {
      void navigate({ to: "/" });
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">New password</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Create a strong password for your account</p>
        </div>

        <div className="space-y-4">
          {error && <div className={errorCls}>{error}</div>}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min. 6 characters)"
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
                  <span className="text-[11px] text-muted-foreground/60">Password strength</span>
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
              placeholder="Confirm password"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            <button type="submit" disabled={submitting} className={btnCls}>
              {submitting ? "Saving…" : "Save password"}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
