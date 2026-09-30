const assert = require('node:assert/strict');
const vm = require('node:vm');

const { loadIndexContext } = require('../scripts/lib/corpus');

const data = loadIndexContext();
const context = { ...data, pmState: { filter: 'all', detail: 't3' } };
for (const name of ['esc', 'pmConnections', 'pmUsable', 'pmShownTools', 'pmMechCell', 'pmToolRow']) {
  const start = data.html.indexOf(`function ${name}(`);
  const end = data.html.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0 && end > start, `could not extract ${name}`);
  vm.runInNewContext(data.html.slice(start, end), context);
}

// Every cell must retain a known method, whether it uses the original string
// format or lists several direct/indirect connections.
for (const tool of data.TOOLS) {
  for (const credential of data.CREDENTIALS) {
    const connections = context.pmConnections(tool, credential.id);
    assert.ok(connections.length, `${tool.id}/${credential.id} needs a connection`);
    for (const connection of connections) {
      assert.ok(data.MECH[connection.method], `${tool.id}/${credential.id} has an unknown method`);
      if (connection.via !== undefined) {
        assert.ok(typeof connection.via === 'string' && connection.via.trim(), 'via needs an agent name');
      }
    }
    assert.doesNotThrow(() => context.pmMechCell(tool, credential));
  }
}

const claude = data.CREDENTIALS.find(c => c.id === 'claude_sub');
const chatgpt = data.CREDENTIALS.find(c => c.id === 'chatgpt');
const zed = data.TOOLS.find(t => t.id === 'zed');
const t3 = data.TOOLS.find(t => t.id === 't3');

assert.equal(context.pmUsable(zed, [claude], 'sub'), false, 'Zed Claude must stay API-key only');
assert.equal(context.pmUsable(zed, [claude], 'usable'), true);
assert.match(context.pmMechCell(zed, claude), /API Key/);
assert.doesNotMatch(context.pmMechCell(zed, claude), /Sign-in/);
assert.match(context.pmMechCell(zed, chatgpt), /Sign-in[\s\S]*API Key/, 'Zed must show both OpenAI methods');
assert.match(context.pmMechCell(t3, claude), /via Claude Code/, 'T3 must expose the agent in the cell');
assert.match(context.pmToolRow(t3, data.CREDENTIALS), /via OpenCode/);

// A sign-in appearing after an API key still qualifies the row. A blocked
// subscription plus a usable API key qualifies only for the provider filter.
const mixed = { name: 'Mixed', support: { claude_sub: ['apikey', { method: 'oauth', via: 'Agent' }] } };
const restricted = { name: 'Restricted', support: { claude_sub: ['restricted', 'apikey'] } };
assert.equal(context.pmUsable(mixed, [claude], 'sub'), true);
assert.equal(context.pmUsable(restricted, [claude], 'sub'), false);
assert.equal(context.pmUsable(restricted, [claude], 'usable'), true);
assert.equal(context.pmUsable({ support: {} }, [claude], 'usable'), false);
assert.equal(context.pmUsable(t3, [], 'sub'), false);

const opencode = data.TOOLS.find(t => t.id === 'opencode');
assert.equal(context.pmUsable(opencode, [claude], 'usable'), true, 'OpenCode must allow Anthropic API keys');
assert.equal(context.pmUsable(opencode, [claude], 'sub'), false, 'OpenCode must not imply Claude subscription access');
const cline = data.TOOLS.find(t => t.id === 'cline');
assert.equal(context.pmUsable(cline, [claude], 'sub'), true, 'Cline Claude Code sign-in must qualify');

context.pmState.filter = 'sub';
assert.ok(context.pmShownTools([claude]).some(t => t.id === 't3'));
assert.ok(!context.pmShownTools([claude]).some(t => t.id === 'zed'));
context.pmState.filter = 'usable';
assert.ok(context.pmShownTools([claude]).some(t => t.id === 'zed'));

const untrusted = { name: '<Tool>', support: { claude_sub: { method: 'oauth', via: '"><img src=x onerror=alert(1)>' } } };
const rendered = context.pmMechCell(untrusted, claude);
assert.doesNotMatch(rendered, /<img/);
assert.match(rendered, /via &quot;&gt;&lt;img/);

console.log(`Provider checks passed for ${data.TOOLS.length} tools, multiple methods, indirect routes, and filters.`);
