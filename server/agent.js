'use strict';
/* AI-agent decision layer (thesis §3.7.2). Rule-based decision intelligence with explicit
   traceability: every decision carries the readings, thresholds and rule that produced it. */
const { clamp, round } = require('./util');

const POLICIES = {
  tomato: { moisture: [38, 45], ph: [6.0, 6.8], nitrogen: 40, phosphorus: 25, potassium: 30, airTemp: [18, 32], soilTemp: [18, 30], humidityMax: 80 },
  chilli: { moisture: [35, 45], ph: [6.0, 7.0], nitrogen: 35, phosphorus: 25, potassium: 30, airTemp: [20, 33], soilTemp: [18, 32], humidityMax: 85 },
  okra:   { moisture: [40, 50], ph: [6.0, 6.8], nitrogen: 35, phosphorus: 20, potassium: 30, airTemp: [22, 35], soilTemp: [20, 34], humidityMax: 85 },
};
const SEVERITY = { critical: 0, warning: 1, info: 2, good: 3 };

function evaluateZone({ zone, latest, recent = [], node, nowIso = new Date().toISOString(), rejectedRatio = 0 }) {
  const policy = POLICIES[zone.crop] || POLICIES.tomato;
  const decisions = [];
  const push = (code, severity, params = {}, evidence = [], action = null, confidence = 0.92) => decisions.push({
    id: `${zone.id}-${code}`, code, severity, zoneId: zone.id, crop: zone.crop, ruleId: 'R-' + code, policy: zone.crop,
    params: { zone: zone.id, crop: zone.crop, ...params }, evidence, action, confidence: round(confidence, 2), ts: nowIso,
  });
  const ev = (metric, value, threshold, relation) => ({ metric, value, threshold, relation });

  const interval = node?.expectedInterval || 20;
  const lastSeenAge = node?.lastSeen ? (Date.parse(nowIso) - Date.parse(node.lastSeen)) / 1000 : Infinity;
  if (lastSeenAge > Math.max(90, interval * 4)) {
    push('SENSOR_OFFLINE', 'critical', { node: node?.id || zone.nodeId, minutes: Math.round(lastSeenAge / 60) },
      [ev('lastSeen', node?.lastSeen || null, `${interval}s`, 'older_than')], { type: 'sensor_check' }, 0.99);
  }
  if (!latest) { push('NO_DATA', 'warning', {}, [], null, 0.99); return decisions; }

  const ageMin = (Date.parse(nowIso) - Date.parse(latest.ts)) / 60000;
  let confidence = 0.92;
  if (latest.completeness < 1) confidence -= 0.07;
  if (ageMin > 30) confidence -= 0.25;
  if (rejectedRatio > 0.1) confidence -= 0.1;

  const rain1h = recent.filter((r) => (Date.parse(nowIso) - Date.parse(r.ts)) <= 3600e3).reduce((s, r) => s + (r.rainfall || 0), 0);
  const m = latest.moisture;
  if (m != null) {
    if (m < policy.moisture[0]) {
      const deficit = round(policy.moisture[0] - m, 1);
      if (rain1h >= 2 || (latest.rainfall || 0) >= 3) {
        push('RAIN_HOLD_IRRIGATION', 'info', { moisture: m, min: policy.moisture[0], rain: round(rain1h, 1) },
          [ev('moisture', m, policy.moisture[0], 'below'), ev('rainfall_1h', round(rain1h, 1), 2, 'above')], null, confidence);
      } else {
        const minutes = clamp(Math.round(deficit * 3), 8, 30);
        push('IRRIGATE', deficit >= 5 ? 'critical' : 'warning', { moisture: m, min: policy.moisture[0], max: policy.moisture[1], deficit, minutes },
          [ev('moisture', m, policy.moisture[0], 'below'), ev('rainfall_1h', round(rain1h, 1), 2, 'below')], { type: 'irrigation', minutes }, confidence);
      }
    } else if (m > policy.moisture[1]) {
      push('MOISTURE_HIGH', 'info', { moisture: m, max: policy.moisture[1] }, [ev('moisture', m, policy.moisture[1], 'above')], null, confidence);
    }
  }
  const low = ['nitrogen', 'phosphorus', 'potassium'].filter((n) => latest[n] != null && latest[n] < policy[n]);
  if (low.length) {
    push('NUTRIENT_LOW', 'warning', { nutrients: low, values: Object.fromEntries(low.map((n) => [n, latest[n]])), mins: Object.fromEntries(low.map((n) => [n, policy[n]])) },
      low.map((n) => ev(n, latest[n], policy[n], 'below')), { type: 'fertigation', nutrients: low }, confidence);
  }
  if (latest.ph != null) {
    if (latest.ph < policy.ph[0]) push('PH_LOW', 'warning', { ph: latest.ph, min: policy.ph[0], max: policy.ph[1] }, [ev('ph', latest.ph, policy.ph[0], 'below')], null, confidence);
    else if (latest.ph > policy.ph[1]) push('PH_HIGH', 'warning', { ph: latest.ph, min: policy.ph[0], max: policy.ph[1] }, [ev('ph', latest.ph, policy.ph[1], 'above')], null, confidence);
  }
  if (latest.airTemp != null) {
    if (latest.airTemp > policy.airTemp[1]) push('HEAT_STRESS', 'warning', { airTemp: latest.airTemp, max: policy.airTemp[1] }, [ev('airTemp', latest.airTemp, policy.airTemp[1], 'above')], null, confidence);
    else if (latest.airTemp < policy.airTemp[0]) push('COLD_STRESS', 'info', { airTemp: latest.airTemp, min: policy.airTemp[0] }, [ev('airTemp', latest.airTemp, policy.airTemp[0], 'below')], null, confidence);
  }
  if (latest.humidity != null && latest.humidity > policy.humidityMax && (latest.airTemp ?? 0) >= 24) {
    push('DISEASE_RISK', 'warning', { humidity: latest.humidity, max: policy.humidityMax, airTemp: latest.airTemp },
      [ev('humidity', latest.humidity, policy.humidityMax, 'above'), ev('airTemp', latest.airTemp, 24, 'above')], null, confidence - 0.05);
  }
  if ((latest.rainfall || 0) >= 5) push('RAIN_EVENT', 'info', { rainfall: latest.rainfall }, [ev('rainfall', latest.rainfall, 5, 'above')], { type: 'cancel_irrigation' }, confidence);
  if (rejectedRatio > 0.1) push('DATA_QUALITY', 'warning', { ratio: Math.round(rejectedRatio * 100) }, [ev('rejected_ratio', round(rejectedRatio, 2), 0.1, 'above')], null, 0.95);
  if (ageMin > 30) push('STALE_DATA', 'warning', { minutes: Math.round(ageMin) }, [ev('reading_age_min', Math.round(ageMin), 30, 'above')], null, 0.95);
  if (!decisions.some((d) => d.severity === 'critical' || d.severity === 'warning')) {
    push('HEALTHY', 'good', { moisture: m, ph: latest.ph }, [ev('moisture', m, policy.moisture, 'within'), ev('ph', latest.ph, policy.ph, 'within')], null, confidence);
  }
  return decisions.sort((a, b) => SEVERITY[a.severity] - SEVERITY[b.severity]);
}

