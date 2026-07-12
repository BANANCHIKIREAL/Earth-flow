import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing token" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Identify the caller from their own JWT — users can only delete themselves
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: "Invalid token" }, 401);
  const userId = userData.user.id;

  // Remove user rows
  for (const table of ["user_settings", "user_data", "user_streaks", "user_profiles"]) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) console.error(`cleanup ${table}:`, error.message);
  }

  // Remove storage files (avatars + custom backgrounds)
  for (const bucket of ["avatars", "user-backgrounds"]) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(userId);
      if (files?.length) {
        await admin.storage
          .from(bucket)
          .remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch (e) {
      console.error(`cleanup storage ${bucket}:`, e);
    }
  }

  // Delete the auth user itself
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ ok: true });
});
