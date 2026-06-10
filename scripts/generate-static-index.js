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
  const css = clientFiles.find((f) => /^styles[-].*\.css$/.test(f));
  return css ? normalizeAssetPath(css) : null;
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

  const clientEntry = routerManifestData.clientEntry;
  if (!clientEntry) {
    console.error(
      'No clientEntry in TanStack start manifest; aborting index generation.',
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
    <title>Earth Flow</title>
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
