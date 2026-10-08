// Real measurement run: fresh DB, 5 s node interval, autonomous mode, N minutes; reports pipeline metrics + latency.
const fs = require('fs'); const path = require('path');
process.env.DATA_DIR = path.join(__dirname, 'data'); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
process.env.PORT = '3456';
const app = require('/Users/shanithkaindu/Downloads/smart-farming-web-system/server.js');
const MIN = Number(process.argv[2] || 20);
const base = 'http://127.0.0.1:3456';
const call = async (m, u, b, t) => { const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => ({})), ms: 0 }; };
(async () => {
  await app.start(3456);
  const tok = (await call('POST', '/api/auth/login', { email: 'farmer@agripulse.lk', password: 'Farm@123' })).data.token;
  await call('PATCH', '/api/farm', { interval: 5, autonomous: true }, tok);
  // zero the seeded counters so results are measured, not inherited
  const dbmod = require('/Users/shanithkaindu/Downloads/smart-farming-web-system/server/db.js'); const db = dbmod.load();
  Object.assign(db.stats, { expectedReadings: 0, receivedReadings: 0, acceptedReadings: 0, rejectedReadings: 0, workflowsStarted: 0, workflowsCompleted: 0, workflowsFailed: 0, b2bAttempted: 0, b2bCompleted: 0 });
  const start = Date.now(); const log = [];
  // inject scenarios periodically so workflows are exercised
  const presets = ['dry', 'nutrient_drop', 'normal', 'dry', 'rain', 'acidic', 'dry', 'heat'];
  let i = 0;
  const inj = setInterval(async () => { const z = ['A1', 'B2', 'C3'][i % 3]; await call('POST', '/api/simulate', { zone: z, preset: presets[i % presets.length] }, tok); i++; }, 90000);
  while (Date.now() - start < MIN * 60e3) { await new Promise((r) => setTimeout(r, 60000)); const m = (await call('GET', '/api/evaluation', null, tok)).data.metrics; log.push({ t: Math.round((Date.now() - start) / 60000), ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.value])) }); console.log(JSON.stringify(log[log.length - 1])); }
  clearInterval(inj);
  // latency test: 200 sequential + 50 concurrent dashboard requests, plus ingest latency
  const lat = []; for (let k = 0; k < 200; k++) { const t0 = performance.now(); await call('GET', '/api/dashboard', null, tok); lat.push(performance.now() - t0); }
  const t1 = performance.now(); await Promise.all(Array.from({ length: 50 }, () => call('GET', '/api/dashboard', null, tok))); const conc = performance.now() - t1;
  const key = (await call('GET', '/api/devices', null, tok)).data.devices[0].key;
  const ing = []; for (let k = 0; k < 100; k++) { const t0 = performance.now(); await fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Key': key }, body: JSON.stringify({ moisture: 40 + Math.random() * 5, nitrogen: 42, phosphorus: 30, potassium: 36, soilTemp: 25, airTemp: 28, humidity: 70, ph: 6.4, rainfall: 0 }) }); ing.push(performance.now() - t0); }
  const s = (a) => { a = [...a].sort((x, y) => x - y); return { avg: +(a.reduce((p, c) => p + c, 0) / a.length).toFixed(1), p50: +a[Math.floor(a.length * .5)].toFixed(1), p95: +a[Math.floor(a.length * .95)].toFixed(1), max: +a[a.length - 1].toFixed(1) }; };
  const final = (await call('GET', '/api/evaluation', null, tok)).data;
  const db2 = dbmod.load();
  const out = { minutes: MIN, stats: db2.stats, metrics: final.metrics, scenarios: final.scenarios, latencyDashboard: s(lat), concurrent50ms: +conc.toFixed(1), latencyIngest: s(ing), workflows: db2.workflows.map((w) => [w.type, w.zoneId, w.status]), rejectedReasons: db2.ingestLog.filter((e) => e.status === 'rejected').map((e) => e.errors.map((x) => x.field + ':' + x.code).join(',')), timeline: log };
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(out, null, 2)); console.log('DONE'); await app.stop(); process.exit(0);
})();
