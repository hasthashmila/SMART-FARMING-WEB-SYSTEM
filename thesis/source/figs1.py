import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from svg import D

# ---------- Figure 1.1 Rich picture ----------
d = D(1100, 620)
d.text(550, 30, 'Rich picture: Smart Farming Web System (AgriPulse)', 18, weight='bold')
# field
d.box(30, 70, 300, 500, '', fill='#f2f8ee', stroke='#5a8a3a', r=14)
d.text(180, 95, 'FIELD (Kandyan Valley Farm)', 13, weight='bold', fill='#3b6a26')
for i, (z, c) in enumerate([('Zone A1', 'Tomato'), ('Zone B2', 'Chilli'), ('Zone C3', 'Okra')]):
    y = 115 + i * 95
    d.box(50, y, 120, 70, f'{z}\n{c}', fill='#dbeed0', stroke='#5a8a3a', size=12)
    d.box(190, y + 10, 120, 50, f'ESP32 node\n9 sensors', fill='#fff', stroke='#5a8a3a', size=11)
    d.line(170, y + 35, 190, y + 35)
d.box(50, 405, 260, 60, 'Irrigation valve / fertigation pump\n(relay actuator)', fill='#fff', stroke='#5a8a3a', size=11)
d.text(180, 500, 'Readings every 5–60 s', 11, italic=True)
d.text(180, 520, 'HTTP + device key  |  MQTT bridge', 11, italic=True)
# platform
d.box(380, 70, 400, 500, '', fill='#eef3fa', stroke='#2c5b8a', r=14)
d.text(580, 95, 'AGRIPULSE PLATFORM', 13, weight='bold', fill='#2c5b8a')
d.box(400, 115, 360, 50, '1 Validate & prepare (aliases, units, ranges, timestamps)', fill='#fff', stroke='#2c5b8a', size=11)
d.box(400, 180, 360, 60, '2 AI agent: crop policy rules → decisions\nwith evidence, rule id, confidence', fill='#fff', stroke='#2c5b8a', size=11)
d.box(400, 255, 170, 60, '3 Alerts', fill='#fff', stroke='#2c5b8a', size=11)
d.box(590, 255, 170, 60, '4 Workflows\napprove → execute → verify', fill='#fff', stroke='#2c5b8a', size=11)
d.box(400, 330, 360, 60, '5 Digital twin dashboard, analytics,\nassistant (English · සිංහල · தமிழ்)', fill='#fff', stroke='#2c5b8a', size=11)
d.box(400, 405, 360, 60, '6 B2B: listings ← live zone status,\ninquiries, quotations, orders, documents, payment', fill='#fff', stroke='#2c5b8a', size=11)
d.box(400, 480, 360, 50, 'Evaluation: metrics computed from logs (DSRM)', fill='#fff', stroke='#2c5b8a', size=11, dash=True)
for y in (165, 240, 315, 390, 465): d.line(580, y, 580, y + 15)
d.line(330, 150, 380, 140)
d.path('M400 285 L360 285 L360 435 L310 435', arrow=True, dash=True)
d.text(345, 275, 'actuator cmd', 10, italic=True)
# people
d.box(820, 70, 260, 230, '', fill='#fff8ec', stroke='#b7791f', r=14)
d.actor(870, 95, 'Farmer /\nfarm manager')
d.text(1000, 120, 'Phone or PC,\nown language', 11)
d.text(950, 200, '• sees zone status & reasons\n• approves / rejects actions\n• asks assistant\n• lists produce', 11, anchor='middle')
d.line(820, 190, 780, 350)
d.line(780, 300, 820, 220, arrow=True)
d.box(820, 330, 260, 240, '', fill='#fff8ec', stroke='#b7791f', r=14)
d.actor(870, 355, 'Export buyer')
d.text(1000, 380, 'Dubai · Doha ·\nRotterdam · Malé', 11)
d.text(950, 470, '• browses verified listings\n• sends inquiries\n• confirms quotation\n• tracks documents & payment', 11)
d.line(820, 440, 780, 435)
d.text(550, 600, 'Workflows: field → decision (1–3) · decision → verified action (4) · production → market (5–6)', 12, italic=True)
d.save('fig_rich_picture')

