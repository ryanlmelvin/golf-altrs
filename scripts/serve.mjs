import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docs');
const port = Number(process.env.PORT || 4320);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};
const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.includes('\0') || path.includes('\\')) throw new URIError('Invalid path');
    if (path === '/golf-altrs') {
      res.writeHead(308, { Location: '/golf-altrs/' }); res.end(); return;
    }
    if (path.startsWith('/golf-altrs/')) path = path.slice('/golf-altrs'.length);
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const details = await stat(file);
    if (!details.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const headers = {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Content-Length': details.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    };
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404);
    res.end(error instanceof URIError ? 'Bad request' : 'Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`The Pension Plan: http://localhost:${port}`);
  console.log(`GitHub Pages preview: http://localhost:${port}/golf-altrs/`);
});
