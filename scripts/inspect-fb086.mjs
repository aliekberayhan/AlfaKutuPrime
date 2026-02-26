import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const dir = path.join('D:', 'Desktop', 'Autoplanung test');
const file = path.join(dir, 'FB086_Fertigungsplanung 11.07.2025.xlsx');
if (!fs.existsSync(file)) {
  console.log('NOT FOUND:', file);
  process.exit(1);
}
const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log('=== FB086 (first 30 rows, first 25 cols) ===');
for (let r = 0; r < Math.min(30, raw.length); r++) {
  const row = raw[r];
  const line = row.slice(0, 25).map((c) => String(c ?? '').slice(0, 12)).join(' | ');
  console.log('R' + r + ':', line);
}
// Find row that contains "Maschine" or "Projekt"
let headerRow = -1;
for (let r = 0; r < Math.min(50, raw.length); r++) {
  const row = raw[r] || [];
  const joined = row.map((c) => String(c ?? '')).join(' ');
  if (/maschine|projekt|produkt|material/i.test(joined)) {
    headerRow = r;
    console.log('\nHeader-like row index:', r, '->', row.slice(0, 20));
    break;
  }
}