# ---------- Figure 2.1 Concept map ----------
d = D(1000, 560)
d.ellipse(500, 280, 130, 60, 'Integrated Smart\nFarming Web System', fill='#dbeed0', stroke='#3b6a26', size=13)
nodes = [(180, 120, 'Smart-agriculture\narchitectures &\ndigital twins', 'Tzounis 2017; Elijah 2018;\nVerdouw 2021; Pylianidis 2021'),
         (820, 120, 'IoT & sensor networks,\ndata quality', 'Ayaz 2019; Kour & Arora 2020;\nSinha 2022; Naik 2017'),
         (180, 440, 'AI agents, decision\nintelligence & XAI', 'Wooldridge 1995; Russell 2021;\nLiakos 2018; Adadi 2018'),
         (820, 440, 'Agri-food e-commerce\n& B2B export', 'Zhang & Berghäll 2021;\nLezoche 2020')]
for x, y, t, refs in nodes:
    d.ellipse(x, y, 130, 55, t, size=12)
    d.text(x, y + 78, refs, 10, italic=True, fill='#555')
    d.line(x + (110 if x < 500 else -110), y + (30 if y < 280 else -30), 500 + (-95 if x < 500 else 95), 280 + (-40 if y < 280 else 40), arrow=False, stroke='#888')
d.box(330, 20, 340, 40, 'Cross-cutting: human factors (language, literacy, trust)', fill='#fff8ec', stroke='#b7791f', size=11, dash=True)
d.box(330, 500, 340, 40, 'Cross-cutting: Design Science Research paradigm', fill='#fff8ec', stroke='#b7791f', size=11, dash=True)
d.save('fig_concept_map')

# ---------- Figure 2.2 Gap (Venn) ----------
d = D(900, 560)
d.add('<circle cx="330" cy="230" r="170" fill="#c9e3f5" fill-opacity=".6" stroke="#2c5b8a" stroke-width="1.5"/>')
d.add('<circle cx="570" cy="230" r="170" fill="#d5edc7" fill-opacity=".6" stroke="#3b6a26" stroke-width="1.5"/>')
d.add('<circle cx="450" cy="400" r="170" fill="#fde8c3" fill-opacity=".6" stroke="#b7791f" stroke-width="1.5"/>')
d.text(250, 150, 'IoT environmental\nmonitoring', 14, weight='bold')
d.text(650, 150, 'AI-agent\ndecision support', 14, weight='bold')
d.text(450, 530, 'B2B export commerce', 14, weight='bold')
d.text(450, 200, 'Sensing +\nanalytics\nplatforms', 11)
d.text(310, 380, 'Traceability\nsystems', 11)
d.text(590, 380, 'Market\nadvisory apps', 11)
d.text(450, 300, 'RESEARCH GAP\nintegrated, explainable,\nmultilingual platform', 12, weight='bold', fill='#8a1c1c')
d.save('fig_gap')

# ---------- Figure 3.1 DSRM ----------
d = D(1100, 400)
steps = ['1 Problem\nidentification &\nmotivation', '2 Define\nobjectives of\na solution', '3 Design &\ndevelopment', '4 Demonstration', '5 Evaluation', '6 Communication']
sub = ['Fragmented tools,\nexperience-based\ndecisions', 'Six evaluation\ntargets;\n4 objectives', 'Six-layer artefact;\n3 Scrum cycles', 'Scenario\ndemonstrations,\nviva, users', 'Metrics from logs,\nscenario suite,\nSUS study', 'Thesis, code,\nREADME']
for i, (t, s2) in enumerate(zip(steps, sub)):
    x = 30 + i * 178
    d.box(x, 90, 150, 80, t, fill='#eef3fa', stroke='#2c5b8a', size=12, weight='bold')
    d.box(x, 190, 150, 80, s2, fill='#fff', stroke='#999', size=11)
    d.line(x + 75, 170, x + 75, 190)
    if i < 5: d.line(x + 150, 130, x + 178, 130)
