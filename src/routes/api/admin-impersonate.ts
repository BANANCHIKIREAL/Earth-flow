import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = "p:g=5%BBe&~#LXD";

export const APIRoute = createAPIFileRoute("/api/admin-impersonate")({
  POST: async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };

    if (password !== ADMIN_PASSWORD) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return Response.json({ error: "Server not configured" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ url: data.properties.action_link });
  },
});
