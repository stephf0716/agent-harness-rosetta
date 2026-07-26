# Handoff: make the harness tab data-driven

A task spec for a fresh session. Everything you need should be here; read
`README.md` first for what the app is, then this.

## Goal

The provider tab renders from JS constants (`CREDENTIALS`, `TOOLS`, `MECH`,
`CLOSED`) — one place to edit, and adding a row is a single object. The harness
tab is hand-written HTML where every fact is stored **twice** and the filtering
depends on hardcoded column positions. Move the harness tab to the same
data-driven shape the provider tab already has.

This is a **pure refactor**. The rendered page should be indistinguishable from
today's, cell for cell and word for word. No new features, no restyling, no
fact changes.

## Why it's worth doing

A July 2026 fact-check found roughly a dozen stale cells. Fixing just one of
them — Copilot gaining a skills layer — meant coordinated edits in five places:
the matrix cell, the card's platform grid, the intro paragraph of that card, the
terminology-traps list, and the bundles row. That edit cost is the real problem;
the data going stale is routine and will keep happening.

It also unblocks the things worth building next, all of which are impractical
against hand-written HTML: per-cell `verifiedOn` / `sourceUrl` metadata with
staleness badges, a compare-two-harnesses mode, URL-encoded filter state, and a
scheduled job that diffs vendor docs and flags cells to re-check.

## Current state

All line numbers are against `index.html` at commit `05496d2` (854 lines).

| What | Where | Shape |
| --- | --- | --- |
| Matrix | 237–325 | `<table>`, 11 columns, 5 `<tr>` rows |
| Layer cards | 332–427 | 5 `<details>`, each with a 10-tile `.plat-grid` (50 tiles) |
| Picker | 222–235 | 11 hardcoded buttons carrying `data-hf` indices |
| Filter CSS | 78–92 | 11 rules, 30 `nth-child` selectors |

Two specific problems:

**Facts live twice.** A matrix cell (`.term` / `.loc` / `.note`) and the
matching card tile (`.pterm` / `.pdesc`) restate the same thing at different
lengths. Nothing keeps them in sync.

**Filtering is positional.** `body[data-hf="4"]` hides every column except
`nth-child(5)`, and the card grids rely on the same ordering. The only thing
tying the two together is a comment at line 78 listing the column order. Reorder
a column or insert a harness and the picker silently points at the wrong data —
the failure is invisible, because every cell still looks plausible.

## Target design

### Data

Two new constants next to the existing provider ones, same commented style.

```js
// Column order for the matrix; also the card grid order.
var HARNESSES = [
  { id: "claude",   label: "Claude",          short: "Claude" },
  { id: "codex",    label: "Codex / ChatGPT", short: "Codex" },
  { id: "goose",    label: "Goose",           short: "Goose" },
  // … hermes, osaurus, gemini, cursor, opencode, openclaw, copilot
];

var LAYERS = [
  {
    id: "c-instr",              // keep these ids — they are public deep links
    num: "L1",
    hue: "instr",               // drives .r-instr / --cc
    name: "Instructions",
    question: "persistent rules",
    oneliner: "Persistent rules the agent reads every session",
    body: ["<p>…</p>"],         // card prose, verbatim from today
    cells: {
      claude: {
        term: "CLAUDE.md",
        loc:  "repo root · ~/.claude · Project instructions in claude.ai",
        note: null,
        warn: false,            // true renders the ⚠ .note.warn style
        desc: "Hierarchy: home dir → repo root → subdirectory. …"
      },
      // … one entry per harness id
    }
  },
  // … c-skill, c-mcp, c-bundle, c-agent
];
```

`term: null` renders the `—` dash cell. `desc` is the card tile's prose; `loc`
and `note` are matrix-only. That split is what removes the duplication: the term
is stated once and used in both places.

Some `desc` and `loc` values contain intentional inline markup (`<code>`,
`<em>`). Keep supporting it, but then **do not** run those fields through
`esc()` — see the gotcha below.

### Rendering

Add `renderHarnessMatrix()`, `renderLayerCards()`, and `renderHarnessPicker()`,
called from the existing init IIFE alongside `pmRenderAll()`. Match the current
DOM exactly: same class names, same element nesting, same `id`s on the
`<details>` cards. The stylesheet should need no changes beyond the filtering
rules below.

### Filtering — the main win

Replace all 30 `nth-child` selectors with something order-independent. Tag every
harness-owned cell and card tile with `data-h="<harness id>"` as you render it,
then let the filter toggle the `hidden` attribute:

```js
function applyHarness(id){
  document.querySelectorAll('#panel-harness [data-h]').forEach(function(el){
    el.hidden = (id !== 'all' && el.getAttribute('data-h') !== id);
  });
  // …plus the existing aria-pressed bookkeeping and body[data-hf] for the
  // table min-width and .scrollnote rules, which stay CSS-driven.
}
```

The invariant becomes "a cell is shown iff its `data-h` matches" — it cannot
silently mismatch, and column order then lives only in `HARNESSES`. (Checked
against the current stylesheet: setting `hidden` collapses both a `<td>` and a
`.plat`, and clearing it restores `table-cell` and `block` respectively.)

CSS-only is also viable, but note it takes one rule *per harness*
(`body[data-hf="claude"] [data-h]:not([data-h="claude"]){display:none}`) because
CSS can't compare two attribute values. That's still a real improvement — the
rules stop depending on position — but it grows with the harness list, which is
the thing this refactor is trying to stop.

