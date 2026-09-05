const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '../..');
const indexPath = path.join(repoRoot, 'index.html');

function loadIndexContext() {
  const html = fs.readFileSync(indexPath, 'utf8');
  const dataStart = html.indexOf('var BUILD =');
  const dataEnd = html.indexOf('function esc(');

  assert.ok(dataStart >= 0 && dataEnd > dataStart, 'could not extract comparison data block');

  const context = {};
  vm.runInNewContext(html.slice(dataStart, dataEnd), context);
  return { html, ...context };
}

function pushClaim(claims, claim) {
  assert.ok(
    typeof claim.url === 'string' && claim.url.trim().length > 0,
    `${claim.id} is missing a source URL`
  );
  claims.push(claim);
}

function collectSourceClaims(data = loadIndexContext()) {
  const claims = [];

  data.TOOLS.forEach(tool => {
    pushClaim(claims, {
      id: `tool/${tool.id}`,
      scope: 'tool',
      url: tool.url,
      status: null,
      entry: tool
    });
  });

  data.LAYERS.forEach(layer => {
    Object.entries(layer.cells).forEach(([harnessId, cell]) => {
      pushClaim(claims, {
        id: `layer/${layer.id}/${harnessId}`,
        scope: 'layer',
        url: cell.url,
        status: null,
        entry: cell
      });
    });
  });

  data.PORTABILITY.forEach(row => {
    pushClaim(claims, {
      id: `portability/${row.id}`,
      scope: 'portability',
      url: row.url,
      status: row.status === 'verified' ? null : row.status,
      entry: row
    });
  });

  data.PERMISSIONS.forEach(row => {
    pushClaim(claims, {
      id: `permissions/${row.id}`,
      scope: 'permissions',
      url: row.url,
      status: row.status === 'verified' ? null : row.status,
      entry: row
    });
  });

  data.INFRA.forEach(row => {
    pushClaim(claims, {
      id: `infra/${row.id}`,
      scope: 'infra',
      url: row.url,
      status: row.status === 'verified' ? null : row.status,
      entry: row
    });

    if (row.free) {
      pushClaim(claims, {
        id: `infra-free/${row.id}`,
        scope: 'infra-free',
        url: row.free.freeUrl,
        status: row.free.freeStatus || null,
        entry: row.free,
        parent: row
      });
    }
  });

  return claims;
}

module.exports = {
  indexPath,
  loadIndexContext,
  collectSourceClaims
};
