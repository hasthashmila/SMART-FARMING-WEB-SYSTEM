import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from svg import D

# ---------- Figure 4.1 Use case ----------
d = D(1100, 760)
d.box(230, 30, 640, 700, '', fill='#fbfbfb', stroke='#666', r=6)
d.text(550, 55, 'Smart Farming Web System', 14, weight='bold')
d.actor(90, 200, 'Farmer /\nFarm manager'); d.actor(90, 520, 'Buyer'); d.actor(1010, 160, 'Sensor node'); d.actor(1010, 470, 'AI agent')
ucs = {
 'reg': (400, 95, 'UC-08 Register /\nsign in'), 'dash': (400, 160, 'UC-09 View digital\ntwin & analytics'), 'wf': (400, 225, 'UC-03 Approve /\nreject workflow'),
 'ask': (400, 290, 'UC-07 Ask farm\nassistant'), 'cfg': (400, 355, 'UC-10 Configure farm,\nzones & devices'), 'list': (400, 420, 'UC-04 Create /\nedit listing'),
 'conv': (400, 485, 'UC-06a Convert inquiry\nto export order'), 'stage': (400, 550, 'UC-06 Track export\nstages & documents'), 'eval': (400, 615, 'UC-11 Run evaluation /\nsubmit SUS'),
 'ingest': (720, 130, 'UC-01 Ingest\nsensor reading'), 'rec': (720, 210, 'UC-02 Generate\nrecommendation'), 'alert': (720, 285, 'UC-12 Raise /\nresolve alert'),
 'open': (720, 360, 'UC-13 Open\nworkflow'), 'browse': (720, 460, 'UC-14 Browse &\nsearch listings'), 'inq': (720, 535, 'UC-05 Send inquiry\n& negotiate'), 'confirm': (720, 610, 'UC-15 Confirm quotation /\nrecord payment'), 'lang': (720, 680, 'UC-16 Switch language\n(en / si / ta)')}
for k, (x, y, t) in ucs.items(): d.ellipse(x, y, 110, 30, t, size=10, fill='#eef5f0', stroke='#2e6b52')
for k in ['reg', 'dash', 'wf', 'ask', 'cfg', 'list', 'conv', 'stage', 'eval']:
    x, y, _ = ucs[k]; d.line(110, 235, x - 105, y, arrow=False, stroke='#555', width=1)
for k in ['browse', 'inq', 'confirm']:
    x, y, _ = ucs[k]; d.line(110, 555, x - 105, y, arrow=False, stroke='#555', width=1)
d.line(110, 555, 295, 95, arrow=False, stroke='#555', width=1); d.line(110, 555, 615, 680, arrow=False, stroke='#555', width=1); d.line(110, 235, 615, 680, arrow=False, stroke='#555', width=1); d.line(110, 235, 615, 460, arrow=False, stroke='#555', width=1)
d.line(990, 200, 830, 135, arrow=False, stroke='#555', width=1)
for k in ['rec', 'alert', 'open']:
    x, y, _ = ucs[k]; d.line(990, 505, x + 105, y, arrow=False, stroke='#555', width=1)
d.line(720, 160, 720, 180, dash=True); d.text(745, 173, '«include»', 9, anchor='start', italic=True)
d.line(720, 240, 720, 255, dash=True); d.line(720, 315, 720, 330, dash=True)
d.line(505, 225, 610, 360, dash=True); d.text(560, 285, '«extend»', 9, italic=True)
d.line(505, 485, 615, 535, dash=True); d.text(560, 500, '«include»', 9, italic=True)
d.save('fig_usecase')

