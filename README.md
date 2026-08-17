# AI Tool Reference

A single-file interactive reference for AI developer tools, in five tabs:

- **Harness layers** — the Agent Harness Rosetta Stone: maps the five extension
  layers of AI agent harnesses (instructions, skills, tool access/MCP, bundles,
  delegation) across Claude, Codex/ChatGPT, Goose, Hermes Agent, Osaurus,
  Gemini CLI, Grok Build, Cursor, OpenCode, OpenClaw, GitHub Copilot, Zed, and
  Jan in one matrix. Jan is the outlier and the row shows it: a local chat/RAG
  app with a real MCP tool loop, but no skills layer and no file-write or shell
  tool.
- **Provider matrix** — a compatibility matrix of AI developer tools and the
  credentials each one supports. Each row is a tool (Cline, Cursor, Goose,
  Claude, ChatGPT, and more); each column is a credential you might hold.
  Every cell records *how* that credential connects — an API key, a subscription
  sign-in, a built-in first-party path, or not at all.
- **Portability** — what config survives if you add or switch harnesses. Three
  things travel as open standards (AGENTS.md, SKILL.md skills, MCP servers), and
  several tools read each other's directories outright — Grok Build furthest of
  all, being the only one that reads a rival's bundle layer (Claude Code's
  plugins and marketplaces) and the only "reads others'" cell in the MCP column.
  The last column is what has no equivalent anywhere else.
- **Permissions** — what each harness does without asking, reduced to the two
  blunt questions: before checking with you, does it edit your files, and does
  it run your shell? Then what contains it and where you change it. Tap a row
  for the default in full, approval granularity and unattended behaviour.
- **Infrastructure** — what each host and database actually gives you, how much
  of it is free, and what an agent can break there. Pick what you're building (a
  web app, a web app with a database, …) and all three tables narrow to the
  platforms that cover it: the first is the capability matrix — hosting,
  functions, servers, database, cache, file storage, auth, cron — the second is
  the free tier, meaning what a card-less account gets and where that allowance
  ends, and the third is blast radius: how far the official MCP integration
  reaches, what non-production target exists, and whether there's any enforced
  brake on it.

## Usage

Open `index.html` in a browser. No build step, no dependencies beyond Google
Fonts. Every tab renders from data with JavaScript, so the page needs it enabled
(a `<noscript>` note says so).

Features:
- Tab bar to switch between the five references (deep-linkable via `#harnesses`,
  `#providers`, `#portability`, `#permissions` and `#infra`)
- Dark / light / system theme control (a three-way segmented control, defaulting
  to system), one theme across all tabs
- Harness tab: sticky harness picker filters the matrix and layer cards to one
  platform; tap any matrix cell or layer card for the full explanation (the
  column headers are buttons, so the same jump works from the keyboard);
  terminology traps section covers the "plugin" / "extension" naming collisions
- Provider tab: toggle the credentials you have to filter columns, then narrow
  the rows to "selected providers" or "subscription sign-in only"; tap any row
  for connection details and provider docs
- Infrastructure tab: toggle what you need to build to narrow all three matrices
  to the platforms that cover it; "every service" puts the rest back, annotated
  with what they'd be missing
- Individual layer cards are deep-linkable too (`#c-instr`, `#c-skill`,
  `#c-mcp`, `#c-bundle`, `#c-agent`) — the link opens the card and scrolls to it

Theme, credential selections, the harness filter, the infrastructure capability
picks, both row filters, and the active tab are remembered via `localStorage`
when available.

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
  the four connection-type hues (plus one green the free-tier badge and the
  filter chips reuse).
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
  `PORT_MECH`, `AUTO`, `ACT` and `SBX` are their vocabularies; all four are our
  own summaries of a researched default, not vendors' own labels. Rows carry a
  `status` of `verified`, `partial` or `unverified`, and anything short of
  verified shows a caveat in the detail panel.
  - Permissions is four columns: the two actions that change something (`edit`
    and `shell`, both keyed to `ACT`), then `sbx` and where to configure. The
    two actions are split out because a single roll-up hides real differences —
    Cursor, Hermes and Osaurus all write to your disk unprompted but stop at the
    terminal, which one word can't say.
  - **One badge vocabulary per tab.** `ACT` is the only one that gets a colour
    here. `SBX` renders as a plain leading word instead, because three
    vocabularies all drew from the same three hues and the colour stopped
    distinguishing anything — every row became a wall of diamonds.
  - A `PERM_COLS` entry with a `vocab` renders as a badge and one with `plain`
    renders the same label unstyled; either way `sub` names the row key holding
    the qualifying prose underneath, so a verdict never loses the caveat that
    makes it true ("No prompt" alone would misread Codex, which is free only
    inside the workspace). A bare entry is plain text.
  - Approval granularity, the `auto` roll-up and headless behaviour are
    deliberately detail-panel-only. Approval was a list of each vendor's mode
    names — reference material, not something comparable across a row — and the
    roll-up duplicated the two columns that replaced it.
