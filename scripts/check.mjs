import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = resolve(root, 'docs');
let failures = 0;
for (const name of (await readdir(docs)).filter(name => name.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', resolve(docs, name)], { encoding: 'utf8' });
  if (result.status !== 0) { console.error(result.stderr || `Syntax check failed: ${name}`); failures++; }
}
const worker = await readFile(resolve(docs, 'sw.js'), 'utf8');
const manifest = JSON.parse(await readFile(resolve(docs, 'manifest.webmanifest'), 'utf8'));
const match = worker.match(/const ASSETS = (\[[\s\S]*?\]);/);
if (!match) throw new Error('Service worker ASSETS must be a JSON array.');
const assets = JSON.parse(match[1]);
for (const entry of assets) {
  const file = resolve(docs, entry === './' ? 'index.html' : entry);
  if (!file.startsWith(docs + sep) || !(await stat(file).catch(() => null))?.isFile()) {
    console.error(`Missing or invalid offline asset: ${entry}`); failures++;
  }
}
for (const icon of manifest.icons) {
  if (!assets.includes(icon.src)) { console.error(`Manifest icon is not cached: ${icon.src}`); failures++; }
}
for (const required of ['./', './index.html', './styles.css', './app.js', './story.js', './golf.js', './state.js', './manifest.webmanifest']) {
  if (!assets.includes(required)) { console.error(`Missing required offline entry: ${required}`); failures++; }
}
// Walk real module dependencies, including vendored code. A missing transitive
// dependency otherwise works online and fails only after the game is installed.
const checkedModules = new Set();
async function checkModule(file) {
  if (checkedModules.has(file)) return;
  checkedModules.add(file);
  const asset = './' + relative(docs, file).split(sep).join('/');
  if (!file.startsWith(docs + sep) || !assets.includes(asset)) {
    console.error(`Module is not cached inside the project: ${asset}`); failures++;
    return;
  }
  const source = await readFile(file, 'utf8').catch(() => null);
  if (source === null) return; // The asset existence check already reports this.
  const imports = /^\s*(?:import\s+(?:[\w$*{},\s]+\s+from\s*)?|export\s+(?:\*|\{[^}]*\})\s+from\s*)(['"])([^'"]+)\1/gm;
  for (const match of source.matchAll(imports)) {
    const specifier = match[2];
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      console.error(`Module must use a local relative import: ${asset} → ${specifier}`); failures++;
      continue;
    }
    await checkModule(resolve(dirname(file), specifier));
  }
}
await checkModule(resolve(docs, 'app.js'));
if (!manifest.start_url.startsWith('./') || !manifest.scope.startsWith('./')) {
  console.error('Manifest must use relative paths for GitHub Pages.'); failures++;
}
if (failures) process.exitCode = 1;
else console.log(`JavaScript syntax, ${assets.length} offline assets, and ${checkedModules.size} local modules verified.`);
