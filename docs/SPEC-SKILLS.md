# SPEC-SKILLS: Skill System

> **Last verified**: 2026-03-03
> **Verified by**: manual review
> **Verification method**: file listing + source inspection

## Overview

All skill functionality is unified under a single `/coherence` command with sub-commands. The skill lives in `template/.claude/skills/coherence/SKILL.md` (template) and `plugins/coherence-plugin/skills/coherence/SKILL.md` (plugin copy). Both files must be identical.

## Components

There is 1 skill with 9 sub-commands.

### Sub-commands

| Sub-command | Delegates To | Description |
|-------------|-------------|-------------|
| `/coherence init [--reset]` | None (interactive wizard) | Setup wizard — generates hooks, agents, skills, CLAUDE.md |
| `/coherence check-principles [path]` | `architecture-reviewer` agent | Compliance check against CLAUDE.md principles |
| `/coherence check-drift [scope]` | `drift-detector` agent | Compare SPEC docs against codebase |
| `/coherence test [scope]` | None (runs test command directly) | Run tests with flexible scope |
| `/coherence hook` | None (reads config files) | List installed hooks with enforcement levels and status |
| `/coherence spec` | None (reads SPEC files) | List SPEC documents with verification metadata |
| `/coherence status [--prune]` | None (reads config files) | Show install state and registry contents |
| `/coherence uninstall [--force]` | None (modifies config files) | Remove Coherence from current repo (and optionally global) |
| `/coherence help` | None | Show available sub-commands |

### File Locations

| Copy | Location |
|------|----------|
| Template | `template/.claude/skills/coherence/SKILL.md` |
| Plugin | `plugins/coherence-plugin/skills/coherence/SKILL.md` |

## Skill Protocol

Skill definitions live in `skills/<name>/SKILL.md` with YAML front matter:

```yaml
---
name: skill-name
description: What this skill does.
user_invocable: true
arguments: "[optional arguments]"
---
```

### Front Matter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Slash command name (`coherence` -> `/coherence`) |
| `description` | Yes | What the skill does |
| `user_invocable` | Yes | Must be `true` for user-facing skills |
| `arguments` | No | Description of accepted arguments |

## `/coherence init` Wizard Phases

The `init` sub-command runs the interactive setup wizard through 7 phases:

| Phase | Name | Description |
|-------|------|-------------|
| 0 | Project Scan | Silently scan the project to detect stack, framework, tests, structure |
| 1 | Project Classification | Ask project type (web app, API, CLI, infra, writing, marketing, research) |
| 2 | Constraint Discovery | Ask 2-3 questions adapted to the project type |
| 3 | Enforcement Preferences | Ask whether to generate SPEC documents |
| 4 | Summary & Confirmation | Present what will be generated, get user approval |
| 5 | Generate Files | Create all hooks, agents, skills, CLAUDE.md, settings |
| 6 | Verify | Syntax-check hooks, cross-reference settings, check for leftover placeholders |
| 7 | Register | Upsert current repo in global registry (`~/.claude/coherence/repos.json`) |

## Plugin Distribution

The `/coherence` skill is distributed as a Claude Code plugin:

- Plugin manifest: `plugins/coherence-plugin/.claude-plugin/plugin.json`
- Marketplace listing: `marketplace.json`
- Install command: `claude plugin add --from https://github.com/viewyonder/coherence`
- Homepage: `https://coherence.viewyonder.com`

## Constraints

These constraints are falsifiable — each can be verified mechanically.

1. **User-invocable**: The skill's front matter has `user_invocable: true`. Verified by: `grep "user_invocable:" template/.claude/skills/coherence/SKILL.md` should show `true`.
2. **Agent cross-references valid**: Sub-commands that delegate to agents reference agents that exist. Verified by: `check-drift` references `drift-detector` (exists), `check-principles` references `architecture-reviewer` (exists).
3. **Skill count**: There is 1 skill directory in `template/.claude/skills/` (coherence). Verified by: `ls -d template/.claude/skills/*/SKILL.md | wc -l` should return 1.
4. **Plugin copy matches template**: The plugin copy and template copy are identical. Verified by: `diff template/.claude/skills/coherence/SKILL.md plugins/coherence-plugin/skills/coherence/SKILL.md` should produce no output.
5. **Plugin metadata consistent**: `marketplace.json` and `plugin.json` both reference the same homepage URL. Verified by: `grep "homepage" marketplace.json plugins/coherence-plugin/.claude-plugin/plugin.json`.
6. **Registry schema**: The registry file (`~/.claude/coherence/repos.json`) uses `{ "version": 1, "repos": [{ "path": "...", "registeredAt": "...", "lastSeen": "..." }] }`. Verified by: `init` creates this structure, `status` reads it, `uninstall` modifies it.

---

*This is a SPEC document. It describes what the code **does**, not what it should do. If the code contradicts this document, either the code has drifted or this document needs updating. Run `/coherence check-drift` to detect discrepancies.*
