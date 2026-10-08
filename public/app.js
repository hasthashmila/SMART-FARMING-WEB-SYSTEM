/* AgriPulse — Smart Farming Web System (frontend). Vanilla JS, no build step. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LANGS = ['en', 'si', 'ta'];
  const LOCALE = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };
  const FIELDS = ['moisture', 'nitrogen', 'phosphorus', 'potassium', 'soilTemp', 'airTemp', 'humidity', 'ph', 'rainfall'];
  const UNITS = { moisture: '%', nitrogen: 'mg/kg', phosphorus: 'mg/kg', potassium: 'mg/kg', soilTemp: '°C', airTemp: '°C', humidity: '%', ph: '', rainfall: 'mm' };
  const ICONS = { moisture: '◒', nitrogen: 'N', phosphorus: 'P', potassium: 'K', soilTemp: '♨', airTemp: '☀', humidity: '☁', ph: '⌬', rainfall: '☂' };
  const DEC_ICON = { IRRIGATE: '💧', RAIN_HOLD_IRRIGATION: '🌧️', MOISTURE_HIGH: '🌊', NUTRIENT_LOW: '🌱', PH_LOW: '🧪', PH_HIGH: '🧪', HEAT_STRESS: '🔥', COLD_STRESS: '❄️', DISEASE_RISK: '🍃', RAIN_EVENT: '🌧️', DATA_QUALITY: '📡', STALE_DATA: '⏱️', SENSOR_OFFLINE: '📡', NO_DATA: '📡', HEALTHY: '✅' };
  const SEV_CLASS = { critical: 'crit', warning: 'warn', info: 'info', good: 'good' };
  const STATUS_CLASS = { optimal: 'good', attention: 'warn', critical: 'crit' };
  const STATUS_COLOR = { optimal: '#2d9561', attention: '#e5a135', critical: '#d9564a' };
  const PAGES = {
    farmer: ['dashboard', 'twin', 'analytics', 'agent', 'marketplace', 'export', 'evaluation', 'settings'],
    buyer: ['dashboard', 'marketplace', 'export', 'settings'],
  };
  const PAGE_ICON = { dashboard: '◫', twin: '◉', analytics: '⌁', agent: '✦', marketplace: '▣', export: '↗', evaluation: '◷', settings: '⚙' };

  const state = {
    lang: LANGS.includes(localStorage.getItem('agripulse-lang')) ? localStorage.getItem('agripulse-lang') : (navigator.language.startsWith('si') ? 'si' : navigator.language.startsWith('ta') ? 'ta' : 'en'),
    token: localStorage.getItem('agripulse-token') || '',
    user: null, page: 'dashboard', param: null, data: null, zone: 'A1', metric: 'moisture', hours: 24, readings: null,
    products: null, productMeta: {}, mine: false, filter: 'all', search: '', inquiries: null, orders: null, stages: [], docs: [],
    evaluation: null, devices: null, chat: [], sse: null, register: false, sseState: 'connecting', refreshTimer: null, marketStats: null,
  };

  /* ---------- i18n & formatting ---------- */
  const t = (key, params) => I18N.t(state.lang, key, params);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtNum = (n, d = 1) => (n == null || Number.isNaN(Number(n)) ? '—' : new Intl.NumberFormat(LOCALE[state.lang], { maximumFractionDigits: d }).format(Number(n)));
  const fmtVal = (f, v) => (v == null ? '—' : `${fmtNum(v, f === 'ph' ? 2 : 1)}${UNITS[f] ? ' ' + UNITS[f] : ''}`);
  const fmtMoney = (v, cur = 'USD') => new Intl.NumberFormat(LOCALE[state.lang], { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(Number(v || 0));
  const fmtDate = (ts, opts = { dateStyle: 'medium' }) => (ts ? new Intl.DateTimeFormat(LOCALE[state.lang], opts).format(new Date(ts)) : '—');
  const fmtTime = (ts) => (ts ? new Intl.DateTimeFormat(LOCALE[state.lang], { timeStyle: 'short' }).format(new Date(ts)) : '—');
  const fmtDateTime = (ts) => (ts ? new Intl.DateTimeFormat(LOCALE[state.lang], { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts)) : '—');
  function fmtRel(ts) {
    if (!ts) return '—';
    const diff = (Date.now() - Date.parse(ts)) / 1000;
    const abs = Math.abs(diff);
    const future = diff < 0;
    if (abs < 45) return t('common.justNow');
    const unit = abs < 3600 ? 'minutes' : abs < 86400 ? 'hours' : 'days';
    const n = Math.round(abs / (unit === 'minutes' ? 60 : unit === 'hours' ? 3600 : 86400));
    return t(future ? `common.in.${unit}` : `common.ago.${unit}`, { n: fmtNum(n, 0) });
  }
  const crop = (c) => t('crop.' + c);
  const metricName = (f) => t('metric.' + f);
  const zoneLabel = (z) => `${z.id} · ${crop(z.crop)}`;
  function decisionText(d) {
    const p = { ...d.params, crop: crop(d.crop), nutrients: (d.params.nutrients || []).map(metricName).join(', ') };
    return { title: t(`decision.${d.code}.title`, p), detail: t(`decision.${d.code}.detail`, p) };
  }
  const relation = (r) => t('relation.' + r);
  function evidenceList(d) {
    const rows = (d.evidence || []).map((e) => {
      const thr = Array.isArray(e.threshold) ? `${fmtNum(e.threshold[0], 2)}–${fmtNum(e.threshold[1], 2)}` : (typeof e.threshold === 'number' ? fmtNum(e.threshold, 2) : esc(e.threshold ?? '—'));
      const unit = UNITS[e.metric] || '';
      const val = e.value == null ? '—' : typeof e.value === 'number' ? fmtNum(e.value, 2) : e.metric === 'lastSeen' ? fmtDateTime(e.value) : esc(e.value);
      return `<li><span>${esc(I18N.has(state.lang, 'metric.' + e.metric) ? metricName(e.metric) : e.metric.replace(/_/g, ' '))}</span><span>${val}${unit} ${relation(e.relation)} ${thr}${unit}</span></li>`;
    });
    rows.push(`<li><span>${t('agent.rule')}</span><span>${esc(d.ruleId)} · ${t('agent.policy')}: ${crop(d.policy)}</span></li>`);
    rows.push(`<li><span>${t('agent.confidence')}</span><span>${fmtNum(d.confidence * 100, 0)}%</span></li>`);
    return `<ul class="evidence">${rows.join('')}</ul>`;
  }

  /* ---------- API ---------- */
  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    } catch { throw Object.assign(new Error(t('err.NETWORK')), { code: 'NETWORK' }); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = data.error?.code || 'SERVER_ERROR';
      if (code === 'UNAUTHENTICATED' && state.user) { signOutLocal(); }
      throw Object.assign(new Error(I18N.has(state.lang, 'err.' + code) ? t('err.' + code) : (data.error?.message || code)), { code });
    }
    return data;
  }

  /* ---------- UI helpers ---------- */
  let toastTimer;
  function toast(message, error = false) {
    const el = $('#toast');
    el.textContent = message; el.classList.toggle('error', error); el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }
  function openDialog(html, onSubmit) {
    const dlg = $('#dialog');
    dlg.innerHTML = html;
    const form = $('form', dlg);
    if (form && onSubmit) form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form); if (btn) btn.disabled = true;
      const err = $('.form-error', form); if (err) err.textContent = '';
      try { await onSubmit(form); dlg.close(); } catch (ex) { if (err) err.textContent = ex.message; else toast(ex.message, true); } finally { if (btn) btn.disabled = false; }
    };
    $$('[data-close]', dlg).forEach((b) => { b.onclick = () => dlg.close(); });
    dlg.showModal();
  }
  const badge = (cls, text) => `<span class="badge ${cls}">${text}</span>`;
  const statusBadge = (s) => badge(STATUS_CLASS[s] || '', `<i class="dot ${s}"></i>${t('status.' + s)}`);
  const empty = (title, text = '') => `<div class="empty"><b>${title}</b>${text}</div>`;
  const zoneById = (id) => state.data?.zones?.find((z) => z.id === id);
  function applyStatic() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $('#langSelect').value = state.lang; $('#authLang').value = state.lang;
  }
  function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    state.lang = lang; localStorage.setItem('agripulse-lang', lang);
    applyStatic(); renderAuthMode(); if (state.user) { renderChrome(); render(); api('/api/auth/me', { method: 'PATCH', body: { lang } }).catch(() => {}); }
  }

  /* ---------- Auth ---------- */
  function renderAuthMode() {
    const r = state.register;
    $('#authTitle').textContent = t(r ? 'auth.registerTitle' : 'auth.loginTitle');
    $('#authSubtitle').textContent = t(r ? 'auth.registerSubtitle' : 'auth.loginSubtitle');
    $('#authSubmit').textContent = t(r ? 'auth.createAccount' : 'auth.signIn');
    $('#authSwitch').textContent = t(r ? 'auth.haveAccount' : 'auth.newHere');
    $('#registerFields').hidden = !r; $('#authName').required = r;
    $('#authPassword').autocomplete = r ? 'new-password' : 'current-password';
    $('#authError').textContent = '';
  }
  function showAuth() { $('#auth').hidden = false; $('#app').hidden = true; renderAuthMode(); setTimeout(() => $('#authEmail').focus(), 50); }
  function signOutLocal() { state.user = null; state.token = ''; localStorage.removeItem('agripulse-token'); closeSse(); showAuth(); }
  async function enterApp(user, { fromLogin = false } = {}) {
    state.user = user;
    if ((fromLogin || state.forceLang) && user.lang !== state.lang) api('/api/auth/me', { method: 'PATCH', body: { lang: state.lang } }).catch(() => {});
    else if (user.lang && user.lang !== state.lang && LANGS.includes(user.lang)) { state.lang = user.lang; localStorage.setItem('agripulse-lang', user.lang); applyStatic(); }
    $('#auth').hidden = true; $('#app').hidden = false;
    renderChrome();
    await refreshData();
    route();
    openSse();
  }

  /* ---------- Live data ---------- */
  async function refreshData() {
    try { state.data = await api('/api/dashboard'); renderChrome(); } catch (e) { if (e.code !== 'UNAUTHENTICATED') toast(e.message, true); }
  }
  function openSse() {
    closeSse();
    const es = new EventSource('/api/events' + (state.token ? `?token=${encodeURIComponent(state.token)}` : ''));
    state.sse = es;
    es.onopen = () => setSse('online');
    es.onerror = () => setSse('offline');
    const bump = () => { clearTimeout(state.refreshTimer); state.refreshTimer = setTimeout(async () => { await refreshData(); await loadPage(true); render(); }, 400); };
    es.addEventListener('update', bump); es.addEventListener('ingest', bump); es.addEventListener('b2b', bump);
    es.addEventListener('log', bump);
  }
  function closeSse() { if (state.sse) { state.sse.close(); state.sse = null; } }
  function setSse(s) { state.sseState = s; const el = $('#liveBadge'); el.dataset.state = s; $('span', el).textContent = t('header.' + (s === 'online' ? 'live' : s === 'offline' ? 'offline' : 'connecting')); }

  /* ---------- Chrome (nav, header, menus) ---------- */
  function renderChrome() {
    const u = state.user; if (!u) return;
    const d = state.data;
    const pending = d?.workflows?.filter((w) => w.status === 'pending').length || 0;
    const openInq = d?.market?.openInquiries || 0;
    $('#nav').innerHTML = PAGES[u.role].map((p) => `<a href="#/${p}" class="${state.page === p ? 'active' : ''}"><i>${PAGE_ICON[p]}</i><span>${t('nav.' + p)}</span>${p === 'agent' && pending ? `<em>${pending}</em>` : ''}${p === 'export' && openInq ? `<em>${openInq}</em>` : ''}</a>`).join('');
    const hour = new Date().getHours();
    $('#greeting').textContent = t(hour < 12 ? 'header.morning' : hour < 17 ? 'header.afternoon' : 'header.evening', { name: u.name.split(' ')[0] });
    $('#pageTitle').textContent = t('nav.' + state.page);
    $('#profileBtn').textContent = u.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
    $('#profileBtn').title = `${u.name} · ${u.email}`;
    const alerts = d?.alerts || [];
    const unread = alerts.filter((a) => !a.read).length;
    $('#alertCount').hidden = !unread; $('#alertCount').textContent = unread;
    $('#alertsMenu').innerHTML = `<div class="menu-head"><span>${t('header.alerts')}</span>${alerts.length ? `<button class="link-btn" data-action="readAlerts">${t('header.markRead')}</button>` : ''}</div>` +
      (alerts.length ? alerts.slice(0, 8).map((a) => { const tx = decisionText({ ...a, crop: zoneById(a.zoneId)?.crop || 'tomato' }); return `<button class="menu-item" data-action="go" data-page="agent"><span>${DEC_ICON[a.code] || '⚠️'}</span><span><b>${esc(tx.title)}</b><p>${esc(tx.detail)}</p><small>${fmtRel(a.updatedAt)} · ${t('severity.' + a.severity)}</small></span></button>`; }).join('') : `<div class="menu-item"><p>${u.role === 'farmer' ? t('header.noAlerts') : t('header.noAlertsBuyer')}</p></div>`);
    $('#profileMenu').innerHTML = `<div class="menu-item head"><span class="avatar" style="width:34px;height:34px">${$('#profileBtn').textContent}</span><span><b>${esc(u.name)}</b><p>${esc(u.email)}</p><small>${t('role.' + u.role)}${u.company ? ' · ' + esc(u.company) : ''}</small></span></div>` +
      `<button class="menu-item" data-action="go" data-page="settings"><span>⚙</span><span><b>${t('nav.settings')}</b></span></button><button class="menu-item" data-action="logout"><span>⇥</span><span><b>${t('header.logout')}</b></span></button>`;
    const net = $('#netStatus');
    if (u.role === 'farmer' && d?.nodes) {
      const online = d.nodes.filter((n) => n.online).length;
      net.dataset.state = online === d.nodes.length ? 'online' : 'offline';
      $('#netDetail').textContent = t('sidebar.nodes', { online, total: d.nodes.length }) + (d.farm?.simulation ? ` · ${t('sidebar.simulated')}` : '');
    } else { net.dataset.state = 'online'; $('#netDetail').textContent = t('sidebar.marketplaceOnline'); }
  }

  /* ---------- Router ---------- */
  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [page, param] = hash.split('/');
    const allowed = PAGES[state.user.role];
    state.page = allowed.includes(page) ? page : allowed[0];
    state.param = param || null;
    if (!allowed.includes(page)) history.replaceState(null, '', '#/' + state.page);
    $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('show'); closeMenus();
    renderChrome();
    $('#view').innerHTML = '<div class="skeleton"></div>';
    loadPage().then(render).catch((e) => { $('#view').innerHTML = empty(t('common.loadFailed'), esc(e.message)); });
  }
  async function loadPage(silent = false) {
    const p = state.page;
    try {
      if (p === 'analytics') state.readings = await api(`/api/readings?zone=${encodeURIComponent(state.zone)}&hours=${state.hours}`);
      if (p === 'marketplace') { const r = await api(`/api/products${state.mine ? '?mine=1' : ''}`); state.products = r.products; state.productMeta = r; }
      if (p === 'export' || (p === 'dashboard' && state.user.role === 'buyer')) { const [i, o] = await Promise.all([api('/api/inquiries'), api('/api/orders')]); state.inquiries = i.inquiries; state.orders = o.orders; state.stages = o.stages; state.docs = o.documents; }
      if (p === 'evaluation') state.evaluation = await api('/api/evaluation');
      if (p === 'settings' && state.user.role === 'farmer') state.devices = await api('/api/devices');
    } catch (e) { if (!silent) throw e; }
  }
  function render() {
    const view = $('#view');
    const fn = { dashboard: renderDashboard, twin: renderTwin, analytics: renderAnalytics, agent: renderAgent, marketplace: renderMarketplace, export: renderExport, evaluation: renderEvaluation, settings: renderSettings }[state.page];
    view.innerHTML = fn ? fn() : '';
    if (state.page === 'agent') { const c = $('#chatLog'); if (c) c.scrollTop = c.scrollHeight; }
    if (state.page === 'export') { const m = $('#messages'); if (m) m.scrollTop = m.scrollHeight; }
  }

  /* ---------- Shared renderers ---------- */
  function zoneMap(zones, selected = null, compact = false) {
    const pos = { A1: { x: 40, y: 150, w: 210, h: 120 }, B2: { x: 300, y: 120, w: 240, h: 100 }, C3: { x: 190, y: 250, w: 250, h: 85 } };
    const plots = zones.map((z, i) => {
      const p = pos[z.id] || { x: 40 + i * 180, y: 150, w: 160, h: 100 };
      const col = STATUS_COLOR[z.status] || '#9db3a9';
      return `<g class="plot ${selected === z.id ? 'selected' : ''}" data-action="selectZone" data-zone="${z.id}" role="button" tabindex="0" aria-label="${esc(zoneLabel(z))}">
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="14" fill="${col}" opacity=".92"/>
        <rect x="${p.x + 8}" y="${p.y + 8}" width="${p.w - 16}" height="${p.h - 16}" rx="10" fill="none" stroke="#fff" stroke-opacity=".35" stroke-dasharray="6 6"/>
        <text x="${p.x + 16}" y="${p.y + 32}" font-size="20" font-weight="800" fill="#fff">${z.id}</text>
        <text x="${p.x + 16}" y="${p.y + 52}" font-size="12" fill="#fff" opacity=".95">${esc(crop(z.crop))}</text>
        <text x="${p.x + 16}" y="${p.y + p.h - 14}" font-size="11" fill="#fff" opacity=".9">${z.latest ? `◒ ${fmtNum(z.latest.moisture)}%` : '—'}</text>
        <circle cx="${p.x + p.w - 18}" cy="${p.y + 18}" r="6" fill="${z.node?.online ? '#c9f36b' : '#d9564a'}" stroke="#fff" stroke-width="2"/></g>`;
    }).join('');
    return `<svg class="zone-map" viewBox="0 0 600 ${compact ? 350 : 360}" role="img" aria-label="${t('twin.mapAria')}">
      <defs><linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cfe6fb"/><stop offset="1" stop-color="#e8f3d9"/></linearGradient><pattern id="rows" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="14" height="14" fill="#c5dea6"/><rect width="6" height="14" fill="#b6d492"/></pattern></defs>
      <rect width="600" height="360" rx="16" fill="url(#sky)"/><rect y="105" width="600" height="255" fill="url(#rows)"/>
      <circle cx="530" cy="48" r="22" fill="#ffd66b"/><ellipse cx="120" cy="52" rx="42" ry="16" fill="#fff" opacity=".85"/><ellipse cx="150" cy="44" rx="30" ry="14" fill="#fff" opacity=".85"/>
      <path d="M60 130 l30 -28 l30 28 z" fill="#c9784c"/><rect x="66" y="130" width="48" height="26" fill="#e8b98a"/><rect x="82" y="140" width="14" height="16" fill="#7b4a2b"/>
      <path d="M20 340 C 150 300, 300 330, 580 300" stroke="#3e8fd6" stroke-width="3" fill="none" stroke-dasharray="8 6"/>
      <text x="24" y="352" font-size="10" fill="#1c6753" font-weight="700">⌁ ${esc(t('twin.irrigationLine'))}</text>
      ${plots}</svg>`;
  }
  function recCard(d, { showActions = false } = {}) {
    const tx = decisionText(d);
    const wf = showActions && d.action ? state.data.workflows.find((w) => w.zoneId === d.zoneId && w.type === d.action.type && ['pending', 'running'].includes(w.status)) : null;
    let actions = '';
    if (showActions && wf) {
      if (wf.status === 'pending' && wf.type !== 'sensor_check') actions = `<div class="btn-row"><button class="btn primary small" data-action="wf" data-id="${wf.id}" data-op="approve">✓ ${t('wf.approve')}</button><button class="btn outline small" data-action="wf" data-id="${wf.id}" data-op="reject">${t('wf.reject')}</button></div>`;
      else if (wf.status === 'pending') actions = `<div class="btn-row"><button class="btn primary small" data-action="wf" data-id="${wf.id}" data-op="acknowledge">✓ ${t('wf.acknowledge')}</button></div>`;
      else actions = `<div class="btn-row">${badge('warn', t('wf.status.running'))}</div>`;
    }
    return `<div class="rec ${SEV_CLASS[d.severity]}"><span class="rec-icon">${DEC_ICON[d.code] || '•'}</span><div style="flex:1;min-width:0"><b>${esc(tx.title)}</b><p>${esc(tx.detail)}</p>
      <div class="meta">${badge(SEV_CLASS[d.severity], t('severity.' + d.severity))}${badge('', d.zoneId)}${d.action && d.action.type !== 'cancel_irrigation' ? badge('info', t('wf.type.' + d.action.type)) : ''}</div>
      <details><summary>✦ ${t('agent.why')}</summary>${evidenceList(d)}</details>${actions}</div></div>`;
  }
  const logLine = (l) => {
    const meta = { ...l.meta, errors: Array.isArray(l.meta?.errors) ? l.meta.errors.join(', ') : '' , stage: l.meta?.stage ? t('stage.' + l.meta.stage) : '', type: l.meta?.type ? t('wf.type.' + l.meta.type) : '', decision: l.meta?.decision ? decisionText({ code: l.meta.decision, params: {}, crop: 'tomato' }).title : '', code: l.meta?.code ? decisionText({ code: l.meta.code, params: {}, crop: 'tomato' }).title : '' };
    return I18N.has(state.lang, 'log.' + l.code) ? t('log.' + l.code, meta) : l.code;
  };
  const LOG_ICON = { workflow: '⚙', data: '⌁', agent: '✦', network: '📡', b2b: '▣', auth: '👤', system: '◫', simulator: '🧪' };

  /* ---------- Pages ---------- */
  function renderDashboard() {
    const d = state.data; if (!d) return '';
    if (state.user.role === 'buyer') return renderBuyerDashboard();
    const zones = d.zones;
    const crit = zones.filter((z) => z.status === 'critical').length, warn = zones.filter((z) => z.status === 'attention').length, ok = zones.filter((z) => z.status === 'optimal').length;
    const heroTitle = crit ? t('dash.heroCritical', { n: crit }) : warn ? t('dash.heroAttention', { n: warn }) : t('dash.heroGood');
    const latest = zones.map((z) => z.latest).filter(Boolean);
    const avg = (f) => latest.length ? latest.reduce((s, r) => s + (r[f] ?? 0), 0) / latest.filter((r) => r[f] != null).length : null;
    const tiles = FIELDS.filter((f) => f !== 'soilTemp').slice(0, 8).map((f) => {
      const out = zones.filter((z) => z.latest && outOfRange(z, f)).length;
      return metricTile(ICONS[f], metricName(f), fmtNum(avg(f), f === 'ph' ? 2 : 1), UNITS[f], out ? t('dash.zonesOut', { n: out }) : t('dash.allInRange'), out ? 'warn' : 'good');
    }).join('');
    const decisions = d.decisions.filter((x) => x.severity !== 'good').slice(0, 4);
    const pending = d.workflows.filter((w) => w.status === 'pending');
    return `<section class="hero"><div><p class="eyebrow">${esc(d.farm.name)} · ${esc(d.farm.location)}</p><h2>${esc(heroTitle)}</h2><p class="lead">${esc(t('dash.heroText', { ok, total: zones.length, pending: pending.length }))}</p><a class="btn primary" href="#/agent">${t('dash.reviewActions')} →</a></div>
      <div class="hero-side"><div class="stat"><b>${fmtNum(avg('airTemp'))}°C</b><span>${metricName('airTemp')}</span></div><div class="stat"><b>${fmtNum(avg('humidity'), 0)}%</b><span>${metricName('humidity')}</span></div><div class="stat"><b>${fmtNum(latest.reduce((s, r) => s + (r.rainfall || 0), 0))} mm</b><span>${metricName('rainfall')}</span></div></div></section>
      <div class="metrics">${tiles}</div>
      <div class="grid two">
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('dash.twinEyebrow')}</p><h3>${t('dash.fieldConditions')}</h3></div><a class="link-btn" href="#/twin">${t('dash.viewTwin')} →</a></div>${zoneMap(zones, null, true)}<div class="legend"><span><i class="dot optimal"></i>${t('status.optimal')}</span><span><i class="dot attention"></i>${t('status.attention')}</span><span><i class="dot critical"></i>${t('status.critical')}</span><span><i class="dot" style="background:#c9f36b"></i>${t('twin.nodeOnline')}</span></div></article>
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('dash.aiEyebrow')}</p><h3>${t('dash.todayRecommendations')}</h3></div><a class="link-btn" href="#/agent">${t('common.seeAll')} →</a></div><div class="list">${decisions.length ? decisions.map((x) => recCard(x)).join('') : recCard(d.decisions.find((x) => x.code === 'HEALTHY') || { code: 'HEALTHY', severity: 'good', params: {}, evidence: [], crop: 'tomato', zoneId: '—', ruleId: '—', policy: 'tomato', confidence: 1 })}</div></article>
      </div>
      <div class="grid three mt">
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('dash.workflowEyebrow')}</p><h3>${t('dash.workflowQueue')}</h3></div>${pending.length ? badge('warn', t('dash.pendingCount', { n: pending.length })) : badge('good', t('dash.queueClear'))}</div>
          ${d.workflows.slice(0, 4).map((w) => `<div class="activity-row"><span class="activity-icon"><i class="dot ${w.status}"></i></span><div><b>${t('wf.type.' + w.type)} · ${w.zoneId}</b><p>${t('wf.status.' + w.status)}</p><small>${fmtRel(w.updatedAt)}</small></div></div>`).join('') || empty(t('wf.none'))}</article>
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('dash.activityEyebrow')}</p><h3>${t('dash.fieldUpdates')}</h3></div></div>
          ${d.logs.slice(0, 5).map((l) => `<div class="activity-row"><span class="activity-icon">${LOG_ICON[l.category] || '•'}</span><div><b>${esc(logLine(l))}</b><p>${t('log.category.' + l.category)}</p><small>${fmtRel(l.ts)}</small></div></div>`).join('')}</article>
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('dash.marketEyebrow')}</p><h3>${t('dash.marketSignal')}</h3></div>${d.market.openInquiries ? badge('warn', t('dash.openInquiries', { n: d.market.openInquiries })) : ''}</div>
          <div class="kv"><div><span>${t('market.activeListings')}</span><b>${d.market.myProducts}</b></div><div><span>${t('export.openInquiries')}</span><b>${d.market.openInquiries}</b></div><div><span>${t('export.activeOrders')}</span><b>${d.market.activeOrders}</b></div></div>
          ${d.market.latestInquiry ? `<p class="small muted mt">${esc(t('dash.latestInquiry', { company: d.market.latestInquiry.buyerCompany || d.market.latestInquiry.buyerName, product: d.market.latestInquiry.productName }))}</p>` : ''}
          <div class="btn-row mt"><a class="btn outline small" href="#/export">${t('dash.openExport')}</a><a class="btn ghost small" href="#/marketplace">${t('nav.marketplace')}</a></div></article>
      </div>`;
  }
  function outOfRange(z, f) {
    const p = z.policy, v = z.latest?.[f]; if (v == null) return false;
    if (Array.isArray(p[f])) return v < p[f][0] || v > p[f][1];
    if (f === 'humidity') return v > p.humidityMax;
    if (['nitrogen', 'phosphorus', 'potassium'].includes(f)) return v < p[f];
    return false;
  }
  const metricTile = (icon, label, value, unit, note, cls = '') => `<article class="metric"><div class="metric-top"><span class="metric-icon">${icon}</span><small>${esc(label)}</small></div><b>${value}<sub>${unit}</sub></b><p class="${cls}">${esc(note)}</p></article>`;

  function renderBuyerDashboard() {
    const d = state.data;
    const orders = state.orders || d.orders || [];
    const inqs = state.inquiries || [];
    return `<section class="hero"><div><p class="eyebrow">${esc(state.user.company || t('role.buyer'))}</p><h2>${esc(t('dash.buyerHero'))}</h2><p class="lead">${esc(t('dash.buyerText', { products: d.market.products }))}</p><a class="btn primary" href="#/marketplace">${t('dash.browseMarket')} →</a></div>
      <div class="hero-side"><div class="stat"><b>${d.market.products}</b><span>${t('market.activeListings')}</span></div><div class="stat"><b>${d.market.openInquiries}</b><span>${t('export.openInquiries')}</span></div><div class="stat"><b>${d.market.activeOrders}</b><span>${t('export.activeOrders')}</span></div></div></section>
      <div class="grid two mt"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('export.inquiriesEyebrow')}</p><h3>${t('export.myInquiries')}</h3></div><a class="link-btn" href="#/export">${t('common.seeAll')} →</a></div>
        ${inqs.length ? inqs.slice(0, 4).map((i) => `<div class="activity-row"><span class="activity-icon">▣</span><div><b>${esc(i.productName)}</b><p>${esc(i.messages[i.messages.length - 1]?.text?.replace(/^__QUOTE__.*/, t('export.quoteCreated')) || '')}</p><small>${fmtRel(i.updatedAt)} · ${t('inquiry.status.' + i.status)}</small></div></div>`).join('') : empty(t('export.noInquiries'), t('export.noInquiriesBuyer'))}</article>
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('export.ordersEyebrow')}</p><h3>${t('export.myOrders')}</h3></div></div>
        ${orders.length ? orders.slice(0, 4).map((o) => `<div class="activity-row"><span class="activity-icon">↗</span><div><b>${esc(o.ref)} · ${esc(o.productName)}</b><p>${t('stage.' + (state.stages[o.stage] || 'inquiry'))} · ${fmtNum(o.quantity, 0)} ${o.unit}</p><small>${fmtRel(o.updatedAt)}</small></div></div>`).join('') : empty(t('export.noOrders'))}</article></div>`;
  }

  function renderTwin() {
    const d = state.data; const z = zoneById(state.zone) || d.zones[0]; if (!z) return empty(t('twin.noZones'));
    state.zone = z.id;
    const top = z.decisions[0];
    const rows = FIELDS.map((f) => { const p = z.policy; const v = z.latest?.[f]; const out = outOfRange(z, f);
      const range = Array.isArray(p[f]) ? `${p[f][0]}–${p[f][1]}` : f === 'humidity' ? `≤ ${p.humidityMax}` : ['nitrogen', 'phosphorus', 'potassium'].includes(f) ? `≥ ${p[f]}` : '—';
      return `<div><span>${ICONS[f]} ${metricName(f)} <small class="muted">(${range}${UNITS[f]})</small></span><b class="${v == null ? '' : out ? 'warn' : 'good'}">${fmtVal(f, v)}</b></div>`; }).join('');
    return `<div class="section-intro"><div><p class="eyebrow">${t('dash.twinEyebrow')}</p><h2>${t('twin.title')}</h2><p class="lead">${t('twin.text')}</p></div><div class="tools">${badge('good', `↻ ${t('twin.updated')} ${z.latest ? fmtRel(z.latest.ts) : '—'}`)}</div></div>
      <div class="chips" style="margin-bottom:16px">${d.zones.map((x) => `<button class="chip ${x.id === z.id ? 'active' : ''}" data-action="selectZone" data-zone="${x.id}"><i class="dot ${x.status}"></i>${esc(zoneLabel(x))}</button>`).join('')}</div>
      <div class="grid sidebar-right"><article class="card" style="padding:10px">${zoneMap(d.zones, z.id)}<div class="legend" style="padding:6px 8px 4px"><span><i class="dot optimal"></i>${t('status.optimal')}</span><span><i class="dot attention"></i>${t('status.attention')}</span><span><i class="dot critical"></i>${t('status.critical')}</span><span>${t('twin.clickZone')}</span></div></article>
      <div class="stack"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('twin.selectedZone')}</p><h3>${esc(zoneLabel(z))}</h3></div>${statusBadge(z.status)}</div>
        <div class="kv"><div><span>${t('twin.area')}</span><b>${fmtNum(z.area, 2)} ha</b></div><div><span>${t('twin.planted')}</span><b>${fmtDate(z.planted)}</b></div><div><span>${t('twin.node')}</span><b class="${z.node.online ? 'good' : 'crit'}">${esc(z.node.label || z.node.id)} · ${z.node.online ? t('twin.online') : t('twin.offline')}</b></div><div><span>${t('twin.lastSeen')}</span><b>${fmtRel(z.node.lastSeen)}</b></div></div>
        <svg class="spark" viewBox="0 0 200 34" preserveAspectRatio="none">${spark(z.spark)}</svg><p class="small muted">${t('twin.sparkNote')}</p></article>
        <article class="card"><p class="eyebrow">${t('twin.readings')}</p><div class="kv">${rows}</div></article>
        <article class="card"><p class="eyebrow">✦ ${t('twin.aiAdvice')}</p>${top ? recCard(top) : ''}<div class="btn-row mt"><a class="btn primary small" href="#/agent">${t('twin.openAgent')}</a>${d.farm.simulation ? `<select class="inline-select" id="presetSelect" aria-label="${t('twin.simulate')}"><option value="">${t('twin.simulate')}…</option>${['dry', 'rain', 'heat', 'nutrient_drop', 'acidic', 'normal'].map((p) => `<option value="${p}">${t('preset.' + p)}</option>`).join('')}</select><button class="btn outline small" data-action="simulate">${t('twin.newReading')}</button>` : badge('info', t('twin.liveHardware'))}</div></article></div></div>`;
  }
  function spark(values = []) {
    if (!values.length) return '';
    const min = Math.min(...values) - 1, max = Math.max(...values) + 1;
    const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 200},${32 - ((v - min) / (max - min)) * 28}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="#24935d" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  }

  function renderAnalytics() {
    const r = state.readings; const d = state.data; if (!r) return '';
    const z = zoneById(r.zoneId);
    const vals = r.readings.map((x) => x[state.metric]).filter((v) => v != null);
    const st = r.stats[state.metric];
    const m = d.metrics;
    return `<div class="section-intro"><div><p class="eyebrow">${t('nav.analytics')}</p><h2>${t('analytics.title')}</h2><p class="lead">${t('analytics.text')}</p></div>
      <div class="tools filters"><select id="zoneSelect" class="inline-select" data-action="zoneChange">${d.zones.map((x) => `<option value="${x.id}" ${x.id === r.zoneId ? 'selected' : ''}>${esc(zoneLabel(x))}</option>`).join('')}</select>
        <select id="metricSelect" class="inline-select" data-action="metricChange">${FIELDS.map((f) => `<option value="${f}" ${f === state.metric ? 'selected' : ''}>${esc(metricName(f))}</option>`).join('')}</select>
        <select id="hoursSelect" class="inline-select" data-action="hoursChange">${[6, 24, 72].map((h) => `<option value="${h}" ${h === state.hours ? 'selected' : ''}>${t('analytics.lastHours', { h })}</option>`).join('')}</select>
        <a class="btn outline small" href="/api/readings.csv?zone=${encodeURIComponent(r.zoneId)}" download>⤓ CSV</a></div></div>
      <article class="card"><div class="chart-top"><div><h3>${esc(metricName(state.metric))} · ${esc(z ? zoneLabel(z) : r.zoneId)}</h3><p class="muted">${t('analytics.currentValue')}: <strong>${fmtVal(state.metric, vals[vals.length - 1])}</strong></p></div>
        ${st ? `<div class="chips"><span class="badge">${t('analytics.min')} ${fmtVal(state.metric, st.min)}</span><span class="badge">${t('analytics.avg')} ${fmtVal(state.metric, st.avg)}</span><span class="badge">${t('analytics.max')} ${fmtVal(state.metric, st.max)}</span><span class="badge info">${t('analytics.samples', { n: vals.length })}</span></div>` : ''}</div>
        <div class="chart-wrap">${chart(r.readings, state.metric, z)}</div></article>
      <div class="metrics"><article class="metric compact"><div class="metric-top"><span class="metric-icon">📡</span><small>${t('eval.sensorIntegration')}</small></div><b>${fmtNum(m.sensorIntegration.value)}<sub>%</sub></b><p class="${m.sensorIntegration.value >= 95 ? 'good' : 'warn'}">${t('analytics.received', m.sensorIntegration.detail)}</p></article>
        <article class="metric compact"><div class="metric-top"><span class="metric-icon">✓</span><small>${t('eval.dataQuality')}</small></div><b>${fmtNum(m.dataQuality.value)}<sub>%</sub></b><p class="${m.dataQuality.value >= 90 ? 'good' : 'warn'}">${t('analytics.rejected', { n: m.dataQuality.detail.rejected })}</p></article>
        <article class="metric compact"><div class="metric-top"><span class="metric-icon">⚙</span><small>${t('eval.workflowAutomation')}</small></div><b>${fmtNum(m.workflowAutomation.value)}<sub>%</sub></b><p class="good">${t('analytics.workflows', m.workflowAutomation.detail)}</p></article>
        <article class="metric compact"><div class="metric-top"><span class="metric-icon">◒</span><small>${t('analytics.completeness')}</small></div><b>${fmtNum(r.readings.length ? r.readings.reduce((s, x) => s + x.completeness, 0) / r.readings.length * 100 : 0)}<sub>%</sub></b><p class="muted">${t('analytics.completenessNote')}</p></article></div>
      <div class="grid two"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('analytics.statsEyebrow')}</p><h3>${t('analytics.stats', { h: r.hours })}</h3></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${t('analytics.parameter')}</th><th>${t('analytics.min')}</th><th>${t('analytics.avg')}</th><th>${t('analytics.max')}</th></tr></thead><tbody>
        ${FIELDS.map((f) => { const s = r.stats[f]; return `<tr><td>${ICONS[f]} ${esc(metricName(f))}</td><td class="num">${s ? fmtVal(f, s.min) : '—'}</td><td class="num">${s ? fmtVal(f, s.avg) : '—'}</td><td class="num">${s ? fmtVal(f, s.max) : '—'}</td></tr>`; }).join('')}</tbody></table></div></article>
      <article class="card"><div class="card-head"><div><p class="eyebrow">${t('analytics.ingestEyebrow')}</p><h3>${t('analytics.ingestLog')}</h3></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${t('common.time')}</th><th>${t('twin.node')}</th><th>${t('common.status')}</th><th>${t('analytics.detail')}</th></tr></thead><tbody>
        ${r.ingestLog.slice(0, 14).map((e) => `<tr><td>${fmtTime(e.ts)}</td><td>${esc(e.nodeId)}</td><td>${badge(e.status === 'accepted' ? 'good' : 'crit', t('ingest.' + e.status))}</td><td>${e.status === 'accepted' ? t('analytics.completenessVal', { n: fmtNum(e.completeness * 100, 0) }) : esc((e.errors || []).map((x) => `${metricName(x.field) === 'metric.' + x.field ? x.field : (I18N.has(state.lang, 'metric.' + x.field) ? metricName(x.field) : x.field)}: ${t('validation.' + x.code)}${x.value != null ? ` (${x.value})` : ''}`).join('; '))}</td></tr>`).join('') || `<tr><td colspan="4">${t('analytics.noIngest')}</td></tr>`}</tbody></table></div></article></div>`;
  }
  function chart(readings, field, zone) {
    const pts = readings.filter((r) => r[field] != null);
    if (pts.length < 2) return `<div class="empty">${t('analytics.noData')}</div>`;
    const W = 760, H = 260, L = 44, R = 16, T = 14, B = 34;
    const xs = pts.map((r) => Date.parse(r.ts)); const ys = pts.map((r) => r[field]);
    const x0 = xs[0], x1 = xs[xs.length - 1];
    let lo = Math.min(...ys), hi = Math.max(...ys);
    const p = zone?.policy; const band = p && Array.isArray(p[field]) ? p[field] : null;
    if (band) { lo = Math.min(lo, band[0]); hi = Math.max(hi, band[1]); }
    const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad;
    const X = (x) => L + ((x - x0) / Math.max(1, x1 - x0)) * (W - L - R);
    const Y = (y) => T + (1 - (y - lo) / (hi - lo)) * (H - T - B);
    const line = pts.map((r, i) => `${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(' ');
    const grid = [0, .25, .5, .75, 1].map((f) => { const y = T + f * (H - T - B); const v = hi - f * (hi - lo); return `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#e7eee9"/><text x="${L - 6}" y="${y + 3}" text-anchor="end">${fmtNum(v, field === 'ph' ? 1 : 0)}</text>`; }).join('');
    const ticks = 6; const labels = Array.from({ length: ticks + 1 }, (_, i) => { const x = x0 + (i / ticks) * (x1 - x0); return `<text x="${X(x)}" y="${H - 10}" text-anchor="middle">${fmtTime(new Date(x).toISOString())}</text>`; }).join('');
    const bandRect = band ? `<rect x="${L}" y="${Y(band[1])}" width="${W - L - R}" height="${Math.max(0, Y(band[0]) - Y(band[1]))}" fill="#42ad68" opacity=".1"/><text x="${W - R - 4}" y="${Y(band[1]) - 4}" text-anchor="end" fill="#2d8a57">${t('analytics.policyRange')}</text>` : '';
    const step = Math.max(1, Math.floor(pts.length / 40));
    const dots = pts.map((r, i) => (i % step === 0 || i === pts.length - 1) ? `<circle cx="${X(xs[i])}" cy="${Y(ys[i])}" r="3" fill="#fff" stroke="#24935d" stroke-width="2"><title>${fmtDateTime(r.ts)} · ${fmtVal(field, ys[i])}</title></circle>` : '').join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#4cad6d" stop-opacity=".25"/><stop offset="1" stop-color="#4cad6d" stop-opacity="0"/></linearGradient></defs>${grid}${bandRect}<polygon points="${X(x0)},${H - B} ${line} ${X(x1)},${H - B}" fill="url(#cg)"/><polyline points="${line}" fill="none" stroke="#24935d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}</svg>`;
  }

  function renderAgent() {
    const d = state.data; if (!d) return '';
    const byZone = d.zones.map((z) => ({ z, list: z.decisions }));
    const open = d.workflows.filter((w) => ['pending', 'running'].includes(w.status));
    const recent = d.workflows.filter((w) => !['pending', 'running'].includes(w.status)).slice(0, 6);
    const wfCard = (w) => { const steps = w.steps; const dec = decisionText({ ...w.decision, crop: zoneById(w.zoneId)?.crop || 'tomato', zoneId: w.zoneId });
      return `<div class="wf"><div class="wf-head"><div><b>${t('wf.type.' + w.type)} · ${w.zoneId}</b><small>${esc(dec.title)} · ${fmtRel(w.createdAt)}</small></div>${badge(w.status === 'done' ? 'good' : w.status === 'pending' ? 'warn' : w.status === 'running' ? 'info' : ['failed', 'rejected', 'cancelled'].includes(w.status) ? 'crit' : '', t('wf.status.' + w.status))}</div>
        <div class="steps">${steps.map((s) => `<div class="step ${s.status === 'done' ? 'done' : s.status === 'failed' || s.status === 'rejected' ? s.status : (w.status === 'running' || w.status === 'pending') && steps.find((x) => x.status !== 'done') === s ? 'current' : ''}"><i></i><span>${t('wf.step.' + s.key)}</span></div>`).join('')}</div>
        ${w.approvedBy ? `<p class="small muted">${t('wf.approvedBy', { name: w.approvedBy })}${w.steps.find((s) => s.key === 'execute')?.command ? ` · ${t('wf.command')}: <span class="key">${esc(w.steps.find((s) => s.key === 'execute').command.topic)}</span>` : ''}</p>` : ''}
        ${w.status === 'pending' && w.type !== 'sensor_check' ? `<div class="btn-row"><button class="btn primary small" data-action="wf" data-id="${w.id}" data-op="approve">✓ ${t('wf.approve')}</button><button class="btn outline small" data-action="wf" data-id="${w.id}" data-op="reject">${t('wf.reject')}</button></div>` : w.status === 'pending' ? `<div class="btn-row"><button class="btn primary small" data-action="wf" data-id="${w.id}" data-op="acknowledge">✓ ${t('wf.acknowledge')}</button></div>` : ''}</div>`; };
    return `<div class="section-intro"><div><p class="eyebrow">${t('dash.aiEyebrow')}</p><h2>${t('agent.title')}</h2><p class="lead">${t('agent.text')}</p></div>
      <div class="tools"><span class="badge info">✦ ${t('agent.explainable')}</span><label class="switch" style="border:0;padding:0;gap:8px"><span class="small"><b>${t('agent.autonomous')}</b></span><button class="toggle" role="switch" aria-checked="${d.farm.autonomous}" data-action="toggleFarm" data-key="autonomous" aria-label="${t('agent.autonomous')}"></button></label></div></div>
      <div class="grid sidebar-right"><div class="stack">${byZone.map(({ z, list }) => `<article class="card"><div class="card-head"><div><p class="eyebrow">${t('twin.selectedZone')}</p><h3>${esc(zoneLabel(z))}</h3></div>${statusBadge(z.status)}</div><div class="list">${list.map((x) => recCard(x, { showActions: true })).join('')}</div></article>`).join('')}
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('assistant.eyebrow')}</p><h3>${t('assistant.title')}</h3></div><span class="badge">NLP · en / සිං / தமிழ்</span></div>
          <div class="chat" id="chatLog">${state.chat.length ? state.chat.map((m) => `<div class="msg ${m.role === 'user' ? 'mine' : 'bot'}">${esc(m.text)}</div>`).join('') : `<div class="msg bot">${esc(t('assistant.welcome'))}</div>`}</div>
          <div class="suggest">${['irrigation', 'nutrients', 'market', 'workflow'].map((i) => `<button data-action="chatSuggest" data-text="${esc(t('assistant.suggest.' + i))}">${esc(t('assistant.suggest.' + i))}</button>`).join('')}</div>
          <form class="composer" data-action="chat"><input id="chatInput" maxlength="300" placeholder="${esc(t('assistant.placeholder'))}" autocomplete="off"><button class="btn primary" type="submit">${t('assistant.send')}</button></form></article></div>
      <div class="stack"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('dash.workflowEyebrow')}</p><h3>${t('agent.openWorkflows')}</h3></div>${badge(open.length ? 'warn' : 'good', open.length)}</div><div class="list">${open.length ? open.map(wfCard).join('') : empty(t('wf.none'), t('wf.noneText'))}</div></article>
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('agent.historyEyebrow')}</p><h3>${t('agent.recentWorkflows')}</h3></div></div><div class="list">${recent.length ? recent.map(wfCard).join('') : empty(t('wf.none'))}</div></article></div></div>`;
  }

  function renderMarketplace() {
    const list = (state.products || []).filter((p) => (state.filter === 'all' || p.category === state.filter) && (!state.search || `${p.name} ${p.market} ${p.sellerCompany || ''} ${p.description || ''}`.toLowerCase().includes(state.search.toLowerCase())));
    const isFarmer = state.user.role === 'farmer';
    const card = (p) => { const own = p.ownerId === state.user.id; return `<article class="card product"><div class="product-image">${p.live ? badge(STATUS_CLASS[p.live.status], `<i class="dot ${p.live.status}"></i>${t('market.liveFarm')}`) : badge('', t('market.verifiedFarm'))}${badge('dark grade', t('market.grade') + ' ' + p.grade)}<span aria-hidden="true">${p.emoji || '🌱'}</span></div>
      <div class="product-body"><h3>${esc(p.name)}</h3><div class="price">${fmtMoney(p.price, p.currency)} <small>/ ${p.unit}</small></div>
        <div class="product-meta"><span>📍 ${esc(p.market)} · ${fmtNum(p.quantity, 0)} ${p.unit}</span><span>🏷 ${t('cat.' + p.category)}${p.certifications.length ? ' · ' + p.certifications.map((c) => t('cert.' + c)).join(', ') : ''}</span><span>🌾 ${esc(p.sellerCompany || p.sellerName || '')} · ${esc(p.farmLocation || '')}</span>${p.harvestDate ? `<span>📅 ${t('market.harvest')}: ${fmtDate(p.harvestDate)}</span>` : ''}${p.live ? `<span>◒ ${t('market.liveMoisture', { zone: p.live.zoneId, v: fmtNum(p.live.moisture) })} · ${fmtRel(p.live.ts)}</span>` : ''}</div>
        ${p.description ? `<p class="small muted">${esc(p.description)}</p>` : ''}${p.status === 'archived' ? badge('', t('market.archived')) : ''}
        <div class="btn-row">${own ? `<button class="btn outline small" data-action="editProduct" data-id="${p.id}">✎ ${t('common.edit')}</button>${p.status === 'active' ? `<button class="btn ghost small" data-action="archiveProduct" data-id="${p.id}">${t('market.archive')}</button>` : `<button class="btn ghost small" data-action="restoreProduct" data-id="${p.id}">${t('market.restore')}</button>`}` : `<button class="btn primary small" data-action="inquire" data-id="${p.id}">✉ ${t('market.sendInquiry')}</button>`}</div></div></article>`; };
    return `<div class="section-intro"><div><p class="eyebrow">${t('nav.marketplace')}</p><h2>${t('market.title')}</h2><p class="lead">${t('market.text')}</p></div><div class="tools">${isFarmer ? `<button class="btn primary" data-action="newProduct">+ ${t('market.createListing')}</button>` : ''}</div></div>
      <div class="filters"><button class="chip ${state.filter === 'all' ? 'active' : ''}" data-action="filter" data-filter="all">${t('market.all')}</button>${(state.productMeta.categories || []).map((c) => `<button class="chip ${state.filter === c ? 'active' : ''}" data-action="filter" data-filter="${c}">${t('cat.' + c)}</button>`).join('')}${isFarmer ? `<button class="chip ${state.mine ? 'active' : ''}" data-action="toggleMine">${t('market.myListings')}</button>` : ''}
        <label class="search">⌕<input id="productSearch" value="${esc(state.search)}" placeholder="${esc(t('market.search'))}" data-action="search"></label></div>
      <div class="product-grid">${list.length ? list.map(card).join('') : `<div class="empty" style="grid-column:1/-1"><b>${t('market.noProducts')}</b>${t('market.noProductsText')}</div>`}</div>`;
  }
  function productForm(p = {}) {
    const zones = state.data?.zones || [];
    const meta = state.productMeta;
    return `<form class="form"><button type="button" class="close" data-close aria-label="${t('common.close')}">×</button><p class="eyebrow">${t('nav.marketplace')}</p><h2>${p.id ? t('market.editListing') : t('market.createListing')}</h2><p class="muted small">${t('market.formText')}</p>
      <label>${t('market.productName')}<input name="name" required maxlength="80" value="${esc(p.name || '')}"></label>
      <div class="row"><label>${t('market.category')}<select name="category">${(meta.categories || []).map((c) => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${t('cat.' + c)}</option>`).join('')}</select></label><label>${t('market.grade')}<select name="grade">${['A', 'B', 'C'].map((g) => `<option ${p.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label></div>
      <div class="row"><label>${t('market.quantity')}<input name="quantity" type="number" min="1" step="1" required value="${esc(p.quantity ?? '')}"></label><label>${t('market.unit')}<select name="unit">${(meta.units || ['kg']).map((u) => `<option ${p.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label></div>
      <div class="row"><label>${t('market.price')}<input name="price" type="number" min="0.01" step="0.01" required value="${esc(p.price ?? '')}"></label><label>${t('market.currency')}<select name="currency">${(meta.currencies || ['USD']).map((u) => `<option ${p.currency === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label></div>
      <div class="row"><label>${t('market.targetMarket')}<input name="market" required maxlength="80" value="${esc(p.market || '')}" placeholder="Dubai, UAE"></label><label>${t('market.harvest')}<input name="harvestDate" type="date" value="${esc(p.harvestDate || '')}"></label></div>
      <label>${t('market.linkedZone')}<select name="zoneId"><option value="">${t('market.noZone')}</option>${zones.map((z) => `<option value="${z.id}" ${p.zoneId === z.id ? 'selected' : ''}>${esc(zoneLabel(z))}</option>`).join('')}</select></label>
      <div><span class="small" style="font-weight:700;color:#426457">${t('market.certifications')}</span><div class="checks" style="margin-top:6px">${(meta.certifications || []).map((c) => `<label><input type="checkbox" name="cert" value="${c}" ${(p.certifications || []).includes(c) ? 'checked' : ''}>${t('cert.' + c)}</label>`).join('')}</div></div>
      <label>${t('market.description')}<textarea name="description" maxlength="400">${esc(p.description || '')}</textarea></label>
      <p class="form-error"></p><div class="btn-row"><button type="button" class="btn ghost" data-close>${t('common.cancel')}</button><button class="btn primary" type="submit">${p.id ? t('common.save') : t('market.publish')}</button></div></form>`;
  }

  function renderExport() {
    const inqs = state.inquiries || [], orders = state.orders || [];
    const me = state.user.id;
    const active = inqs.find((i) => i.id === state.param) || inqs[0];
    const thread = active ? `<div class="card-head"><div><p class="eyebrow">${active.buyerId === me ? t('export.seller') : t('export.buyer')}</p><h3>${esc(active.buyerId === me ? active.sellerName : (active.buyerCompany || active.buyerName))}</h3><p class="small muted">${esc(active.productName)}${active.quantity ? ` · ${fmtNum(active.quantity, 0)} kg` : ''} · ${t('inquiry.status.' + active.status)}</p></div><div class="btn-row">${active.status === 'open' && active.sellerId === me ? `<button class="btn primary small" data-action="convert" data-id="${active.id}">↗ ${t('export.convertOrder')}</button>` : ''}${active.status === 'open' ? `<button class="btn ghost small" data-action="closeInquiry" data-id="${active.id}">${t('export.close')}</button>` : ''}</div></div>
      <div class="messages" id="messages">${active.messages.map((m) => m.system ? `<div class="msg system">${esc(t('export.quoteCreated'))} · ${esc(m.text.replace('__QUOTE__', '').trim())}</div>` : `<div class="msg ${m.fromId === me ? 'mine' : ''}">${esc(m.text)}<small>${esc(m.fromName)} · ${fmtDateTime(m.ts)}</small></div>`).join('')}</div>
      ${active.status !== 'closed' ? `<form class="composer" data-action="reply" data-id="${active.id}"><textarea name="text" required maxlength="1000" placeholder="${esc(t('export.writeReply'))}"></textarea><button class="btn primary" type="submit">${t('export.send')}</button></form>` : ''}` : empty(t('export.noInquiries'), state.user.role === 'buyer' ? t('export.noInquiriesBuyer') : t('export.noInquiriesFarmer'));
    const orderCard = (o) => { const isBuyer = o.buyerId === me; const cur = state.stages[o.stage]; const next = state.stages[o.stage + 1]; const done = o.stage >= state.stages.length - 1;
      const canAdvance = next && ((next === 'buyer_confirmed' && isBuyer) || (next !== 'buyer_confirmed' && (!isBuyer || next === 'delivered')));
      const blocked = next === 'dispatched' ? (!o.documents.every((x) => x.ready) ? t('err.DOCUMENTS_INCOMPLETE') : o.payment.status === 'unpaid' ? t('err.PAYMENT_REQUIRED') : '') : '';
      return `<article class="order"><div class="order-head"><div><p class="eyebrow">${esc(o.ref)}</p><h3>${esc(o.productName)} · ${fmtNum(o.quantity, 0)} ${o.unit}</h3><p class="small muted">${esc(isBuyer ? o.sellerName : (o.buyerCompany || o.buyerName))} · ${esc(o.destination)} · ${o.incoterm} · ${fmtMoney(o.price, o.currency)}/${o.unit} = <b>${fmtMoney(o.price * o.quantity, o.currency)}</b></p></div>${badge(done ? 'good' : 'warn', t('stage.' + cur))}</div>
        <div class="timeline">${o.stages.map((s, i) => `<div class="${s.status === 'done' ? 'done' : s.status === 'current' ? 'current' : ''}"><i>${s.status === 'done' ? '✓' : i + 1}</i><span><b>${t('stage.' + s.key)}</b><small>${s.ts ? fmtDateTime(s.ts) + (s.by ? ' · ' + esc(s.by) : '') : t('export.pending')}</small></span></div>`).join('')}</div>
        <div class="grid two" style="gap:12px"><div><p class="eyebrow">${t('export.documents')}</p><div class="doc-list">${o.documents.map((dd) => `<label><input type="checkbox" ${dd.ready ? 'checked' : ''} ${isBuyer ? 'disabled' : ''} data-action="doc" data-id="${o.id}" data-key="${dd.key}">${t('doc.' + dd.key)}${dd.ready ? ' ✓' : ''}</label>`).join('')}</div></div>
        <div><p class="eyebrow">${t('export.payment')}</p><div class="kv"><div><span>${t('common.status')}</span><b class="${o.payment.status === 'paid' ? 'good' : o.payment.status === 'deposit' ? 'warn' : 'crit'}">${t('payment.' + o.payment.status)}</b></div>${o.payment.reference ? `<div><span>${t('export.reference')}</span><b>${esc(o.payment.reference)}</b></div>` : ''}</div>${o.payment.status !== 'paid' ? `<div class="btn-row mt"><button class="btn outline small" data-action="payment" data-id="${o.id}">${t('export.recordPayment')}</button></div>` : ''}<p class="small muted mt">${t('export.paymentNote')}</p></div></div>
        <div class="btn-row mt">${canAdvance ? `<button class="btn primary small" data-action="advance" data-id="${o.id}" ${blocked ? 'disabled' : ''} title="${esc(blocked)}">→ ${t('export.markStage', { stage: t('stage.' + next) })}</button>${blocked ? `<span class="small muted">${esc(blocked)}</span>` : ''}` : next ? badge('', t('export.waitingFor', { who: next === 'buyer_confirmed' ? t('export.buyer') : t('export.seller') })) : badge('good', t('export.completed'))}</div></article>`; };
    return `<div class="section-intro"><div><p class="eyebrow">${t('nav.export')}</p><h2>${t('export.title')}</h2><p class="lead">${t('export.text')}</p></div></div>
      <div class="grid two"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('export.inquiriesEyebrow')}</p><h3>${t('export.inbox')}</h3></div>${badge(inqs.filter((i) => i.status === 'open').length ? 'warn' : '', inqs.length)}</div>
        <div class="grid" style="grid-template-columns:minmax(160px,.8fr) minmax(0,1.6fr);gap:14px"><div class="thread-list">${inqs.map((i) => `<button class="thread-item ${active && i.id === active.id ? 'active' : ''}" data-action="openThread" data-id="${i.id}"><span class="top"><b>${esc(i.buyerId === me ? i.sellerName : (i.buyerCompany || i.buyerName))}</b><i class="dot ${i.status === 'open' ? 'pending' : i.status === 'converted' ? 'done' : ''}"></i></span><p>${esc(i.productName)}</p><p>${fmtRel(i.updatedAt)}</p></button>`).join('') || `<p class="small muted">${t('export.noInquiries')}</p>`}</div><div>${thread}</div></div></article>
      <article class="card"><div class="card-head"><div><p class="eyebrow">${t('export.ordersEyebrow')}</p><h3>${t('export.orders')}</h3></div>${badge('', orders.length)}</div><div class="list">${orders.length ? orders.map(orderCard).join('') : empty(t('export.noOrders'), t('export.noOrdersText'))}</div></article></div>`;
  }

  function renderEvaluation() {
    const e = state.evaluation; if (!e) return '';
    const rows = [['sensorIntegration', '📡'], ['dataQuality', '✓'], ['aiDecisionSupport', '✦'], ['workflowAutomation', '⚙'], ['webUsability', '◫'], ['b2bFunctionality', '▣']];
    const row = ([k, icon]) => { const m = e.metrics[k]; const v = m.value; const cls = v == null ? '' : v >= m.target ? '' : v >= 80 ? 'warn' : 'crit';
      return `<div class="eval-row"><div><b>${icon} ${t('eval.' + k)}</b><p class="small muted">${t('eval.' + k + 'Metric')}</p></div><div><b class="value">${v == null ? '—' : fmtNum(v) + '%'}</b><p class="small muted">${t('eval.target')} ≥ ${m.target}%</p></div><div class="progress"><i class="${cls}" style="width:${Math.min(100, v || 0)}%"></i><span class="target" style="left:${m.target}%"></span></div><div>${v == null ? badge('', t('eval.pending')) : badge(v >= m.target ? 'good' : 'warn', v >= m.target ? t('eval.met') : t('eval.below'))}</div></div>`; };
    const sc = e.scenarios;
    return `<div class="section-intro"><div><p class="eyebrow">${t('nav.evaluation')}</p><h2>${t('eval.title')}</h2><p class="lead">${t('eval.text')}</p></div><div class="tools"><button class="btn primary" data-action="runScenarios">▶ ${t('eval.runSuite')}</button></div></div>
      <article class="card"><div class="card-head"><div><p class="eyebrow">${t('eval.tableEyebrow')}</p><h3>${t('eval.tableTitle')}</h3></div><span class="badge">${t('eval.threshold')}</span></div>${rows.map(row).join('')}</article>
      <div class="grid two mt"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('eval.scenarioEyebrow')}</p><h3>${t('eval.scenarioTitle')}</h3></div>${sc ? badge(sc.agreement >= 85 ? 'good' : 'warn', `${sc.passed}/${sc.total} · ${fmtNum(sc.agreement)}%`) : ''}</div>
        ${sc ? `<p class="small muted" style="margin-bottom:10px">${t('eval.scenarioRan', { when: fmtDateTime(sc.ranAt) })}</p><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>${t('twin.crop')}</th><th>${t('eval.expected')}</th><th>${t('eval.actual')}</th><th>${t('common.status')}</th></tr></thead><tbody>${sc.results.map((r) => `<tr><td>${r.id}${r.note ? ' *' : ''}</td><td>${crop(r.crop)}</td><td>${esc(decisionText({ code: r.expected, params: {}, crop: r.crop }).title)}</td><td>${esc(decisionText({ code: r.actual, params: {}, crop: r.crop }).title)}</td><td>${badge(r.pass ? 'good' : 'crit', r.pass ? t('eval.pass') : t('eval.fail'))}</td></tr>`).join('')}</tbody></table></div><p class="small muted mt">* ${t('eval.expertNote')}</p>` : empty(t('eval.noRun'), t('eval.noRunText'))}</article>
      <article class="card"><div class="card-head"><div><p class="eyebrow">${t('eval.susEyebrow')}</p><h3>${t('eval.susTitle')}</h3></div>${badge('', t('eval.susCount', { n: e.susCount }))}</div><p class="small muted" style="margin-bottom:10px">${t('eval.susText')}</p>
        <form class="form" data-action="sus">${Array.from({ length: 10 }, (_, i) => `<label style="grid-template-columns:1fr auto;align-items:center"><span>${i + 1}. ${t('sus.q' + (i + 1))}</span><span class="chips" role="radiogroup">${[1, 2, 3, 4, 5].map((v) => `<label class="chip" style="padding:6px 9px;font-weight:600"><input type="radio" name="q${i}" value="${v}" required style="margin:0 4px 0 0">${v}</label>`).join('')}</span></label>`).join('')}<p class="small muted">1 = ${t('sus.disagree')} · 5 = ${t('sus.agree')}</p><label>${t('eval.comment')}<textarea name="comment" maxlength="500"></textarea></label><p class="form-error"></p><button class="btn primary" type="submit">${t('eval.submitSus')}</button></form></article></div>
      <article class="card mt"><p class="eyebrow">${t('eval.dsrmEyebrow')}</p><h3>${t('eval.dsrmTitle')}</h3><p class="small muted mt">${t('eval.dsrmText')}</p></article>`;
  }

  function renderEvalSusOnly() {
    return `<article class="card"><div class="card-head"><div><p class="eyebrow">${t('eval.susEyebrow')}</p><h3>${t('eval.susTitle')}</h3></div></div><p class="small muted" style="margin-bottom:10px">${t('eval.susText')}</p>
      <form class="form" data-action="sus">${Array.from({ length: 10 }, (_, i) => `<label style="grid-template-columns:1fr auto;align-items:center"><span>${i + 1}. ${t('sus.q' + (i + 1))}</span><span class="chips"> ${[1, 2, 3, 4, 5].map((v) => `<label class="chip" style="padding:6px 9px;font-weight:600"><input type="radio" name="q${i}" value="${v}" required style="margin:0 4px 0 0">${v}</label>`).join('')}</span></label>`).join('')}<p class="small muted">1 = ${t('sus.disagree')} · 5 = ${t('sus.agree')}</p><p class="form-error"></p><button class="btn primary" type="submit">${t('eval.submitSus')}</button></form></article>`;
  }

  function renderSettings() {
    const u = state.user; const d = state.data; const isFarmer = u.role === 'farmer';
    const farm = isFarmer ? `<article class="card"><div class="card-head"><div><p class="eyebrow">${t('settings.farmEyebrow')}</p><h3>${t('settings.farm')}</h3></div></div>
        <form class="form" data-action="saveFarm"><div class="row"><label>${t('settings.farmName')}<input name="name" required value="${esc(d.farm.name)}"></label><label>${t('settings.location')}<input name="location" value="${esc(d.farm.location)}"></label></div>
        <label>${t('settings.interval')}<input name="interval" type="number" min="5" max="300" value="${d.farm.interval}"></label><div class="btn-row"><button class="btn primary" type="submit">${t('common.save')}</button></div></form>
        <div class="mt"><div class="switch"><div><b>${t('settings.simulation')}</b><p>${t('settings.simulationText')}</p></div><button class="toggle" role="switch" aria-checked="${d.farm.simulation}" data-action="toggleFarm" data-key="simulation" aria-label="${t('settings.simulation')}"></button></div>
        <div class="switch"><div><b>${t('agent.autonomous')}</b><p>${t('settings.autonomousText')}</p></div><button class="toggle" role="switch" aria-checked="${d.farm.autonomous}" data-action="toggleFarm" data-key="autonomous" aria-label="${t('agent.autonomous')}"></button></div></div></article>
      <article class="card"><div class="card-head"><div><p class="eyebrow">${t('settings.zonesEyebrow')}</p><h3>${t('settings.zones')}</h3></div></div><div class="list">${d.zones.map((z) => `<form class="form" data-action="saveZone" data-id="${z.id}" style="grid-template-columns:auto 1fr 1fr auto;align-items:end;gap:10px"><b style="padding-bottom:10px">${z.id}</b><label>${t('twin.crop')}<select name="crop">${['tomato', 'chilli', 'okra'].map((c) => `<option value="${c}" ${z.crop === c ? 'selected' : ''}>${crop(c)}</option>`).join('')}</select></label><label>${t('twin.area')} (ha)<input name="area" type="number" step="0.01" min="0.01" value="${z.area}"></label><button class="btn outline small" type="submit">${t('common.save')}</button></form>`).join('')}</div><p class="small muted mt">${t('settings.zonesNote')}</p></article>
      <article class="card"><div class="card-head"><div><p class="eyebrow">${t('settings.devicesEyebrow')}</p><h3>${t('settings.devices')}</h3></div></div><p class="small muted">${t('settings.devicesText')}</p>
        ${state.devices ? `<div class="kv mt"><div><span>${t('settings.ingestUrl')}</span><b><span class="key">${esc(state.devices.ingestUrl)}</span></b></div><div><span>MQTT</span><b><span class="key">${esc(state.devices.mqttTopic)}</span></b></div></div>
        <div class="table-wrap mt"><table class="table"><thead><tr><th>${t('twin.node')}</th><th>${t('twin.selectedZone')}</th><th>${t('settings.deviceKey')}</th><th>${t('common.status')}</th><th></th></tr></thead><tbody>${state.devices.devices.map((n) => `<tr><td>${esc(n.label)}<br><small class="muted">${n.id} · fw ${esc(n.firmware || '—')}</small></td><td>${n.zoneId}</td><td><span class="key">${esc(n.key)}</span></td><td>${badge(n.online ? 'good' : 'crit', n.online ? t('twin.online') : t('twin.offline'))}<br><small class="muted">${fmtRel(n.lastSeen)}</small></td><td><button class="btn ghost small" data-action="copy" data-text="${esc(n.key)}">⧉ ${t('common.copy')}</button><button class="btn ghost small" data-action="rotate" data-id="${n.id}">↻ ${t('settings.rotate')}</button></td></tr>`).join('')}</tbody></table></div>
        <p class="small muted mt">${t('settings.sample')}</p><pre class="code">curl -X POST ${esc(state.devices.ingestUrl)} \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Key: ${esc(state.devices.devices[0]?.key || '<device-key>')}" \\
  -d '{"moisture":41.2,"nitrogen":42,"phosphorus":30,"potassium":36,"soilTemp":25.1,"airTemp":28.4,"humidity":70,"ph":6.4,"rainfall":0}'</pre>` : ''}
        <div class="btn-row mt"><a class="btn outline small" href="/api/readings.csv" download>⤓ ${t('settings.exportAll')}</a></div></article>` : renderEvalSusOnly();
    return `<div class="section-intro"><div><p class="eyebrow">${t('nav.settings')}</p><h2>${t('settings.title')}</h2><p class="lead">${t('settings.text')}</p></div></div>
      <div class="grid two"><div class="stack"><article class="card"><div class="card-head"><div><p class="eyebrow">${t('settings.profileEyebrow')}</p><h3>${t('settings.profile')}</h3></div>${badge('', t('role.' + u.role))}</div>
          <form class="form" data-action="saveProfile"><label>${t('auth.fullName')}<input name="name" required minlength="2" maxlength="80" value="${esc(u.name)}"></label><div class="row"><label>${t('auth.company')}<input name="company" maxlength="80" value="${esc(u.company || '')}"></label><label>${t('auth.email')}<input value="${esc(u.email)}" disabled></label></div>
          <label>${t('header.language')}<select name="lang">${LANGS.map((l) => `<option value="${l}" ${state.lang === l ? 'selected' : ''}>${({ en: 'English', si: 'සිංහල', ta: 'தமிழ்' })[l]}</option>`).join('')}</select></label><div class="btn-row"><button class="btn primary" type="submit">${t('common.save')}</button></div></form></article>
        <article class="card"><div class="card-head"><div><p class="eyebrow">${t('settings.securityEyebrow')}</p><h3>${t('settings.password')}</h3></div></div>
          <form class="form" data-action="savePassword"><label>${t('settings.currentPassword')}<input name="current" type="password" required autocomplete="current-password"></label><label>${t('settings.newPassword')}<input name="next" type="password" required minlength="8" autocomplete="new-password"></label><p class="form-error"></p><div class="btn-row"><button class="btn outline" type="submit">${t('settings.changePassword')}</button><button type="button" class="btn ghost" data-action="logout">${t('header.logout')}</button></div></form></article>
        <article class="card"><p class="eyebrow">${t('settings.aboutEyebrow')}</p><h3>AgriPulse · ${t('brand.tagline')}</h3><p class="small muted mt">${t('settings.about')}</p><p class="small muted mt">${t('settings.disclaimer')}</p></article></div>
      <div class="stack">${farm}</div></div>`;
  }

  /* ---------- Assistant (client-side response composer) ---------- */
  function assistantReply(intent, zoneId) {
    const d = state.data; if (!d || !d.zones) return t('assistant.buyerOnly');
    const zones = zoneId ? d.zones.filter((z) => z.id === zoneId) : d.zones;
    const line = (z, f) => `${z.id} (${crop(z.crop)}): ${fmtVal(f, z.latest?.[f])}`;
    switch (intent) {
      case 'irrigation': return zones.map((z) => { const dec = z.decisions.find((x) => ['IRRIGATE', 'RAIN_HOLD_IRRIGATION', 'MOISTURE_HIGH'].includes(x.code)); return `${z.id} (${crop(z.crop)}): ${metricName('moisture')} ${fmtVal('moisture', z.latest?.moisture)} · ${t('assistant.target')} ${z.policy.moisture[0]}–${z.policy.moisture[1]}%\n${dec ? decisionText(dec).detail : t('assistant.noIrrigation')}`; }).join('\n\n');
      case 'nutrients': return zones.map((z) => { const dec = z.decisions.find((x) => x.code === 'NUTRIENT_LOW'); return `${z.id} (${crop(z.crop)}): N ${fmtNum(z.latest?.nitrogen)} · P ${fmtNum(z.latest?.phosphorus)} · K ${fmtNum(z.latest?.potassium)} mg/kg\n${dec ? decisionText(dec).detail : t('assistant.nutrientsOk')}`; }).join('\n\n');
      case 'ph': return zones.map((z) => { const dec = z.decisions.find((x) => x.code === 'PH_LOW' || x.code === 'PH_HIGH'); return `${line(z, 'ph')} · ${t('assistant.target')} ${z.policy.ph[0]}–${z.policy.ph[1]}\n${dec ? decisionText(dec).detail : t('assistant.phOk')}`; }).join('\n\n');
      case 'weather': return zones.map((z) => `${z.id}: ${metricName('airTemp')} ${fmtVal('airTemp', z.latest?.airTemp)} · ${metricName('humidity')} ${fmtVal('humidity', z.latest?.humidity)} · ${metricName('rainfall')} ${fmtVal('rainfall', z.latest?.rainfall)}`).join('\n') + '\n' + (zones.flatMap((z) => z.decisions).find((x) => ['HEAT_STRESS', 'RAIN_EVENT', 'COLD_STRESS'].includes(x.code)) ? decisionText(zones.flatMap((z) => z.decisions).find((x) => ['HEAT_STRESS', 'RAIN_EVENT', 'COLD_STRESS'].includes(x.code))).detail : t('assistant.weatherOk'));
      case 'disease': { const dec = zones.flatMap((z) => z.decisions).find((x) => x.code === 'DISEASE_RISK'); return dec ? `${dec.zoneId}: ${decisionText(dec).detail}` : t('assistant.diseaseOk'); }
      case 'market': return t('assistant.market', { products: d.market.myProducts, inquiries: d.market.openInquiries, orders: d.market.activeOrders });
      case 'export': return t('assistant.export', { orders: d.market.activeOrders });
      case 'workflow': { const pend = d.workflows.filter((w) => w.status === 'pending'); return pend.length ? t('assistant.workflowPending', { n: pend.length }) + '\n' + pend.map((w) => `• ${t('wf.type.' + w.type)} · ${w.zoneId}`).join('\n') : t('assistant.workflowClear', { mode: d.farm.autonomous ? t('assistant.autonomousOn') : t('assistant.autonomousOff') }); }
      case 'help': return t('assistant.help');
      default: return zones.map((z) => `${z.id} (${crop(z.crop)}): ${t('status.' + z.status)} · ${decisionText(z.decisions[0]).title}`).join('\n') + '\n\n' + t('assistant.statusHint');
    }
  }

  /* ---------- Actions ---------- */
  const actions = {
    go: (el) => { location.hash = '#/' + el.dataset.page; closeMenus(); },
    logout: async () => { try { await api('/api/auth/logout', { method: 'POST', body: {} }); } catch { /* ignore */ } signOutLocal(); toast(t('toast.loggedOut')); },
    readAlerts: async () => { await api('/api/alerts/read', { method: 'POST', body: {} }); await refreshData(); },
    selectZone: (el) => { state.zone = el.dataset.zone; if (state.page === 'twin') render(); else location.hash = '#/twin'; },
    simulate: async () => { const preset = $('#presetSelect')?.value || ''; try { await api('/api/simulate', { method: 'POST', body: { zone: state.zone, preset: preset || undefined } }); toast(t('toast.readingSimulated')); await refreshData(); render(); } catch (e) { toast(e.message, true); } },
    zoneChange: async (el) => { state.zone = el.value; await loadPage(); render(); },
    metricChange: (el) => { state.metric = el.value; render(); },
    hoursChange: async (el) => { state.hours = Number(el.value); await loadPage(); render(); },
    wf: async (el) => { try { await api(`/api/workflows/${el.dataset.id}/${el.dataset.op}`, { method: 'POST', body: {} }); toast(t('toast.wf.' + el.dataset.op)); await refreshData(); render(); } catch (e) { toast(e.message, true); } },
    toggleFarm: async (el) => { const key = el.dataset.key; const next = el.getAttribute('aria-checked') !== 'true'; try { await api('/api/farm', { method: 'PATCH', body: { [key]: next } }); toast(t(next ? 'toast.enabled' : 'toast.disabled', { what: t(key === 'simulation' ? 'settings.simulation' : 'agent.autonomous') })); await refreshData(); render(); } catch (e) { toast(e.message, true); } },
    chatSuggest: (el) => submitChat(el.dataset.text),
    filter: (el) => { state.filter = el.dataset.filter; render(); },
    toggleMine: async () => { state.mine = !state.mine; await loadPage(); render(); },
    newProduct: () => openDialog(productForm(), async (f) => { await api('/api/products', { method: 'POST', body: readProductForm(f) }); toast(t('toast.listingPublished')); await loadPage(); await refreshData(); render(); }),
    editProduct: (el) => { const p = state.products.find((x) => x.id === el.dataset.id); openDialog(productForm(p), async (f) => { await api(`/api/products/${p.id}`, { method: 'PATCH', body: readProductForm(f) }); toast(t('toast.saved')); await loadPage(); render(); }); },
    archiveProduct: async (el) => { if (!confirm(t('market.archiveConfirm'))) return; await api(`/api/products/${el.dataset.id}`, { method: 'DELETE' }); toast(t('toast.saved')); await loadPage(); await refreshData(); render(); },
    restoreProduct: async (el) => { await api(`/api/products/${el.dataset.id}`, { method: 'PATCH', body: { status: 'active' } }); toast(t('toast.saved')); await loadPage(); render(); },
    inquire: (el) => { const p = state.products.find((x) => x.id === el.dataset.id); openDialog(`<form class="form"><button type="button" class="close" data-close aria-label="${t('common.close')}">×</button><p class="eyebrow">${t('market.sendInquiry')}</p><h2>${esc(p.name)}</h2><p class="muted small">${esc(p.sellerCompany || p.sellerName || '')} · ${fmtMoney(p.price, p.currency)}/${p.unit} · ${esc(p.market)}</p>
      <label>${t('market.quantityWanted')} (${p.unit})<input name="quantity" type="number" min="1" value="${Math.min(p.quantity, 500)}"></label><label>${t('export.message')}<textarea name="text" required maxlength="1000">${esc(t('market.inquiryTemplate', { product: p.name, qty: Math.min(p.quantity, 500), unit: p.unit, market: p.market }))}</textarea></label><p class="form-error"></p><div class="btn-row"><button type="button" class="btn ghost" data-close>${t('common.cancel')}</button><button class="btn primary" type="submit">✉ ${t('export.send')}</button></div></form>`,
      async (f) => { const r = await api(`/api/products/${p.id}/inquiries`, { method: 'POST', body: { text: f.text.value, quantity: f.quantity.value } }); toast(t('toast.inquirySent')); location.hash = `#/export/${r.inquiry.id}`; }); },
    openThread: (el) => { state.param = el.dataset.id; history.replaceState(null, '', `#/export/${el.dataset.id}`); render(); },
    closeInquiry: async (el) => { await api(`/api/inquiries/${el.dataset.id}/close`, { method: 'POST', body: {} }); await loadPage(); render(); },
    convert: (el) => { const i = state.inquiries.find((x) => x.id === el.dataset.id); const p = (state.products || []).find((x) => x.id === i.productId); openDialog(`<form class="form"><button type="button" class="close" data-close aria-label="${t('common.close')}">×</button><p class="eyebrow">${t('export.convertOrder')}</p><h2>${esc(i.productName)}</h2><p class="muted small">${esc(i.buyerCompany || i.buyerName)}</p>
      <div class="row"><label>${t('market.quantity')}<input name="quantity" type="number" min="1" required value="${i.quantity || p?.quantity || 100}"></label><label>${t('market.price')} (${p?.currency || 'USD'}/${p?.unit || 'kg'})<input name="price" type="number" step="0.01" min="0.01" required value="${p?.price || ''}"></label></div>
      <div class="row"><label>${t('export.destination')}<input name="destination" required value="${esc(p?.market || '')}"></label><label>Incoterm<select name="incoterm"><option>FOB</option><option>CIF</option><option>EXW</option></select></label></div><p class="form-error"></p><div class="btn-row"><button type="button" class="btn ghost" data-close>${t('common.cancel')}</button><button class="btn primary" type="submit">${t('export.createOrder')}</button></div></form>`,
      async (f) => { await api(`/api/inquiries/${i.id}/convert`, { method: 'POST', body: { quantity: f.quantity.value, price: f.price.value, destination: f.destination.value, incoterm: f.incoterm.value } }); toast(t('toast.orderCreated')); await loadPage(); await refreshData(); render(); }); },
    advance: async (el) => { try { await api(`/api/orders/${el.dataset.id}/advance`, { method: 'POST', body: {} }); toast(t('toast.stageUpdated')); await loadPage(); await refreshData(); render(); } catch (e) { toast(e.message, true); } },
    doc: async (el) => { try { await api(`/api/orders/${el.dataset.id}/documents`, { method: 'POST', body: { key: el.dataset.key, ready: el.checked } }); await loadPage(); render(); } catch (e) { toast(e.message, true); } },
    payment: (el) => openDialog(`<form class="form"><button type="button" class="close" data-close aria-label="${t('common.close')}">×</button><p class="eyebrow">${t('export.payment')}</p><h2>${t('export.recordPayment')}</h2><p class="muted small">${t('export.paymentNote')}</p>
      <label>${t('common.status')}<select name="status"><option value="deposit">${t('payment.deposit')}</option><option value="paid">${t('payment.paid')}</option></select></label><div class="row"><label>${t('export.provider')}<input name="provider" value="Bank transfer"></label><label>${t('export.reference')}<input name="reference" required maxlength="60"></label></div><p class="form-error"></p><div class="btn-row"><button type="button" class="btn ghost" data-close>${t('common.cancel')}</button><button class="btn primary" type="submit">${t('common.save')}</button></div></form>`,
      async (f) => { await api(`/api/orders/${el.dataset.id}/payment`, { method: 'POST', body: { status: f.status.value, provider: f.provider.value, reference: f.reference.value } }); toast(t('toast.saved')); await loadPage(); render(); }),
    runScenarios: async () => { try { const r = await api('/api/evaluation/run', { method: 'POST', body: {} }); toast(t('toast.scenarios', { passed: r.scenarios.passed, total: r.scenarios.total })); await loadPage(); render(); } catch (e) { toast(e.message, true); } },
    copy: async (el) => { try { await navigator.clipboard.writeText(el.dataset.text); toast(t('toast.copied')); } catch { toast(el.dataset.text); } },
    rotate: async (el) => { if (!confirm(t('settings.rotateConfirm'))) return; await api(`/api/devices/${el.dataset.id}/rotate`, { method: 'POST', body: {} }); toast(t('toast.saved')); await loadPage(); render(); },
  };
  const forms = {
    chat: (f) => submitChat(f.chatInput?.value || $('#chatInput').value),
    reply: async (f) => { const text = f.text.value.trim(); if (!text) return; await api(`/api/inquiries/${f.dataset.id}/messages`, { method: 'POST', body: { text } }); f.reset(); await loadPage(); render(); },
    sus: async (f) => { const answers = Array.from({ length: 10 }, (_, i) => Number(f[`q${i}`].value)); const r = await api('/api/evaluation/sus', { method: 'POST', body: { answers, comment: f.comment?.value } }); toast(t('toast.sus', { score: r.score })); if (state.page === 'evaluation') { await loadPage(); render(); } else f.reset(); },
    saveProfile: async (f) => { const r = await api('/api/auth/me', { method: 'PATCH', body: { name: f.name.value, company: f.company.value, lang: f.lang.value } }); state.user = r.user; toast(t('toast.saved')); if (f.lang.value !== state.lang) setLang(f.lang.value); else { renderChrome(); render(); } },
    savePassword: async (f) => { await api('/api/auth/password', { method: 'POST', body: { current: f.current.value, next: f.next.value } }); f.reset(); toast(t('toast.passwordChanged')); },
    saveFarm: async (f) => { await api('/api/farm', { method: 'PATCH', body: { name: f.name.value, location: f.location.value, interval: f.interval.value } }); toast(t('toast.saved')); await refreshData(); render(); },
    saveZone: async (f) => { await api(`/api/zones/${f.dataset.id}`, { method: 'PATCH', body: { crop: f.crop.value, area: f.area.value } }); toast(t('toast.saved')); await refreshData(); render(); },
  };
  function readProductForm(f) {
    return { name: f.name.value, category: f.category.value, grade: f.grade.value, quantity: f.quantity.value, unit: f.unit.value, price: f.price.value, currency: f.currency.value, market: f.market.value, harvestDate: f.harvestDate.value, zoneId: f.zoneId.value, description: f.description.value, certifications: $$('input[name="cert"]:checked', f).map((c) => c.value) };
  }
  async function submitChat(text) {
    text = (text || '').trim(); if (!text) return;
    state.chat.push({ role: 'user', text });
    const input = $('#chatInput'); if (input) input.value = '';
    render();
    try { const r = await api('/api/assistant', { method: 'POST', body: { text } }); state.chat.push({ role: 'bot', text: assistantReply(r.intent, r.zoneId) }); }
    catch (e) { state.chat.push({ role: 'bot', text: e.message }); }
    if (state.chat.length > 40) state.chat.splice(0, state.chat.length - 40);
    render();
  }
  function closeMenus() { $$('.menu').forEach((m) => { m.hidden = true; }); $$('.dropdown button').forEach((b) => b.setAttribute('aria-expanded', 'false')); }

  /* ---------- Event wiring ---------- */
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (el && !['SELECT', 'INPUT', 'FORM'].includes(el.tagName) && actions[el.dataset.action]) { e.preventDefault(); try { await actions[el.dataset.action](el, e); } catch (err) { toast(err.message, true); } return; }
    if (!e.target.closest('.dropdown')) closeMenus();
  });
  document.addEventListener('keydown', (e) => { const el = e.target.closest('[data-action][role="button"]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); actions[el.dataset.action]?.(el, e); } if (e.key === 'Escape') closeMenus(); });
  document.addEventListener('change', async (e) => { const el = e.target.closest('[data-action]'); if (el && (el.tagName === 'SELECT' || el.type === 'checkbox') && actions[el.dataset.action]) { try { await actions[el.dataset.action](el, e); } catch (err) { toast(err.message, true); } } });
  let searchTimer; document.addEventListener('input', (e) => { if (e.target.id === 'productSearch') { clearTimeout(searchTimer); const v = e.target.value; searchTimer = setTimeout(() => { state.search = v; render(); const i = $('#productSearch'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } }, 250); } });
  document.addEventListener('submit', async (e) => { const f = e.target.closest('form[data-action]'); if (!f) return; e.preventDefault(); const btn = $('button[type="submit"]', f); const err = $('.form-error', f); if (err) err.textContent = ''; if (btn) btn.disabled = true; try { await forms[f.dataset.action](f); } catch (ex) { if (err) err.textContent = ex.message; else toast(ex.message, true); } finally { if (btn) btn.disabled = false; } });
  $('#alertsBtn').onclick = (e) => { e.stopPropagation(); const open = $('#alertsMenu').hidden; closeMenus(); $('#alertsMenu').hidden = !open; $('#alertsBtn').setAttribute('aria-expanded', String(open)); };
  $('#profileBtn').onclick = (e) => { e.stopPropagation(); const open = $('#profileMenu').hidden; closeMenus(); $('#profileMenu').hidden = !open; $('#profileBtn').setAttribute('aria-expanded', String(open)); };
  $('#menuToggle').onclick = () => { $('#sidebar').classList.toggle('open'); $('#backdrop').classList.toggle('show'); };
  $('#backdrop').onclick = () => { $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('show'); };
  $('#langSelect').onchange = (e) => setLang(e.target.value);
  $('#authLang').onchange = (e) => setLang(e.target.value);
  $('#authSwitch').onclick = () => { state.register = !state.register; renderAuthMode(); };
  $('#pwToggle').onclick = () => { const i = $('#authPassword'); i.type = i.type === 'password' ? 'text' : 'password'; };
  $$('.demo-btn').forEach((b) => { b.onclick = () => { state.register = false; renderAuthMode(); $('#authEmail').value = b.dataset.demo === 'farmer' ? 'farmer@agripulse.lk' : 'buyer@agripulse.lk'; $('#authPassword').value = b.dataset.demo === 'farmer' ? 'Farm@123' : 'Buyer@123'; $('#authForm').requestSubmit(); }; });
  $('#authForm').onsubmit = async (e) => {
    e.preventDefault(); const btn = $('#authSubmit'); btn.disabled = true; $('#authError').textContent = '';
    try {
      const body = { email: $('#authEmail').value, password: $('#authPassword').value, lang: state.lang };
      if (state.register) Object.assign(body, { name: $('#authName').value, role: $('#authRole').value, company: $('#authCompany').value });
      const r = await api(state.register ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body });
      state.token = r.token; localStorage.setItem('agripulse-token', r.token);
      $('#authPassword').value = '';
      await enterApp(r.user, { fromLogin: true });
      toast(state.register ? t('toast.accountCreated') : t('toast.welcome', { name: r.user.name.split(' ')[0] }));
    } catch (err) { $('#authError').textContent = err.message; } finally { btn.disabled = false; }
  };
  window.addEventListener('hashchange', () => { if (state.user) route(); });
  window.addEventListener('online', () => setSse('connecting'));

  /* ---------- Boot ---------- */
  (async () => {
    const boot = new URLSearchParams(location.search);
    if (boot.get('token')) { state.token = boot.get('token'); localStorage.setItem('agripulse-token', state.token); if (LANGS.includes(boot.get('lang'))) { state.lang = boot.get('lang'); state.forceLang = true; localStorage.setItem('agripulse-lang', state.lang); } history.replaceState(null, '', location.pathname + location.hash); }
    applyStatic();
    try { const r = await api('/api/auth/me'); await enterApp(r.user); }
    catch { state.token = ''; localStorage.removeItem('agripulse-token'); showAuth(); }
  })();
})();
