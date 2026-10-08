'use strict';
/* AgriPulse — Smart Farming Web System. Zero-dependency Node.js server (Node 18+). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { ApiError } = require('./server/util');
const db = require('./server/db');
const { createPipeline } = require('./server/pipeline');
const { Simulator } = require('./server/simulator');
const { createApi } = require('./server/api');
const workflows = require('./server/workflows');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

const getDb = () => db.load();
const pipeline = createPipeline(getDb, db.save);
const simulator = new Simulator(getDb, pipeline.ingest, pipeline.log);
pipeline.ctx.simulator = simulator;
const api = createApi({ getDb, save: db.save, pipeline, simulator });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 1e6) { reject(new ApiError(413, 'PAYLOAD_TOO_LARGE')); req.destroy(); } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new ApiError(400, 'INVALID_JSON')); } });
    req.on('error', reject);
  });
}
function sendJson(res, status, payload) {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; manifest-src 'self'");
}

function serveStatic(req, res, pathname) {
  const target = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.normalize(path.join(ROOT, target));
  if (!file.startsWith(ROOT)) return sendJson(res, 403, { error: { code: 'FORBIDDEN' } });
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      if (path.extname(target)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
      return serveStatic(req, res, '/');
    }
    const ext = path.extname(file);
    const cache = ext === '.html' || process.env.NODE_ENV !== 'production' ? 'no-cache' : 'public, max-age=86400, immutable';
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': cache, 'Content-Length': stat.size });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  try {
    const result = await api.handle(req, res, url, () => readBody(req));
    if (result === null) return;
    if (result && typeof result === 'object' && 'status' in result && 'body' in result && Object.keys(result).length === 2) return sendJson(res, result.status, result.body);
    return sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof ApiError) return sendJson(res, err.status, { error: { code: err.code, message: err.message } });
    console.error(err);
    return sendJson(res, 500, { error: { code: 'SERVER_ERROR', message: 'Unexpected server error' } });
  }
});

function start(port = PORT) {
  db.load();
  simulator.init();
  pipeline.bootstrap();
  const housekeeping = setInterval(() => { try { workflows.tick(getDb(), pipeline.ctx); db.save(); } catch (err) { console.error(err); } }, 15000);
  if (housekeeping.unref) housekeeping.unref();
  return new Promise((resolve) => server.listen(port, () => {
    console.log(`AgriPulse Smart Farming Web System → http://localhost:${server.address().port}`);
    resolve(server);
  }));
}
function stop() { simulator.stop(); db.flush(); return new Promise((resolve) => server.close(resolve)); }

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { db.flush(); process.exit(0); });

if (require.main === module) start();
module.exports = { start, stop, server };
