// A tiny web server for playing the arcade on this computer.
//   node tools/serve.mjs          -> http://localhost:8080
//   node tools/serve.mjs --lan    -> also reachable from a phone on the same Wi-Fi
//   node tools/serve.mjs --port 9000

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const at = args.indexOf('--port');
const port = at >= 0 ? Number(args[at + 1]) : 8080;
const lan = args.includes('--lan');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) {
      if (!path.endsWith('/')) {
        res.writeHead(301, { Location: path + '/' }).end();
        return;
      }
      file = join(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    if (!info) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(500).end();
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.log(`Port ${port} is already in use. The arcade may already be running: open http://localhost:${port}/`);
  else console.log(e.message);
  process.exit(1);
});

server.listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Arcade running at http://localhost:${port}/`);
  if (!lan) return;
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`On your phone (same Wi-Fi): http://${a.address}:${port}/`);
    }
  }
});
