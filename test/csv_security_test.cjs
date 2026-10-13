const assert = require('node:assert/strict');
const { test } = require('node:test');
const { parse } = require('csv-parse/sync');

test('duplicate __proto__ columns do not replace the record prototype', () => {
  const [record] = parse('__proto__,__proto__,name\nfirst,second,Alice\n', {
    columns: true,
    group_columns_by_name: true,
  });

  assert.equal(Object.getPrototypeOf(record), Object.prototype);
  assert.equal(Object.prototype.hasOwnProperty.call(record, '__proto__'), true);
  assert.deepEqual(record.__proto__, ['first', 'second']);
  assert.equal(record.name, 'Alice');
});
