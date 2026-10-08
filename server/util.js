'use strict';
const crypto = require('crypto');

const id = (prefix = '') => prefix + crypto.randomBytes(8).toString('hex');
const now = () => new Date().toISOString();
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const minutesBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / 60000;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, salt, hash) {
  const computed = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return computed.length === stored.length && crypto.timingSafeEqual(computed, stored);
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

module.exports = { id, now, round, clamp, minutesBetween, hashPassword, verifyPassword, ApiError, str, isEmail };
