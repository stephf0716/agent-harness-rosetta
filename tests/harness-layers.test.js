const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');

const dataStart = html.indexOf('var HARNESSES =');
const dataEnd = html.indexOf('var MCPKIND =');
assert.ok(dataStart >= 0 && dataEnd > dataStart, 'could not extract harness data block');
const context = {};
vm.runInNewContext(html.slice(dataStart, dataEnd), context);

const harnesses = context.HARNESSES;
const layers = context.LAYERS;
const portability = context.PORTABILITY;
const permissions = context.PERMISSIONS;
const providerBlock = html.slice(html.indexOf('var TOOLS ='), dataStart);

// Jan is a general AI tool rather than a harness, so it belongs to the provider
// matrix alone; the other tabs are keyed by HARNESSES and would drop it anyway.
assert.equal(harnesses.some(h => h.id === 'jan'), false, 'Jan must stay out of Harness layers');
assert.match(providerBlock, /id: "jan"/, 'Jan must remain in Provider matrix');
assert.equal(portability.some(h => h.id === 'jan'), false, 'Jan must stay out of Portability');
assert.equal(permissions.some(h => h.id === 'jan'), false, 'Jan must stay out of Permissions');

// every harness-keyed tab covers every harness — a row nobody renders is a bug
for (const h of harnesses) {
  assert.equal(portability.some(r => r.id === h.id), true, `Portability is missing ${h.id}`);
  assert.equal(permissions.some(r => r.id === h.id), true, `Permissions is missing ${h.id}`);
}
// ...and no row outlives the harness it belongs to: alphaHarnessOrder walks
// HARNESSES, so an orphaned id would silently never render again.
for (const r of [...portability, ...permissions]) {
  assert.equal(harnesses.some(h => h.id === r.id), true, `orphaned row id ${r.id}`);
}
// the rows are sorted by label at load, so a row without one throws inside the
// single inline script and takes every renderer down with it
for (const h of harnesses) {
  assert.equal(typeof h.label === 'string' && h.label.length > 0, true, `${h.id} needs a label`);
}

for (const layer of layers) {
  for (const harness of harnesses) {
    const cell = layer.cells[harness.id];
    assert.ok(cell, `${layer.id} is missing ${harness.id}`);
    assert.match(cell.url || '', /^https:\/\//, `${harness.id}/${layer.id} needs an HTTPS reference URL`);
  }
}

assert.equal(
  layers.find(layer => layer.id === 'c-instr').cells.codex.url,
  'https://learn.chatgpt.com/docs/agent-configuration/agents-md',
  'Codex instructions must use the requested reference'
);

const hermesBundle = layers.find(layer => layer.id === 'c-bundle').cells.hermes;
assert.equal(hermesBundle.term, 'Plugins', 'Hermes L4 must use the current Plugins terminology');
assert.match(hermesBundle.desc, /plugin\.yaml/, 'Hermes L4 must name the plugin manifest');
assert.match(hermesBundle.desc, /tools.*hooks.*skills/i, 'Hermes L4 must describe what plugins bundle');

const cursorBundle = layers.find(layer => layer.id === 'c-bundle').cells.cursor;
assert.equal(cursorBundle.term, 'Plugins', 'Cursor L4 must use its current Plugins layer');
assert.match(cursorBundle.desc, /plugin\.json/, 'Cursor L4 must name the plugin manifest');
assert.match(cursorBundle.desc, /rules.*skills.*agents.*MCP/i, 'Cursor L4 must describe its distributable plugin contents');

const openClawBundle = layers.find(layer => layer.id === 'c-bundle').cells.openclaw;
assert.equal(openClawBundle.term, 'Plugin bundles', 'OpenClaw L4 must expose its bundle compatibility layer');
assert.match(openClawBundle.desc, /Agent Plugins.*Codex.*Claude.*Cursor/i, 'OpenClaw L4 must describe supported external bundle formats');

// L4 cells carry the bundle payload only — manifests and install paths live in
// the layer card, so the column stays comparable row to row.
for (const [id, cell] of Object.entries(layers.find(layer => layer.id === 'c-bundle').cells)) {
  assert.doesNotMatch(
    cell.loc || '',
    /\.(json|yaml|toml)\b/,
    `c-bundle/${id} should list payload, not a manifest filename`
  );
}

const currentTerms = {
  'c-bundle/goose': 'Plugins',
  'c-bundle/osaurus': 'Claude plugin imports',
  'c-bundle/copilot': 'Plugins',
  'c-bundle/opencode': 'Plugins',
  'c-mcp/openclaw': 'Built-in tools + MCP servers',
  'c-agent/copilot': 'Custom agents / subagents',
  'c-agent/pi': 'Subagent example extension'
};
for (const [key, expected] of Object.entries(currentTerms)) {
  const [layerId, harnessId] = key.split('/');
  assert.equal(layers.find(layer => layer.id === layerId).cells[harnessId].term, expected, `${key} terminology is stale`);
}

assert.match(html, /class="ref"[^>]*href="' \+ esc\(cell\.url\)/, 'layer explanations must render a reference link');
assert.match(html, /target="_blank"/, 'reference links should open without replacing the comparison');
assert.match(html, /rel="noopener noreferrer"/, 'external reference links need safe rel attributes');

console.log(`Harness layer checks passed for ${harnesses.length} harnesses × ${layers.length} layers.`);
