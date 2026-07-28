import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, GoogleIcon, Divider, PasswordInput, inputCls, btnCls, ghostBtnCls, errorCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Sign Up — Earth Flow" }] }),
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
  if (score <= 1) return { score: 1, label: "Weak",   color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair",   color: "bg-orange-400" };
  if (score === 3) return { score: 3, label: "Good",   color: "bg-yellow-400" };
  return              { score: 4, label: "Strong",  color: "bg-green-400" };
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
  const passwordChecks = [
    { label: "8 or more characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /[0-9]/.test(password) },
    { label: "No Cyrillic letters", passed: !/[\u0400-\u04ff]/.test(password) },
    { label: "Not a common password", passed: password.length > 0 && !isBanned(password) },
  ];
  const passedChecks = passwordChecks.filter((check) => check.passed).length;
  const passwordReady = passedChecks === passwordChecks.length && strength.score >= 2;
  const confirmMatches = confirm.length > 0 && password === confirm;

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (/[\u0400-\u04ff]/.test(password)) { setError("Password cannot contain Cyrillic characters"); return; }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must include lowercase and uppercase letters and a number");
      return;
    }
    if (isBanned(password)) { setError("This password is too common — please choose something unique"); return; }
    if (strength.score < 2) { setError("Password too weak — add numbers or uppercase letters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setSubmitting(true);
    setError(null);
    const { error } = await signUp(email, password);
    if (error) {
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("user already exists")
      ) {
        setError("An account with this email already exists. Try signing in.");
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
            <h2 className="font-display text-2xl text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              We sent a message to{" "}
              <span className="text-foreground font-medium">{email}</span>.<br />
              Click the link to confirm your account.
            </p>
          </div>
          <p className="text-xs text-muted-foreground/50 leading-relaxed">
            Don't see the email? Check your spam folder.<br />
            If it never arrives, this email may already be registered.{" "}
            <Link to="/login" className="underline hover:text-muted-foreground transition-colors">
              Try signing in.
            </Link>
          </p>
          <button
            onClick={() => { setSuccess(false); setSubmitting(false); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to sign up
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1.5">You can add your name later in settings</p>
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
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            {password && (
              <div className={`auth-password-checker ${passwordReady ? "is-ready" : ""}`}>
                <div className="auth-password-checker-head">
                  <span className="auth-password-checker-icon"><ShieldCheck size={15} /></span>
                  <span>
                    <b>Password security</b>
                    <small>{passedChecks} of {passwordChecks.length} requirements met</small>
                  </span>
                  <em className={`auth-password-strength strength-${strength.score}`}>{strength.label}</em>
                </div>
                <div className="auth-password-meter" aria-hidden="true">
                  <i style={{ width: `${Math.max(8, (passedChecks / passwordChecks.length) * 100)}%` }} />
                </div>
                <div className="auth-password-requirements">
                  {passwordChecks.map((check) => (
                    <span key={check.label} className={check.passed ? "is-passed" : ""}>
                      <i>{check.passed ? <Check size={10} /> : <X size={10} />}</i>
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            {confirm && (
              <div className={`auth-password-match ${confirmMatches ? "is-matched" : "is-mismatched"}`}>
                {confirmMatches ? <Check size={12} /> : <X size={12} />}
                {confirmMatches ? "Passwords match" : "Passwords do not match yet"}
              </div>
            )}
            <button type="submit" disabled={submitting || !passwordReady || !confirmMatches} className={btnCls}>
              {submitting ? "Creating…" : "Create account"}
            </button>
          </form>

          <Divider />

          <button onClick={() => void signInWithGoogle()} className={ghostBtnCls}>
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground hover:text-primary transition-colors font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
