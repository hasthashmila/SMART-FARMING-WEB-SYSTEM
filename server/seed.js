'use strict';
const crypto = require('crypto');
const { id, now, hashPassword, round, clamp } = require('./util');

const SCHEMA = 3;
const deviceKey = () => 'ap_' + crypto.randomBytes(12).toString('hex');

function history(zone, endMoisture, npk, ph, hours = 24, stepMin = 10) {
  const out = [];
  const end = Date.now();
  const steps = Math.floor((hours * 60) / stepMin);
  const base = { tomato: [27, 68], chilli: [28, 66], okra: [29, 70] }[zone.crop];
  for (let i = steps; i >= 0; i--) {
    const d = new Date(end - i * stepMin * 60e3);
    const h = d.getHours() + d.getMinutes() / 60;
    const diurnal = Math.sin(((h - 9) / 24) * Math.PI * 2);
    const progress = 1 - i / steps;
    const airTemp = base[0] + 4.5 * diurnal + (Math.random() - 0.5);
    const humidity = clamp(base[1] - 11 * diurnal + (Math.random() - 0.5) * 3, 35, 98);
    const moisture = endMoisture + (1 - progress) * 9 + (Math.random() - 0.5) * 0.8;
    out.push({
      id: id('r-'), nodeId: zone.nodeId, zoneId: zone.id, source: 'simulator', ts: d.toISOString(), completeness: 1,
      moisture: round(moisture, 1), nitrogen: round(npk[0] + (1 - progress) * 1.5, 1), phosphorus: round(npk[1] + (1 - progress), 1), potassium: round(npk[2] + (1 - progress), 1),
      soilTemp: round(airTemp - 2.5, 1), airTemp: round(airTemp, 1), humidity: round(humidity, 1), ph: round(ph + (Math.random() - 0.5) * 0.05, 2), rainfall: 0,
    });
  }
  return out;
}

