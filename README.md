# AI Tool Reference

A single-file interactive reference for AI developer tools, in five tabs:

- **Harness layers** — the Agent Harness Rosetta Stone: maps the five extension
  layers of AI agent harnesses (instructions, skills, tool access/MCP, bundles,
  delegation) across Claude, Codex/ChatGPT, Goose, Hermes Agent, Osaurus,
  Gemini CLI, Cursor, OpenCode, OpenClaw, and GitHub Copilot in one matrix.
- **Provider matrix** — a compatibility matrix of AI developer tools and the
  credentials each one supports. Each row is a tool (Cline, Cursor, Goose,
  Claude, ChatGPT, and more); each column is a credential you might hold.
  Every cell records *how* that credential connects — an API key, a subscription
  sign-in, a built-in first-party path, or not at all.
- **Portability** — what config survives if you add or switch harnesses. Three
  things travel as open standards (AGENTS.md, SKILL.md skills, MCP servers), and
  several tools read each other's directories outright; the last column is what
  has no equivalent anywhere else.
- **Permissions** — what each harness does without asking, and how to constrain
  it: default autonomy, approval granularity, sandboxing, where permissions are
  declared, and what happens unattended.
- **Infrastructure** — the hosts and databases an agent can operate directly
  through a first-party MCP server, and what it can break: how far the official
  integration reaches, what non-production target exists, and whether there's
  any enforced brake on it.

## Usage

Open `index.html` in a browser. No build step, no dependencies beyond Google
Fonts. Both tabs render from data with JavaScript, so the page needs it enabled
(a `<noscript>` note says so).

Features:
- Tab bar to switch between the two references (deep-linkable via `#harnesses` / `#providers`)
- Light/dark theme toggle (defaults to system preference), one theme for both tabs
- Harness tab: sticky harness picker filters the matrix and layer cards to one
  platform; tap any matrix row or layer card for the full explanation;
  terminology traps section covers the "plugin" / "extension" naming collisions
- Provider tab: toggle the credentials you have to filter columns, "only show
  available" to hide tools you can't use, tap any row for connection details
  and provider docs
- Individual layer cards are deep-linkable too (`#c-instr`, `#c-skill`,
  `#c-mcp`, `#c-bundle`, `#c-agent`) — the link opens the card and scrolls to it

Theme, credential selections, the harness filter, and the active tab are
remembered via `localStorage` when available.

## Deployment

Deployed on Vercel as a static site, connected to this repo through the Git
integration: pushes to `main` publish to production, and any other branch gets
its own preview URL.

`vercel.json` holds the whole configuration. There is no framework and no build
step — Vercel serves the repo root as-is — so the file only sets `cleanUrls`
plus a couple of response headers. Anything the dashboard can configure belongs
here instead, so the settings travel with the code.

`.vercelignore` is an allowlist: everything at the repo root is excluded and
only `index.html` and `vercel.json` are added back, so the deployment carries
the site and nothing else. Docs, notes, and tooling config stay out by default —
including anything added later, which is the point of allowlisting rather than
naming files to exclude.

Working on it locally needs nothing but a browser. If you do want the Vercel
CLI, `vercel link` connects the directory and writes `.vercel/`, which is
git-ignored because it holds machine-specific project and org ids.

## Structure

Everything lives in `index.html`.

- CSS custom properties drive the two themes, the five per-concept hues, and
  the five connection-type hues.
- **`BUILD`** (top of the `<script>` block) holds the version and dates; the
  masthead and footer both render from it, so bump it in one place.
- **`TABS`** — one entry per reference, in display order, with the public deep
  link in `hash`. The tab bar, panel visibility, arrow-key cycling and hash
  routing all read from it; a new reference is one entry plus a
  `<main id="panel-<id>">`. Panels are hidden via the `hidden` attribute rather
  than a CSS rule per pair.
- The portability and permissions tabs render from **`PORTABILITY`** and
  **`PERMISSIONS`**, both keyed by harness `id` and both ordered by `HARNESSES`
  at render time, so they can't drift out of step with the harness tab.
  `PORT_MECH` and `AUTO` are their badge vocabularies; `AUTO` is our own
  summary of a researched default, not a vendor's own label. Rows carry a
  `status` of `verified`, `partial` or `unverified`, and anything short of
  verified shows a caveat in the detail panel.
- **`INFRA`** is the one table whose rows aren't harnesses, so it sorts itself
  by name. It carries three badge vocabularies: `MCPKIND` (is there a
  first-party MCP server), `REACH` (how far the official integration goes at
  its most permissive) and `LOCK` (whether anything can stop it). `REACH` and
  `LOCK` are both our own summaries rather than vendor labels — reach is nearly
  always `full`, so `LOCK` is the column that actually discriminates.
- The harness tab renders from plain JS constants (the refactor that got it
  there is specced in
  [`docs/harness-tab-refactor.md`](./docs/harness-tab-refactor.md)):
  - **`HARNESSES`** — the columns, in matrix/card-grid order. Each has an `id`,
    a `label` (matrix header), a `short` (picker chip — the picker sorts these
    alphabetically), and optionally a `tile` when the card-grid heading differs.
  - **`LAYERS`** — one entry per layer: matrix row, explainer card, and a
    `cells` map from harness `id` to that harness's cell (`term`, matrix-only
    `loc`/`note`/`warn`, card-tile `desc`, and `pterm` when the tile term
    differs). Adding a harness means one `HARNESSES` object plus one `cells`
    entry per layer — no markup or CSS changes.
  - Filtering tags every rendered cell and tile with `data-h="<harness id>"`
    and toggles the `hidden` attribute, so it never depends on column order.
- The provider matrix renders from plain JS constants near the top of the
  `<script>` block:
  - **`CREDENTIALS`** — the columns. Each has an `id` and a `label`.
  - **`TOOLS`** — the rows. Each tool has a unique `id` (used for selection and
    the `CLOSED` grouping), a `name`, a `kind` (e.g. `"IDE + CLI"`), a `note`,
    a `url` to its provider docs, and a `support` map from credential `id` to
    a connection type.
  - **`MECH`** — the connection types: `apikey` (works with a provider API key),
    `oauth` (subscription/account sign-in), `native` (first-party app only),
    `restricted` (explicitly disallowed), `no` (unsupported).
  - **`CLOSED`** — the tool ids grouped under "Closed source" instead of "Open source".

## A note on accuracy

Compiled July 2026; all four tabs last fact-checked against provider docs on
26 July 2026. Where a vendor's docs site blocked automated access, claims were
verified against the same docs in the project's public repo, or against the
shipping source behind them; the two Cursor rows rest on secondary sources that
agree with each other and are marked `partial` for that reason. Terminology and provider support in this space move fast — tools
add subscription sign-in, vendors change their terms, projects get renamed or
merged. Both tabs are point-in-time snapshots; verify against each project's
linked docs before relying on any single cell.

One nuance the matrix can't yet express: since Anthropic's February 2026 terms
change and its April 2026 enforcement, several third-party harnesses still offer
a Claude sign-in, but it bills as metered extra usage rather than drawing on
plan limits. Those cells read "Sign-in"; the row's note carries the caveat.

## License

MIT — see [LICENSE](./LICENSE).
