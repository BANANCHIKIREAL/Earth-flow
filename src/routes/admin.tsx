import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = "p:g=5%BBe&~#LXD";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Earth Flow" }] }),
  component: AdminPage,
});

interface UserProfile {
  user_number: number;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  registered_at: string | null;
  last_seen_at: string | null;
  today_sessions: number;
  total_sessions: number;
  total_time_seconds: number;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return "< 1m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "short", year: "numeric" });
}

// ── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    if (value === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-xs space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-sm tracking-wide">
              <span className="font-display text-base">Earth</span>
              <span className="text-muted-foreground"> Flow</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin access</p>
        </div>
        <div className={shake ? "animate-[shake_0.4s_ease-in-out]" : ""}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Password"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-white/[0.06]"
          />
        </div>
        <button
          onClick={submit}
          className="w-full h-11 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

// ── Avatar cell ──────────────────────────────────────────────────────────────

function Avatar({ url, name, email }: { url: string | null; name: string | null; email: string }) {
  const [err, setErr] = useState(false);
  const letter = (name || email || "?").charAt(0).toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-white/10 border border-white/15 inline-flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden text-foreground">
      {url && !err
        ? <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setErr(true)} />
        : letter}
    </div>
  );
}

// ── SQL hint ─────────────────────────────────────────────────────────────────

const SETUP_SQL = `-- 1. Create table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id          UUID PRIMARY KEY,
  email            TEXT,
  display_name     TEXT,
  avatar_url       TEXT,
  registered_at    TIMESTAMPTZ,
  last_seen_at     TIMESTAMPTZ DEFAULT NOW(),
  today_sessions   INTEGER DEFAULT 1,
  last_session_date DATE DEFAULT CURRENT_DATE,
  total_sessions   INTEGER DEFAULT 1,
  total_time_seconds INTEGER DEFAULT 0
);

-- 2. RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admin_read" ON user_profiles FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 3. Atomic time increment function
CREATE OR REPLACE FUNCTION increment_session_time(p_user_id UUID, p_seconds INTEGER)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE user_profiles
  SET total_time_seconds = total_time_seconds + p_seconds,
      last_seen_at = NOW()
  WHERE user_id = p_user_id;
$$;`;

// ── Main dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [query, setQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"email" | "id">("email");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const loginAs = async (user_id: string) => {
    setImpersonating(user_id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-impersonate", {
        body: { user_id, password: ADMIN_PASSWORD },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "No link returned");
      window.open(data.url, "_blank");
    } catch (e) {
      alert("Failed: " + (e as Error).message);
    } finally {
      setImpersonating(null);
    }
  };

  useEffect(() => {
    supabase
      .from("user_profiles")
      .select("user_number, user_id, email, display_name, avatar_url, registered_at, last_seen_at, today_sessions, total_sessions, total_time_seconds")
      .order("last_seen_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setNeedsSetup(true);
        } else {
          setUsers((data ?? []) as UserProfile[]);
        }
        setLoading(false);
      });
  }, []);

  const totalTime = users.reduce((s, u) => s + (u.total_time_seconds ?? 0), 0);
  const todayActive = users.filter((u) => u.today_sessions > 0).length;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) =>
        searchBy === "email"
          ? (u.email ?? "").toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q)
          : u.user_number.toString() === q.replace("#", "")
      )
    : users;

  return (
    <div className="dark min-h-screen bg-background text-foreground animate-page-enter">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
          <span className="text-sm tracking-wide">
            <span className="font-display text-base">Earth</span>
            <span className="text-muted-foreground"> Flow</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold tracking-widest uppercase">
            Admin
          </span>
        </div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to app
        </Link>
      </header>

      <main className="px-8 py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">Users</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-white/10 overflow-hidden text-xs">
              <button
                onClick={() => { setSearchBy("email"); setQuery(""); }}
                className={`px-3 py-1.5 transition-colors ${searchBy === "email" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Email
              </button>
              <button
                onClick={() => { setSearchBy("id"); setQuery(""); }}
                className={`px-3 py-1.5 transition-colors ${searchBy === "id" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                ID
              </button>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchBy === "email" ? "Search by email…" : "Enter user ID (e.g. 3)"}
              className="w-56 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Stats */}
        {!needsSetup && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <StatCard label="Total users" value={users.length} />
            <StatCard label="Active today" value={todayActive} />
            <StatCard label="Total time" value={formatTime(totalTime)} isText />
          </div>
        )}

        {/* Setup hint */}
        {needsSetup && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-5 text-sm space-y-3 mb-8">
            <p className="text-foreground font-medium">Setup required</p>
            <p className="text-muted-foreground text-xs">Run this SQL in Supabase → SQL Editor:</p>
            <pre className="text-xs bg-white/[0.04] rounded-lg px-4 py-4 overflow-x-auto text-primary/80 leading-relaxed whitespace-pre">{SETUP_SQL}</pre>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !needsSetup && users.length === 0 ? (
          <div className="text-sm text-muted-foreground">No users yet. Data appears after the first login.</div>
        ) : !needsSetup && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["User", "#", "Registered", "Today", "Sessions", "Time", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[11px] uppercase tracking-widest font-medium text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.user_id}
                    className={`${i < filtered.length - 1 ? "border-b border-white/[0.04]" : ""} hover:bg-white/[0.02] transition-colors`}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar url={u.avatar_url} name={u.display_name} email={u.email} />
                        <div className="min-w-0">
                          {u.display_name && (
                            <div className="text-xs font-medium truncate max-w-[160px]">{u.display_name}</div>
                          )}
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* # */}
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground/60">
                      #{u.user_number}
                    </td>
                    {/* Registered */}
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatDate(u.registered_at)}
                    </td>
                    {/* Today sessions */}
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      {u.today_sessions > 0 ? (
                        <span className="text-primary font-medium">{u.today_sessions}×</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    {/* Total sessions */}
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{u.total_sessions}</td>
                    {/* Total time */}
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
                      {formatTime(u.total_time_seconds ?? 0)}
                    </td>
                    {/* Login as */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void loginAs(u.user_id)}
                        disabled={impersonating === u.user_id}
                        className="text-[11px] px-3 py-1 rounded-full border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors disabled:opacity-40"
                      >
                        {impersonating === u.user_id ? "…" : "Login as"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <div className={`font-semibold tabular-nums ${isText ? "text-xl" : "text-2xl"}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// ── Route component ──────────────────────────────────────────────────────────

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.user_metadata?.role === "admin";
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) void navigate({ to: "/" });
  }, [user, loading, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
      </div>
    );
  }

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return <Dashboard />;
}