function seed() {
  const ts = now();
  const farmer = { id: 'u-farmer', name: 'Saman Kumarasinghe', email: 'farmer@agripulse.lk', role: 'farmer', company: 'Kandyan Valley Farm', country: 'LK', lang: 'en', createdAt: ts, ...hashPassword('Farm@123') };
  const buyer = { id: 'u-buyer', name: 'Aisha Rahman', email: 'buyer@agripulse.lk', role: 'buyer', company: 'Green Harvest LLC', country: 'AE', lang: 'en', createdAt: ts, ...hashPassword('Buyer@123') };
  const zones = [
    { id: 'A1', name: 'Block A1', crop: 'tomato', area: 0.4, nodeId: 'node-a1', planted: '2026-06-14' },
    { id: 'B2', name: 'Block B2', crop: 'chilli', area: 0.3, nodeId: 'node-b2', planted: '2026-05-30' },
    { id: 'C3', name: 'Block C3', crop: 'okra', area: 0.35, nodeId: 'node-c3', planted: '2026-07-02' },
  ];
  const nodes = zones.map((z) => ({ id: z.nodeId, zoneId: z.id, label: `ESP32 ${z.id}`, key: deviceKey(), expectedInterval: 20, lastSeen: ts, firmware: '1.4.2', createdAt: ts }));
  const readings = {
    A1: history(zones[0], 34, [42, 31, 38], 6.4),
    B2: history(zones[1], 41, [39, 28, 34], 6.2),
    C3: history(zones[2], 44, [41, 26, 35], 6.5),
  };
  const products = [
    { id: 'p-1', ownerId: farmer.id, name: 'Premium Mangoes', category: 'fruit', grade: 'A', quantity: 2000, unit: 'kg', price: 2.4, currency: 'USD', market: 'Dubai, UAE', certifications: ['GAP', 'GlobalGAP'], harvestDate: '2026-09-04', zoneId: null, description: 'TJC mangoes, hand-picked and pre-cooled within 4 hours of harvest.', emoji: '🥭', status: 'active', createdAt: ts },
    { id: 'p-2', ownerId: farmer.id, name: 'Green Chillies', category: 'vegetable', grade: 'A', quantity: 800, unit: 'kg', price: 3.1, currency: 'USD', market: 'Rotterdam, NL', certifications: ['GAP'], harvestDate: '2026-09-08', zoneId: 'B2', description: 'Long green chillies from sensor-monitored block B2.', emoji: '🌶️', status: 'active', createdAt: ts },
    { id: 'p-3', ownerId: farmer.id, name: 'Fresh Okra', category: 'vegetable', grade: 'A', quantity: 1200, unit: 'kg', price: 1.85, currency: 'USD', market: 'Doha, Qatar', certifications: ['GAP', 'Organic'], harvestDate: '2026-09-09', zoneId: 'C3', description: 'Tender okra pods, 8–10 cm, harvested every second day.', emoji: '🥬', status: 'active', createdAt: ts },
    { id: 'p-4', ownerId: farmer.id, name: 'Vine Tomatoes', category: 'vegetable', grade: 'B', quantity: 1500, unit: 'kg', price: 1.4, currency: 'USD', market: 'Malé, Maldives', certifications: ['GAP'], harvestDate: '2026-09-12', zoneId: 'A1', description: 'Cluster tomatoes from irrigated block A1.', emoji: '🍅', status: 'active', createdAt: ts },
  ];
  const inquiryTs = new Date(Date.now() - 3 * 3600e3).toISOString();
  const inquiries = [{
    id: 'inq-1', productId: 'p-1', productName: 'Premium Mangoes', buyerId: buyer.id, buyerName: buyer.name, buyerCompany: buyer.company, sellerId: farmer.id, sellerName: farmer.name,
    status: 'open', quantity: 2000, createdAt: inquiryTs, updatedAt: inquiryTs,
    messages: [
      { id: id('m-'), fromId: buyer.id, fromName: buyer.name, text: 'We are interested in 2,000 kg of Grade A mangoes for Dubai. Can you confirm the packing date and cold-chain arrangements?', ts: inquiryTs },
    ],
  }];
  const orderTs = new Date(Date.now() - 4 * 86400e3).toISOString();
  const orders = [{
    id: 'ord-1', ref: 'EX-2026-014', productId: 'p-1', productName: 'Premium Mangoes', inquiryId: null, buyerId: buyer.id, buyerName: buyer.name, buyerCompany: buyer.company,
    sellerId: farmer.id, sellerName: farmer.name, quantity: 2000, unit: 'kg', price: 2.4, currency: 'USD', destination: 'Dubai, UAE', incoterm: 'CIF',
    stage: 4, stages: ['inquiry', 'quotation', 'buyer_confirmed', 'quality_verified', 'documents_ready', 'dispatched', 'delivered'].map((key, i) => ({ key, status: i < 4 ? 'done' : i === 4 ? 'current' : 'pending', ts: i < 4 ? new Date(Date.now() - (4 - i) * 86400e3).toISOString() : null })),
    documents: [{ key: 'invoice', ready: true }, { key: 'packing_list', ready: true }, { key: 'phytosanitary', ready: false }, { key: 'certificate_of_origin', ready: false }],
    payment: { status: 'deposit', provider: 'manual', reference: 'TT-88213', ts: new Date(Date.now() - 2 * 86400e3).toISOString() }, createdAt: orderTs, updatedAt: orderTs,
  }];
  const logs = [
    { ts: new Date(Date.now() - 60 * 60e3).toISOString(), level: 'info', category: 'system', code: 'SYSTEM_SEEDED', meta: {} },
    { ts: new Date(Date.now() - 42 * 60e3).toISOString(), level: 'info', category: 'workflow', code: 'WORKFLOW_COMPLETED', meta: { id: 'wf-seed-1', type: 'irrigation', zone: 'C3' } },
    { ts: new Date(Date.now() - 18 * 60e3).toISOString(), level: 'info', category: 'data', code: 'SENSOR_VALIDATED', meta: { node: 'node-b2' } },
  ];
  return {
    meta: { schema: SCHEMA, createdAt: ts, app: 'AgriPulse Smart Farming Web System' },
    users: [farmer, buyer], sessions: [],
    farm: { id: 'farm-1', ownerId: farmer.id, name: 'Kandyan Valley Farm', location: 'Mahiyanganaya, Sri Lanka', lat: 7.33, lng: 81.0, simulation: true, interval: 20, autonomous: false, timezone: 'Asia/Colombo' },
    zones, nodes, readings, ingestLog: [], alerts: [], decisionLog: [], workflows: [
      { id: 'wf-seed-1', type: 'irrigation', zoneId: 'C3', status: 'done', params: { type: 'irrigation', minutes: 12 }, approvedBy: farmer.name,
        decision: { code: 'IRRIGATE', params: { zone: 'C3', crop: 'okra', moisture: 37.2, min: 40, max: 50, deficit: 2.8, minutes: 12 }, evidence: [{ metric: 'moisture', value: 37.2, threshold: 40, relation: 'below' }], ruleId: 'R-IRRIGATE', confidence: 0.92, ts: new Date(Date.now() - 55 * 60e3).toISOString() },
        steps: ['detected', 'approval', 'execute', 'verify', 'completed'].map((key) => ({ key, status: 'done', ts: new Date(Date.now() - 50 * 60e3).toISOString(), by: key === 'approval' ? farmer.name : 'agent' })),
        createdAt: new Date(Date.now() - 55 * 60e3).toISOString(), updatedAt: new Date(Date.now() - 42 * 60e3).toISOString(), executedAt: new Date(Date.now() - 50 * 60e3).toISOString(), completedAt: new Date(Date.now() - 42 * 60e3).toISOString() },
    ],
    products, inquiries, orders, logs, susResponses: [],
    evaluation: { lastRun: null },
    stats: { expectedReadings: 4320, receivedReadings: 4251, acceptedReadings: 4170, rejectedReadings: 81, workflowsStarted: 31, workflowsCompleted: 28, workflowsFailed: 2, b2bAttempted: 47, b2bCompleted: 42 },
  };
}

module.exports = { seed, SCHEMA };
