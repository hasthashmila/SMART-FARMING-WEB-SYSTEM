'use strict';
/* Data-preparation layer (thesis §3.6): normalises units and field names, checks for
   missing values, rejects out-of-range measurements and standardises timestamps. */
const { round } = require('./util');

const FIELDS = ['moisture', 'nitrogen', 'phosphorus', 'potassium', 'soilTemp', 'airTemp', 'humidity', 'ph', 'rainfall'];
const REQUIRED = ['moisture', 'airTemp', 'humidity', 'ph'];
const RANGES = {
  moisture: [0, 100], nitrogen: [0, 500], phosphorus: [0, 500], potassium: [0, 500],
  soilTemp: [-10, 60], airTemp: [-10, 60], humidity: [0, 100], ph: [0, 14], rainfall: [0, 500],
};
const UNITS = { moisture: '%', nitrogen: 'mg/kg', phosphorus: 'mg/kg', potassium: 'mg/kg', soilTemp: '°C', airTemp: '°C', humidity: '%', ph: '', rainfall: 'mm' };
const ALIASES = {
  soil_moisture: 'moisture', soilmoisture: 'moisture', soilMoisture: 'moisture', vwc: 'moisture',
  n: 'nitrogen', p: 'phosphorus', k: 'potassium',
  soil_temp: 'soilTemp', soil_temperature: 'soilTemp', soiltemp: 'soilTemp',
  temperature: 'airTemp', air_temp: 'airTemp', ambient: 'airTemp', ambient_temp: 'airTemp', temp: 'airTemp', airtemp: 'airTemp',
  hum: 'humidity', relative_humidity: 'humidity', rh: 'humidity',
  rain: 'rainfall', rain_mm: 'rainfall', precipitation: 'rainfall',
  pH: 'ph', PH: 'ph',
};

function prepare(raw, nowMs = Date.now()) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const errors = [];
  const reading = {};
  for (const [key, value] of Object.entries(src)) {
    const field = ALIASES[key] || key;
    if (FIELDS.includes(field)) reading[field] = value;
  }
  const units = src.units && typeof src.units === 'object' ? src.units : {};
  if (String(units.temperature || '').toUpperCase() === 'F') {
    for (const f of ['soilTemp', 'airTemp']) if (reading[f] != null && reading[f] !== '') reading[f] = (Number(reading[f]) - 32) * 5 / 9;
  }
  if (String(units.rainfall || '').toLowerCase() === 'in' && reading.rainfall != null) reading.rainfall = Number(reading.rainfall) * 25.4;

  for (const f of FIELDS) {
    const v = reading[f];
    if (v === undefined || v === null || v === '') {
      reading[f] = null;
      if (REQUIRED.includes(f)) errors.push({ field: f, code: 'MISSING' });
      continue;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) { errors.push({ field: f, code: 'NOT_NUMERIC', value: String(v).slice(0, 20) }); reading[f] = null; continue; }
    const [lo, hi] = RANGES[f];
    if (n < lo || n > hi) { errors.push({ field: f, code: 'OUT_OF_RANGE', value: round(n, 2) }); reading[f] = null; continue; }
    reading[f] = round(n, f === 'ph' ? 2 : 1);
  }

  const ts = src.ts ?? src.timestamp ?? src.time;
  let t = ts == null ? nowMs : typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(ts);
  if (!Number.isFinite(t)) { errors.push({ field: 'ts', code: 'INVALID_TIMESTAMP' }); t = nowMs; }
  else if (t > nowMs + 5 * 60e3) errors.push({ field: 'ts', code: 'FUTURE_TIMESTAMP' });
  else if (t < nowMs - 24 * 3600e3) errors.push({ field: 'ts', code: 'STALE_TIMESTAMP' });
  reading.ts = new Date(t).toISOString();
  reading.completeness = round(FIELDS.filter((f) => reading[f] != null).length / FIELDS.length, 3);
  return { ok: errors.length === 0, reading, errors };
}

module.exports = { prepare, FIELDS, REQUIRED, RANGES, UNITS };
