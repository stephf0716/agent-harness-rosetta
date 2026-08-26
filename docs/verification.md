# Verification and source maintenance

This site still renders entirely from `index.html`. The accuracy tooling layers onto that file without changing the UI:

- Keep the existing claim text and `url` / `freeUrl` fields on the row or cell being updated.
- Record provenance in `PROVENANCE` near the top of `index.html`.
- Run deterministic checks with `npm test`.
- Run networked link validation separately with `npm run check:links`.

## Claim IDs used by provenance overrides

Only add a `PROVENANCE.claims[...]` override when the defaults are not enough.

| Claim type | ID format |
| --- | --- |
| Provider/tool row | `tool/<toolId>` |
| Harness-layer cell | `layer/<layerId>/<harnessId>` |
| Portability row | `portability/<harnessId>` |
| Permissions row | `permissions/<harnessId>` |
| Infrastructure row | `infra/<serviceId>` |
| Infrastructure free-tier source | `infra-free/<serviceId>` |

Defaults already resolve most metadata from the corpus:

- `sourceUrl` defaults to the row or cell `url` (or `freeUrl` for free-tier claims)
- `checkedAt` defaults to `PROVENANCE.defaultCheckedAt`
- `corpusUpdatedAt` is optional, but when present it records the corpus refresh date that `checkedAt` must not predate
- `sourcePublisher` defaults from the hostname map, falling back to the hostname itself
- `evidenceLevel` defaults to `primary-docs`, unless the claim is already marked `partial` / `unverified`

## Updating a claim

1. Edit the claim text in `index.html`.
2. Keep or replace the matching `url` / `freeUrl`.
3. Update `PROVENANCE.defaultCheckedAt` if you re-verified a broad pass, or add a per-claim `checkedAt` override for a one-off fix. Do not assign a date earlier than the claim's corpus refresh; record `corpusUpdatedAt` alongside the override when that date is known.
4. Add or adjust a `PROVENANCE.claims[...]` override when:
   - the publisher needs a clearer label
   - the source is secondary rather than primary docs
   - the claim is only partially documented
   - the claim needs a short note explaining a caveat
5. Run `npm test`.

## Evidence levels

- `primary-docs`: directly supported by official product docs, vendor docs, or first-party repository docs
- `secondary`: supported by a non-primary source that is still specific enough to keep
- `partial`: some support exists, but the docs are incomplete, blocked, or do not fully cover the claim
- `unknown`: no satisfactory source is attached yet

If you cannot verify a claim directly, do **not** invent a stronger source. Leave the claim in place, mark it `partial` or `unknown`, and add a short note.

## Link validation

`npm run check:links` validates deduplicated external source URLs with:

- `HEAD` first, then `GET` fallback when `HEAD` is blocked or unreliable
- 2 retries by default
- a 10 second per-request timeout
- no dependency on normal `npm test` runs or CI gating

In restricted sandboxes or corporate networks you may still see DNS or egress failures for otherwise valid URLs; rerun from a less restricted network or from the scheduled/manual GitHub Actions workflow before treating that as a broken source.

### Intentionally inaccessible URLs

Some vendor pages require auth, block bots, or behave inconsistently in automation. When that happens:

1. Keep the claim marked `partial` or `unknown`.
2. Add an override in `scripts/link-check.config.js` with `skip: true` and a reason.
3. Document the limitation in the claim note if the source gap affects interpretation.

The scheduled/manual GitHub Actions workflow runs the same command without blocking the deterministic PR checks.