function zoneStatus(decisions) {
  if (decisions.some((d) => d.severity === 'critical')) return 'critical';
  if (decisions.some((d) => d.severity === 'warning')) return 'attention';
  return 'optimal';
}

/* Predefined scenario suite used for the "AI decision support" evaluation metric (thesis Table 3.2).
   Expected outcomes were fixed in advance from crop-policy guidance; two scenarios were deliberately
   set by expert judgement rather than by the encoded rules, so agreement is measured, not assumed. */
const SCENARIOS = [
  { id: 'S01', crop: 'tomato', reading: { moisture: 31, airTemp: 29, humidity: 66, ph: 6.4, rainfall: 0 }, expect: 'IRRIGATE' },
  { id: 'S02', crop: 'tomato', reading: { moisture: 41, airTemp: 27, humidity: 64, ph: 6.4, rainfall: 0, nitrogen: 45, phosphorus: 30, potassium: 35 }, expect: 'HEALTHY' },
  { id: 'S03', crop: 'tomato', reading: { moisture: 33, airTemp: 26, humidity: 88, ph: 6.3, rainfall: 7 }, expect: 'RAIN_HOLD_IRRIGATION' },
  { id: 'S04', crop: 'chilli', reading: { moisture: 40, airTemp: 30, humidity: 60, ph: 6.5, nitrogen: 22, phosphorus: 28, potassium: 33 }, expect: 'NUTRIENT_LOW' },
  { id: 'S05', crop: 'okra', reading: { moisture: 45, airTemp: 31, humidity: 62, ph: 5.4 }, expect: 'PH_LOW' },
  { id: 'S06', crop: 'tomato', reading: { moisture: 42, airTemp: 26, humidity: 60, ph: 7.4 }, expect: 'PH_HIGH' },
  { id: 'S07', crop: 'chilli', reading: { moisture: 42, airTemp: 36, humidity: 50, ph: 6.6 }, expect: 'HEAT_STRESS' },
  { id: 'S08', crop: 'tomato', reading: { moisture: 42, airTemp: 27, humidity: 86, ph: 6.5 }, expect: 'DISEASE_RISK' },
  { id: 'S09', crop: 'okra', reading: { moisture: 56, airTemp: 28, humidity: 70, ph: 6.5 }, expect: 'MOISTURE_HIGH' },
  { id: 'S10', crop: 'tomato', reading: { moisture: 43, airTemp: 27, humidity: 70, ph: 6.4, rainfall: 9 }, expect: 'RAIN_EVENT' },
  { id: 'S11', crop: 'okra', reading: { moisture: 36, airTemp: 30, humidity: 58, ph: 6.4, rainfall: 0 }, expect: 'IRRIGATE' },
  { id: 'S12', crop: 'chilli', reading: { moisture: 15, airTemp: 34, humidity: 40, ph: 6.6, rainfall: 0 }, expect: 'IRRIGATE', severity: 'critical' },
  { id: 'S13', crop: 'tomato', reading: { moisture: 40, airTemp: 16, humidity: 70, ph: 6.4 }, expect: 'COLD_STRESS' },
  { id: 'S14', crop: 'tomato', reading: { moisture: 42, airTemp: 23, humidity: 83, ph: 6.4 }, expect: 'DISEASE_RISK', note: 'expert' },
  { id: 'S15', crop: 'okra', reading: { moisture: 39, airTemp: 29, humidity: 60, ph: 6.4, rainfall: 0 }, expect: 'HEALTHY', note: 'expert' },
];

