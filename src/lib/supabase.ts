import { createClient } from "@supabase/supabase-js";

import { safeStorage } from "./safe-storage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars missing. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  // Auth persists the session in localStorage by default, which throws where
  // storage is blocked (e.g. the /embed widget inside a Notion iframe).
  { auth: { storage: safeStorage } }
);
