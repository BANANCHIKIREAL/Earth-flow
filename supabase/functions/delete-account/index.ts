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

  // Remove every user-owned storage object before deleting the auth identity.
  for (const bucket of ["avatars", "user-backgrounds", "user-audio-sync"]) {
    while (true) {
      const { data: files, error: listError } = await admin.storage
        .from(bucket)
        .list(userId, { limit: 100 });
      if (listError) return json({ error: `Could not clean up ${bucket}` }, 500);
      if (!files?.length) break;
      const { error: removeError } = await admin.storage
        .from(bucket)
        .remove(files.map((file) => `${userId}/${file.name}`));
      if (removeError) return json({ error: `Could not clean up ${bucket}` }, 500);
    }
  }

  // Remove user rows. Abort on failure so the user can retry safely.
  for (const table of [
    "user_custom_tracks",
    "user_settings",
    "user_data",
    "user_streaks",
    "user_profiles",
  ]) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) return json({ error: `Could not clean up ${table}` }, 500);
  }

  // Delete the auth user itself
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ ok: true });
});
