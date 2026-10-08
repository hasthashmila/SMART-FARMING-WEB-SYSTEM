'use strict';
/* Workflow orchestration (thesis §2.2.3 / §3.7.2): converts agent decisions into traceable,
   auditable workflows with explicit approval, execution and verification stages. */
const { id, now } = require('./util');
const { POLICIES } = require('./agent');

const DEFS = {
  irrigation:   { steps: ['detected', 'approval', 'execute', 'verify', 'completed'], approval: true, actuator: 'irrigation_valve' },
  fertigation:  { steps: ['detected', 'approval', 'execute', 'verify', 'completed'], approval: true, actuator: 'fertigation_pump' },
  sensor_check: { steps: ['detected', 'notify', 'acknowledge'], approval: false },
};
const OPEN = ['pending', 'running'];

function findOpen(db, zoneId, type) {
  return db.workflows.find((w) => w.zoneId === zoneId && w.type === type && OPEN.includes(w.status));
}
function step(wf, key, patch) {
  const s = wf.steps.find((x) => x.key === key);
  if (s) Object.assign(s, patch, { ts: now() });
  wf.updatedAt = now();
}

function syncDecisions(db, decisions, ctx) {
  for (const d of decisions) {
    if (d.code === 'RAIN_EVENT' || d.code === 'RAIN_HOLD_IRRIGATION') {
      const open = findOpen(db, d.zoneId, 'irrigation');
      if (open && open.status === 'pending') {
        open.status = 'cancelled'; open.cancelReason = 'rain'; open.updatedAt = now();
        ctx.log('info', 'workflow', 'WORKFLOW_CANCELLED', { id: open.id, zone: d.zoneId, reason: 'rain' });
      }
      if (!d.action || d.action.type === 'cancel_irrigation') continue;
    }
    if (!d.action || !DEFS[d.action.type]) continue;
    if (findOpen(db, d.zoneId, d.action.type)) continue;
    const def = DEFS[d.action.type];
    const wf = {
      id: id('wf-'), type: d.action.type, zoneId: d.zoneId, status: 'pending', params: { ...d.action },
      decision: { code: d.code, params: d.params, evidence: d.evidence, ruleId: d.ruleId, confidence: d.confidence, ts: d.ts },
      steps: def.steps.map((key) => ({ key, status: 'pending' })), createdAt: now(), updatedAt: now(),
    };
    step(wf, 'detected', { status: 'done', by: 'agent' });
    db.workflows.unshift(wf);
    db.stats.workflowsStarted++;
    ctx.log('info', 'workflow', 'WORKFLOW_CREATED', { id: wf.id, type: wf.type, zone: wf.zoneId, decision: d.code });
    if (!def.approval) step(wf, 'notify', { status: 'done', by: 'agent' });
    else if (db.farm.autonomous) approve(db, wf.id, { id: 'agent', name: 'AI agent' }, ctx);
  }
  if (db.workflows.length > 150) db.workflows.length = 150;
}

function approve(db, wfId, user, ctx) {
  const wf = db.workflows.find((w) => w.id === wfId);
  if (!wf || wf.status !== 'pending') return null;
  const def = DEFS[wf.type];
  step(wf, 'approval', { status: 'done', by: user.name, byId: user.id });
  wf.approvedBy = user.name;
  wf.status = 'running';
  const command = { actuator: def.actuator, zone: wf.zoneId, params: wf.params, topic: `agripulse/${db.farm.id}/${wf.zoneId}/actuator/${def.actuator}` };
  if (db.farm.simulation) ctx.simulator?.applyActuator(wf.zoneId, wf.type, wf.params);
  step(wf, 'execute', { status: 'done', by: db.farm.simulation ? 'simulator' : 'mqtt', command });
  wf.executedAt = now();
  wf.verifyDeadline = new Date(Date.now() + 8 * 60e3).toISOString();
  ctx.log('info', 'workflow', 'ACTUATOR_COMMAND', { id: wf.id, ...command, mode: db.farm.simulation ? 'simulated' : 'live' });
  return wf;
}

function reject(db, wfId, user, ctx) {
  const wf = db.workflows.find((w) => w.id === wfId);
  if (!wf || wf.status !== 'pending') return null;
  wf.status = 'rejected'; wf.rejectedBy = user.name; wf.updatedAt = now();
  step(wf, 'approval', { status: 'rejected', by: user.name });
  ctx.log('info', 'workflow', 'WORKFLOW_REJECTED', { id: wf.id, by: user.name });
  return wf;
}

function acknowledge(db, wfId, user, ctx) {
  const wf = db.workflows.find((w) => w.id === wfId);
  if (!wf || wf.status !== 'pending' || wf.type !== 'sensor_check') return null;
  step(wf, 'acknowledge', { status: 'done', by: user.name });
  wf.status = 'done'; db.stats.workflowsCompleted++;
  ctx.log('info', 'workflow', 'WORKFLOW_COMPLETED', { id: wf.id, by: user.name });
  return wf;
}

/* Verification: a running workflow completes when a fresh reading confirms the target condition. */
function tick(db, ctx) {
  const t = Date.now();
  for (const wf of db.workflows) {
    if (wf.status !== 'running') continue;
    const zone = db.zones.find((z) => z.id === wf.zoneId);
    const policy = POLICIES[zone?.crop] || POLICIES.tomato;
    const after = (db.readings[wf.zoneId] || []).filter((r) => Date.parse(r.ts) > Date.parse(wf.executedAt));
    const latest = after[after.length - 1];
    let ok = false;
    if (latest) {
      if (wf.type === 'irrigation') ok = latest.moisture != null && latest.moisture >= policy.moisture[0];
      if (wf.type === 'fertigation') ok = (wf.params.nutrients || []).every((n) => latest[n] == null || latest[n] >= policy[n]);
    }
    if (ok) {
      step(wf, 'verify', { status: 'done', by: 'agent', reading: latest.id });
      step(wf, 'completed', { status: 'done', by: 'agent' });
      wf.status = 'done'; wf.completedAt = now(); db.stats.workflowsCompleted++;
      ctx.log('info', 'workflow', 'WORKFLOW_COMPLETED', { id: wf.id, type: wf.type, zone: wf.zoneId });
    } else if (t > Date.parse(wf.verifyDeadline)) {
      step(wf, 'verify', { status: 'failed', by: 'agent' });
      wf.status = 'failed'; wf.updatedAt = now(); db.stats.workflowsFailed++;
      ctx.log('warn', 'workflow', 'WORKFLOW_FAILED', { id: wf.id, type: wf.type, zone: wf.zoneId, reason: 'verification_timeout' });
    }
  }
}

module.exports = { DEFS, syncDecisions, approve, reject, acknowledge, tick, findOpen };
