// Vercel serverless function — posts a Discord embed on real site visits.
// Called from src/routes/__root.tsx once per full page load (client-side,
// since Earth Flow ships as a static SPA with no per-request server hook).

const ACCENT_COLOR = 0x3dc9b0; // Earth Flow teal

const DEDUPE_WINDOW_MS = 10_000;
let lastPingAt = 0;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(204).end();
    return;
  }

  const now = Date.now();
  if (now - lastPingAt < DEDUPE_WINDOW_MS) {
    res.status(204).end();
    return;
  }
  lastPingAt = now;

  const time = new Date(now).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "long",
    timeStyle: "medium",
  });

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "👀 Новый визит на сайт",
            color: ACCENT_COLOR,
            fields: [{ name: "Время (МСК)", value: time, inline: false }],
            footer: { text: "earthflow.pro" },
            timestamp: new Date(now).toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // best-effort notification, ignore failures
  }

  res.status(204).end();
}
