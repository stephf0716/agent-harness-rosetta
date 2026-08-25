const assert = require('node:assert/strict');
const { URL } = require('node:url');

const { collectSourceClaims, loadIndexContext } = require('./corpus');

function normalizeHost(rawUrl) {
  return new URL(rawUrl).hostname.toLowerCase();
}

function publisherForUrl(rawUrl, provenance) {
  const host = normalizeHost(rawUrl);
  return (provenance.publishers && provenance.publishers[host]) || host.replace(/^www\./, '');
}

function defaultEvidenceLevel(claim) {
  if (claim.status === 'partial') return 'partial';
  if (claim.status === 'unverified' || claim.status === 'unknown') return 'unknown';
  return 'primary-docs';
}

function defaultClaimNote(claim, evidenceLevel, provenance) {
  if (!claim.status) return null;
  if (!provenance.defaultNotes) return null;
  return provenance.defaultNotes[evidenceLevel] || null;
}

function resolveClaimProvenance(claim, provenance) {
  const override = (provenance.claims && provenance.claims[claim.id]) || {};
  const sourceUrl = override.sourceUrl || claim.url;
  const evidenceLevel = override.evidenceLevel || defaultEvidenceLevel(claim);
  const checkedAt = override.checkedAt || provenance.defaultCheckedAt;
  const sourceTitle = override.sourceTitle || null;
  const sourcePublisher = override.sourcePublisher || publisherForUrl(sourceUrl, provenance);
  const claimNote = Object.prototype.hasOwnProperty.call(override, 'claimNote')
    ? override.claimNote
    : defaultClaimNote(claim, evidenceLevel, provenance);

  return {
    sourceUrl,
    sourceTitle,
    sourcePublisher,
    checkedAt,
    evidenceLevel,
    claimNote
  };
}

function resolveCorpusProvenance(data = loadIndexContext()) {
  assert.ok(data.PROVENANCE, 'PROVENANCE metadata is required');
  return collectSourceClaims(data).map(claim => ({
    ...claim,
    provenance: resolveClaimProvenance(claim, data.PROVENANCE)
  }));
}

module.exports = {
  defaultEvidenceLevel,
  normalizeHost,
  publisherForUrl,
  resolveClaimProvenance,
  resolveCorpusProvenance
};