# ---------- Figure 4.2 Class diagram ----------
d = D(1200, 820)
def cls(x, y, w, name, attrs, ops=None, fill='#fff'):
    h_a = 16 + 14 * len(attrs); h_o = (10 + 14 * len(ops)) if ops else 0
    d.box(x, y, w, 22 + h_a + h_o, '', fill=fill, stroke='#333', r=2)
    d.add(f'<rect x="{x}" y="{y}" width="{w}" height="22" fill="#dfe8f5" stroke="#333"/>')
    d.text(x + w / 2, y + 15, name, 11, weight='bold')
    for i, a in enumerate(attrs): d.text(x + 6, y + 36 + i * 14, a, 9.5, anchor='start')
    if ops:
        d.line(x, y + 22 + h_a, x + w, y + 22 + h_a, arrow=False, stroke='#333', width=1)
        for i, o in enumerate(ops): d.text(x + 6, y + 22 + h_a + 14 + i * 14, o, 9.5, anchor='start', italic=True)
cls(20, 30, 190, 'User', ['id, name, email', 'role: farmer | buyer', 'company, country', 'lang: en | si | ta', 'salt, hash, createdAt'], ['register(), login()', 'changePassword()'])
cls(250, 30, 190, 'Farm', ['id, ownerId, name', 'location, lat, lng', 'simulation, interval', 'autonomous, timezone'])
cls(480, 30, 190, 'Zone', ['id, name, crop', 'area, planted', 'nodeId'], ['status()', 'policy()'])
cls(710, 30, 190, 'SensorNode', ['id, zoneId, label', 'key, firmware', 'expectedInterval', 'lastSeen'], ['rotateKey()', 'online()'])
cls(940, 30, 230, 'Reading', ['id, nodeId, zoneId, ts, source', 'moisture, nitrogen, phosphorus', 'potassium, soilTemp, airTemp', 'humidity, ph, rainfall', 'completeness'])
cls(480, 200, 190, 'CropPolicy', ['crop', 'moisture[min,max], ph[min,max]', 'nitrogen, phosphorus, potassium', 'airTemp[], soilTemp[]', 'humidityMax'])
cls(710, 200, 230, 'Decision', ['id, code, severity, zoneId', 'ruleId, policy, confidence, ts', 'params, action'], ['evaluateZone()', 'runScenarios()'])
cls(980, 220, 190, 'Evidence', ['metric, value', 'threshold, relation'])
cls(710, 360, 230, 'Workflow', ['id, type, zoneId, status', 'params, decision, approvedBy', 'executedAt, verifyDeadline'], ['approve(), reject()', 'acknowledge(), tick()'])
cls(980, 380, 190, 'WorkflowStep', ['key, status, ts', 'by, command'])
cls(480, 380, 190, 'Alert', ['id, code, zoneId', 'severity, params', 'ts, read, resolvedAt, count'])
cls(20, 330, 190, 'Product', ['id, ownerId, name, category', 'grade, quantity, unit', 'price, currency, market', 'certifications[], harvestDate', 'zoneId?, description, status'], ['liveStatus()'])
cls(250, 330, 190, 'Inquiry', ['id, productId, buyerId', 'sellerId, status', 'quantity, orderId?', 'createdAt, updatedAt'], ['convert()', 'close()'])
cls(250, 520, 190, 'Message', ['id, fromId, fromName', 'text, ts, system'])
cls(20, 560, 190, 'Order', ['id, ref, productId, inquiryId', 'buyerId, sellerId', 'quantity, unit, price, currency', 'destination, incoterm, stage'], ['advance(user)'])
cls(250, 660, 190, 'OrderStage', ['key, status, ts, by'])
cls(480, 560, 190, 'Document', ['key: invoice | packing_list |', 'phytosanitary | certificate_of_origin', 'ready, ts'])
cls(480, 680, 190, 'Payment', ['status: unpaid | deposit | paid', 'provider, reference, ts, by'])
# relations
d.line(210, 60, 250, 60, arrow=False, stroke='#333'); d.text(230, 52, '1 owns 1', 8)
d.line(440, 60, 480, 60, arrow=False, stroke='#333'); d.text(460, 52, '1..*', 8)
d.line(670, 60, 710, 60, arrow=False, stroke='#333'); d.text(690, 52, '1 – 1', 8)
d.line(900, 60, 940, 60, arrow=False, stroke='#333'); d.text(920, 52, '1..*', 8)
d.line(575, 130, 575, 200, arrow=False, stroke='#333'); d.text(600, 170, 'applies', 8)
d.line(670, 250, 710, 250, arrow=False, stroke='#333'); d.text(690, 242, 'uses', 8)
d.line(940, 260, 980, 260, arrow=False, stroke='#333', marker='dia'); d.text(960, 252, '1..*', 8)
d.line(825, 310, 825, 360, arrow=False, stroke='#333'); d.text(850, 340, 'originates', 8)
d.line(940, 420, 980, 420, arrow=False, stroke='#333'); d.text(960, 412, '3..5', 8)
d.line(670, 430, 710, 430, arrow=False, stroke='#333'); d.text(690, 422, 'raises', 8)
d.line(115, 160, 115, 330, arrow=False, stroke='#333'); d.text(135, 250, 'sells 0..*', 8)
d.line(210, 400, 250, 400, arrow=False, stroke='#333'); d.text(230, 392, '0..*', 8)
d.line(345, 470, 345, 520, arrow=False, stroke='#333'); d.text(370, 500, '1..*', 8)
d.line(115, 480, 115, 560, arrow=False, stroke='#333'); d.text(160, 520, 'ordered as 0..*', 8)
d.line(210, 640, 250, 680, arrow=False, stroke='#333'); d.text(240, 655, '7', 8)
d.line(210, 620, 480, 600, arrow=False, stroke='#333'); d.text(345, 600, '4 documents', 8)
d.line(210, 660, 480, 710, arrow=False, stroke='#333'); d.text(360, 695, '1 payment', 8)
d.path('M 410 240 L 410 330', arrow=False, stroke='#333'); d.text(430, 300, 'buyer / seller', 8)
d.path('M 480 260 L 460 260 L 460 245', arrow=False, stroke='#333')
d.save('fig_class')

