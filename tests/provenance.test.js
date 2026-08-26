const assert = require('node:assert/strict');

const { loadIndexContext } = require('../scripts/lib/corpus');
const { resolveCorpusProvenance } = require('../scripts/lib/provenance');

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isOnOrAfter(left, right) {
  return left >= right;
}

const data = loadIndexContext();
const provenance = data.PROVENANCE;

assert.ok(provenance, 'PROVENANCE metadata must exist');
assert.deepEqual(
  Array.from(provenance.evidenceLevels),
  ['primary-docs', 'secondary', 'partial', 'unknown'],
  'evidence level enum must stay explicit and documented'
);
assert.ok(isIsoDate(provenance.defaultCheckedAt), 'defaultCheckedAt must be an ISO date');

const resolvedClaims = resolveCorpusProvenance(data);
assert.ok(resolvedClaims.length > 0, 'expected source-backed claims to validate');

const knownClaimIds = new Set(resolvedClaims.map(claim => claim.id));
for (const claimId of Object.keys(provenance.claims || {})) {
  assert.ok(knownClaimIds.has(claimId), `${claimId} is not a known source-backed claim`);
}

for (const claim of resolvedClaims) {
  const meta = claim.provenance;
  const override = (provenance.claims && provenance.claims[claim.id]) || {};
  assert.ok(isHttpsUrl(meta.sourceUrl), `${claim.id} needs a valid HTTPS source URL`);
  assert.ok(isIsoDate(meta.checkedAt), `${claim.id} needs an ISO checked-at date`);
  assert.ok(provenance.evidenceLevels.includes(meta.evidenceLevel), `${claim.id} has an unknown evidence level`);
  assert.ok(meta.sourceTitle || meta.sourcePublisher, `${claim.id} needs a source title or publisher`);

  if (override.corpusUpdatedAt) {
    assert.ok(isIsoDate(override.corpusUpdatedAt), `${claim.id} needs an ISO corpus-updated date`);
    assert.ok(
      isOnOrAfter(meta.checkedAt, override.corpusUpdatedAt),
      `${claim.id} checkedAt cannot predate its recorded corpus update`
    );
  }

  if (claim.status) {
    assert.ok(
      meta.evidenceLevel === 'partial' || meta.evidenceLevel === 'unknown',
      `${claim.id} must stay explicitly marked partial or unknown`
    );
    assert.ok(meta.claimNote, `${claim.id} should explain why its evidence is partial or unknown`);
  }
}

const gaps = resolvedClaims
  .filter(claim => claim.provenance.evidenceLevel === 'partial' || claim.provenance.evidenceLevel === 'unknown')
  .map(claim => claim.id)
  .sort();

assert.ok(gaps.length > 0, 'expected at least one explicitly tracked provenance gap for incremental migration');
console.log(`Provenance checks passed for ${resolvedClaims.length} source-backed claims.`);
console.log(`Evidence gaps currently tracked (${gaps.length}): ${gaps.join(', ')}`);
