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

assert.equal(harnesses.some(h => h.id === 'jan'), false, 'Jan must be removed only from Harness layers');
assert.equal(harnesses.some(h => h.id === 'pi'), true, 'Pi must appear in Harness layers');
assert.match(providerBlock, /id: "jan"/, 'Jan must remain in Provider matrix');
assert.equal(portability.some(h => h.id === 'jan'), true, 'Jan must remain in Portability');
assert.equal(permissions.some(h => h.id === 'jan'), true, 'Jan must remain in Permissions');

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
assert.match(hermesBundle.loc, /plugin\.yaml/, 'Hermes L4 must describe the plugin package structure');
assert.match(hermesBundle.desc, /tools.*hooks.*skills/i, 'Hermes L4 must describe what plugins bundle');

const cursorBundle = layers.find(layer => layer.id === 'c-bundle').cells.cursor;
assert.equal(cursorBundle.term, 'Plugins', 'Cursor L4 must use its current Plugins layer');
assert.match(cursorBundle.loc, /plugin\.json/, 'Cursor L4 must include the plugin manifest');
assert.match(cursorBundle.desc, /rules.*skills.*agents.*MCP/i, 'Cursor L4 must describe its distributable plugin contents');

const openClawBundle = layers.find(layer => layer.id === 'c-bundle').cells.openclaw;
assert.equal(openClawBundle.term, 'Plugin bundles', 'OpenClaw L4 must expose its bundle compatibility layer');
assert.match(openClawBundle.desc, /Agent Plugins.*Codex.*Claude.*Cursor/i, 'OpenClaw L4 must describe supported external bundle formats');

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