# ---------- Figure 4.3 Activity diagram ----------
d = D(1150, 560)
lanes = ['Sensor node', 'Data layer', 'AI agent', 'Farmer', 'Actuator']
for i, l in enumerate(lanes):
    x = 20 + i * 222
    d.box(x, 20, 210, 520, '', fill='#fafafa' if i % 2 == 0 else '#f3f6f4', stroke='#999', r=4)
    d.text(x + 105, 42, l, 12, weight='bold')
d.add('<circle cx="125" cy="80" r="8" fill="#333"/>')
d.box(60, 110, 130, 40, 'Read 9 sensors', size=10)
d.box(60, 175, 130, 40, 'POST reading', size=10)
d.box(282, 175, 130, 40, 'Authenticate key\nnormalise units', size=10)
d.diamond(347, 260, 110, 50, 'Valid?', size=10)
d.box(282, 320, 130, 40, 'Log rejection\n(error codes)', size=10, fill='#fde8c3', stroke='#b7791f')
d.box(282, 400, 130, 40, 'Store reading\nupdate node', size=10)
d.box(504, 400, 130, 40, 'Evaluate rules\n(evidence, confidence)', size=10)
d.diamond(569, 480, 120, 50, 'Action?', size=10)
d.box(504, 100, 130, 40, 'Raise / resolve\nalerts', size=10)
d.box(504, 180, 130, 40, 'Open workflow\n(no duplicate)', size=10)
d.diamond(569, 270, 130, 50, 'Autonomous?', size=10)
d.box(726, 180, 130, 40, 'Review evidence', size=10)
d.diamond(791, 270, 120, 50, 'Approve?', size=10)
d.box(726, 340, 130, 40, 'Workflow rejected', size=10, fill='#fde8c3', stroke='#b7791f')
d.box(948, 180, 130, 40, 'Execute command\n(valve / pump)', size=10)
d.box(948, 260, 130, 40, 'Verify with next\nreadings', size=10)
d.diamond(1013, 350, 120, 50, 'Target met\nbefore deadline?', size=9)
d.box(948, 420, 130, 40, 'Completed', size=10, fill='#d5edc7')
d.box(948, 480, 130, 40, 'Failed', size=10, fill='#fde8c3', stroke='#b7791f')
d.line(125, 88, 125, 110); d.line(125, 150, 125, 175); d.line(190, 195, 282, 195); d.line(347, 215, 347, 235)
d.line(347, 285, 347, 320); d.text(360, 305, 'no', 9, anchor='start')
d.path('M 402 260 L 460 260 L 460 380 L 347 380 L 347 400'); d.text(465, 255, 'yes', 9, anchor='start')
d.line(412, 420, 504, 420); d.line(569, 440, 569, 455)
d.path('M 634 480 L 690 480 L 690 60 L 569 60 L 569 100'); d.text(640, 475, 'yes', 9, anchor='start')
d.path('M 504 480 L 470 480 L 470 540', arrow=False); d.text(475, 500, 'no → healthy / info', 9, anchor='start')
d.line(569, 140, 569, 180); d.line(569, 220, 569, 245)
d.line(634, 270, 726, 200); d.text(660, 240, 'no', 9)
d.path('M 569 295 L 569 330 L 900 330 L 900 200 L 948 200'); d.text(700, 325, 'yes: agent approves', 9)
d.line(791, 220, 791, 245); d.line(791, 295, 791, 340); d.text(805, 320, 'no', 9, anchor='start')
d.line(851, 270, 948, 200); d.text(880, 240, 'yes', 9)
d.line(1013, 220, 1013, 260); d.line(1013, 300, 1013, 325); d.line(1013, 375, 1013, 420); d.text(1030, 400, 'yes', 9, anchor='start')
d.path('M 1073 350 L 1100 350 L 1100 500 L 1078 500'); d.text(1105, 430, 'no', 9, anchor='start')
d.add('<circle cx="1013" cy="530" r="9" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="1013" cy="530" r="5" fill="#333"/>')
d.save('fig_activity')

