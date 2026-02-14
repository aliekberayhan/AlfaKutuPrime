#!/usr/bin/env node
/**
 * Simple importer: reads D:/AlfaKutu/Products.xlsx and writes src/assets/data/products.json
 * Usage: node tools/import-products.js
 *
 * Requires package: xlsx
 */
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const INPUT = 'D:/AlfaKutu/Products.xlsx';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'data');
const OUTPUT = path.join(OUTPUT_DIR, 'products.json');

if (!fs.existsSync(INPUT)) {
    console.error(`Input file not found: ${INPUT}`);
    process.exit(1);
}

const workbook = xlsx.readFile(INPUT);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { defval: null });

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(json, null, 2), 'utf8');
console.log(`Wrote ${json.length} rows to ${OUTPUT}`);

