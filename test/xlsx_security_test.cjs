const assert = require('node:assert/strict');
const { test } = require('node:test');
const XLSX = require('xlsx');

test('SheetJS version excludes releases affected by CVE-2024-22363', () => {
  assert.match(XLSX.version, /^\d+\.\d+\.\d+$/);
  const [major, minor, patch] = XLSX.version.split('.').map(Number);
  const patched = major > 0 || minor > 20 || (minor === 20 && patch >= 2);

  assert.ok(patched, `SheetJS ${XLSX.version} is affected; use version 0.20.2 or newer`);
});
