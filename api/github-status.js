// Vercel serverless function — proxies public GitHub repo metadata for
// BANANCHIKIREAL/Earth-flow. Not called from anywhere in the app; it only
// answers if something requests /api/github-status directly. Uses the
// public, unauthenticated GitHub REST API — no token, no secrets.

const REPO = "BANANCHIKIREAL/Earth-flow";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO}`;
const GITHUB_URL = `https://github.com/${REPO}`;

const CACHE_TTL_MS = 60_000;
let cache = null; // { at: number, body: object }

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    res.status(200).json(cache.body);
    return;
  }

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "earthflow.pro-status-check",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      res.status(502).json({ success: false, error: "GitHub API request failed" });
      return;
    }

    const data = await response.json();

    const body = {
      success: true,
      repository: REPO,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      updatedAt: data.updated_at,
      githubUrl: GITHUB_URL,
    };

    cache = { at: Date.now(), body };
    res.status(200).json(body);
  } catch {
    res.status(502).json({ success: false, error: "GitHub API request failed" });
  }
}
