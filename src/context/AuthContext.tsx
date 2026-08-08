import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  imageExtensionFor,
  validateImageFile,
} from "@/lib/imageUpload";
import {
  forgetAccount,
  listSavedAccounts,
  saveAccount,
  type SavedAccount,
} from "@/lib/savedAccounts";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (
    email: string,
    mode?: "add" | "change",
  ) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateDisplayName: (name: string) => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ error: Error | null }>;
  removeAvatar: () => Promise<{ error: Error | null }>;
  updateEmail: (email: string) => Promise<{ error: Error | null }>;
  requestDeleteCode: () => Promise<{ error: Error | null }>;
  verifyDeleteCode: (code: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  savedAccounts: SavedAccount[];
  switchAccount: (id: string) => Promise<{ error: Error | null }>;
  forgetSavedAccount: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() =>
    listSavedAccounts(),
  );

  // Remember every session we see so it shows up in the account switcher —
  // covers sign-in, sign-up, OAuth, and switching back to an account already
  // in the list.
  useEffect(() => {
    if (!session || !user) return;
    saveAccount({
      id: user.id,
      email: user.email ?? "",
      displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    });
    setSavedAccounts(listSavedAccounts());
  }, [session, user]);

  useEffect(() => {
    let active = true;

    const refreshUserFromServer = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active || error) return;
      setUser(data.user);
      setSession((current) =>
        current ? { ...current, user: data.user } : current,
      );
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) void refreshUserFromServer();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) window.setTimeout(() => void refreshUserFromServer(), 0);
    });

    const refreshOnFocus = () => void refreshUserFromServer();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshUserFromServer();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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

  const resetPassword = async (
    email: string,
    mode: "add" | "change" = "change",
  ) => {
    if (user) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { password_email_mode: mode },
      });
      if (metadataError) return { error: metadataError as Error };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error && user) {
      await Promise.all([
        supabase
          .from("user_profiles")
          .update({ has_password: true })
          .eq("user_id", user.id),
        supabase.auth.updateUser({
          data: { password_email_mode: null },
        }),
      ]);
    }
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
    const validationError = validateImageFile(file);
    if (validationError) return { error: validationError };
    const ext = imageExtensionFor(file);
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
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

  const switchAccount = async (id: string) => {
    const target = listSavedAccounts().find((a) => a.id === id);
    if (!target) return { error: new Error("Account not found") };
    const { error } = await supabase.auth.setSession({
      access_token: target.accessToken,
      refresh_token: target.refreshToken,
    });
    return { error: error as Error | null };
  };

  const forgetSavedAccount = (id: string) => {
    forgetAccount(id);
    setSavedAccounts(listSavedAccounts());
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
        savedAccounts,
        switchAccount,
        forgetSavedAccount,
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
