/**
 * FB086 + Test.xlsx ile NN ataması doğrula: combined data'dan KB, test siparişlerine makine ataması.
 */
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const dir = path.join('D:', 'Desktop', 'Autoplanung test');
const fbPath = path.join(dir, 'FB086_Fertigungsplanung 11.07.2025.xlsx');
const testPath = path.join(dir, 'Test.xlsx');

function clean(x) {
  const s = String(x ?? '').trim();
  return ['nan', 'nat', 'none'].includes(s.toLowerCase()) ? '' : s;
}
function sizeNum(s) {
  const t = clean(s).toLowerCase();
  try {
    const part = t.includes('x') ? t.split('x')[0] : t;
    return parseFloat(part.replace(',', '.'));
  } catch {
    return null;
  }
}
function tokenOverlap(a, b) {
  const tokens = (s) => new Set(clean(s).toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ').split(/\s+/).filter(Boolean));
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach((t) => { if (tb.has(t)) inter++; });
  const union = ta.size + tb.size - inter;
  return union > 0 ? inter / union : 0;
}
function sim(order, kb) {
  let score = 0;
  const op = clean(order.Product).toLowerCase();
  const kp = clean(kb.Product).toLowerCase();
  if (op && op === kp) score += 4;
  else score += 3 * tokenOverlap(order.Product, kb.Product);
  if (clean(order.Color) && clean(order.Color).toLowerCase() === clean(kb.Color).toLowerCase()) score += 3;
  if (clean(order.Material) && clean(order.Material).toLowerCase() === clean(kb.Material).toLowerCase()) score += 2;
  const an = sizeNum(order.Size);
  const bn = sizeNum(kb.Size);
  if (an != null && bn != null) score += Math.max(0, 1.5 - 0.1 * Math.abs(an - bn));
  else if (clean(order.Size) && clean(order.Size).toLowerCase() === clean(kb.Size).toLowerCase()) score += 0.5;
  return score + 0.01;
}

function findHeaderRow(raw) {
  const aliasKeys = {
    product: ['product', 'artikel', 'produkt', 'item', 'bezeichnung'],
    color: ['color', 'farbe', 'renk'],
    size: ['size', 'maß', 'mass', 'länge'],
    material: ['material', 'werkstoff'],
    machine: ['maschine', 'makine', 'machine'],
  };
  let bestRow = 0;
  let bestScore = -1;
  for (let r = 0; r < Math.min(30, raw.length); r++) {
    const row = raw[r] || [];
    const cells = row.map((c) => String(c ?? '').trim().toLowerCase());
    let matched = 0;
    let hasMachine = false;
    for (const [key, aliases] of Object.entries(aliasKeys)) {
      if (key === 'machine') {
        if (aliases.some((a) => cells.some((c) => !/material/.test(c) && c.includes(a)))) {
          hasMachine = true;
          matched++;
        }
      } else {
        if (aliases.some((a) => cells.some((c) => c.includes(a)))) matched++;
      }
    }
    if (hasMachine && matched > bestScore) {
      bestScore = matched;
      bestRow = r;
    }
  }
  return bestRow;
}

function autodetectColumns(header) {
  const lc = new Map();
  header.forEach((h) => {
    const t = String(h ?? '').trim();
    lc.set(t.toLowerCase(), t);
  });
  const pick = (...keys) => {
    for (const key of keys) {
      const k = key.toLowerCase();
      if (lc.has(k)) return lc.get(k);
      for (const [cand, orig] of lc) {
        if (cand.includes(k)) return orig;
      }
    }
    return null;
  };
  return {
    Product: pick('Product', 'Artikel', 'Produkt'),
    Color: pick('Color', 'Farbe'),
    Size: pick('Size', 'Maß', 'Länge'),
    Material: pick('Material'),
    Machine: (() => {
      const m = pick('Machine', 'Maschine');
      if (m && !/Material/i.test(m)) return m;
      return null;
    })(),
  };
}

// Build KB from FB086
const wbFb = XLSX.readFile(fbPath);
const rawFb = XLSX.utils.sheet_to_json(wbFb.Sheets[wbFb.SheetNames[0]], { header: 1, defval: '' });
const hr = findHeaderRow(rawFb);
const headerFb = (rawFb[hr] || []).map((h) => String(h ?? '').trim());
const mapFb = autodetectColumns(headerFb);
const colIdx = (key) => headerFb.findIndex((x) => String(x ?? '').trim() === mapFb[key]);
const idx = { Product: colIdx('Product'), Color: colIdx('Color'), Size: colIdx('Size'), Material: colIdx('Material'), Machine: colIdx('Machine') };

const kbRows = [];
for (let r = hr + 1; r < rawFb.length; r++) {
  const row = rawFb[r] || [];
  const machine = idx.Machine >= 0 ? clean(row[idx.Machine]) : '';
  if (!machine) continue;
  kbRows.push({
    Product: idx.Product >= 0 ? clean(row[idx.Product]) : '',
    Color: idx.Color >= 0 ? clean(row[idx.Color]) : '',
    Size: idx.Size >= 0 ? clean(row[idx.Size]) : '',
    Material: idx.Material >= 0 ? clean(row[idx.Material]) : '',
    Machine: machine,
  });
}
console.log('KB satır sayısı (FB086, Machine dolu):', kbRows.length);
const machines = [...new Set(kbRows.map((r) => r.Machine))].sort();
console.log('Makineler:', machines.slice(0, 15).join(', '), machines.length > 15 ? '...' : '');

// Test.xlsx orders
const wbTest = XLSX.readFile(testPath);
const rawTest = XLSX.utils.sheet_to_json(wbTest.Sheets[wbTest.SheetNames[0]], { header: 1, defval: '' });
const headerTest = (rawTest[0] || []).map((h) => String(h ?? '').trim());
const mapTest = autodetectColumns(headerTest);
const getCol = (key) => {
  const h = mapTest[key];
  if (!h) return -1;
  return headerTest.findIndex((x) => String(x ?? '').trim() === h);
};
const g = { Product: getCol('Product'), Color: getCol('Color'), Size: getCol('Size'), Material: getCol('Material') };
const get = (row, i) => (i >= 0 ? clean(row[i]) : '');

console.log('\n--- İlk 10 test siparişi -> NN atanan makine ---');
const sample = kbRows.length > 8000 ? kbRows.filter((_, i) => i % Math.ceil(kbRows.length / 8000) === 0) : kbRows;
for (let r = 1; r <= Math.min(10, rawTest.length - 1); r++) {
  const row = rawTest[r] || [];
  const order = {
    Product: get(row, g.Product),
    Color: get(row, g.Color),
    Size: get(row, g.Size),
    Material: get(row, g.Material),
  };
  let best = null;
  let bestScore = -1;
  for (const kb of sample) {
    const s = sim(order, kb);
    if (s > bestScore) {
      bestScore = s;
      best = kb;
    }
  }
  const machine = best ? clean(best.Machine) : '—';
  console.log(`  ${r}. ${order.Product} | ${order.Material} | ${order.Color} | ${order.Size} -> ${machine} (skor: ${bestScore?.toFixed(2)})`);
}

const byMachine = {};
kbRows.forEach((r) => { byMachine[r.Machine] = (byMachine[r.Machine] || 0) + 1; });
console.log('\nKB makine dağılımı (örnek):', Object.entries(byMachine).slice(0, 10));
