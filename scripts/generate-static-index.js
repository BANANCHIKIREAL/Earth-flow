import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function safeResolve(...p) {
  return resolve(process.cwd(), ...p);
}

const normalizeAssetPath = (p) =>
  p ? p.replace(/^\/?assets[\\/]/, '').replace(/^assets[\\/]/, '') : p;

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

  const routerManifestData =
    (await parseStartManifest(clientAssetsDir, serverAssetsDir)) ?? {
      routes: {},
    };

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

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Earth Flow — Ambient sounds &amp; focus timer</title>
    <meta name="description" content="A calm focus space with ambient sound mixer and Pomodoro timer." />
    <meta property="og:title" content="Earth Flow" />
    <meta property="og:description" content="Ambient sounds &amp; focus timer for deep work." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://earthflow.pro" />
    <meta property="og:image" content="https://earthflow.pro/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://earthflow.pro/og-image.png" />
    ${styleFileName ? `<link rel="stylesheet" href="/assets/${styleFileName}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.$_TSR = window.$_TSR || {
        h: () => {},
        buffer: [],
        initialized: true,
        router: {
          matches: [],
          lastMatchId: null,
          manifest: ${routerManifestJson},
          dehydratedData: {}
        }
      };
    </script>
    <script type="module" src="/assets/${startFileName}"></script>
  </body>
</html>`;

  const outPath = safeResolve('dist', 'client', 'index.html');
  await writeFile(outPath, indexHtml, 'utf8');
  console.log('Generated', outPath, 'with client entry', startFileName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
