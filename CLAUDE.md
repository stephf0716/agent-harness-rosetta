# AI Tool Reference

A single-file static site: five interactive reference tables for AI developer
tools. Everything is `index.html` — markup, styles, data, and behaviour.
`README.md` explains what the tabs are and how the data constants work.

Deployed on Vercel from `main`; `vercel.json` holds the config.

## Conventions

- **One file, no build, no dependencies** beyond the Google Fonts link. Don't
  add `package.json` — besides the zero-dependency property, its presence
  changes Vercel's zero-config inference for this static site. Put throwaway
  scripts in a scratch directory outside the repo.
- **Data lives in JS constants** near the top of the `<script>` block. Prefer
  editing those over touching markup. Every tab renders from them: the provider
  tab from `CREDENTIALS`/`TOOLS`/`MECH`/`CLOSED`, the harness tab from
  `HARNESSES`/`LAYERS` (see `docs/harness-tab-refactor.md` for the design), and
  the portability and permissions tabs from `PORTABILITY`/`PERMISSIONS`, and
  the infrastructure tab's two matrices from `INFRA` (capabilities via
  `CAPS`/`CAPVIA` and each row's `caps` map, blast radius via `LOCK`, with
  `MCPKIND`/`REACH` detail-panel-only because they are near-uniform). The tab
  bar itself comes from `TABS`, so
  a new reference is one entry plus a `<main id="panel-…">`. Declare any new
  render state near the other `*State` variables — the init IIFE runs before
  `var` assignments further down the file.
- **Both themes matter.** Colors come from the CSS custom properties at the top
  of the stylesheet; check light and dark before calling a visual change done.
- **Keep the accessibility scaffolding**: tab roles with arrow-key handling,
  `aria-pressed` / `aria-checked` on the filter chips, visible focus rings,
  keyboard-operable `<details>` cards.
- `esc()` anything interpolated into HTML.
- Bump `BUILD` (version and dates) when the content changes; the masthead and
  footer render from it.

## Accuracy

Every table is a point-in-time snapshot of a fast-moving ecosystem, and stale
cells are the main defect this project has. Don't add or change a factual claim
from memory — check the vendor's current docs, and treat anything you can't
verify as unverified rather than guessing. Every tool row carries a `url` to its
provider docs; that's the place to start.

Two things learned the hard way while compiling the newer tabs:

- **Vendor docs sites block automated fetches** (403) more often than not. The
  workaround that consistently works is reading the same markdown from the
  project's public repo via `raw.githubusercontent.com`, or cloning it. Where
  docs and shipping source disagree, the source wins — say so in the row.
- **One-time import is not portability.** Several tools ingest a rival's config
  once during migration (`/init`, `openclaw migrate`, plugin importers). That
  is not the same as reading it at runtime, and conflating the two would make
  the portability tab wrong in the most useful column it has.

## Verifying a change

`.claude/launch.json` defines a **rosetta** preview server: a static file server
written inline as a `node -e` one-liner, so it stays true to the no-dependency
rule and needs nothing installed. Start it and drive the page with the preview
tools — screenshot, resize, click, and `preview_eval` for things like
`setTab('permissions')` or `setTheme('light')`. Prefer `preview_eval` with
`scrollBehavior='auto'` before scrolling; the stylesheet's smooth scroll
otherwise races the screenshot and you capture the old position.

Exercise the filters and **both themes**, and screenshot desktop and mobile
(the `mobile` preset is 375×812). A failed Google Fonts request is expected
offline; anything else in the console is a bug.

Verify visually whenever a change is visible — density, colour and duplication
problems are invisible to a DOM-level check. The sandbox column, for instance,
passed every structural assertion while rendering "Opt-in" directly above prose
beginning "None built in".

For logic that isn't visual, driving the render functions in Node with a small
DOM stub is fast and catches missing data: extract the `<script>` block, stub
`document.getElementById` to capture `innerHTML`, then call the `render*`
functions and assert over the output. Keep those scripts in a scratch directory
outside the repo.
