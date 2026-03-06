---
title: "The Whole Picture"
subtitle: "A new /coherence config sub-command that shows everything installed in one view"
date: 2026-03-03
author: "Injectionator"
draft: false
---

## Seeing the Forest

Coherence has sub-commands for inspecting individual parts of a project. `/coherence hook` shows hooks. `/coherence spec` shows SPEC documents. `/coherence status` shows the global registry. Each answers a specific question well.

But sometimes the question isn't "what hooks do I have?" — it's "what does this project's Coherence setup actually look like?" You want the whole picture, not a single slice.

After onboarding a new team member or picking up a project after a break, the first thing you need is orientation. Not the details of each hook's enforcement level or each SPEC's verification date — just the shape of the thing. What's installed? What's active? What's missing?

## `/coherence config`

The `config` sub-command reads everything in your `.claude/` directory and presents a unified overview.

```
Coherence Project Config
=========================

Project: /path/to/repo

settings.local.json:  found (8 hooks across 3 matchers)
                      PreToolUse: yes   PostToolUse: yes

Hooks (.claude/hooks/):
  ● forbidden-imports.cjs     active
  ● boundary-guard.cjs        active
  ● required-prefix.cjs       active
  ● data-isolation.cjs        active
  ● test-gate.cjs             active
  ○ style-guard.cjs           orphaned (not in settings.local.json)
  5 active, 1 orphaned, 0 missing

Agents (.claude/agents/):
  architecture-reviewer.md
  drift-detector.md
  2 agents

Skills (.claude/skills/):
  coherence       "Coherence guardrails system — init, check..."
  1 skill

SPEC Documents (docs/):
  SPEC-API-SURFACE.md
  SPEC-DATA-MODELS.md
  SPEC-HOOKS.md
  Template: SPEC-TEMPLATE.md
  3 specs (+ template)

Project Files:
  CLAUDE.md:    found, configured
  MEMORY.md:    found

For details:  /coherence hook    (hook enforcement levels and matchers)
              /coherence spec    (SPEC verification metadata)
              /coherence status  (global install state and registry)
```

Every category is represented. Hooks, agents, skills, SPECs, project files. One command, one view.

## Three States of a Hook

The most useful thing `config` surfaces is the relationship between hook files on disk and hook registrations in `settings.local.json`. Every hook falls into one of three states:

- **Active** (`●`) — the file exists and it's registered. This is what you want.
- **Orphaned** (`○`) — the file exists but isn't registered. Maybe you created it and forgot to wire it up, or you removed it from settings but left the file.
- **Missing** (`✗`) — it's registered in settings but the file is gone. This means a hook is supposed to run but can't. It will silently fail.

Orphaned hooks are clutter. Missing hooks are bugs. Both are easy to miss when you're only looking at one side — either the settings file or the hooks directory. `config` cross-references them for you.

## What Config Isn't

`config` is deliberately shallow. It tells you *what* exists, not *how* it's configured. For that, drill into the specific sub-commands:

- `/coherence hook` shows enforcement levels, matchers, and per-hook purposes
- `/coherence spec` shows verification dates and descriptions
- `/coherence status` shows global install state and the repo registry

Think of `config` as the table of contents. The other sub-commands are the chapters.

## The Inspection Trio

With `config`, the read-only inspection sub-commands form a complete set:

| Scope | Command | Shows |
|-------|---------|-------|
| Local overview | `config` | Everything in `.claude/` at a glance |
| Hook details | `hook` | Enforcement levels, matchers, file status |
| SPEC details | `spec` | Verification metadata, descriptions |
| Global state | `status` | Plugin config, repo registry |

Each answers a different question. Together, they mean you never have to manually read JSON or scan directories to understand your Coherence setup.

---

*Coherence v1.5.0 is available now. Run `/coherence config` to see the whole picture.*
