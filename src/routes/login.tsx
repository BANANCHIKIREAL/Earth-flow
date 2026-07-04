import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout, GoogleIcon, Divider, inputCls, btnCls, ghostBtnCls, errorCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Earth Flow" }] }),
  component: LoginPage,
});

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
      setError("Invalid email or password");
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Sign in to continue</p>
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
              placeholder="Password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
            <button type="submit" disabled={submitting} className={btnCls}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <Divider />

          <button onClick={() => void signInWithGoogle()} className={ghostBtnCls}>
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <div>
            <Link to="/reset-password" className="hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <div>
            Don't have an account?{" "}
            <Link to="/register" className="text-foreground hover:text-primary transition-colors font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
