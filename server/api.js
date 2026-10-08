'use strict';
/* REST API (web application layer). All responses are JSON; errors carry a machine-readable
   code so the client can translate them into English, Sinhala or Tamil. */
const crypto = require('crypto');
const { id, now, round, clamp, hashPassword, verifyPassword, ApiError, str, isEmail } = require('./util');
const { FIELDS, UNITS } = require('./validate');
const agent = require('./agent');
const workflows = require('./workflows');
const events = require('./events');

const SESSION_TTL_MS = 30 * 86400e3;
const STAGES = ['inquiry', 'quotation', 'buyer_confirmed', 'quality_verified', 'documents_ready', 'dispatched', 'delivered'];
const DOCS = ['invoice', 'packing_list', 'phytosanitary', 'certificate_of_origin'];
const CATEGORIES = ['fruit', 'vegetable', 'grain', 'spice', 'other'];
const CERTS = ['GAP', 'GlobalGAP', 'Organic', 'HACCP', 'FairTrade'];
const CURRENCIES = ['USD', 'EUR', 'LKR', 'AED'];
const UNITS_Q = ['kg', 't', 'box'];
const EMOJI = { fruit: '🍈', vegetable: '🥬', grain: '🌾', spice: '🌶️', other: '🌱' };
const loginAttempts = new Map();

