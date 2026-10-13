const assert = require('node:assert/strict');
const { test } = require('node:test');
const XLSX = require('xlsx');
const { GetData, write2csv } = require('../dist/index.js');

class Row {
  constructor() {
    this.name = '';
    this.amount = 0;
    this.enabled = false;
    this.date = new Date(0);
  }
}

test('CSV reading preserves BOM, blank-line handling and type conversion', () => {
  const csv = Buffer.from(
    '\uFEFFname,amount,enabled,date\r\n' +
    'Alice,12.5,true,2026-10-13T00:00:00Z\r\n\r\n' +
    'Bob,0,0,\r\n',
  );
  const rows = GetData.getFromCsv(csv, Row);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, 'Alice');
  assert.equal(rows[0].amount, 12.5);
  assert.equal(rows[0].enabled, true);
  assert.equal(rows[0].date.toISOString(), '2026-10-13T00:00:00.000Z');
  assert.equal(rows[1].name, 'Bob');
  assert.equal(rows[1].amount, 0);
  assert.equal(rows[1].enabled, false);
  assert.equal(rows[1].date.getTime(), 0);
});

test('CSV reading maps Chinese headers and ignores unknown fields', () => {
  const csv = Buffer.from('姓名,金额,启用,额外列\n张三,8.5,True,ignored\n');
  const [row] = GetData.getFromCsv(csv, Row, {
    姓名: 'name',
    金额: 'amount',
    启用: 'enabled',
  });

  assert.equal(row.name, '张三');
  assert.equal(row.amount, 8.5);
  assert.equal(row.enabled, true);
  assert.equal(row.date.getTime(), 0);
  assert.deepEqual(Object.keys(row), ['name', 'amount', 'enabled', 'date']);
});

test('CSV reading preserves quoted commas, escaped quotes and embedded newlines', () => {
  const csv = Buffer.from('name,amount,enabled,date\n"项目 ""A"",一号\n二号",7,1,\n');
  const [row] = GetData.getFromCsv(csv, Row);

  assert.equal(row.name, '项目 "A",一号\n二号');
  assert.equal(row.amount, 7);
  assert.equal(row.enabled, true);
});

test('duplicate CSV columns retain the existing last-value behavior', () => {
  const [row] = GetData.getFromCsv(Buffer.from('name,name\nfirst,last\n'), Row);

  assert.equal(row.name, 'last');
});

test('CSV reading still rejects rows with inconsistent column counts', () => {
  assert.throws(
    () => GetData.getFromCsv(Buffer.from('name,amount\nAlice\n'), Row),
    { code: 'CSV_RECORD_INCONSISTENT_COLUMNS' },
  );
});

test('XLSX reading uses the first worksheet and maps its headers', () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['姓名', '金额', '启用'],
      ['项目甲', 21.5, 'true'],
      ['项目乙', 0, 'false'],
    ]),
    'First',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['姓名'], ['not selected']]),
    'Second',
  );
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const rows = GetData.getFromXlsx(buffer, Row, {
    姓名: 'name',
    金额: 'amount',
    启用: 'enabled',
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, '项目甲');
  assert.equal(rows[0].amount, 21.5);
  assert.equal(rows[0].enabled, true);
  assert.equal(rows[1].name, '项目乙');
  assert.equal(rows[1].amount, 0);
  assert.equal(rows[1].enabled, false);
});

test('CSV export and import round trip preserves supported field values', () => {
  const row = new Row();
  row.name = '项目 "A",一号\n二号';
  row.amount = 12.5;
  row.enabled = true;
  row.date = new Date(2026, 9, 13);

  const csv = write2csv([row]);
  const rows = GetData.getFromCsv(Buffer.from(csv), Row);

  assert.deepEqual(rows, [row]);
});

test('special CSV headers cannot replace the returned data instance prototype', () => {
  const csv = Buffer.from('__proto__,__proto__,constructor,name\nfirst,second,ignored,Alice\n');
  const [row] = GetData.getFromCsv(csv, Row);

  assert.equal(Object.getPrototypeOf(row), Row.prototype);
  assert.equal(row.constructor, Row);
  assert.equal(row.name, 'Alice');
  assert.deepEqual(Object.keys(row), ['name', 'amount', 'enabled', 'date']);
});