function runScenarios(nowIso = new Date().toISOString()) {
  const results = SCENARIOS.map((s) => {
    const latest = { ...s.reading, ts: nowIso, completeness: 1 };
    const zone = { id: 'TEST', crop: s.crop, nodeId: 'test' };
    const node = { id: 'test', lastSeen: nowIso, expectedInterval: 20 };
    const decisions = evaluateZone({ zone, latest, recent: [latest], node, nowIso });
    const top = decisions[0];
    const codes = decisions.map((d) => d.code);
    const pass = codes.includes(s.expect) && (!s.severity || decisions.find((d) => d.code === s.expect)?.severity === s.severity);
    return { id: s.id, crop: s.crop, expected: s.expect, actual: top?.code, codes, pass, note: s.note || null };
  });
  const passed = results.filter((r) => r.pass).length;
  return { total: results.length, passed, agreement: round((passed / results.length) * 100, 1), results, ranAt: nowIso };
}

/* Lightweight NLP intent classifier for the assistant (English, Sinhala, Tamil keywords). */
const INTENTS = {
  irrigation: ['irrigat', 'water', 'moisture', 'dry', 'වතුර', 'ජල', 'වාරි', 'තෙතමන', 'වියළ', 'நீர்', 'பாசன', 'ஈரப்பத', 'வறட்'],
  nutrients: ['fertil', 'nutrient', 'npk', 'nitrogen', 'phosph', 'potas', 'පොහොර', 'පෝෂක', 'නයිට්‍රජන්', 'උරம்', 'ஊட்டச்சத்', 'நைட்ரஜன்'],
  ph: [' ph', 'ph ', 'acid', 'alkal', 'lime', 'ආම්ලික', 'හුණු', 'அமில', 'சுண்ணாம்'],
  weather: ['weather', 'temperature', 'hot', 'heat', 'rain', 'humid', 'කාලගුණ', 'උෂ්ණ', 'වැස්ස', 'වර්ෂා', 'ආර්ද්‍ර', 'வானிலை', 'வெப்ப', 'மழை', 'ஈரப்பதம்'],
  disease: ['disease', 'fungus', 'fungal', 'pest', 'leaf', 'රෝග', 'දිලීර', 'පළිබෝධ', 'නෝய்', 'பூஞ்சை', 'பூச்சி'],
  market: ['price', 'market', 'sell', 'buyer', 'listing', 'මිල', 'වෙළඳ', 'විකුණ', 'ගැනුම්', 'விலை', 'சந்தை', 'விற்', 'வாங்கு'],
  export: ['export', 'shipment', 'order', 'document', 'අපනයන', 'නැව්', 'ඇණවුම', 'ලේඛන', 'ஏற்றுமதி', 'சரக்கு', 'ஆர்டர்', 'ஆவண'],
  workflow: ['workflow', 'approve', 'automation', 'pending', 'ක්‍රියා', 'අනුමත', 'ස්වයංක්‍රීය', 'பணிப்பாய்வு', 'அங்கீகர', 'தானியங்கி'],
  help: ['help', 'what can', 'how do', 'උදව්', 'උපකාර', 'කොහොමද', 'உதவி', 'எப்படி'],
};
function classifyIntent(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  let best = 'status', bestScore = 0;
  for (const [intent, words] of Object.entries(INTENTS)) {
    const score = words.reduce((s, w) => s + (t.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { best = intent; bestScore = score; }
  }
  return best;
}

module.exports = { POLICIES, evaluateZone, zoneStatus, runScenarios, classifyIntent, SCENARIOS };
