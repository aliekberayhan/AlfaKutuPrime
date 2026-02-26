import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const testPath = path.join('D:', 'Desktop', 'Autoplanung test', 'Test.xlsx');
if (!fs.existsSync(testPath)) {
  console.log('NOT FOUND:', testPath);
  process.exit(1);
}
const wb = XLSX.readFile(testPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log('=== Test.xlsx ===');
console.log('Headers:', raw[0]);
console.log('Row count:', raw.length);
console.log('First 2 data rows (as array):');
for (let r = 1; r <= Math.min(2, raw.length - 1); r++) {
  console.log('Row', r, raw[r]);
}
