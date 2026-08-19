# Agent Harness Rosetta

A dependency-free, interactive reference for comparing AI developer tools.

Use it to see how agent harnesses name and organize their extension layers, which credentials different tools accept, what configuration is portable, what actions run without approval, and how much infrastructure access an agent can receive.

Everything runs from a single `index.html` file—no framework, package manager, or build step.

## What it covers

| Reference | Question it answers |
| --- | --- |
| **Harness layers** | How do 13 agent harnesses represent instructions, skills, tool access/MCP, bundles, and delegation? |
| **Provider matrix** | Can a tool use your API key, subscription sign-in, or a built-in provider connection? |
| **Portability** | Which instructions, skills, MCP settings, and agent definitions survive a switch between harnesses? |
| **Permissions** | Will a harness edit files or run shell commands before asking, and what contains it? |
| **Infrastructure** | Which hosting and database platforms provide the capabilities you need, what is free, and what their agent integrations can change or delete? |

The reference currently covers Claude, Codex/ChatGPT, Goose, Hermes Agent, Osaurus, Gemini CLI, Grok Build, Cursor, OpenCode, OpenClaw, GitHub Copilot, Zed, and Jan, plus a broader set of AI tools and infrastructure providers in the other matrices.

## Run locally

Clone the repository and open `index.html` in a browser:

```bash
git clone https://github.com/stephf0716/agent-harness-rosetta.git
cd agent-harness-rosetta
open index.html
```

On Windows, use `start index.html`. On Linux, use `xdg-open index.html`.

JavaScript must be enabled. The only external assets are Google Fonts.

## Using the reference

- Switch among the five tabs; each tab has a stable URL hash.
- Filter the harness, provider, and infrastructure matrices to the tools or capabilities you care about.
- Select cells and rows for source links, qualifications, and fuller explanations.
- Choose dark, light, or system theme.
- Share specific sections with hashes such as `#harnesses`, `#providers`, `#portability`, `#permissions`, `#infra`, or an individual layer such as `#c-mcp`.

Theme and filter selections are saved in `localStorage` when available. The interface supports keyboard navigation and reduced-motion preferences.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Application, styles, data, and rendering logic |
| `vercel.json` | Static Vercel configuration and response headers |
| `.vercelignore` | Deployment allowlist; only the site and Vercel config are published |
| `LICENSE` | CC BY 4.0 license |

The data model also lives in `index.html`:

- `BUILD` holds the displayed version and fact-check dates.
- `HARNESSES` and `LAYERS` drive the harness comparison.
- `CREDENTIALS`, `TOOLS`, and `MECH` drive the provider matrix.
- `PORTABILITY` and `PERMISSIONS` drive their corresponding tabs.
- `INFRA` drives the capability, free-tier, and blast-radius tables.

A missing harness-layer entry throws instead of silently degrading. Research records can be marked `verified`, `partial`, or `unverified`; caveats for anything short of verified appear in the detail view.

## Accuracy and scope

This is a point-in-time reference, not a compatibility guarantee. The core dataset was fact-checked against vendor documentation in July 2026, with Grok Build added in August 2026. Some vendor documentation and pricing pages block automated access; affected records are marked `partial` and explain the limitation.

Provider support, product names, permissions, pricing, and free tiers change quickly. Follow the source links in the interface before making a security, purchasing, or architecture decision.

Corrections are welcome. When reporting one, please include the affected row or cell, a primary-source URL, and the date you verified it.

## Deployment

The repository is configured as a static Vercel site:

- Pushes to `main` publish to production.
- Other branches receive preview deployments.
- There is no build command; Vercel serves the repository root.
- `.vercelignore` allowlists `index.html` and `vercel.json`, keeping notes and tooling files out of deployments.

## License

[CC BY 4.0](./LICENSE). You may share and adapt the work, including commercially, with attribution and an indication of changes.
