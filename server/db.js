'use strict';
const fs = require('fs');
const path = require('path');
const { seed, SCHEMA } = require('./seed');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LIMITS = { readings: 320, ingestLog: 400, logs: 400, alerts: 150, decisionLog: 200 };

let state = null;
let timer = null;

function cap(list, n) { if (Array.isArray(list) && list.length > n) list.splice(0, list.length - n); }
function trim(db) {
  Object.values(db.readings).forEach((l) => cap(l, LIMITS.readings));
  cap(db.ingestLog, LIMITS.ingestLog); cap(db.logs, LIMITS.logs); cap(db.decisionLog, LIMITS.decisionLog);
  if (db.alerts.length > LIMITS.alerts) db.alerts = db.alerts.filter((a) => !a.resolvedAt).concat(db.alerts.filter((a) => a.resolvedAt).slice(-40));
}

function load() {
  if (state) return state;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try { state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch {
      const backup = `${DB_FILE}.corrupt-${Date.now()}`;
      fs.renameSync(DB_FILE, backup);
      console.warn(`Database could not be parsed; moved to ${backup} and reseeded.`);
    }
  }
  if (!state || state.meta?.schema !== SCHEMA) {
    if (state) fs.renameSync(DB_FILE, `${DB_FILE}.schema${state.meta?.schema || 0}-${Date.now()}`);
    state = seed();
    flush();
    console.log('Seeded a fresh database with demo data.');
  }
  return state;
}
function save() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; flush(); }, 300);
  if (timer.unref) timer.unref();
}
function flush() {
  if (!state) return;
  trim(state);
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, DB_FILE);
}

module.exports = { load, save, flush, DATA_DIR, DB_FILE };
