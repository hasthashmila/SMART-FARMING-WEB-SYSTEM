'use strict';
/* End-to-end API tests. Run with: npm test (Node 18+, no dependencies). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'agripulse-test-'));
process.env.PORT = '0';
const app = require('../server');

let base = '';
let farmer = '';
let buyer = '';

const call = async (method, url, body, token) => {
  if (base === '' && url !== '/api/auth/login') await ready;
  const res = await fetch(base + url, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};

const ready = (async () => {
  const server = await app.start(0);
  base = `http://127.0.0.1:${server.address().port}`;
  farmer = (await call('POST', '/api/auth/login', { email: 'farmer@agripulse.lk', password: 'Farm@123' })).data.token;
  buyer = (await call('POST', '/api/auth/login', { email: 'buyer@agripulse.lk', password: 'Buyer@123' })).data.token;
})();


test('health endpoint is public', async () => {
  const r = await call('GET', '/api/health');
  assert.equal(r.status, 200); assert.equal(r.data.ok, true);
});

test('protected routes reject anonymous requests', async () => {
  assert.equal((await call('GET', '/api/dashboard')).status, 401);
});

test('login rejects wrong credentials with a translatable code', async () => {
  const r = await call('POST', '/api/auth/login', { email: 'farmer@agripulse.lk', password: 'nope' });
  assert.equal(r.status, 401); assert.equal(r.data.error.code, 'INVALID_CREDENTIALS');
});

test('registration creates a session and rejects duplicates', async () => {
  const r = await call('POST', '/api/auth/register', { name: 'Test Farmer', email: 'test@farm.lk', password: 'Secret123', role: 'farmer', lang: 'si' });
  assert.equal(r.status, 201); assert.equal(r.data.user.lang, 'si');
  const dup = await call('POST', '/api/auth/register', { name: 'Test Farmer', email: 'test@farm.lk', password: 'Secret123' });
  assert.equal(dup.data.error.code, 'EMAIL_EXISTS');
});

test('farmer dashboard exposes zones, decisions, metrics and an actionable irrigation decision', async () => {
  const r = await call('GET', '/api/dashboard', null, farmer);
  assert.equal(r.status, 200);
  assert.equal(r.data.zones.length, 3);
  const a1 = r.data.zones.find((z) => z.id === 'A1');
  assert.ok(a1.latest.moisture < 38);
  assert.ok(a1.decisions.some((d) => d.code === 'IRRIGATE' && d.evidence.length > 0));
  assert.ok(r.data.workflows.some((w) => w.type === 'irrigation' && w.status === 'pending'));
  assert.ok(r.data.metrics.sensorIntegration.value > 90);
});

test('ingest pipeline normalises aliases and units, and rejects out-of-range readings', async () => {
  const devices = (await call('GET', '/api/devices', null, farmer)).data.devices;
  const key = devices.find((d) => d.zoneId === 'B2').key;
  const ok = await fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Key': key },
    body: JSON.stringify({ soil_moisture: 41, n: 41, p: 30, k: 37, soil_temp: 77, temperature: 84.2, units: { temperature: 'F' }, humidity: 70, pH: 6.4, rain: 0 }) });
  assert.equal(ok.status, 201);
  const readings = (await call('GET', '/api/readings?zone=B2&hours=1', null, farmer)).data.readings;
  const last = readings[readings.length - 1];
  assert.equal(last.airTemp, 29); assert.equal(last.moisture, 41);
  const bad = await fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Key': key }, body: JSON.stringify({ moisture: 260, humidity: 70, ph: 6.4 }) });
  assert.equal(bad.status, 422);
  const body = await bad.json();
  assert.ok(body.errors.some((e) => e.field === 'moisture' && e.code === 'OUT_OF_RANGE'));
  assert.ok(body.errors.some((e) => e.field === 'airTemp' && e.code === 'MISSING'));
  const badKey = await fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Key': 'nope' }, body: '{}' });
  assert.equal(badKey.status, 401);
});

test('irrigation workflow can be approved, executes and verifies', async () => {
  const pending = (await call('GET', '/api/workflows', null, farmer)).data.workflows.find((w) => w.status === 'pending' && w.type === 'irrigation');
  assert.ok(pending);
  const r = await call('POST', `/api/workflows/${pending.id}/approve`, {}, farmer);
  assert.equal(r.status, 200);
  assert.ok(['running', 'done'].includes(r.data.workflow.status));
  assert.equal(r.data.workflow.steps.find((s) => s.key === 'execute').status, 'done');
  const again = await call('POST', `/api/workflows/${pending.id}/approve`, {}, farmer);
  assert.equal(again.data.error.code, 'WORKFLOW_STATE');
});

test('buyers cannot access farm-only routes', async () => {
  assert.equal((await call('GET', '/api/workflows', null, buyer)).data.error.code, 'FARMER_ONLY');
});

test('scenario suite runs and meets the thesis target', async () => {
  const r = await call('POST', '/api/evaluation/run', {}, farmer);
  assert.equal(r.data.scenarios.total, 15);
  assert.ok(r.data.scenarios.agreement >= 85);
  assert.equal(r.data.metrics.aiDecisionSupport.value, r.data.scenarios.agreement);
});

test('assistant classifies Sinhala, Tamil and English intents', async () => {
  assert.equal((await call('POST', '/api/assistant', { text: 'A1 වතුර දාන්න ඕනද?' }, farmer)).data.intent, 'irrigation');
  assert.equal((await call('POST', '/api/assistant', { text: 'இன்றைய விலை என்ன?' }, farmer)).data.intent, 'market');
  assert.equal((await call('POST', '/api/assistant', { text: 'Do I need fertiliser in B2?' }, farmer)).data.zoneId, 'B2');
});

test('B2B flow: inquiry → reply → order → buyer confirmation → documents → payment → dispatch', async () => {
  const inq = await call('POST', '/api/products/p-3/inquiries', { text: 'Price for 500 kg okra to Doha?', quantity: 500 }, buyer);
  assert.equal(inq.status, 201);
  const own = await call('POST', '/api/products/p-3/inquiries', { text: 'hi' }, farmer);
  assert.equal(own.data.error.code, 'OWN_PRODUCT');
  const reply = await call('POST', `/api/inquiries/${inq.data.inquiry.id}/messages`, { text: 'USD 1.90 / kg CIF Doha.' }, farmer);
  assert.equal(reply.data.inquiry.messages.length, 2);
  const conv = await call('POST', `/api/inquiries/${inq.data.inquiry.id}/convert`, { quantity: 500, price: 1.9, destination: 'Doha, Qatar' }, farmer);
  assert.equal(conv.status, 201);
  const order = conv.data.order;
  assert.equal((await call('POST', `/api/orders/${order.id}/advance`, {}, farmer)).data.error.code, 'BUYER_MUST_CONFIRM');
  assert.equal((await call('POST', `/api/orders/${order.id}/advance`, {}, buyer)).data.order.stage, 2);
  assert.equal((await call('POST', `/api/orders/${order.id}/advance`, {}, farmer)).data.order.stage, 3);
  for (const key of ['invoice', 'packing_list', 'phytosanitary', 'certificate_of_origin']) await call('POST', `/api/orders/${order.id}/documents`, { key, ready: true }, farmer);
  const docs = (await call('GET', '/api/orders', null, farmer)).data.orders.find((o) => o.id === order.id);
  assert.equal(docs.stage, 4);
  assert.equal((await call('POST', `/api/orders/${order.id}/advance`, {}, farmer)).data.error.code, 'PAYMENT_REQUIRED');
  await call('POST', `/api/orders/${order.id}/payment`, { status: 'deposit', reference: 'TT-1' }, buyer);
  assert.equal((await call('POST', `/api/orders/${order.id}/advance`, {}, farmer)).data.order.stage, 5);
});

test('product CRUD enforces ownership and validation', async () => {
  const bad = await call('POST', '/api/products', { name: 'X', quantity: 0, price: 1, market: 'Colombo' }, farmer);
  assert.equal(bad.data.error.code, 'INVALID_PRODUCT');
  const created = await call('POST', '/api/products', { name: 'Pineapple', category: 'fruit', quantity: 300, price: 1.2, market: 'Singapore', zoneId: 'A1' }, farmer);
  assert.equal(created.status, 201);
  assert.ok(created.data.product.live);
  const forbidden = await call('PATCH', `/api/products/${created.data.product.id}`, { name: 'Hacked' }, buyer);
  assert.equal(forbidden.data.error.code, 'NOT_OWNER');
  const deleted = await call('DELETE', `/api/products/${created.data.product.id}`, null, farmer);
  assert.equal(deleted.status, 200);
});

test('SUS questionnaire feeds the usability metric', async () => {
  const r = await call('POST', '/api/evaluation/sus', { answers: [5, 1, 5, 2, 4, 1, 5, 1, 4, 2] }, buyer);
  assert.equal(r.data.score, 90);
  const m = (await call('GET', '/api/evaluation', null, farmer)).data.metrics;
  assert.equal(m.webUsability.value, 90);
});

test('simulator presets drive the agent', async () => {
  const r = await call('POST', '/api/simulate', { zone: 'C3', preset: 'dry' }, farmer);
  assert.equal(r.status, 200);
  assert.ok(r.data.zone.decisions.some((d) => d.code === 'IRRIGATE'));
  assert.equal(r.data.zone.status === 'optimal', false);
});

test('CSV export streams readings', async () => {
  await ready;
  const res = await fetch(base + '/api/readings.csv?zone=A1', { headers: { Authorization: `Bearer ${farmer}` } });
  assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8');
  const text = await res.text();
  assert.ok(text.startsWith('ts,zoneId,nodeId'));
});

test('teardown', async () => { await app.stop(); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });
