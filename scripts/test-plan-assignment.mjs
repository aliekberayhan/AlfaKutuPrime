/**
 * Test.xlsx ile makine ataması ve Reihenfolge'u doğrula.
 * plan.component ile aynı mantık: KB yoksa M1, Reihenfolge makine bazlı 1,2,3...
 */
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const testPath = path.join('D:', 'Desktop', 'Autoplanung test', 'Test.xlsx');
if (!fs.existsSync(testPath)) {
  console.log('Test.xlsx bulunamadı:', testPath);
  process.exit(1);
}

const wb = XLSX.readFile(testPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const headers = raw[0].map((h) => String(h ?? '').trim());

const col = (name) => {
  const i = headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));
  return i >= 0 ? i : -1;
};
const maschineCol = headers.findIndex((h) => /maschine|makine|machine/i.test(String(h)) && !/material/i.test(String(h)));
const reihenfolgeCol = headers.findIndex((h) => /reihenfolge|sıra|sequence/i.test(String(h)));

console.log('Headers:', headers.slice(0, 10).join(', '), '...');
console.log('Maschine column index:', maschineCol, maschineCol >= 0 ? headers[maschineCol] : '');
console.log('Reihenfolge column index:', reihenfolgeCol, reihenfolgeCol >= 0 ? headers[reihenfolgeCol] : '');

// KB yok simülasyonu: tüm satırlara M1 ata
const assignedMachine = 'M1';
const dataRows = raw.slice(1);
const byMachine = new Map();
dataRows.forEach((row, idx) => {
  if (!byMachine.has(assignedMachine)) byMachine.set(assignedMachine, []);
  byMachine.get(assignedMachine).push(idx);
});
const seqMap = new Map();
byMachine.get(assignedMachine).forEach((idx, i) => seqMap.set(idx, i + 1));

console.log('\n--- İlk 5 satır: Maschine ve Reihenfolge atanmış mı? ---');
for (let r = 0; r < Math.min(5, dataRows.length); r++) {
  const row = dataRows[r];
  const origMaschine = maschineCol >= 0 ? String(row[maschineCol] ?? '') : '';
  const origReihe = reihenfolgeCol >= 0 ? String(row[reihenfolgeCol] ?? '') : '';
  const assigned = assignedMachine;
  const seq = seqMap.get(r);
  console.log(`Row ${r + 1}: Orijinal Maschine="${origMaschine}" Reihenfolge="${origReihe}" -> Atanan Maschine="${assigned}" Reihenfolge=${seq}`);
}

console.log('\nÖzet: KB yokken tüm satırlara M1 atandı, Reihenfolge 1..N (N=' + dataRows.length + ').');
console.log('Plan sayfasında Test.xlsx yüklenince Maschine ve Reihenfolge sütunları bu değerlerle dolu görünmeli.');