# ---------- Sequence diagram helper ----------
def seq(name, parts, msgs, w=1150, h=None, title=''):
    n = len(parts); gap = (w - 60) / n
    h = h or 120 + 32 * len(msgs)
    d = D(w, h)
    if title: d.text(w / 2, 24, title, 13, weight='bold')
    xs = []
    for i, p in enumerate(parts):
        x = 30 + gap * i + gap / 2; xs.append(x)
        d.box(x - 70, 40, 140, 36, p, size=10, fill='#dfe8f5', stroke='#333', r=4)
        d.line(x, 76, x, h - 20, arrow=False, dash=True, stroke='#999', width=1)
    y = 105
    for m in msgs:
        a, b, txt = m[0], m[1], m[2]; ret = len(m) > 3 and m[3] == 'ret'; note = len(m) > 3 and m[3] == 'note'
        if note:
            d.box(xs[a] - 90, y - 12, 180, 26, txt, size=9, fill='#fff8e6', stroke='#b7791f', r=3)
        elif a == b:
            d.path(f'M {xs[a]} {y-8} L {xs[a]+40} {y-8} L {xs[a]+40} {y+10} L {xs[a]+2} {y+10}', arrow=True, width=1.2)
            d.text(xs[a] + 46, y + 2, txt, 9, anchor='start')
        else:
            d.line(xs[a], y, xs[b], y, arrow=True, dash=ret, width=1.2, marker='arw' if ret else 'ar')
            d.text((xs[a] + xs[b]) / 2, y - 5, txt, 9)
        y += 32
    d.save(name)

