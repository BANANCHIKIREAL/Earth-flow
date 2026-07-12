import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateDisplayName: (name: string) => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ error: Error | null }>;
  removeAvatar: () => Promise<{ error: Error | null }>;
  updateEmail: (email: string) => Promise<{ error: Error | null }>;
  requestDeleteCode: () => Promise<{ error: Error | null }>;
  verifyDeleteCode: (code: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const updateDisplayName = async (name: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim() },
    });
    return { error: error as Error | null };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error("Not authenticated") };
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError as Error };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const urlWithBust = `${data.publicUrl}?t=${Date.now()}`;
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: urlWithBust },
    });
    if (!updateError) {
      const { data: { user: fresh } } = await supabase.auth.getUser();
      if (fresh) setUser(fresh);
    }
    return { error: updateError as Error | null };
  };

  const removeAvatar = async () => {
    if (!user) return { error: new Error("Not authenticated") };
    // Best-effort: clean up stored avatar files
    try {
      const { data: files } = await supabase.storage.from("avatars").list(user.id);
      if (files?.length) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${user.id}/${f.name}`));
      }
    } catch {}
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
    if (!error) {
      const { data: { user: fresh } } = await supabase.auth.getUser();
      if (fresh) setUser(fresh);
    }
    return { error: error as Error | null };
  };

  const updateEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: window.location.origin },
    );
    return { error: error as Error | null };
  };

  const requestDeleteCode = async () => {
    if (!user?.email) return { error: new Error("Not authenticated") };
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false },
    });
    return { error: error as Error | null };
  };

  const verifyDeleteCode = async (code: string) => {
    if (!user?.email) return { error: new Error("Not authenticated") };
    const { error } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: "email",
    });
    return { error: error as Error | null };
  };

  const deleteAccount = async () => {
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) return { error: new Error("Not authenticated") };
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${current.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        return { error: new Error(body.error ?? `Request failed (${res.status})`) };
      }
    } catch (e) {
      return { error: e as Error };
    }
    await supabase.auth.signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        updateDisplayName,
        uploadAvatar,
        removeAvatar,
        updateEmail,
        requestDeleteCode,
        verifyDeleteCode,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
