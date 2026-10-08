'use strict';
/* IoT sensor-node simulator. Stands in for ESP32 field nodes when no hardware is connected and
   feeds readings through the same ingest pipeline (validation → storage → agent → workflows). */
const { round, clamp } = require('./util');

const BASE = { tomato: { temp: 27, hum: 68 }, chilli: { temp: 28, hum: 66 }, okra: { temp: 29, hum: 70 } };

class Simulator {
  constructor(getDb, ingest, log) {
    this.getDb = getDb; this.ingest = ingest; this.log = log;
    this.state = {}; this.timer = null; this.interval = 20;
  }
  init() {
    const db = this.getDb();
    for (const zone of db.zones) {
      const latest = (db.readings[zone.id] || []).slice(-1)[0];
      this.state[zone.id] = {
        moisture: latest?.moisture ?? 40, nitrogen: latest?.nitrogen ?? 42, phosphorus: latest?.phosphorus ?? 30, potassium: latest?.potassium ?? 36,
        ph: latest?.ph ?? 6.4, rainTicks: 0, boost: 0,
      };
    }
    this.restart();
  }
  restart() {
    const db = this.getDb();
    this.interval = clamp(Number(db.farm.interval) || 20, 5, 300);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => { try { this.tick(); } catch (err) { console.error('Simulator tick failed', err); } }, this.interval * 1000);
    if (this.timer.unref) this.timer.unref();
  }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }

  generate(zone, date = new Date()) {
    const s = this.state[zone.id];
    const base = BASE[zone.crop] || BASE.tomato;
    const h = date.getHours() + date.getMinutes() / 60;
    const diurnal = Math.sin(((h - 9) / 24) * Math.PI * 2);
    const airTemp = base.temp + 4.5 * diurnal + (Math.random() - 0.5) * 1.2;
    const humidity = clamp(base.hum - 11 * diurnal + (Math.random() - 0.5) * 4, 35, 98);
    const soilTemp = airTemp - 2.5 + (Math.random() - 0.5) * 0.6;
    if (s.rainTicks <= 0 && Math.random() < 0.004) s.rainTicks = 3 + Math.floor(Math.random() * 3);
    let rainfall = 0;
    if (s.rainTicks > 0) { rainfall = round(3 + Math.random() * 5, 1); s.rainTicks--; }
    const evap = 0.05 + Math.max(0, airTemp - 26) * 0.01;
    s.moisture = clamp(s.moisture - evap + rainfall * 0.35 + s.boost, 12, 75);
    s.boost = 0;
    s.ph = clamp(s.ph + (Math.random() - 0.5) * 0.02, 5.2, 7.6);
    for (const n of ['nitrogen', 'phosphorus', 'potassium']) s[n] = clamp(s[n] - 0.02 + (Math.random() - 0.5) * 0.3, 5, 120);
    return {
      moisture: round(s.moisture, 1), nitrogen: round(s.nitrogen, 1), phosphorus: round(s.phosphorus, 1), potassium: round(s.potassium, 1),
      soilTemp: round(soilTemp, 1), airTemp: round(airTemp, 1), humidity: round(humidity, 1), ph: round(s.ph, 2), rainfall,
      ts: date.toISOString(),
    };
  }

  tick(onlyZone = null) {
    const db = this.getDb();
    if (!db.farm.simulation) return;
    for (const node of db.nodes) {
      const zone = db.zones.find((z) => z.id === node.zoneId);
      if (!zone || (onlyZone && zone.id !== onlyZone)) continue;
      db.stats.expectedReadings++;
      if (!onlyZone && Math.random() < 0.015) { this.log('warn', 'network', 'PACKET_DROPPED', { node: node.id }); continue; }
      const payload = this.generate(zone);
      if (!onlyZone && Math.random() < 0.02) {
        const field = ['moisture', 'ph', 'humidity'][Math.floor(Math.random() * 3)];
        payload[field] = field === 'ph' ? 19.5 : 260;
      }
      this.ingest(node, payload, 'simulator');
    }
  }

  applyActuator(zoneId, type, params = {}) {
    const s = this.state[zoneId];
    if (!s) return;
    if (type === 'irrigation') s.boost += clamp((params.minutes || 12) * 0.6, 4, 18);
    if (type === 'fertigation') for (const n of params.nutrients || []) s[n] += 14;
  }

  inject(zoneId, preset) {
    const s = this.state[zoneId];
    if (!s) return false;
    const presets = {
      dry: () => { s.moisture = 29; s.rainTicks = 0; },
      rain: () => { s.rainTicks = 5; },
      heat: () => { this.heatUntil = Date.now() + 10 * 60e3; },
      nutrient_drop: () => { s.nitrogen = 24; s.potassium = 26; },
      acidic: () => { s.ph = 5.5; },
      normal: () => { s.moisture = 42; s.nitrogen = 44; s.phosphorus = 31; s.potassium = 37; s.ph = 6.4; s.rainTicks = 0; },
    };
    if (!presets[preset]) return false;
    presets[preset]();
    return true;
  }
}

module.exports = { Simulator };