seq('fig_seq_ingest', ['ESP32 node', 'Ingest API', 'Validator', 'Data store', 'AI agent', 'Workflow engine', 'SSE hub', 'Browser'],
    [(0, 1, 'POST /api/ingest {reading} + X-Device-Key'), (1, 1, 'authenticate key → node, zone'), (1, 2, 'prepare(raw)'), (2, 2, 'aliases, units, ranges, timestamp, completeness'),
     (2, 1, '{ok, reading, errors}', 'ret'), (1, 3, 'push reading; ingestLog(accepted) ; stats++'), (1, 4, 'evaluateZone(zone, latest, recent, node)'), (4, 4, 'apply crop-policy rules'),
     (4, 1, 'decisions[] with evidence, confidence', 'ret'), (1, 3, 'syncAlerts(decisions); decisionLog'), (1, 5, 'syncDecisions(decisions)'), (5, 5, 'create workflow if action & none open'),
     (5, 1, 'workflows updated', 'ret'), (1, 6, "broadcast('update', zone)"), (6, 7, 'event: update'), (7, 1, 'GET /api/dashboard'), (1, 7, 'snapshot (zones, decisions, alerts, workflows)', 'ret'),
     (1, 0, '201 {accepted, decisions[]}', 'ret'), (1, 0, '422 {errors} when validation fails', 'ret')], title='UC-01 / UC-02: sensor ingest and recommendation generation')

seq('fig_seq_workflow', ['Farmer (browser)', 'API', 'Workflow engine', 'Simulator / MQTT bridge', 'Data store', 'AI agent', 'SSE hub'],
    [(0, 1, 'POST /api/workflows/{id}/approve'), (1, 1, 'require role = farmer'), (1, 2, 'approve(id, user)'), (2, 2, 'step approval ← done (by user)'),
     (2, 3, 'actuator command {valve, minutes, topic}'), (3, 2, 'applied / published', 'ret'), (2, 2, 'step execute ← done; status running; deadline +8 min'), (2, 4, 'save'),
     (1, 0, '200 {workflow}', 'ret'), (3, 1, 'next reading (moisture ↑) via ingest', 'note'), (1, 5, 'evaluateZone()'), (5, 1, 'decisions (HEALTHY)', 'ret'), (1, 2, 'tick()'),
     (2, 2, 'moisture ≥ policy.min → verify done, completed'), (2, 4, 'stats.workflowsCompleted++'), (1, 6, "broadcast('update')"), (6, 0, 'event: update → refresh'),
     (2, 2, 'else if now > deadline → failed', 'note')], title='UC-03: workflow approval, execution and verification')

seq('fig_seq_b2b', ['Buyer (browser)', 'API', 'Data store', 'SSE hub', 'Seller (browser)'],
    [(0, 1, 'POST /api/products/{id}/inquiries {text, quantity}'), (1, 1, 'reject if owner = buyer'), (1, 2, 'create / reuse inquiry; add message'), (1, 3, "broadcast('b2b') to seller"),
     (3, 4, 'event: b2b'), (4, 1, 'GET /api/inquiries'), (1, 4, 'threads', 'ret'), (4, 1, 'POST /api/inquiries/{id}/messages {reply}'), (1, 3, "broadcast('b2b') to buyer"), (3, 0, 'event: b2b'),
     (4, 1, 'POST /api/inquiries/{id}/convert {qty, price, destination, incoterm}'), (1, 2, 'create order @ quotation; inquiry.status = converted; system message'),
     (1, 4, '201 {order}', 'ret'), (3, 0, 'event: b2b → order visible'), (0, 1, 'POST /api/orders/{id}/advance'), (1, 1, 'next = buyer_confirmed & user = buyer ✓'),
     (1, 2, 'stage ← buyer_confirmed (ts, by)'), (1, 0, '200 {order}', 'ret'), (3, 4, 'event: b2b → seller sees confirmation')], title='UC-05 / UC-06: inquiry, quotation and buyer confirmation')

