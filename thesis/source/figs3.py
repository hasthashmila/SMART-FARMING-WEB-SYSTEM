import sys, os, json; sys.path.insert(0, os.path.dirname(__file__))
from svg import D
r = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'measure', 'results.json')))
# Figure 6.1 evaluation workflow
d = D(1100, 300)
d.text(550, 30, 'Testing and evaluation workflow', 14, weight='bold')
steps = ['Sprint build\n(2 weeks)', 'Automated end-to-end\nsuite (16 tests)', 'Scripted walkthrough\nin en / si / ta', 'Sprint review\n(supervisor)', 'Cycle demonstration\n(panel / users)', 'Evaluation page vs\nsix targets', 'Backlog refinement\n→ next cycle']
for i, t in enumerate(steps):
    x = 20 + i * 152
    d.box(x, 80, 138, 64, t, size=10, fill='#eef5f0' if i < 4 else '#d5edc7')
    if i < 6: d.line(x + 138, 112, x + 152, 112)
d.path('M 1000 144 L 1000 200 L 89 200 L 89 144', dash=True)
d.box(300, 220, 500, 50, 'Final evaluation (Sept 2026): 20-min instrumented run · 15-scenario suite · 12-participant SUS study', size=10, fill='#fff8e6', stroke='#b7791f')
d.save('fig_eval_workflow')
# Figure 6.2 run timeline
d = D(1000, 420)
d.text(500, 28, 'Sensor integration and data quality during the instrumented run', 14, weight='bold')
ox, oy, W, H = 70, 360, 880, 280
for v in range(90, 101, 2):
    y = oy - (v - 90) / 10 * H
    d.line(ox, y, ox + W, y, arrow=False, stroke='#e5e5e5', width=1); d.text(ox - 8, y + 4, f'{v}%', 10, anchor='end')
for tmin in range(0, 21, 2):
    x = ox + tmin / 20 * W; d.text(x, oy + 18, str(tmin), 10)
d.text(ox + W / 2, oy + 40, 'minutes', 11)
def poly(key, col):
    pts = ' '.join(f'{ox + t["t"]/20*W},{oy - (max(90, t[key]) - 90)/10*H}' for t in r['timeline'])
    d.add(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="2.5"/>')
    for t in r['timeline']: d.add(f'<circle cx="{ox + t["t"]/20*W}" cy="{oy - (max(90, t[key]) - 90)/10*H}" r="3" fill="{col}"/>')
poly('sensorIntegration', '#2c5b8a'); poly('dataQuality', '#3b8a5f')
y95 = oy - 5 / 10 * H; d.line(ox, y95, ox + W, y95, arrow=False, dash=True, stroke='#2c5b8a'); d.text(ox + W - 5, y95 - 5, 'target 95 % (sensor integration)', 10, anchor='end', fill='#2c5b8a')
d.add(f'<rect x="{ox+20}" y="60" width="14" height="4" fill="#2c5b8a"/>'); d.text(ox + 40, 65, 'Sensor integration (received / expected)', 10, anchor='start')
d.add(f'<rect x="{ox+20}" y="80" width="14" height="4" fill="#3b8a5f"/>'); d.text(ox + 40, 85, 'Data quality (accepted / received); target 90 % lies below the axis', 10, anchor='start')
d.save('fig_run_timeline')
# Figure 6.3 SUS
sus = [('P01','si',85),('P02','si',77.5),('P03','si',82.5),('P04','ta',72.5),('P05','ta',87.5),('P06','en',90),('P07','en',87.5),('P08','si',80),('P09','en',82.5),('P10','en',92.5),('P11','en',80),('P12','en',67.5)]
d = D(1000, 420); d.text(500, 28, 'SUS scores by participant (colour = interface language)', 14, weight='bold')
ox, oy, H = 70, 350, 270
for v in range(0, 101, 20):
    y = oy - v / 100 * H; d.line(ox, y, 960, y, arrow=False, stroke='#e5e5e5', width=1); d.text(ox - 8, y + 4, str(v), 10, anchor='end')
col = {'en': '#2c5b8a', 'si': '#3b8a5f', 'ta': '#b7791f'}
for i, (p, l, v) in enumerate(sus):
    x = ox + 20 + i * 72
    d.add(f'<rect x="{x}" y="{oy - v/100*H}" width="46" height="{v/100*H}" fill="{col[l]}"/>')
    d.text(x + 23, oy - v / 100 * H - 5, str(v), 10); d.text(x + 23, oy + 16, p, 10)
for v, t, c in ((85, 'target 85', '#b00'), (68, 'SUS average 68', '#777'), (82.1, 'mean 82.1', '#000')):
    y = oy - v / 100 * H; d.line(ox, y, 960, y, arrow=False, dash=True, stroke=c); d.text(962, y + 4, t, 9, anchor='start', fill=c)
for i, (l, n) in enumerate([('en', 'English (mean 84.0)'), ('si', 'Sinhala (81.3)'), ('ta', 'Tamil (80.5)')]):
    d.add(f'<rect x="{ox + 20 + i*220}" y="392" width="14" height="10" fill="{col[l]}"/>'); d.text(ox + 40 + i * 220, 401, n, 10, anchor='start')
d.save('fig_sus')
# Figure 6.4 results vs targets
d = D(1000, 440); d.text(500, 28, 'Results against thesis evaluation targets', 14, weight='bold')
areas = [('Sensor\nintegration', 95, 98.0), ('Data\nquality', 90, 98.1), ('AI decision\nsupport', 85, 86.7), ('Workflow\nautomation', 90, 100), ('Web usability\n(SUS)', 85, 82.1), ('B2B\nfunctionality', 88, 95.8)]
ox, oy, H = 80, 350, 270
for v in range(0, 101, 20):
    y = oy - v / 100 * H; d.line(ox, y, 960, y, arrow=False, stroke='#e5e5e5', width=1); d.text(ox - 8, y + 4, f'{v}%', 10, anchor='end')
for i, (n, t, v) in enumerate(areas):
    x = ox + 30 + i * 145
    d.add(f'<rect x="{x}" y="{oy - t/100*H}" width="40" height="{t/100*H}" fill="#c9d6e3"/>'); d.text(x + 20, oy - t / 100 * H - 5, f'{t}', 10, fill='#555')
    d.add(f'<rect x="{x+44}" y="{oy - v/100*H}" width="40" height="{v/100*H}" fill="{"#3b8a5f" if v >= t else "#b7791f"}"/>'); d.text(x + 64, oy - v / 100 * H - 5, f'{v}', 10, weight='bold')
    d.text(x + 42, oy + 18, n, 10)
y80 = oy - 0.8 * H; d.line(ox, y80, 960, y80, arrow=False, dash=True, stroke='#b00'); d.text(962, y80 + 4, '80 %', 9, anchor='start', fill='#b00')
d.add('<rect x="110" y="405" width="14" height="10" fill="#c9d6e3"/>'); d.text(130, 414, 'target', 10, anchor='start')
d.add('<rect x="200" y="405" width="14" height="10" fill="#3b8a5f"/>'); d.text(220, 414, 'result (met)', 10, anchor='start')
d.add('<rect x="320" y="405" width="14" height="10" fill="#b7791f"/>'); d.text(340, 414, 'result (below target)', 10, anchor='start')
d.save('fig_results')
