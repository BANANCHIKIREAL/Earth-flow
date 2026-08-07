import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

function safeResolve(...p) {
  return resolve(process.cwd(), ...p);
}

const normalizeAssetPath = (p) =>
  p ? p.replace(/^\/?assets[\\/]/, '').replace(/^assets[\\/]/, '') : p;

function stripPrivateManifestFields(value) {
  if (Array.isArray(value)) return value.map(stripPrivateManifestFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'filePath')
      .map(([key, entry]) => [key, stripPrivateManifestFields(entry)]),
  );
}

async function findStartManifestFile(...assetDirs) {
  const fs = await import('node:fs');
  for (const dir of assetDirs) {
    if (!existsSync(dir)) continue;
    const files = await fs.promises.readdir(dir);
    const manifestFile = files.find(
      (f) => f.startsWith('_tanstack-start-manifest_v-') && f.endsWith('.js'),
    );
    if (manifestFile) return resolve(dir, manifestFile);
  }
  return null;
}

async function parseStartManifest(...assetDirs) {
  const manifestPath = await findStartManifestFile(...assetDirs);
  if (!manifestPath) return null;

  const manifestContent = await readFile(manifestPath, 'utf8');
  const functionMatch = manifestContent.match(
    /(?:export\s+)?const tsrStartManifest = \(\) => \(([\s\S]+?)\);/,
  );
  if (!functionMatch) return null;

  try {
    return new Function('return ' + functionMatch[1])();
  } catch (e) {
    console.warn('Could not parse TanStack start manifest:', e.message);
    return null;
  }
}

async function findStyleFile(clientAssetsDir) {
  const fs = await import('node:fs');
  const clientFiles = await fs.promises.readdir(clientAssetsDir);
  const candidates = clientFiles.filter((f) => /^styles[-].*\.css$/.test(f));
  if (candidates.length === 0) return null;
  // Pick the newest file — stale hashed copies may linger from build caches
  const withTimes = await Promise.all(
    candidates.map(async (f) => ({
      f,
      mtime: (await fs.promises.stat(resolve(clientAssetsDir, f))).mtimeMs,
    })),
  );
  withTimes.sort((a, b) => b.mtime - a.mtime);
  return normalizeAssetPath(withTimes[0].f);
}

