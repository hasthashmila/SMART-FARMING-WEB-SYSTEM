# Tiny SVG diagram toolkit + rasteriser (MuPDF) for thesis figures
import fitz, html, math, os
OUT = os.path.join(os.path.dirname(__file__), 'fig')
FONT = "Helvetica, Arial, sans-serif"
class D:
    def __init__(s, w, h, bg='#ffffff'):
        s.w, s.h, s.parts = w, h, [f'<rect width="{w}" height="{h}" fill="{bg}"/>']
        s.parts.append('<defs><marker id="ar" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#333"/></marker><marker id="arw" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,5 L0,10 z" fill="#fff" stroke="#333"/></marker><marker id="dia" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto"><path d="M0,6 L6,0 L12,6 L6,12 z" fill="#fff" stroke="#333"/></marker></defs>')
    def add(s, x): s.parts.append(x)
    def text(s, x, y, t, size=13, anchor='middle', weight='normal', fill='#222', italic=False):
        st = f'font-family="{FONT}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" fill="{fill}"' + (' font-style="italic"' if italic else '')
        lines = t.split('\n')
        for i, l in enumerate(lines):
            s.add(f'<text x="{x}" y="{y + i*size*1.25}" {st}>{html.escape(l)}</text>')
    def box(s, x, y, w, h, t='', fill='#eef5f0', stroke='#2e6b52', size=13, r=8, weight='normal', dash=False, tfill='#222'):
        da = ' stroke-dasharray="6 4"' if dash else ''
        s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"{da}/>')
        if t:
            n = t.count('\n') + 1
            s.text(x + w/2, y + h/2 - (n-1)*size*0.62 + size*0.35, t, size, weight=weight, fill=tfill)
    def line(s, x1, y1, x2, y2, arrow=True, dash=False, stroke='#333', width=1.5, marker='ar'):
        da = ' stroke-dasharray="6 4"' if dash else ''
        ma = f' marker-end="url(#{marker})"' if arrow else ''
        s.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{width}"{da}{ma}/>')
    def path(s, d, arrow=True, dash=False, stroke='#333', width=1.5, marker='ar'):
        da = ' stroke-dasharray="6 4"' if dash else ''
        ma = f' marker-end="url(#{marker})"' if arrow else ''
        s.add(f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width}"{da}{ma}/>')
    def ellipse(s, cx, cy, rx, ry, t='', fill='#fff6e0', stroke='#b7791f', size=12):
        s.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
        if t:
            n = t.count('\n') + 1
            s.text(cx, cy - (n-1)*size*0.62 + size*0.35, t, size)
    def actor(s, x, y, name, size=12):
        s.add(f'<circle cx="{x}" cy="{y}" r="9" fill="#fff" stroke="#333" stroke-width="1.5"/><line x1="{x}" y1="{y+9}" x2="{x}" y2="{y+34}" stroke="#333" stroke-width="1.5"/><line x1="{x-14}" y1="{y+18}" x2="{x+14}" y2="{y+18}" stroke="#333" stroke-width="1.5"/><line x1="{x}" y1="{y+34}" x2="{x-12}" y2="{y+52}" stroke="#333" stroke-width="1.5"/><line x1="{x}" y1="{y+34}" x2="{x+12}" y2="{y+52}" stroke="#333" stroke-width="1.5"/>')
        s.text(x, y + 68, name, size, weight='bold')
    def diamond(s, cx, cy, w, h, t='', size=11):
        s.add(f'<polygon points="{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}" fill="#fff8e6" stroke="#b7791f" stroke-width="1.5"/>')
        if t:
            n = t.count('\n') + 1
            s.text(cx, cy - (n-1)*size*0.62 + size*0.35, t, size)
    def save(s, name, scale=2.5):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{s.w}" height="{s.h}" viewBox="0 0 {s.w} {s.h}">' + ''.join(s.parts) + '</svg>'
        p = os.path.join(OUT, name + '.svg'); open(p, 'w').write(svg)
        doc = fitz.open(p); pix = doc[0].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False); pix.save(os.path.join(OUT, name + '.png'))
        print('saved', name, pix.width, pix.height)
