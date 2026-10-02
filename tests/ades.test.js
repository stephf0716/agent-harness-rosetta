const assert = require('node:assert/strict');
const vm = require('node:vm');

const { loadIndexContext } = require('../scripts/lib/corpus');

const data = loadIndexContext();
const ades = data.ADES;
const osIds = data.ADE_OS.map(o => o.id).filter(id => id !== 'all');

assert.ok(ades.length > 0, 'ADES must not be empty');
assert.equal(new Set(ades.map(r => r.id)).size, ades.length, 'ADE ids must be unique');
assert.ok(data.TABS.some(t => t.id === 'ades' && t.hash === 'ades'), 'the ADE tab must keep its #ades hash');

const required = ['name', 'kind', 'maker', 'agents', 'platforms', 'iso', 'review', 'price', 'license',
  'remote', 'extras', 'maturity', 'note', 'url'];
for (const r of ades) {
  for (const key of required) {
    assert.ok(typeof r[key] === 'string' && r[key].trim(), `${r.id} needs ${key}`);
  }
  assert.ok(data.ADE_DRIVE[r.drive], `${r.id} has an unknown drive value`);
  assert.ok(data.ADE_PAY[r.pay], `${r.id} has an unknown pay value`);
  const os = Object.keys(r.os || {});
  assert.ok(os.length, `${r.id} needs at least one platform`);
  for (const key of os) assert.ok(osIds.includes(key), `${r.id} has an unknown platform ${key}`);
  assert.ok(['verified', 'partial'].includes(r.status), `${r.id} needs a verified or partial status`);
  if (r.status === 'partial') {
    assert.ok(r.caveat && r.caveat.trim(), `${r.id} is partial and must say why in caveat`);
  } else {
    assert.equal(r.caveat, undefined, `${r.id} is verified and should not carry a caveat`);
  }
}

// The platform filter must keep a row iff it has a build for that platform.
const context = { ...data, adeState: { os: 'all', detail: null } };
const start = data.html.indexOf('function adeRows(');
const end = data.html.indexOf('\nfunction ', start + 1);
assert.ok(start >= 0 && end > start, 'could not extract adeRows');
vm.runInNewContext(data.html.slice(start, end), context);
assert.equal(context.adeRows().length, ades.length, 'Any must show every ADE');
for (const id of osIds) {
  context.adeState.os = id;
  const shown = context.adeRows().map(r => r.id).sort();
  const expected = ades.filter(r => r.os[id]).map(r => r.id).sort();
  assert.deepEqual(shown, expected, `platform filter ${id} must match each row's builds`);
}

console.log(`ADE checks passed for ${ades.length} tools.`);