# ---------- Figure 4.7 Deployment ----------
d = D(1100, 520)
d.box(30, 60, 300, 400, '', fill='#f2f8ee', stroke='#5a8a3a', r=12); d.text(180, 85, '«device» Field zone (×3)', 12, weight='bold')
d.box(60, 110, 240, 70, '«device» ESP32 node\nfirmware: sensor loop, HTTP client,\nMQTT subscriber', size=10, fill='#fff')
d.box(60, 200, 110, 50, '9 sensors', size=10, fill='#fff'); d.box(190, 200, 110, 50, 'Relay\nactuator', size=10, fill='#fff')
d.box(60, 290, 240, 60, '«device» Optional gateway\nMosquitto MQTT broker + HTTP bridge', size=10, fill='#fff', dash=True)
d.text(180, 400, 'Wi-Fi (HTTP/JSON) or LoRa → gateway', 10, italic=True)
d.box(400, 60, 320, 400, '', fill='#eef3fa', stroke='#2c5b8a', r=12); d.text(560, 85, '«server» Application host', 12, weight='bold')
d.text(560, 105, '(local machine, VPS or container platform)', 10, italic=True)
d.box(420, 120, 280, 90, '«execution environment» Node.js 18\nserver.js: REST API, SSE hub, static files\nvalidate · agent · workflows · simulator', size=10, fill='#fff')
d.box(420, 230, 280, 60, '«artifact» JSON document store\n/data/db.json (persistent volume)', size=10, fill='#fff')
d.box(420, 310, 280, 50, '«artifact» public/ web app + i18n (en/si/ta)', size=10, fill='#fff')
d.box(420, 380, 280, 50, '«optional» reverse proxy (HTTPS, port 443)', size=10, fill='#fff', dash=True)
d.line(330, 145, 400, 165); d.text(365, 140, 'HTTPS', 9)
d.line(330, 320, 400, 175); d.text(345, 250, 'HTTP', 9)
d.box(790, 60, 280, 190, '', fill='#fff8ec', stroke='#b7791f', r=12); d.text(930, 85, '«device» User devices', 12, weight='bold')
d.box(810, 105, 240, 50, 'Farmer / manager: phone, tablet, PC\n(Chrome, Safari, Firefox)', size=10, fill='#fff')
d.box(810, 170, 240, 50, 'Buyer / importer: browser', size=10, fill='#fff')
d.line(790, 150, 720, 165); d.text(755, 150, 'HTTPS · SSE', 9)
d.box(790, 290, 280, 170, '', fill='#f5f5f5', stroke='#777', r=12, dash=True); d.text(930, 315, '«external» services', 12, weight='bold')
d.box(810, 335, 240, 45, 'Payment gateway (adapter at\nPOST /api/orders/{id}/payment)', size=10, fill='#fff')
d.box(810, 395, 240, 45, 'Logistics / forwarder systems\n(future interface)', size=10, fill='#fff')
d.line(790, 360, 720, 250, dash=True)
d.save('fig_deploy')

# ---------- Flowcharts ----------
d = D(1100, 300)
steps = ['Receive JSON\n+ device key', 'Key valid?', 'Map aliases,\nconvert units', 'Required fields\npresent?', 'Numeric &\nin range?', 'Timestamp\nvalid?', 'Accept: store,\ncompleteness', 'Invoke agent,\nbroadcast']
for i, t in enumerate(steps):
    x = 20 + i * 135
    if '?' in t: d.diamond(x + 57, 120, 115, 70, t, size=10)
    else: d.box(x, 85, 115, 70, t, size=10)
    if i < 7: d.line(x + 115, 120, x + 135, 120)
for i in (1, 3, 4, 5):
    x = 20 + i * 135 + 57
    d.line(x, 155, x, 210); d.text(x + 6, 185, 'no', 9, anchor='start')
d.box(230, 210, 500, 50, 'Reject: log per-field error codes (401 for key; 422 for validation) · count in data-quality metric', size=10, fill='#fde8c3', stroke='#b7791f')
d.text(550, 40, 'Data validation and preparation pipeline', 14, weight='bold')
d.save('fig_flow_ingest')

d = D(1100, 420)
d.text(550, 30, 'AI-agent zone evaluation', 14, weight='bold')
flow = [('Load policy, latest, recent (1 h), node', 'b'), ('Node silent > 4 intervals?', 'q'), ('No reading?', 'q'), ('Compute confidence\n(completeness, age, rejects)', 'b'), ('Moisture < min?', 'q'), ('Rain ≥ 2 mm/h?', 'q')]
xs = [20, 190, 340, 480, 660, 810]
for (t, k), x in zip(flow, xs):
    if k == 'q': d.diamond(x + 65, 100, 130, 64, t, size=9)
    else: d.box(x, 70, 150, 60, t, size=9)
