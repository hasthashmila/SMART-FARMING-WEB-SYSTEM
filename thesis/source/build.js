/* Build the thesis .docx from markdown-like chapter files using docx-js */
const fs = require('fs'); const path = require('path');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType, ImageRun, PageBreak, TableOfContents, LevelFormat, BorderStyle, Footer, PageNumber, NumberFormat, SectionType, Header, VerticalAlign } = D;
const CH = path.join(__dirname, 'ch'); const FIG = path.join(__dirname, 'fig');
const FONT = 'Times New Roman';
const files = fs.readdirSync(CH).filter((f) => f.endsWith('.md')).sort();

function pngSize(buf) { return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }
function inline(text, base = {}) {
  // **bold**, *italic*
  const runs = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g; let last = 0; let m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), font: FONT, size: 24, ...base }));
    const t = m[0];
    if (t.startsWith('**')) runs.push(new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, size: 24, ...base }));
    else runs.push(new TextRun({ text: t.slice(1, -1), italics: true, font: FONT, size: 24, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), font: FONT, size: 24, ...base }));
  return runs;
}
const para = (text, opts = {}) => new Paragraph({ children: inline(text, opts.run || {}), alignment: opts.align || AlignmentType.JUSTIFIED, spacing: { line: 360, after: 160 }, ...(opts.p || {}) });
const heading = (text, level, pageBreak = false) => new Paragraph({ text, heading: level, pageBreakBefore: pageBreak, spacing: { before: level === HeadingLevel.HEADING_1 ? 0 : 280, after: 160 } });
const caption = (text, style) => new Paragraph({ style, children: [new TextRun({ text, font: FONT, size: 22, italics: false, bold: false })], alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200 }, keepNext: style === 'TableCaption' });
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
function table(rows) {
  const cols = rows[0].length; const total = 9000;
  // content-aware widths: proportional to the mean text length per column (min 9 %, max 55 %)
  const lens = rows[0].map((_, ci) => rows.reduce((a, r) => a + Math.min(140, (r[ci] || '').trim().length), 0) / rows.length + 6);
  let raw = lens.map((l) => l / lens.reduce((a, b) => a + b, 0));
  raw = raw.map((f) => Math.min(0.55, Math.max(0.09, f)));
  const norm = raw.reduce((a, b) => a + b, 0);
  const widths = raw.map((f) => Math.round(total * f / norm));
  const sum = widths.reduce((a, b) => a + b, 0); widths[widths.length - 1] += total - sum;
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: rows.map((r, ri) => new TableRow({ tableHeader: ri === 0, cantSplit: true, children: r.map((c, ci) => new TableCell({ width: { size: widths[ci], type: WidthType.DXA }, borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }, shading: ri === 0 ? { fill: 'DDE8DF', type: ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: inline(c.trim(), { size: 20, bold: ri === 0 }), spacing: { line: 260, after: 0 }, alignment: AlignmentType.LEFT })] })) })) });
}
function image(file, capText) {
  const p = path.join(FIG, file); if (!fs.existsSync(p)) { console.warn('MISSING FIGURE', file); return [para(`[Figure missing: ${file}]`)]; }
  const buf = fs.readFileSync(p); const { w, h } = pngSize(buf);
  let width = 600; let height = Math.round(h * width / w);
  if (height > 720) { height = 720; width = Math.round(w * height / h); }
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, keepNext: true, children: [new ImageRun({ type: 'png', data: buf, transformation: { width, height } })] }), caption(capText, 'FigureCaption')];
}
function code(lines) { return lines.map((l, i) => new Paragraph({ children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 17 })], shading: { fill: 'F3F5F3', type: ShadingType.CLEAR, color: 'auto' }, spacing: { line: 240, after: 0, before: i === 0 ? 120 : 0 }, indent: { left: 360, right: 360 }, keepNext: i < lines.length - 1, keepLines: true })); }
const titlePage = () => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 400 }, children: [new TextRun({ text: 'SMART FARMING WEB SYSTEM', bold: true, font: FONT, size: 40 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 }, children: [new TextRun({ text: 'An Autonomous AI-Agent and IoT-Driven Web Platform for Precision Agriculture and Global B2B Export Optimization', bold: true, font: FONT, size: 30 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Research Project Thesis', font: FONT, size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'presented to the Faculty of Computing', font: FONT, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'in partial fulfilment of the requirements for the degree of', font: FONT, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 }, children: [new TextRun({ text: 'Bachelor of Science (Honours) in Software Engineering', bold: true, font: FONT, size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'NSBM Green University', bold: true, font: FONT, size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800, after: 100 }, children: [new TextRun({ text: 'H.A.S. Thashmila', font: FONT, size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Index Number: 28971', font: FONT, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Supervisor: Mr. Gayan Perera', font: FONT, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [new TextRun({ text: 'Project Duration: November 2025 – November 2026', font: FONT, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'September 2026', font: FONT, size: 24 })] }),
  new Paragraph({ children: [new PageBreak()] }),
];
const signature = (who) => [new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: '______________________________', font: FONT, size: 24 })] }), new Paragraph({ children: [new TextRun({ text: who, font: FONT, size: 24 })] }), new Paragraph({ children: [new TextRun({ text: 'Date: ____________________', font: FONT, size: 24 })] })];