If you do go the CSS route, remember `<td>` and `.plat` have different natural
display values, so re-showing needs `display: revert`, not `display: block`.
The `hidden` approach sidesteps that entirely; just keep a defensive
`#panel-harness [hidden]{display:none}` in case a future rule sets `display` on
those elements and out-specifies the UA sheet.

Store the harness id (`"claude"`) in `localStorage` instead of today's index
(`"1"`). `applyHarness()` already falls back to "all" for unrecognized values,
so stale numeric prefs degrade gracefully — verify that rather than writing a
migration.

## Invariants — do not break

- **Single file, no build, no dependencies** beyond the Google Fonts link.
  Do not add `package.json`; besides the zero-dep property, its presence changes
  Vercel's zero-config inference for this static site.
- **Deep links.** `#harnesses`, `#providers`, and the five card ids
  (`#c-instr`, `#c-skill`, `#c-mcp`, `#c-bundle`, `#c-agent`) are documented in
  the README and shareable. Loading one opens the card, switches tabs, scrolls.
- **`localStorage`** keeps working for theme, credentials, harness filter, tab —
  key `ai_tool_matrix_prefs`, and the whole thing wrapped so private-mode
  failures stay silent.
- **Accessibility.** `role="tab"`/`tabpanel` with arrow-key handling,
  `aria-pressed` picker chips, `aria-checked` radio filter, visible focus rings,
  `<details>`/`<summary>` cards that work by keyboard.
- **Both themes**, driven by the CSS custom properties. The five `--c-*` concept
  hues map to layers by `hue`.
- Sticky table header and sticky first column; horizontal scroll on mobile; the
  `.scrollnote` hint hides when a single harness is selected.
- `esc()` every plain-text value interpolated into HTML.

## Gotchas

**Escaping.** `esc()` exists and must stay for plain strings, but `desc`/`loc`
carry deliberate `<code>` and `<em>` tags. Decide explicitly: either keep those
two fields raw-HTML-by-contract (document it in the comment above `LAYERS`) or
add a tiny allowlist. Do not silently double-escape — the tell is literal
`&lt;code&gt;` in the rendered tiles.

**No-JS.** Today the harness tab is static HTML and readable with JS disabled;
after this it will not be. The provider tab already had that property, so this
is a real if minor regression. Either accept it and say so in the README, or add
a `<noscript>` line. Don't leave it undecided.

**The `⚠` notes carry meaning.** Four cells use `.note.warn` for terminology
collisions ("plugin here means a code extension, not a bundle"). They are part
of the content, not decoration — the `warn` flag must survive.

**Header labels differ from picker labels.** The matrix header says
"Codex / ChatGPT" and "Hermes Agent" and "GitHub Copilot", while the picker and
card tiles say "Codex", "Hermes", "Copilot". Hence both `label` and `short`.

**Picker order is alphabetical, column order is not.** The picker runs All,
Claude, Codex, Copilot, Cursor, Gemini, Goose, Hermes, OpenClaw, OpenCode,
Osaurus; the columns run in the order at line 78. Preserve both independently.

## Verification

**Content parity is the acceptance test.** Dump the rendered text before and
after and diff it — that catches a dropped cell or a mangled note far more
reliably than reading the diff.

```js
// with playwright-core against file:// — run once on the pre-refactor commit
// (git worktree add ../before 05496d2), once on the new build, then diff.
await page.evaluate(() => setHarness ? setHarness(0) : null);
document.querySelectorAll('#c-instr,#c-skill,#c-mcp,#c-bundle,#c-agent')
  .forEach(d => d.open = true);
const dump = [
  ...document.querySelectorAll('#panel-harness table td'),
  ...document.querySelectorAll('#panel-harness .plat')
].map(el => el.innerText.replace(/\s+/g, ' ').trim()).join('\n');
```

Aim for a zero-line diff. Any difference should be one you can explain.

Chromium is preinstalled at `/opt/pw-browsers/chromium`; `npm i playwright-core`
in a scratch directory outside the repo and launch with `executablePath`. Do not
run `playwright install`.

Then check by hand or by script:

- Each of the 11 picker options shows exactly its own column, in both the matrix
  and every card grid; "All" restores 10.
- Reload keeps the selected harness; a stale numeric pref falls back to All.
- `index.html#c-bundle` opens that card and lands on the harness tab.
- Switching tabs returns to the top of the page.
- No console errors (a failed Google Fonts fetch is expected offline).
- Screenshot desktop (1380×900) and mobile (390×844), both themes, and compare
  against the same shots from the pre-refactor worktree.

## Done when

`HARNESSES` and `LAYERS` are the only place harness facts live; adding a harness
means appending one object and one `cells` entry per layer, touching no CSS and
no markup; the `nth-child` block and the order comment at line 78 are gone; and
the content-parity diff is empty.

## Out of scope

Deliberately not part of this task, but each becomes straightforward afterwards:
per-cell `verifiedOn` / `sourceUrl` with staleness badges, comparison mode
(two or three harnesses side by side), URL-encoded filter state, a search box,
markdown export, and self-hosted fonts. Do not fold them in — a refactor whose
diff is provably content-neutral is much easier to trust.
