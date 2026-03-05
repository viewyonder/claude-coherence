# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A template system for encoding architectural constraints into the Claude Code development loop. It provides hooks, agents, skills, and SPEC document templates that teams copy into their own projects and customize. This is **not an application** — it's a development tooling template.

## Repository Structure

- `template/` — The copyable template: `.claude/` directory (hooks, agents, skills, settings), `CLAUDE.md` template with `{{PLACEHOLDER}}` markers, SPEC and MEMORY doc templates
- `examples/` — Two worked examples showing the template adapted to specific stacks (Express+PostgreSQL, Next.js+Prisma)
- `site/src/content/blog/` — Blog posts including "Entropy at Velocity" explaining the rationale

## The Four-Layer Architecture

| Layer | Directory | Purpose | When It Runs |
|-------|-----------|---------|--------------|
| **Hooks** | `template/.claude/hooks/` | Enforce constraints (block/warn/inform) | Every file edit/write/commit via `settings.local.json` |
| **Agents** | `template/.claude/agents/` | Review and detect drift (read-only) | On demand via skills |
| **SPEC Docs** | `template/docs/` | Define "correct" via falsifiable claims | Referenced by agents |
| **Skills** | `template/.claude/skills/` | Multi-step workflows with compliance built in | User-invoked (`/coherence <sub-command>` locally, `/coherence:<sub-command>` via plugin) |

## Hook Protocol

Hooks are Node.js scripts (`.cjs`/`.js`) that read JSON from stdin and communicate via stdout:
- **Block**: `{ "decision": "block", "reason": "..." }` — prevents the tool from executing
- **Warn**: `{ "message": "..." }` — tool proceeds, agent sees warning
- **Allow**: no output, exit 0

Each hook has a `// === CONFIGURATION ===` block at the top with project-specific constants. Hooks are registered in `settings.local.json` under `PreToolUse` (Edit/Write/Bash matchers) or `PostToolUse`.

Three enforcement levels: 4 blocking hooks (forbidden-imports, required-prefix, boundary-guard, test-gate), 4 warning hooks (data-isolation, delegation-check, terminology-check, style-guard), 3 informational hooks (test-suggest, change-suggest, state-flow).

## Testing Hooks

```bash
echo '{"tool_input":{"file_path":"/src/test.ts","content":"require(\"fs\")"}}' | node template/.claude/hooks/forbidden-imports.cjs
```

No output = allowed. JSON output = blocked/warned.

## Key Conventions

- The `template/CLAUDE.md` uses `{{PLACEHOLDER}}` markers that adopters replace with their project values
- Hooks are self-contained — no external config files, all configuration via constants at the top of each file
- Agents are read-only (Read, Grep, Glob, Bash only — no Write/Edit access)
- SPEC documents make falsifiable claims ("we have 18 inspectors") not opinions ("our API is well-designed")
- When adding a new hook: create the `.cjs` file, add a `// === CONFIGURATION ===` block, register it in `settings.local.json`
- **Plugin skills** (in `plugins/coherence-plugin/skills/`) are split into individual skills: `init`, `check-principles`, `check-drift`, `test-runner`, `hook`, `spec`, `config`, `history`, `status`, `help`. Invoked as `/coherence:init`, `/coherence:check-drift`, etc.
- **Template skill** (in `template/.claude/skills/coherence/`) remains a single monolithic skill with sub-command dispatch. Invoked as `/coherence init`, `/coherence check-drift`, etc. This is what gets installed into user projects.
- Running `/coherence:init` (or `/coherence init` locally) inside this repo triggers dogfood mode — a read-only validation of templates, hooks, examples, and documentation accuracy
- **Version bumps** must update all three locations: `plugins/coherence-plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and a `v<version>` git tag on the release commit
