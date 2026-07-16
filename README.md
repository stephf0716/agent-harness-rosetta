# Agent Harness Rosetta Stone

A single-file interactive reference mapping the five extension layers of AI agent
harnesses — instructions, skills, tool access (MCP), bundles, and delegation —
across Claude, Codex/ChatGPT, Goose, Hermes Agent, Osaurus, Gemini CLI, Cursor,
OpenCode, OpenClaw, and GitHub Copilot in one matrix.

## Usage

Open `index.html` in a browser. No build step, no dependencies beyond Google Fonts.

Features:
- Sticky harness picker to filter the matrix and layer cards to one platform
- Light/dark theme toggle (defaults to system preference)
- Tap any matrix row or layer card for the full explanation
- Terminology traps section covering the "plugin" / "extension" naming collisions

## Structure

Everything lives in `index.html`: CSS custom properties drive the two themes and
the five per-concept hues; filtering is CSS-only via a `data-hf` attribute on
`<body>` (column order: concept, Claude, Codex, Goose, Hermes, Osaurus, Gemini,
Cursor, OpenCode, OpenClaw, Copilot — keep the matrix columns and each card's
platform grid in that order when editing).

Compiled July 2026. Terminology in this space moves fast — verify against each
project's docs before relying on details.
