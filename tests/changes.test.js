const assert = require('node:assert/strict');

const { loadIndexContext } = require('../scripts/lib/corpus');

const data = loadIndexContext();
const tabIds = new Set(data.TABS.map(t => t.id));

assert.ok(data.CHANGES.length > 0, 'CHANGES must not be empty');
let prev = '9999-99-99';
for (const c of data.CHANGES) {
  assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/, `${c.date} must be an ISO date`);
  assert.ok(c.date <= prev, `CHANGES must stay newest first (${c.date} after ${prev})`);
  prev = c.date;
  assert.ok(typeof c.text === 'string' && c.text.trim(), `${c.date} entry needs text`);
  for (const id of c.tabs) assert.ok(tabIds.has(id), `${c.date} entry names unknown tab ${id}`);
}
// The #changes hash relies on the collapsed list at the foot of the page.
assert.match(data.html, /<details class="changes" id="changes">/);

console.log(`Changelog checks passed for ${data.CHANGES.length} entries.`);

// The list shows only the last month, measured from the reader's today.
const vm = require('node:vm');
const ctx = { CHANGES: [
  { date: '2026-10-01', tabs: [], text: 'a' },
  { date: '2026-09-01', tabs: [], text: 'b' },
  { date: '2026-08-31', tabs: [], text: 'c' }
] };
const start = data.html.indexOf('function recentChanges(');
const end = data.html.indexOf('\nfunction ', start + 1);
vm.runInNewContext(data.html.slice(start, end), ctx);
assert.deepEqual(ctx.recentChanges(new Date(2026, 9, 1)).map(c => c.text), ['a', 'b'],
  'entries a month old or newer show; older ones drop off');
assert.equal(ctx.recentChanges(new Date(2027, 0, 1)).length, 0);