for i in range(5): d.line(xs[i] + (150 if flow[i][1] == 'b' else 130), 100, xs[i + 1], 100)
d.box(190, 190, 130, 44, 'SENSOR_OFFLINE\n+ sensor_check', size=9, fill='#fde8c3', stroke='#b7791f'); d.line(255, 132, 255, 190); d.text(262, 165, 'yes', 9, anchor='start')
d.box(340, 190, 130, 44, 'NO_DATA → return', size=9, fill='#fde8c3', stroke='#b7791f'); d.line(405, 132, 405, 190); d.text(412, 165, 'yes', 9, anchor='start')
d.box(810, 190, 130, 44, 'RAIN_HOLD\n(cancel irrigation)', size=9); d.line(875, 132, 875, 190); d.text(882, 165, 'yes', 9, anchor='start')
d.box(960, 70, 120, 60, 'IRRIGATE\nminutes = 3·deficit\n(8–30); critical if ≥5', size=9, fill='#d5edc7'); d.line(940, 100, 960, 100); d.text(945, 92, 'no', 9)
d.path('M 725 132 L 725 260 L 20 260', arrow=False); d.text(740, 250, 'no → MOISTURE_HIGH if > max', 9, anchor='start')
seq2 = ['N/P/K < min?\n→ NUTRIENT_LOW + fertigation', 'pH outside range?\n→ PH_LOW / PH_HIGH', 'Air temp outside?\n→ HEAT / COLD_STRESS', 'Humidity > max & ≥24 °C?\n→ DISEASE_RISK', 'Rain ≥ 5 mm?\n→ RAIN_EVENT (cancel irr.)', 'Rejects >10 % / stale?\n→ DATA_QUALITY / STALE', 'No warning?\n→ HEALTHY']
for i, t in enumerate(seq2):
    x = 20 + i * 152
    d.box(x, 280, 140, 56, t, size=8.5)
    if i < 6: d.line(x + 140, 308, x + 152, 308)
d.line(20, 260, 90, 280)
d.box(360, 360, 380, 40, 'Return decisions sorted by severity, each with evidence, rule id, policy, confidence', size=10, fill='#d5edc7')
d.line(984, 336, 984, 380, arrow=False); d.line(984, 380, 740, 380)
d.save('fig_flow_agent')

d = D(1100, 300)
d.text(550, 30, 'Workflow state machine (irrigation / fertigation; sensor check uses detected → notify → acknowledge)', 13, weight='bold')
st = [('detected', 90), ('pending\n(awaiting approval)', 300), ('running\n(executed, verifying)', 540), ('done', 780)]
for t, x in st: d.ellipse(x, 120, 90, 36, t, size=10, fill='#eef5f0', stroke='#2e6b52')
d.line(180, 120, 210, 120); d.text(195, 108, 'agent', 9)
d.line(390, 120, 450, 120); d.text(420, 108, 'approve (farmer\nor agent if autonomous)', 9)
d.line(630, 120, 690, 120); d.text(660, 108, 'verify OK', 9)
d.ellipse(300, 230, 90, 30, 'rejected', size=10, fill='#fde8c3', stroke='#b7791f'); d.line(300, 156, 300, 200); d.text(315, 180, 'reject', 9, anchor='start')
d.ellipse(120, 230, 90, 30, 'cancelled (rain)', size=10, fill='#fde8c3', stroke='#b7791f'); d.line(250, 140, 165, 210); d.text(190, 165, 'RAIN_EVENT', 9)
d.ellipse(540, 230, 90, 30, 'failed', size=10, fill='#fde8c3', stroke='#b7791f'); d.line(540, 156, 540, 200); d.text(555, 180, 'deadline passed', 9, anchor='start')
d.ellipse(900, 230, 120, 30, 'executed: actuator cmd\n+ MQTT topic logged', size=9, fill='#fff8e6', stroke='#b7791f')
d.save('fig_flow_workflow')