d.text(550, 40, 'Design Science Research Methodology (Peffers et al., 2007) — iterative application', 15, weight='bold')
d.path('M 815 280 L 815 330 L 400 330 L 400 280', arrow=True, dash=True)
d.text(610, 350, 'Iteration: evaluation feeds back into design (Cycles 1 → 2 → 3)', 12, italic=True)
d.path('M 995 280 L 995 360 L 150 360 L 150 280', arrow=True, dash=True)
d.text(550, 385, 'Communication informs the next research cycle', 11, italic=True)
d.save('fig_dsrm')

# ---------- Figure 3.2 Architecture (six layers) ----------
d = D(1000, 640)
layers = [('6 Global B2B e-commerce layer', 'Listings ← live zone status · inquiry threads · quotation → order · 7-stage export · documents · payment interface', '#fde8c3', '#b7791f'),
          ('5 Web application layer', 'REST API · Server-Sent Events · sessions & roles · digital twin, analytics, agent console, evaluation · English / Sinhala / Tamil', '#e8e8f8', '#4a4a9a'),
          ('4 AI-agent & decision layer', 'Crop policies · rule engine with evidence & confidence · alerts · workflow engine (approve → execute → verify) · scenario suite · intent classifier', '#d5edc7', '#3b6a26'),
          ('3 Data layer', 'Validation & preparation (aliases, units, ranges, timestamps, completeness) · JSON document store (atomic writes) · ingest log · CSV export', '#c9e3f5', '#2c5b8a'),
          ('2 Network layer', 'HTTP/JSON ingest with per-device keys · MQTT topic convention & broker bridge', '#e0f2f1', '#1f6f66'),
          ('1 IoT sensor layer', 'ESP32 nodes: soil moisture, N, P, K, soil & air temperature, humidity, pH, rainfall · relay actuators · simulator stand-in', '#f2f8ee', '#5a8a3a')]
for i, (t, s2, f, st) in enumerate(layers):
    y = 40 + i * 95
    d.box(40, y, 920, 80, '', fill=f, stroke=st, r=10)
    d.text(60, y + 30, t, 14, anchor='start', weight='bold', fill=st)
    d.text(60, y + 55, s2, 11, anchor='start')
    if i < 5: d.line(500, y + 80, 500, y + 95, arrow=True)
d.text(985, 320, '', 10)
d.add('<line x1="20" y1="60" x2="20" y2="590" stroke="#333" marker-end="url(#ar)"/>')
d.add('<text x="12" y="330" font-size="11" transform="rotate(-90 12 330)" text-anchor="middle" font-family="Helvetica">data & decisions flow upward; actuator commands flow downward</text>')
d.save('fig_architecture')

# ---------- Figure 3.3 Data flow ----------
d = D(1100, 300)
chain = ['ESP32 node\n(9 parameters)', 'HTTP / MQTT\n+ device key', 'Validate &\nnormalise', 'Store reading\n+ ingest log', 'AI agent\nrule evaluation', 'Alerts &\nworkflows', 'SSE push →\ndigital twin', 'Farmer\ndecision']
for i, t in enumerate(chain):
    x = 20 + i * 135
    d.box(x, 90, 115, 70, t, size=11, fill='#eef5f0' if i not in (2, 4) else '#d5edc7')
    if i < 7: d.line(x + 115, 125, x + 135, 125)
d.text(550, 40, 'End-to-end IoT data flow pipeline', 15, weight='bold')
d.box(290, 200, 115, 50, 'Rejected →\nerror codes', size=10, fill='#fde8c3', stroke='#b7791f')
d.line(347, 160, 347, 200)
d.box(695, 200, 115, 50, 'Actuator\ncommand', size=10, fill='#fde8c3', stroke='#b7791f')
d.line(752, 160, 752, 200)
d.path('M 695 225 L 77 225 L 77 160', arrow=True, dash=True)
d.text(400, 280, 'Every stage is logged; metrics (transmission, quality, workflow success) are derived from these logs.', 11, italic=True, anchor='start')
d.save('fig_dataflow')

