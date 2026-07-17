# AI Tool Reference

A single-file interactive reference for AI developer tools, in two tabs:

- **Harness layers** — the Agent Harness Rosetta Stone: maps the five extension
  layers of AI agent harnesses (instructions, skills, tool access/MCP, bundles,
  delegation) across Claude, Codex/ChatGPT, Goose, Hermes Agent, Osaurus,
  Gemini CLI, Cursor, OpenCode, OpenClaw, and GitHub Copilot in one matrix.
- **Provider matrix** — a compatibility matrix of AI developer tools and the
  credentials each one supports. Each row is a tool (Cline, Cursor, Goose,
  Claude, ChatGPT, and more); each column is a credential you might hold.
  Every cell records *how* that credential connects — an API key, a subscription
  sign-in, a built-in first-party path, or not at all.

## Usage

Open `index.html` in a browser. No build step, no dependencies beyond Google Fonts.

Features:
- Tab bar to switch between the two references (deep-linkable via `#harnesses` / `#providers`)
- Light/dark theme toggle (defaults to system preference), one theme for both tabs
- Harness tab: sticky harness picker filters the matrix and layer cards to one
  platform; tap any matrix row or layer card for the full explanation;
  terminology traps section covers the "plugin" / "extension" naming collisions
- Provider tab: toggle the credentials you have to filter columns, "only show
  available" to hide tools you can't use, tap any row for connection details
  and provider docs

Theme, credential selections, and the active tab are remembered via
`localStorage` when available.

## Structure

Everything lives in `index.html`.

- CSS custom properties drive the two themes, the five per-concept hues, and
  the five connection-type hues.
- Harness-tab filtering is CSS-only via a `data-hf` attribute on `<body>`
  (column order: concept, Claude, Codex, Goose, Hermes, Osaurus, Gemini,
  Cursor, OpenCode, OpenClaw, Copilot — keep the matrix columns and each card's
  platform grid in that order when editing).
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

Compiled July 2026. Terminology and provider support in this space move fast —
tools add subscription sign-in, vendors change their terms, projects get renamed
or merged. Both tabs are point-in-time snapshots; verify against each project's
linked docs before relying on any single cell.

## License

MIT — see [LICENSE](./LICENSE).