function createApi({ getDb, save, pipeline, simulator }) {
  const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, company: u.company, country: u.country, lang: u.lang, createdAt: u.createdAt });
  const safeNode = (n) => ({ id: n.id, zoneId: n.zoneId, label: n.label, expectedInterval: n.expectedInterval, lastSeen: n.lastSeen, firmware: n.firmware, online: n.lastSeen ? Date.now() - Date.parse(n.lastSeen) < Math.max(90e3, n.expectedInterval * 4000) : false });

  /* ---- sessions ---- */
  function createSession(db, user) {
    const token = crypto.randomBytes(32).toString('hex');
    db.sessions = db.sessions.filter((s) => Date.parse(s.expiresAt) > Date.now());
    db.sessions.push({ token, userId: user.id, createdAt: now(), expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
    return token;
  }
  function tokenFrom(req) {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (bearer) return bearer;
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]));
    return cookies.ap_session || (req.url.includes('token=') ? new URL(req.url, 'http://x').searchParams.get('token') : null);
  }
  function currentUser(req, db) {
    const token = tokenFrom(req);
    if (!token) return null;
    const session = db.sessions.find((s) => s.token === token);
    if (!session || Date.parse(session.expiresAt) < Date.now()) return null;
    return db.users.find((u) => u.id === session.userId) || null;
  }
  function cookie(req, token, clear = false) {
    const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.SECURE_COOKIES === 'true';
    return `ap_session=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${clear ? 0 : SESSION_TTL_MS / 1000}`;
  }

  /* ---- helpers ---- */
  const zoneView = (db, zone) => {
    const list = db.readings[zone.id] || [];
    const decisions = pipeline.evaluateZone(db, zone);
    return {
      ...zone, policy: agent.POLICIES[zone.crop], latest: list[list.length - 1] || null, status: agent.zoneStatus(decisions), decisions,
      node: safeNode(db.nodes.find((n) => n.id === zone.nodeId) || { id: zone.nodeId, zoneId: zone.id, expectedInterval: 20 }),
      spark: list.slice(-24).map((r) => r.moisture),
    };
  };
  const productView = (db, p) => {
    const zone = p.zoneId ? db.zones.find((z) => z.id === p.zoneId) : null;
    const latest = zone ? (db.readings[zone.id] || []).slice(-1)[0] : null;
    const owner = db.users.find((u) => u.id === p.ownerId);
    return { ...p, sellerName: owner?.name, sellerCompany: owner?.company, farmName: db.farm.name, farmLocation: db.farm.location,
      live: zone && latest ? { zoneId: zone.id, crop: zone.crop, status: agent.zoneStatus(pipeline.evaluateZone(db, zone)), moisture: latest.moisture, ts: latest.ts } : null };
  };
  const visibleInquiries = (db, user) => db.inquiries.filter((i) => i.buyerId === user.id || i.sellerId === user.id);
  const visibleOrders = (db, user) => db.orders.filter((o) => o.buyerId === user.id || o.sellerId === user.id);
  const farmerOnly = (user) => { if (user.role !== 'farmer') throw new ApiError(403, 'FARMER_ONLY'); };
  const num = (v, lo, hi) => { const n = Number(v); if (!Number.isFinite(n) || n < lo || n > hi) return null; return n; };

  function summaryFor(db, user) {
    const base = { user: publicUser(user), serverTime: now(), sse: events.count() };
    const inquiries = visibleInquiries(db, user);
    const orders = visibleOrders(db, user);
    const market = { products: db.products.filter((p) => p.status === 'active').length, myProducts: db.products.filter((p) => p.ownerId === user.id && p.status === 'active').length,
      openInquiries: inquiries.filter((i) => i.status === 'open').length, activeOrders: orders.filter((o) => o.stage < STAGES.length - 1).length,
      latestInquiry: inquiries.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null };
    if (user.role !== 'farmer') return { ...base, market, orders: orders.slice(0, 5) };
    const zones = db.zones.map((z) => zoneView(db, z));
    const decisions = zones.flatMap((z) => z.decisions);
    return {
      ...base, market,
      farm: { ...db.farm },
      zones, decisions,
      alerts: db.alerts.filter((a) => !a.resolvedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      workflows: db.workflows.slice(0, 20),
      logs: db.logs.slice(-12).reverse(),
      stats: db.stats, metrics: pipeline.metrics(db),
      nodes: db.nodes.map(safeNode),
    };
  }

  /* ---- routes ---- */
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => routes.push({ method, pattern, handler, opts });

  route('GET', /^\/api\/health$/, () => ({ ok: true, ts: now(), version: require('../package.json').version }), { auth: false });

  route('POST', /^\/api\/auth\/register$/, async ({ body, db, req, res }) => {
    const name = str(body.name, 80), email = str(body.email, 120).toLowerCase(), password = String(body.password || '');
    const role = body.role === 'buyer' ? 'buyer' : 'farmer';
    if (name.length < 2 || !isEmail(email) || password.length < 8) throw new ApiError(400, 'INVALID_REGISTRATION');
    if (db.users.some((u) => u.email === email)) throw new ApiError(409, 'EMAIL_EXISTS');
    const user = { id: id('u-'), name, email, role, company: str(body.company, 80), country: str(body.country, 2).toUpperCase() || 'LK', lang: ['en', 'si', 'ta'].includes(body.lang) ? body.lang : 'en', createdAt: now(), ...hashPassword(password) };
    db.users.push(user);
    const token = createSession(db, user);
    res.setHeader('Set-Cookie', cookie(req, token));
    pipeline.log('info', 'auth', 'USER_REGISTERED', { role });
    save();
    return { status: 201, body: { token, user: publicUser(user) } };
  }, { auth: false });

  route('POST', /^\/api\/auth\/login$/, async ({ body, db, req, res }) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const attempts = loginAttempts.get(ip) || { count: 0, until: 0 };
    if (attempts.until > Date.now()) throw new ApiError(429, 'TOO_MANY_ATTEMPTS');
    const email = str(body.email, 120).toLowerCase(), password = String(body.password || '');
    const user = db.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.salt, user.hash)) {
      attempts.count++; if (attempts.count >= 6) { attempts.until = Date.now() + 15 * 60e3; attempts.count = 0; }
      loginAttempts.set(ip, attempts);
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }
    loginAttempts.delete(ip);
    const token = createSession(db, user);
    res.setHeader('Set-Cookie', cookie(req, token));
    pipeline.log('info', 'auth', 'USER_LOGIN', { role: user.role });
    save();
    return { token, user: publicUser(user) };
  }, { auth: false });

  route('POST', /^\/api\/auth\/logout$/, ({ db, req, res }) => {
    const token = tokenFrom(req);
    db.sessions = db.sessions.filter((s) => s.token !== token);
    res.setHeader('Set-Cookie', cookie(req, '', true));
    save();
    return { ok: true };
  }, { auth: false });

  route('GET', /^\/api\/auth\/me$/, ({ user }) => ({ user: publicUser(user) }));
  route('PATCH', /^\/api\/auth\/me$/, ({ user, body }) => {
    if (body.name !== undefined) { const n = str(body.name, 80); if (n.length < 2) throw new ApiError(400, 'INVALID_NAME'); user.name = n; }
    if (body.company !== undefined) user.company = str(body.company, 80);
    if (body.country !== undefined) user.country = str(body.country, 2).toUpperCase();
    if (['en', 'si', 'ta'].includes(body.lang)) user.lang = body.lang;
    save();
    return { user: publicUser(user) };
  });
  route('POST', /^\/api\/auth\/password$/, ({ user, body, db, req }) => {
    if (!verifyPassword(String(body.current || ''), user.salt, user.hash)) throw new ApiError(400, 'WRONG_PASSWORD');
    if (String(body.next || '').length < 8) throw new ApiError(400, 'WEAK_PASSWORD');
    Object.assign(user, hashPassword(String(body.next)));
    db.sessions = db.sessions.filter((s) => s.userId !== user.id || s.token === tokenFrom(req));
    save();
    return { ok: true };
  });

  route('GET', /^\/api\/dashboard$/, ({ db, user }) => summaryFor(db, user));
  route('GET', /^\/api\/events$/, ({ req, res, user }) => { events.subscribe(req, res, user); return null; });

  route('GET', /^\/api\/readings$/, ({ db, user, url }) => {
    farmerOnly(user);
    const zoneId = url.searchParams.get('zone') || db.zones[0].id;
    const hours = clamp(Number(url.searchParams.get('hours')) || 24, 1, 72);
    const cutoff = Date.now() - hours * 3600e3;
    const readings = (db.readings[zoneId] || []).filter((r) => Date.parse(r.ts) >= cutoff);
    const stats = {};
    for (const f of FIELDS) {
      const vals = readings.map((r) => r[f]).filter((v) => v != null);
      stats[f] = vals.length ? { min: Math.min(...vals), max: Math.max(...vals), avg: round(vals.reduce((a, b) => a + b, 0) / vals.length, 2), unit: UNITS[f] } : null;
    }
    return { zoneId, hours, readings, stats, ingestLog: db.ingestLog.filter((e) => e.zoneId === zoneId).slice(-40).reverse() };
  });
  route('GET', /^\/api\/readings\.csv$/, ({ db, user, url, res }) => {
    farmerOnly(user);
    const zoneId = url.searchParams.get('zone');
    const rows = zoneId ? (db.readings[zoneId] || []) : Object.values(db.readings).flat();
    const header = ['ts', 'zoneId', 'nodeId', 'source', ...FIELDS, 'completeness'];
    const csv = [header.join(',')].concat(rows.map((r) => header.map((h) => r[h] ?? '').join(','))).join('\n');
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="agripulse-readings-${zoneId || 'all'}.csv"` });
    res.end(csv);
    return null;
  });

  route('POST', /^\/api\/ingest$/, ({ db, body, req }) => {
    const key = req.headers['x-device-key'] || body.key;
    const node = db.nodes.find((n) => n.key === key) || (body.nodeId ? db.nodes.find((n) => n.id === body.nodeId && n.key === key) : null);
    if (!node) throw new ApiError(401, 'INVALID_DEVICE_KEY');
    const result = pipeline.ingest(node, body, 'http');
    return { status: result.accepted ? 201 : 422, body: result.accepted ? { accepted: true, id: result.reading.id, decisions: result.decisions.map((d) => d.code) } : { accepted: false, errors: result.errors } };
  }, { auth: false });

  route('POST', /^\/api\/simulate$/, ({ db, user, body }) => {
    farmerOnly(user);
    if (!db.farm.simulation) throw new ApiError(400, 'SIMULATION_OFF');
    const zone = db.zones.find((z) => z.id === body.zone);
    if (!zone) throw new ApiError(404, 'ZONE_NOT_FOUND');
    if (body.preset && !simulator.inject(zone.id, body.preset)) throw new ApiError(400, 'INVALID_PRESET');
    simulator.tick(zone.id);
    pipeline.log('info', 'simulator', 'SCENARIO_INJECTED', { zone: zone.id, preset: body.preset || 'reading' });
    save();
    return { ok: true, zone: zoneView(db, zone) };
  });

  route('PATCH', /^\/api\/farm$/, ({ db, user, body }) => {
    farmerOnly(user);
    if (body.name !== undefined) { const n = str(body.name, 80); if (n.length < 2) throw new ApiError(400, 'INVALID_NAME'); db.farm.name = n; }
    if (body.location !== undefined) db.farm.location = str(body.location, 120);
    if (body.simulation !== undefined) { db.farm.simulation = Boolean(body.simulation); }
    if (body.autonomous !== undefined) db.farm.autonomous = Boolean(body.autonomous);
    if (body.interval !== undefined) { const i = num(body.interval, 5, 300); if (i == null) throw new ApiError(400, 'INVALID_INTERVAL'); db.farm.interval = Math.round(i); db.nodes.forEach((n) => { n.expectedInterval = db.farm.interval; }); }
    simulator.restart();
    pipeline.log('info', 'system', 'FARM_SETTINGS_UPDATED', { simulation: db.farm.simulation, autonomous: db.farm.autonomous, interval: db.farm.interval });
    save();
    return { farm: db.farm };
  });
  route('PATCH', /^\/api\/zones\/([^/]+)$/, ({ db, user, body, params }) => {
    farmerOnly(user);
    const zone = db.zones.find((z) => z.id === params[0]);
    if (!zone) throw new ApiError(404, 'ZONE_NOT_FOUND');
    if (body.crop && agent.POLICIES[body.crop]) zone.crop = body.crop;
    if (body.name !== undefined) zone.name = str(body.name, 40) || zone.name;
    if (body.area !== undefined) { const a = num(body.area, 0.01, 1000); if (a != null) zone.area = a; }
    save();
    return { zone: zoneView(db, zone) };
  });

  route('GET', /^\/api\/devices$/, ({ db, user, req }) => {
    farmerOnly(user);
    const host = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    return { ingestUrl: `${host}/api/ingest`, mqttTopic: `agripulse/${db.farm.id}/<zone>/readings`, devices: db.nodes.map((n) => ({ ...safeNode(n), key: n.key })) };
  });
  route('POST', /^\/api\/devices\/([^/]+)\/rotate$/, ({ db, user, params }) => {
    farmerOnly(user);
    const node = db.nodes.find((n) => n.id === params[0]);
    if (!node) throw new ApiError(404, 'NODE_NOT_FOUND');
    node.key = 'ap_' + crypto.randomBytes(12).toString('hex');
    pipeline.log('info', 'system', 'DEVICE_KEY_ROTATED', { node: node.id });
    save();
    return { device: { ...safeNode(node), key: node.key } };
  });

  route('GET', /^\/api\/workflows$/, ({ db, user }) => { farmerOnly(user); return { workflows: db.workflows.slice(0, 60), definitions: workflows.DEFS }; });
  route('POST', /^\/api\/workflows\/([^/]+)\/(approve|reject|acknowledge)$/, ({ db, user, params }) => {
    farmerOnly(user);
    const fn = { approve: workflows.approve, reject: workflows.reject, acknowledge: workflows.acknowledge }[params[1]];
    const wf = fn(db, params[0], user, pipeline.ctx);
    if (!wf) throw new ApiError(409, 'WORKFLOW_STATE');
    if (params[1] === 'approve' && db.farm.simulation) simulator.tick(wf.zoneId);
    workflows.tick(db, pipeline.ctx);
    save();
    events.broadcast('update', { zoneId: wf.zoneId }, (c) => c.role === 'farmer');
    return { workflow: wf };
  });

  route('GET', /^\/api\/alerts$/, ({ db, user }) => { farmerOnly(user); return { alerts: db.alerts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 60) }; });
  route('POST', /^\/api\/alerts\/read$/, ({ db, user }) => { farmerOnly(user); db.alerts.forEach((a) => { a.read = true; }); save(); return { ok: true }; });
  route('GET', /^\/api\/logs$/, ({ db, user, url }) => { farmerOnly(user); const n = clamp(Number(url.searchParams.get('limit')) || 100, 1, 400); return { logs: db.logs.slice(-n).reverse(), decisionLog: db.decisionLog.slice(-30).reverse() }; });

  route('GET', /^\/api\/evaluation$/, ({ db, user }) => { farmerOnly(user); return { metrics: pipeline.metrics(db), scenarios: db.evaluation.lastRun, susCount: db.susResponses.length }; });
  route('POST', /^\/api\/evaluation\/run$/, ({ db, user }) => {
    farmerOnly(user);
    db.evaluation.lastRun = agent.runScenarios();
    pipeline.log('info', 'agent', 'SCENARIO_SUITE_RUN', { passed: db.evaluation.lastRun.passed, total: db.evaluation.lastRun.total });
    save();
    return { scenarios: db.evaluation.lastRun, metrics: pipeline.metrics(db) };
  });
  route('POST', /^\/api\/evaluation\/sus$/, ({ db, user, body }) => {
    const answers = Array.isArray(body.answers) ? body.answers.map((a) => num(a, 1, 5)) : [];
    if (answers.length !== 10 || answers.some((a) => a == null)) throw new ApiError(400, 'INVALID_SUS');
    const score = answers.reduce((sum, a, i) => sum + (i % 2 === 0 ? a - 1 : 5 - a), 0) * 2.5;
    db.susResponses.push({ id: id('sus-'), userId: user.id, role: user.role, answers, score, comment: str(body.comment, 500), ts: now() });
    save();
    return { score, responses: db.susResponses.length };
  });

  route('POST', /^\/api\/assistant$/, ({ db, user, body }) => {
    const text = str(body.text, 300);
    if (!text) throw new ApiError(400, 'EMPTY_MESSAGE');
    const intent = agent.classifyIntent(text);
    const zoneId = (text.match(/\b([ABC][123])\b/i) || [])[1]?.toUpperCase() || null;
    pipeline.log('info', 'agent', 'ASSISTANT_QUERY', { intent, zone: zoneId });
    return { intent, zoneId: db.zones.some((z) => z.id === zoneId) ? zoneId : null, ts: now() };
  });

  /* ---- B2B marketplace ---- */
  route('GET', /^\/api\/products$/, ({ db, user, url }) => {
    const mine = url.searchParams.get('mine') === '1';
    const list = db.products.filter((p) => (mine ? p.ownerId === user.id : p.status === 'active')).map((p) => productView(db, p));
    return { products: list, categories: CATEGORIES, certifications: CERTS, currencies: CURRENCIES, units: UNITS_Q };
  });
  function productFrom(body, existing = {}) {
    const name = str(body.name ?? existing.name, 80);
    const category = CATEGORIES.includes(body.category) ? body.category : existing.category || 'vegetable';
    const quantity = num(body.quantity ?? existing.quantity, 1, 1e7);
    const price = num(body.price ?? existing.price, 0.01, 1e6);
    const market = str(body.market ?? existing.market, 80);
    if (name.length < 2 || quantity == null || price == null || market.length < 2) throw new ApiError(400, 'INVALID_PRODUCT');
    return {
      name, category, quantity, price, market, grade: ['A', 'B', 'C'].includes(body.grade) ? body.grade : existing.grade || 'A',
      unit: UNITS_Q.includes(body.unit) ? body.unit : existing.unit || 'kg', currency: CURRENCIES.includes(body.currency) ? body.currency : existing.currency || 'USD',
      certifications: Array.isArray(body.certifications) ? body.certifications.filter((c) => CERTS.includes(c)) : existing.certifications || [],
      harvestDate: /^\d{4}-\d{2}-\d{2}$/.test(body.harvestDate || '') ? body.harvestDate : existing.harvestDate || null,
      zoneId: body.zoneId === '' ? null : body.zoneId ?? existing.zoneId ?? null, description: str(body.description ?? existing.description, 400),
      emoji: str(body.emoji, 4) || existing.emoji || EMOJI[category],
    };
  }
  route('POST', /^\/api\/products$/, ({ db, user, body }) => {
    farmerOnly(user);
    const data = productFrom(body);
    if (data.zoneId && !db.zones.some((z) => z.id === data.zoneId)) throw new ApiError(400, 'ZONE_NOT_FOUND');
    const product = { id: id('p-'), ownerId: user.id, ...data, status: 'active', createdAt: now() };
    db.products.unshift(product);
    pipeline.log('info', 'b2b', 'PRODUCT_LISTED', { id: product.id });
    save();
    return { status: 201, body: { product: productView(db, product) } };
  });
  route('PATCH', /^\/api\/products\/([^/]+)$/, ({ db, user, body, params }) => {
    const product = db.products.find((p) => p.id === params[0]);
    if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    if (product.ownerId !== user.id) throw new ApiError(403, 'NOT_OWNER');
    Object.assign(product, productFrom(body, product), { updatedAt: now() });
    if (body.status === 'archived' || body.status === 'active') product.status = body.status;
    save();
    return { product: productView(db, product) };
  });
  route('DELETE', /^\/api\/products\/([^/]+)$/, ({ db, user, params }) => {
    const product = db.products.find((p) => p.id === params[0]);
    if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    if (product.ownerId !== user.id) throw new ApiError(403, 'NOT_OWNER');
    product.status = 'archived'; save();
    return { ok: true };
  });

  route('GET', /^\/api\/inquiries$/, ({ db, user }) => ({ inquiries: visibleInquiries(db, user).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }));
  route('POST', /^\/api\/products\/([^/]+)\/inquiries$/, ({ db, user, body, params }) => {
    const product = db.products.find((p) => p.id === params[0] && p.status === 'active');
    if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
    if (product.ownerId === user.id) throw new ApiError(400, 'OWN_PRODUCT');
    const text = str(body.text, 1000);
    if (!text) throw new ApiError(400, 'EMPTY_MESSAGE');
    const seller = db.users.find((u) => u.id === product.ownerId);
    let inquiry = db.inquiries.find((i) => i.productId === product.id && i.buyerId === user.id && i.status === 'open');
    if (!inquiry) {
      inquiry = { id: id('inq-'), productId: product.id, productName: product.name, buyerId: user.id, buyerName: user.name, buyerCompany: user.company, sellerId: seller.id, sellerName: seller.name, status: 'open', quantity: num(body.quantity, 1, 1e7), messages: [], createdAt: now(), updatedAt: now() };
      db.inquiries.unshift(inquiry);
    }
    inquiry.messages.push({ id: id('m-'), fromId: user.id, fromName: user.name, text, ts: now() });
    inquiry.updatedAt = now();
    pipeline.log('info', 'b2b', 'INQUIRY_RECEIVED', { product: product.id });
    save();
    events.broadcast('b2b', { inquiryId: inquiry.id }, (c) => c.userId === seller.id);
    return { status: 201, body: { inquiry } };
  });
  route('POST', /^\/api\/inquiries\/([^/]+)\/messages$/, ({ db, user, body, params }) => {
    const inquiry = visibleInquiries(db, user).find((i) => i.id === params[0]);
    if (!inquiry) throw new ApiError(404, 'INQUIRY_NOT_FOUND');
    const text = str(body.text, 1000);
    if (!text) throw new ApiError(400, 'EMPTY_MESSAGE');
    inquiry.messages.push({ id: id('m-'), fromId: user.id, fromName: user.name, text, ts: now() });
    inquiry.updatedAt = now();
    save();
    events.broadcast('b2b', { inquiryId: inquiry.id }, (c) => c.userId === (user.id === inquiry.buyerId ? inquiry.sellerId : inquiry.buyerId));
    return { inquiry };
  });
  route('POST', /^\/api\/inquiries\/([^/]+)\/close$/, ({ db, user, params }) => {
    const inquiry = visibleInquiries(db, user).find((i) => i.id === params[0]);
    if (!inquiry) throw new ApiError(404, 'INQUIRY_NOT_FOUND');
    inquiry.status = 'closed'; inquiry.updatedAt = now(); save();
    return { inquiry };
  });
  route('POST', /^\/api\/inquiries\/([^/]+)\/convert$/, ({ db, user, body, params }) => {
    const inquiry = db.inquiries.find((i) => i.id === params[0] && i.sellerId === user.id);
    if (!inquiry) throw new ApiError(404, 'INQUIRY_NOT_FOUND');
    if (inquiry.status !== 'open') throw new ApiError(409, 'INQUIRY_CLOSED');
    const product = db.products.find((p) => p.id === inquiry.productId);
    const quantity = num(body.quantity ?? inquiry.quantity ?? product?.quantity, 1, 1e7);
    const price = num(body.price ?? product?.price, 0.01, 1e6);
    if (quantity == null || price == null) throw new ApiError(400, 'INVALID_ORDER');
    const buyer = db.users.find((u) => u.id === inquiry.buyerId);
    const ref = `EX-${new Date().getFullYear()}-${String(db.orders.length + 14).padStart(3, '0')}`;
    const order = {
      id: id('ord-'), ref, productId: inquiry.productId, productName: inquiry.productName, inquiryId: inquiry.id, buyerId: inquiry.buyerId, buyerName: inquiry.buyerName, buyerCompany: buyer?.company,
      sellerId: user.id, sellerName: user.name, quantity, unit: product?.unit || 'kg', price, currency: product?.currency || 'USD', destination: str(body.destination, 80) || product?.market || '', incoterm: ['FOB', 'CIF', 'EXW'].includes(body.incoterm) ? body.incoterm : 'FOB',
      stage: 1, stages: STAGES.map((key, i) => ({ key, status: i === 0 ? 'done' : i === 1 ? 'current' : 'pending', ts: i === 0 ? inquiry.createdAt : i === 1 ? now() : null })),
      documents: DOCS.map((key) => ({ key, ready: false })), payment: { status: 'unpaid', provider: null, reference: null, ts: null }, createdAt: now(), updatedAt: now(),
    };
    db.orders.unshift(order);
    inquiry.status = 'converted'; inquiry.orderId = order.id; inquiry.updatedAt = now();
    inquiry.messages.push({ id: id('m-'), fromId: user.id, fromName: user.name, text: `__QUOTE__ ${ref}`, ts: now(), system: true });
    pipeline.log('info', 'b2b', 'ORDER_CREATED', { ref });
    save();
    events.broadcast('b2b', { orderId: order.id }, (c) => c.userId === inquiry.buyerId);
    return { status: 201, body: { order, inquiry } };
  });

  route('GET', /^\/api\/orders$/, ({ db, user }) => ({ orders: visibleOrders(db, user).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), stages: STAGES, documents: DOCS }));
  route('POST', /^\/api\/orders\/([^/]+)\/advance$/, ({ db, user, params }) => {
    const order = visibleOrders(db, user).find((o) => o.id === params[0]);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND');
    if (order.stage >= STAGES.length - 1) throw new ApiError(409, 'ORDER_COMPLETE');
    const next = STAGES[order.stage + 1];
    const isBuyer = user.id === order.buyerId;
    if (next === 'buyer_confirmed' && !isBuyer) throw new ApiError(403, 'BUYER_MUST_CONFIRM');
    if (next !== 'buyer_confirmed' && isBuyer && next !== 'delivered') throw new ApiError(403, 'SELLER_ONLY');
    if (next === 'dispatched' && !order.documents.every((d) => d.ready)) throw new ApiError(409, 'DOCUMENTS_INCOMPLETE');
    if (next === 'dispatched' && order.payment.status === 'unpaid') throw new ApiError(409, 'PAYMENT_REQUIRED');
    order.stages[order.stage].status = 'done'; order.stages[order.stage].ts ||= now();
    order.stage++;
    order.stages[order.stage].status = order.stage === STAGES.length - 1 ? 'done' : 'current';
    order.stages[order.stage].ts = now(); order.stages[order.stage].by = user.name;
    order.updatedAt = now();
    pipeline.log('info', 'b2b', 'ORDER_STAGE', { ref: order.ref, stage: STAGES[order.stage] });
    save();
    events.broadcast('b2b', { orderId: order.id }, (c) => c.userId === (isBuyer ? order.sellerId : order.buyerId));
    return { order };
  });
  route('POST', /^\/api\/orders\/([^/]+)\/documents$/, ({ db, user, body, params }) => {
    const order = db.orders.find((o) => o.id === params[0] && o.sellerId === user.id);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND');
    const doc = order.documents.find((d) => d.key === body.key);
    if (!doc) throw new ApiError(400, 'INVALID_DOCUMENT');
    doc.ready = Boolean(body.ready); doc.ts = now(); order.updatedAt = now();
    if (order.documents.every((d) => d.ready) && STAGES[order.stage] === 'quality_verified') {
      order.stages[order.stage].status = 'done'; order.stage++; order.stages[order.stage].status = 'current'; order.stages[order.stage].ts = now();
    }
    save();
    return { order };
  });
  /* Payment integration point (thesis §3.5): external payment providers plug in here. The prototype records
     a manual bank-transfer reference; a gateway adapter would replace this handler body. */
  route('POST', /^\/api\/orders\/([^/]+)\/payment$/, ({ db, user, body, params }) => {
    const order = visibleOrders(db, user).find((o) => o.id === params[0]);
    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND');
    if (!['deposit', 'paid'].includes(body.status)) throw new ApiError(400, 'INVALID_PAYMENT');
    order.payment = { status: body.status, provider: str(body.provider, 40) || 'manual', reference: str(body.reference, 60), ts: now(), by: user.name };
    order.updatedAt = now();
    pipeline.log('info', 'b2b', 'PAYMENT_RECORDED', { ref: order.ref, status: body.status });
    save();
    return { order };
  });

  /* ---- dispatcher ---- */
  async function handle(req, res, url, readBody) {
    const db = getDb();
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.pattern);
      if (!m) continue;
      const user = currentUser(req, db);
      if (r.opts.auth !== false && !user) throw new ApiError(401, 'UNAUTHENTICATED');
      const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody() : {};
      const result = await r.handler({ req, res, url, db, user, body, params: m.slice(1) });
      return result;
    }
    throw new ApiError(404, 'NOT_FOUND');
  }
  return { handle, STAGES, DOCS };
}

module.exports = { createApi };