# ---------- Figure 3.4 Targets bar chart ----------
d = D(900, 420)
areas = [('Sensor\nintegration', 95), ('Data\nquality', 90), ('AI decision\nsupport', 85), ('Workflow\nautomation', 90), ('Web\nusability', 85), ('B2B\nfunctionality', 88)]
d.text(450, 30, 'Proposed evaluation targets by assessment area', 15, weight='bold')
ox, oy, H = 80, 340, 260
for i in range(0, 101, 20):
    y = oy - H * i / 100
    d.line(ox, y, 860, y, arrow=False, stroke='#ddd', width=1)
    d.text(ox - 10, y + 4, f'{i}%', 11, anchor='end')
for i, (n, v) in enumerate(areas):
    x = ox + 30 + i * 125
    d.add(f'<rect x="{x}" y="{oy - H*v/100}" width="80" height="{H*v/100}" fill="#3b8a5f"/>')
    d.text(x + 40, oy - H * v / 100 - 6, f'≥ {v}%', 12, weight='bold')
    d.text(x + 40, oy + 20, n, 11)
y80 = oy - H * 0.8
d.line(ox, y80, 860, y80, arrow=False, dash=True, stroke='#b00', width=2)
d.text(865, y80 + 4, '80%\nthreshold', 10, anchor='start', fill='#b00')
d.save('fig_targets')

# ---------- Figure 3.5 Timeline (Gantt) ----------
d = D(1150, 540)
months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
lx, ty, cw = 330, 60, 60
d.text(575, 30, 'Project implementation timeline, November 2025 – November 2026', 15, weight='bold')
for i, m in enumerate(months):
    x = lx + i * cw
    d.text(x + cw / 2, ty + 15, m + ("'25" if i < 2 else "'26"), 10)
    d.line(x, ty + 22, x, 480, arrow=False, stroke='#e5e5e5', width=1)
tasks = [('Problem identification & proposal', 0, 3, '#c9e3f5'), ('Literature review', 1, 5, '#c9e3f5'), ('Methodology & requirements (SRS)', 2, 5, '#c9e3f5'),
         ('Cycle 1: proof of concept', 1, 3.5, '#d5edc7'), ('Cycle 2: layered backend, agent, workflows, B2B v1', 4, 7.5, '#d5edc7'), ('Cycle 3: twin UI, trilingual, export, evaluation page', 8, 10.3, '#d5edc7'),
         ('Sensor node integration & simulator', 4, 9, '#fde8c3'), ('Testing & instrumented evaluation', 8.5, 10.4, '#fde8c3'), ('User evaluation (SUS)', 9.3, 10.4, '#fde8c3'),
         ('Thesis writing', 3, 10, '#e8e8f8'), ('Interim viva → final viva & corrections', 7.5, 11, '#e8e8f8')]
for i, (t, a, b, c) in enumerate(tasks):
    y = ty + 40 + i * 34
    d.text(lx - 10, y + 17, t, 11, anchor='end')
    d.add(f'<rect x="{lx + a*cw}" y="{y+4}" width="{(b-a)*cw}" height="22" rx="5" fill="{c}" stroke="#666"/>')
ms = [(1.05, 'Draft proposal 02 Dec'), (3.5, 'Defence 13–20 Feb'), (4.1, 'Interim 1'), (5.3, 'Ch.2'), (6.0, 'Interim 2'), (7.5, 'Interim viva'), (9.55, 'Draft 17 Aug'), (10.0, 'Final 30 Aug'), (10.7, 'Viva')]
for i, (a, t) in enumerate(ms):
    x = lx + a * cw
    d.add(f'<polygon points="{x},{440} {x-7},{452} {x+7},{452}" fill="#8a1c1c"/>')
    d.text(x, 468 + (i % 2) * 14, t, 9, fill='#8a1c1c')
d.text(575, 525, 'Milestones (red) follow the Faculty timeline for the 22.2 batch; bars show DSRM/Scrum work packages.', 11, italic=True)
d.save('fig_timeline')