- **`INFRA`** is the one table whose rows aren't harnesses, so it sorts itself
  by name. All three of the tab's matrices render from it, in the same order,
  sharing one selection and one filter.
  - The capability half reads `CAPS` (the eight columns, `label` for the header
    and `short` for the filter chip) against each row's `caps` map. A `caps`
    value is the product's name as a plain string, or `{name, via}` where `via`
    is a `CAPVIA` key — `marketplace`, `partner`, `template`, `paid` or `beta`.
    A missing key means the platform has no first-party answer. Rows also carry
    `provides`, `useWhen` and `pairs` for the detail panel.
  - The free-tier half reads each row's `free` block: `card` (a `FREE` key —
    `nocard`, `part`, `trial` or `nofree`), `gets` and `stops`. The vocabulary
    is about the payment method rather than the size of the allowance, because
    the question it answers is "can I hold this without paying" — a generous
    seven-day trial still ends in a card. `freeUrl` links the pricing page, and
    `freeStatus: "partial"` marks a row whose numbers came from the vendor's own
    pricing page read through a search index, because the page itself 403s an
    automated fetch; the detail panel says so.
  - The blast-radius half is three columns: what it can break (`reachDetail` —
    the actual destructive calls, `buy_domain`, `d1_database_delete`,
    `apps-destroy`), the safe target (`isolation`), and the brake (`lock`,
    keyed to `LOCK`). `LOCK` and `FREE` are the only badge vocabularies on the
    tab, one per matrix that has something colour can rank.
  - `MCPKIND` and `REACH` are still defined and still render in the detail
    panel, but they are deliberately not columns. `mcp` is `official` for all
    eleven rows and `reach` is `full` for ten of them, so as columns they were
    22 diamonds carrying almost no information. Both facts are stated once in
    the lede instead — a uniform column is a sentence, not a column.
  - The chip filter counts a capability as covered even when its `via` says
    someone else runs it, because it does solve the problem; the tag on the cell
    is what carries the catch. Adding a capability column is one `CAPS` entry
    plus a `caps` key on the rows that have it.
- The harness tab renders from plain JS constants (the refactor that got it
  there is specced in
  [`docs/harness-tab-refactor.md`](./docs/harness-tab-refactor.md)):
  - The matrix is **harness-per-row, layer-per-column**, the same orientation as
    the other four tabs. The five layers are fixed by the premise, so the column
    count never grows and the table fits without horizontal scroll on desktop;
    each new harness costs one row instead of one column.
  - **`HARNESSES`** — the rows, in matrix/card-grid order. Each has an `id`,
    a `label` (row header), a `short` (picker chip — the picker sorts these
    alphabetically), and optionally a `tile` when the card-grid heading differs.
  - **`LAYERS`** — one entry per layer: matrix column, explainer card, and a
    `cells` map from harness `id` to that harness's cell. A cell's `term` and
    `loc` are what the matrix shows; `note` renders in the layer card's tile,
    `warn` styles that note and puts an inline ⚠ in the matrix cell; `desc` is
    the tile's prose and `pterm` overrides `term` there when the two differ.
    Adding a harness means one `HARNESSES` object plus one `cells` entry per
    layer — no markup or CSS changes. A missing `cells` entry throws rather
    than degrading, so all five are required.
  - Filtering tags every rendered row and tile with `data-h="<harness id>"`
    and toggles the `hidden` attribute, so it never depends on row order.
    Because filtering removes rows without narrowing the table, the scroll
    hint and the table's `min-width` stay put when a filter is active.
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

Compiled July 2026; all five tabs last fact-checked against provider docs on
26 July 2026, with the infrastructure capability columns and the Zed and Jan
rows verified on 27 July 2026, and the infrastructure free-tier columns on
29 July 2026. Where a vendor's docs site blocked automated
access, claims were
verified against the same docs in the project's public repo, or against the
shipping source behind them. Six rows fall short of fully verified and are
marked `partial`, each carrying its caveat in the detail panel: both Cursor rows
(portability and permissions), which rest on secondary sources that agree with
each other, Goose's permissions row, Netlify and Upstash on infrastructure, and
Grok Build's permissions row, where the vendor's docs simply don't state what an
unapproved tool call does in a headless run.

The Grok Build rows were added on 17 August 2026 from xAI's own documentation at
`docs.x.ai/build`, which — unusually for this list — serves an automated fetch
without a 403. Two facts it doesn't cover: the name of the tool the model calls
to delegate, and whether subagents run in parallel. Both are stated as open in
the delegation card rather than guessed at.

Free-tier figures for Neon, Railway, Fly.io and Cloudflare come from those
vendors' own docs; Supabase's from the plan data in its shipping source. The
other six sites 403 an automated fetch of any page, so their numbers were read
from the vendor's pricing page through a search index and their `free` block is
marked `freeStatus: "partial"`. Pricing moves faster than anything else in these
tables — check the linked pricing page before planning around a number. Terminology and provider support in
this space move fast — tools add subscription sign-in, vendors change their
terms, projects get renamed or merged. Every tab is a point-in-time snapshot;
verify against each project's linked docs before relying on any single cell.

One nuance the matrix can't yet express: since Anthropic's February 2026 terms
change and its April 2026 enforcement, several third-party harnesses still offer
a Claude sign-in, but it bills as metered extra usage rather than drawing on
plan limits. Those cells read "Sign-in"; the row's note carries the caveat.

## License

MIT — see [LICENSE](./LICENSE).