function parse(md, sec) {
  const out = []; const lines = md.split('\n'); let i = 0; let tableCap = null;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l === '{{TITLEPAGE}}') { out.push(...titlePage()); i++; continue; }
    if (l === '{{PAGEBREAK}}') { out.push(new Paragraph({ children: [new PageBreak()] })); i++; continue; }
    if (l === '{{TOC}}') { out.push(heading('TABLE OF CONTENTS', HeadingLevel.HEADING_1)); out.push(new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' })); i++; continue; }
    if (l === '{{LOF}}') { out.push(heading('LIST OF FIGURES', HeadingLevel.HEADING_1)); out.push(new TableOfContents('Figures', { hyperlink: true, stylesWithLevels: [{ styleName: 'FigureCaption', level: 1 }] })); i++; continue; }
    if (l === '{{LOT}}') { out.push(heading('LIST OF TABLES', HeadingLevel.HEADING_1)); out.push(new TableOfContents('Tables', { hyperlink: true, stylesWithLevels: [{ styleName: 'TableCaption', level: 1 }] })); i++; continue; }
    if (l.startsWith('{{SIGNATURE:')) { out.push(...signature(l.slice(12, -2))); i++; continue; }
    if (l.startsWith('# ')) { out.push(heading(l.slice(2), HeadingLevel.HEADING_1, sec.mainStarted)); sec.mainStarted = true; i++; continue; }
    if (l.startsWith('## ')) { out.push(heading(l.slice(3), HeadingLevel.HEADING_2)); i++; continue; }
    if (l.startsWith('### ')) { out.push(heading(l.slice(4), HeadingLevel.HEADING_3)); i++; continue; }
    if (l.startsWith('#### ')) { out.push(heading(l.slice(5), HeadingLevel.HEADING_4)); i++; continue; }
    if (l.startsWith('```')) { const buf = []; i++; while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]); i++; out.push(...code(buf)); out.push(new Paragraph({ spacing: { after: 120 }, children: [] })); continue; }
    if (/^!\[/.test(l)) { const m = l.match(/^!\[(.*)\]\((.*)\)/); out.push(...image(m[2], m[1])); i++; continue; }
    if (/^Table [A-Z0-9]+\.\d+: /.test(l) && lines[i + 1] && lines[i + 1].startsWith('|')) { tableCap = l; i++; continue; }
    if (l.startsWith('|')) { const rows = []; while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i].replace(/^\|/, '').replace(/\|$/, '').split('|')); i++; } if (tableCap) { out.push(caption(tableCap, 'TableCaption')); tableCap = null; } out.push(table(rows)); out.push(new Paragraph({ spacing: { after: 120 }, children: [] })); continue; }
    if (/^- /.test(l)) { while (i < lines.length && /^- /.test(lines[i])) { out.push(new Paragraph({ children: inline(lines[i].slice(2)), numbering: { reference: 'bullets', level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 80 } })); i++; } continue; }
    if (/^\d+\. /.test(l)) { sec.num++; const ref = 'num' + sec.num; sec.numRefs.push(ref); while (i < lines.length && /^\d+\. /.test(lines[i])) { out.push(new Paragraph({ children: inline(lines[i].replace(/^\d+\. /, '')), numbering: { reference: ref, level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 80 } })); i++; } continue; }
    // paragraph (may span consecutive non-empty lines)
    const buf = [l]; i++; while (i < lines.length && lines[i].trim() && !/^(#|\||!\[|- |\d+\. |```|\{\{|Table [A-Z0-9]+\.\d+: )/.test(lines[i])) buf.push(lines[i++]);
    out.push(para(buf.join(' ')));
  }
  return out;
}

const sec = { mainStarted: false, num: 0, numRefs: [] };
const front = parse(fs.readFileSync(path.join(CH, files[0]), 'utf8'), sec);
sec.mainStarted = false;
const body = files.slice(1).flatMap((f) => parse(fs.readFileSync(path.join(CH, f), 'utf8'), sec));
const footer = (fmt) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] });
const pageProps = (start, fmt) => ({ page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 2160, right: 1440 }, pageNumbers: { start, formatType: fmt } } });
const doc = new Document({
  creator: 'H.A.S. Thashmila', title: 'Smart Farming Web System', description: 'BSc (Hons) Software Engineering thesis, NSBM Green University',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: FONT, color: '000000' }, paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: FONT, color: '000000' }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: FONT, color: '000000' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2, keepNext: true } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, italics: true, font: FONT, color: '000000' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 3, keepNext: true } },
      { id: 'FigureCaption', name: 'Figure Caption', basedOn: 'Normal', next: 'Normal', run: { size: 22, font: FONT, italics: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 240 } } },
      { id: 'TableCaption', name: 'Table Caption', basedOn: 'Normal', next: 'Normal', run: { size: 22, font: FONT, italics: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 }, keepNext: true } },
    ],
  },
  numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }, ...sec.numRefs.map((ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }))] },
  sections: [
    { properties: pageProps(1, NumberFormat.LOWER_ROMAN), footers: { default: footer() }, children: front },
    { properties: { ...pageProps(1, NumberFormat.DECIMAL), type: SectionType.NEXT_PAGE }, footers: { default: footer() }, children: body },
  ],
});
Packer.toBuffer(doc).then((buf) => { const out = path.join(__dirname, 'Smart_Farming_Web_System_Thesis_HAS_Thashmila.docx'); fs.writeFileSync(out, buf); console.log('wrote', out, buf.length); });