async function assertBrowserBundle(assetPath) {
  const head = (await readFile(assetPath, 'utf8')).slice(0, 4096);
  if (/from\s+["']node:/.test(head) || /import\s+["']node:/.test(head)) {
    throw new Error(
      `Refusing to use server bundle as browser entry: ${assetPath}`,
    );
  }
}

async function main() {
  const clientAssetsDir = safeResolve('dist', 'client', 'assets');
  const serverAssetsDir = safeResolve('dist', 'server', 'assets');

  if (!existsSync(clientAssetsDir)) {
    console.error('No client assets dir at', clientAssetsDir);
    process.exit(1);
  }

  await mkdir(clientAssetsDir, { recursive: true });

  const rawRouterManifestData =
    (await parseStartManifest(clientAssetsDir, serverAssetsDir)) ?? {
      routes: {},
    };
  const routerManifestData = stripPrivateManifestFields(rawRouterManifestData);

  const rootRoute = routerManifestData.routes?.__root__;
  const rootModuleScript = rootRoute?.scripts?.find(
    (script) => script?.attrs?.type === "module" && script.attrs.src,
  );
  const clientEntry = routerManifestData.clientEntry ?? rootModuleScript?.attrs?.src;
  if (!clientEntry) {
    console.error(
      "No browser client entry in TanStack start manifest; aborting index generation.",
    );
    process.exit(1);
  }

  const startFileName = normalizeAssetPath(clientEntry);
  const startAssetPath = resolve(clientAssetsDir, startFileName);
  if (!existsSync(startAssetPath)) {
    console.error('Client entry asset missing:', startAssetPath);
    process.exit(1);
  }

  await assertBrowserBundle(startAssetPath);

  const styleFileName = await findStyleFile(clientAssetsDir);
  const routerManifestJson = JSON.stringify(routerManifestData);
  const bootScript = `window.$_TSR=window.$_TSR||{h:()=>{},buffer:[],initialized:true,router:{matches:[],lastMatchId:null,manifest:${routerManifestJson},dehydratedData:{}}};\n`;
  const bootScriptHash = createHash('sha256')
    .update(bootScript)
    .digest('hex')
    .slice(0, 12);
  const bootScriptName = `earth-flow-boot-${bootScriptHash}.js`;
  await writeFile(resolve(clientAssetsDir, bootScriptName), bootScript, 'utf8');
  const bootSkeletonHtml = `
    <div class="app-boot-shell">
      <div class="dark app-loading-skeleton" role="status" aria-label="Loading Earth Flow">
        <div class="app-loading-glow app-loading-glow-a" aria-hidden="true"></div>
        <div class="app-loading-glow app-loading-glow-b" aria-hidden="true"></div>
        <header class="app-loading-header" aria-hidden="true">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="app-skeleton-block" style="width:10px;height:10px;border-radius:999px"></span>
            <span class="app-skeleton-block" style="width:96px;height:12px;border-radius:999px"></span>
          </div>
          <span class="app-skeleton-block" style="width:36px;height:36px;border-radius:999px"></span>
        </header>
        <main class="app-loading-grid" aria-hidden="true">
          <aside class="app-loading-card app-loading-sidebar">
            <span class="app-skeleton-block" style="width:34%;height:10px;border-radius:999px"></span>
            <div class="app-loading-nav-stack">
              ${[72, 58, 68].map((width) => `
                <div class="app-loading-nav-item">
                  <span class="app-skeleton-block" style="width:28px;height:28px;border-radius:8px"></span>
                  <div style="display:flex;min-width:0;flex:1;flex-direction:column;gap:8px">
                    <span class="app-skeleton-block" style="width:${width}%;height:10px;border-radius:999px"></span>
                    <span class="app-skeleton-block" style="width:42%;height:10px;border-radius:999px"></span>
                  </div>
                </div>`).join("")}
            </div>
          </aside>
          <section class="app-loading-card app-loading-focus">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span class="app-skeleton-block" style="width:18%;height:10px;border-radius:999px"></span>
              <span class="app-skeleton-block" style="width:80px;height:28px;border-radius:999px"></span>
            </div>
            <div class="app-loading-timer">
              <div class="app-loading-timer-inner">
                <span class="app-skeleton-block" style="width:52%;height:10px;border-radius:999px"></span>
                <span class="app-skeleton-block" style="width:32%;height:10px;border-radius:999px"></span>
              </div>
            </div>
            <div class="app-loading-controls">
              <span class="app-skeleton-block" style="width:40px;height:40px;border-radius:999px"></span>
              <span class="app-skeleton-block" style="width:112px;height:48px;border-radius:999px"></span>
              <span class="app-skeleton-block" style="width:40px;height:40px;border-radius:999px"></span>
            </div>
            <div class="app-loading-task-list">
              ${[76, 62, 70].map((width) => `
                <div class="app-loading-task">
                  <span class="app-skeleton-block" style="width:16px;height:16px;border-radius:999px"></span>
                  <span class="app-skeleton-block" style="width:${width}%;height:10px;border-radius:999px"></span>
                </div>`).join("")}
            </div>
          </section>
          <aside class="app-loading-card app-loading-mixer">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span class="app-skeleton-block" style="width:38%;height:10px;border-radius:999px"></span>
              <span class="app-skeleton-block" style="width:28px;height:28px;border-radius:999px"></span>
            </div>
            <div class="app-loading-sound-grid">
              ${[72, 58, 68, 62].map((width) => `
                <div class="app-loading-sound">
                  <span class="app-skeleton-block" style="width:36px;height:36px;border-radius:12px"></span>
                  <div style="display:flex;min-width:0;flex:1;flex-direction:column;gap:8px">
                    <span class="app-skeleton-block" style="width:${width}%;height:10px;border-radius:999px"></span>
                    <span class="app-skeleton-block" style="width:100%;height:10px;border-radius:999px"></span>
                  </div>
                </div>`).join("")}
            </div>
          </aside>
        </main>
        <span class="sr-only">Loading Earth Flow</span>
      </div>
    </div>`;

  const shell = (headHtml) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    ${headHtml}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    ${styleFileName ? `<link rel="stylesheet" href="/assets/${styleFileName}" />` : ''}
  </head>
  <body style="margin:0;background:#090b11">
    <div id="root"></div>
    ${bootSkeletonHtml}
    <script src="/assets/${bootScriptName}"></script>
    <script type="module" src="/assets/${startFileName}"></script>
  </body>
</html>`;

  const indexHtml = shell(`
    <title>Earth Flow — Ambient sounds &amp; focus timer</title>
    <meta name="description" content="A calm focus space with ambient sound mixer and Pomodoro timer." />
    <meta property="og:title" content="Earth Flow" />
    <meta property="og:description" content="Ambient sounds &amp; focus timer for deep work." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://earthflow.pro" />
    <meta property="og:image" content="https://earthflow.pro/og-image.png?v=5.2.11" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://earthflow.pro/og-image.png?v=5.2.11" />`);

  const outPath = safeResolve('dist', 'client', 'index.html');
  await writeFile(outPath, indexHtml, 'utf8');
  console.log('Generated', outPath, 'with client entry', startFileName);

  // /embed is a chrome-free widget meant for iframe embedding (e.g. Notion).
  // It gets its own static shell — deliberately no OG tags — because this is
  // a static SPA: every route is served the same pre-built HTML file via the
  // Vercel rewrite, and link-preview scrapers never run the client JS that
  // would otherwise override the route's <head> at runtime.
  const embedHtml = shell(`
    <title>Earth Flow</title>
    <meta name="robots" content="noindex, nofollow" />`);

  const embedOutPath = safeResolve('dist', 'client', 'embed.html');
  await writeFile(embedOutPath, embedHtml, 'utf8');
  console.log('Generated', embedOutPath, 'with client entry', startFileName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
