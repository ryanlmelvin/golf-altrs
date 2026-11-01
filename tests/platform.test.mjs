import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'docs/sw.js'), 'utf8');

function workerHarness(path, { rejectAsset = false } = {}) {
  const scope = new URL(path, 'https://example.test');
  const handlers = new Map();
  const stores = new Map();
  const writes = [];
  let skipped = false;
  let claimed = false;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {
        async addAll(requests) {
          if (rejectAsset) throw new Error('A required asset did not download');
          for (const request of requests) {
            writes.push(request.url);
            data.set(request.url, new Response(request.url));
          }
        },
        async match(url) { return data.get(String(url))?.clone(); }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(key) { return stores.delete(key); }
  };
  const self = {
    registration: { scope: scope.href },
    clients: { async claim() { claimed = true; } },
    async skipWaiting() { skipped = true; },
    addEventListener(name, handler) { handlers.set(name, handler); }
  };
  vm.runInNewContext(source, { self, caches, URL, Request, Set, fetch() { throw new Error('Network is offline'); } });
  return {
    stores, writes,
    get skipped() { return skipped; },
    get claimed() { return claimed; },
    async lifecycle(name) {
      let work;
      handlers.get(name)({ waitUntil(promise) { work = promise; } });
      assert.ok(work, `${name} must wait for its work`);
      await work;
    },
    fetch(request) {
      let response;
      handlers.get('fetch')({ request, respondWith(promise) { response = promise; } });
      return response;
    }
  };
}

for (const path of ['/', '/golf-altrs/']) {
  test(`offline launch and assets remain available at ${path}`, async () => {
    const worker = workerHarness(path);
    await worker.lifecycle('install');
    assert.equal(worker.skipped, false, 'an update must not replace an active game mid-round');
    for (const file of ['', 'index.html', 'app.js', 'state.js', 'story.js', 'golf.js', 'scene.js', 'detours.js', 'detour-scene.js', 'vendor/three.module.js', 'vendor/three.core.js', 'vendor/THREE-LICENSE.txt', 'styles.css', 'manifest.webmanifest']) {
      const url = `https://example.test${path}${file}`;
      assert.ok(worker.writes.includes(url), `precache includes ${file || 'launch URL'}`);
      const response = await worker.fetch(new Request(url + '?launch=installed'));
      assert.equal(response.status, 200);
      assert.equal(await response.text(), url);
    }
    for (const request of [
      new Request('https://unrelated.test/app.js'),
      new Request('https://example.test/another-game/app.js'),
      new Request(`https://example.test${path}app.js`, { method: 'POST' }),
      new Request(`https://example.test${path}unknown-file.json`)
    ]) assert.equal(worker.fetch(request), undefined, 'unowned requests pass through');
  });
}

test('activation cleans only old versions of this project', async () => {
  const worker = workerHarness('/golf-altrs/');
  await worker.lifecycle('install');
  const current = [...worker.stores.keys()][0];
  const old = 'pension-plan:/golf-altrs/:previous-version';
  const other = 'pension-plan:/debrief-corn-game/:previous-version';
  const rootGame = 'pension-plan:/:previous-version';
  worker.stores.set(old, new Map());
  worker.stores.set(other, new Map());
  worker.stores.set(rootGame, new Map());
  worker.stores.set('another-app-cache', new Map());
  await worker.lifecycle('activate');
  assert.equal(worker.stores.has(old), false);
  for (const key of [current, other, rootGame, 'another-app-cache']) assert.ok(worker.stores.has(key), key);
  assert.equal(worker.claimed, true);
});

test('a failed precache prevents installation instead of claiming offline readiness', async () => {
  const worker = workerHarness('/golf-altrs/', { rejectAsset: true });
  await assert.rejects(worker.lifecycle('install'), /required asset/);
  assert.equal(worker.claimed, false);
  assert.equal(worker.skipped, false);
});

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('preview serves the project path and refuses filesystem escape', { timeout: 10000 }, async t => {
  const port = await freePort();
  const child = spawn(process.execPath, [resolve(root, 'scripts/serve.mjs')], {
    cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    if (child.exitCode === null) {
      const done = once(child, 'exit');
      child.kill('SIGTERM');
      await done;
    }
  });
  await Promise.race([
    once(child.stdout, 'data'),
    once(child, 'exit').then(([code]) => { throw new Error(`Preview exited: ${code}`); })
  ]);
  const origin = `http://127.0.0.1:${port}`;
  const cases = [
    ['/manifest.webmanifest', 200], ['/golf-altrs/manifest.webmanifest', 200],
    ['/golf-altrs/assets/icon-192.png', 200], ['/golf-altrs', 308],
    ['/missing-file', 404], ['/%00', 400], ['/%2e%2e%2fpackage.json', 403],
    ['/package.json', 404], ['/golf-altrs/%2e%2e%2fpackage.json', 403]
  ];
  for (const [path, status] of cases) {
    const response = await fetch(origin + path, { redirect: 'manual' });
    assert.equal(response.status, status, path);
  }
  const head = await fetch(origin + '/golf-altrs/assets/icon-512.png', { method: 'HEAD' });
  assert.equal(head.headers.get('content-type'), 'image/png');
  assert.equal(await head.text(), '');
  for (const file of ['scene.js', 'detours.js', 'detour-scene.js', 'vendor/three.module.js', 'vendor/three.core.js']) {
    const module = await fetch(origin + '/golf-altrs/' + file);
    assert.equal(module.status, 200, file);
    assert.equal(module.headers.get('content-type'), 'text/javascript; charset=utf-8', file);
  }
  assert.equal((await fetch(origin + '/', { method: 'POST' })).status, 405);
  const manifest = await (await fetch(origin + '/golf-altrs/manifest.webmanifest')).json();
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, origin + '/golf-altrs/manifest.webmanifest');
    assert.equal((await fetch(url)).status, 200, icon.src);
  }
});
