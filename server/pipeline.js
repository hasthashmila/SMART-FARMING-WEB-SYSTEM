'use strict';
/* End-to-end data flow (thesis Figure 3.3): node → validation → storage → agent inference →
   alerts + workflows → live dashboard. */
const { id, now, round } = require('./util');
const { prepare } = require('./validate');
const agent = require('./agent');
const workflows = require('./workflows');
const events = require('./events');

function createPipeline(getDb, save) {
  const ctx = { simulator: null, log };

  function log(level, category, code, meta = {}) {
    const db = getDb();
    db.logs.push({ ts: now(), level, category, code, meta });
    events.broadcast('log', { level, category, code, meta }, (c) => c.role === 'farmer');
  }

  function recentReadings(db, zoneId, minutes = 60) {
    const cutoff = Date.now() - minutes * 60e3;
    return (db.readings[zoneId] || []).filter((r) => Date.parse(r.ts) >= cutoff);
  }
  function rejectedRatio(db, zoneId) {
    const cutoff = Date.now() - 3600e3;
    const entries = db.ingestLog.filter((e) => e.zoneId === zoneId && Date.parse(e.ts) >= cutoff);
    if (entries.length < 5) return 0;
    return entries.filter((e) => e.status === 'rejected').length / entries.length;
  }

  function evaluateZone(db, zone, nowIso = now()) {
    const list = db.readings[zone.id] || [];
    const node = db.nodes.find((n) => n.id === zone.nodeId);
    return agent.evaluateZone({ zone, latest: list[list.length - 1], recent: recentReadings(db, zone.id), node, nowIso, rejectedRatio: rejectedRatio(db, zone.id) });
  }
  function evaluateFarm(db) {
    const nowIso = now();
    const zones = db.zones.map((zone) => {
      const decisions = evaluateZone(db, zone, nowIso);
      return { zoneId: zone.id, status: agent.zoneStatus(decisions), decisions };
    });
    return { zones, decisions: zones.flatMap((z) => z.decisions) };
  }

  function syncAlerts(db, zoneId, decisions) {
    const active = decisions.filter((d) => d.severity === 'critical' || d.severity === 'warning');
    for (const d of active) {
      const existing = db.alerts.find((a) => a.id === d.id && !a.resolvedAt);
      if (existing) { existing.params = d.params; existing.severity = d.severity; existing.updatedAt = now(); existing.count++; }
      else {
        db.alerts.push({ id: d.id, code: d.code, zoneId, severity: d.severity, params: d.params, ts: now(), updatedAt: now(), read: false, resolvedAt: null, count: 1 });
        log(d.severity === 'critical' ? 'error' : 'warn', 'agent', 'ALERT_RAISED', { code: d.code, zone: zoneId });
      }
    }
    for (const a of db.alerts) {
      if (a.zoneId === zoneId && !a.resolvedAt && !active.some((d) => d.id === a.id)) { a.resolvedAt = now(); log('info', 'agent', 'ALERT_RESOLVED', { code: a.code, zone: zoneId }); }
    }
    const prev = [...db.decisionLog].reverse().find((e) => e.zoneId === zoneId);
    const codes = decisions.map((d) => d.code);
    if (!prev || prev.codes.join() !== codes.join()) {
      db.decisionLog.push({ ts: now(), zoneId, codes, evidence: decisions.map((d) => ({ code: d.code, evidence: d.evidence, confidence: d.confidence })) });
    }
  }

  function afterReading(db, zone) {
    const decisions = evaluateZone(db, zone);
    syncAlerts(db, zone.id, decisions);
    workflows.syncDecisions(db, decisions, ctx);
    workflows.tick(db, ctx);
    return decisions;
  }

  /* Evaluate every zone once at start-up so alerts and workflows reflect stored readings. */
  function bootstrap() {
    const db = getDb();
    for (const zone of db.zones) afterReading(db, zone);
    if (!db.evaluation.lastRun) db.evaluation.lastRun = agent.runScenarios();
    save();
  }

  function ingest(node, raw, source = 'http') {
    const db = getDb();
    const zone = db.zones.find((z) => z.id === node.zoneId);
    db.stats.receivedReadings++;
    node.lastSeen = now();
    const { ok, reading, errors } = prepare(raw);
    if (!ok || !zone) {
      db.stats.rejectedReadings++;
      db.ingestLog.push({ ts: now(), nodeId: node.id, zoneId: node.zoneId, status: 'rejected', errors, source });
      log('warn', 'data', 'READING_REJECTED', { node: node.id, errors: errors.map((e) => `${e.field}:${e.code}`) });
      save();
      events.broadcast('ingest', { nodeId: node.id, status: 'rejected' }, (c) => c.role === 'farmer');
      return { accepted: false, errors };
    }
    db.stats.acceptedReadings++;
    const record = { id: id('r-'), nodeId: node.id, zoneId: zone.id, source, ...reading };
    (db.readings[zone.id] ||= []).push(record);
    db.ingestLog.push({ ts: now(), nodeId: node.id, zoneId: zone.id, status: 'accepted', completeness: reading.completeness, source });
    const decisions = afterReading(db, zone);
    save();
    events.broadcast('update', { zoneId: zone.id, status: agent.zoneStatus(decisions) }, (c) => c.role === 'farmer');
    return { accepted: true, reading: record, decisions };
  }

  function metrics(db) {
    const s = db.stats;
    const pct = (a, b) => (b > 0 ? round((a / b) * 100, 1) : null);
    /* B2B: an inquiry counts as a completed workflow once the seller has replied or converted it; fresh
       inquiries (< 24 h) are still in progress. An order counts once the buyer has confirmed it (or it is < 48 h old). */
    const dayAgo = Date.now() - 86400e3, twoDaysAgo = Date.now() - 2 * 86400e3;
    const considered = db.inquiries.filter((i) => i.status !== 'open' || i.messages.some((m) => m.fromId === i.sellerId) || Date.parse(i.createdAt) < dayAgo);
    const inquiries = considered.length + (s.b2bAttempted || 0);
    const answered = considered.filter((i) => i.messages.some((m) => m.fromId === i.sellerId) || i.status === 'converted').length + (s.b2bCompleted || 0);
    const orders = db.orders.length;
    const progressed = db.orders.filter((o) => o.stage >= 2 || Date.parse(o.createdAt) > twoDaysAgo).length;
    const sus = db.susResponses.length ? round(db.susResponses.reduce((a, r) => a + r.score, 0) / db.susResponses.length, 1) : null;
    return {
      sensorIntegration: { value: pct(s.receivedReadings, s.expectedReadings), target: 95, detail: { received: s.receivedReadings, expected: s.expectedReadings } },
      dataQuality: { value: pct(s.acceptedReadings, s.receivedReadings), target: 90, detail: { accepted: s.acceptedReadings, received: s.receivedReadings, rejected: s.rejectedReadings } },
      aiDecisionSupport: { value: db.evaluation.lastRun?.agreement ?? null, target: 85, detail: db.evaluation.lastRun ? { passed: db.evaluation.lastRun.passed, total: db.evaluation.lastRun.total, ranAt: db.evaluation.lastRun.ranAt } : null },
      workflowAutomation: { value: pct(s.workflowsCompleted, s.workflowsCompleted + s.workflowsFailed), target: 90, detail: { completed: s.workflowsCompleted, failed: s.workflowsFailed, started: s.workflowsStarted } },
      webUsability: { value: sus, target: 85, detail: { responses: db.susResponses.length } },
      b2bFunctionality: { value: pct(answered + progressed, inquiries + orders), target: 88, detail: { inquiries, answered, orders, progressed } },
    };
  }

  return { ctx, log, ingest, bootstrap, evaluateZone, evaluateFarm, metrics, recentReadings };
}

module.exports = { createPipeline };
