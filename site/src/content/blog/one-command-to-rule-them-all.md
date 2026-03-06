---
title: "One Command to Rule Them All"
subtitle: "Why we consolidated four slash commands into /coherence with sub-commands — and what it means for your workflow"
date: 2026-03-03
author: "Injectionator"
draft: false
---

> **TL;DR** — Four separate slash commands meant four things to remember and no way to discover them from the inside. We consolidated everything under `/coherence` with sub-commands — one entry point, self-documenting, and a single generated skill file instead of three.

## The Problem with Four Commands

Coherence v1.1 shipped with four separate slash commands:

- `/coherence` — the setup wizard
- `/check-drift` — SPEC drift detection
- `/check-architecture` — architecture compliance review
- `/test` — test runner

Four commands. Four things to remember. Four entries in your skills directory. And when you're explaining the system to someone new, four different invocations to demonstrate before they have the full picture.

It worked. But it scattered the surface area in a way that made the system feel like four separate tools rather than one coherent system. The irony of a project called "Coherence" having an incoherent command interface was not lost on us.

## One Entry Point

In v1.2, everything lives under `/coherence`:

| Command | What It Does |
|---------|--------------|
| `/coherence init` | Setup wizard (was `/coherence`) |
| `/coherence check-drift` | SPEC drift detection (was `/check-drift`) |
| `/coherence check-architecture` | Architecture compliance review (was `/check-architecture`) |
| `/coherence test` | Test runner (was `/test`) |
| `/coherence help` | Show available sub-commands |

Running `/coherence` with no arguments (or with `help`) shows the sub-command table. That's it. One command, discoverable from the inside.

## Why This Matters

### Discoverability

With four commands, you had to *know* they existed. With one command and a help screen, you type `/coherence` and immediately see everything available. New team members don't need to memorize a list — they explore from a single entry point.

### Mental Model

The four-layer architecture (hooks, agents, SPEC docs, skills) is the conceptual foundation of Coherence. Having skills scattered across multiple top-level commands muddied that. Now the skill layer has one clear entry point: `/coherence`. Hooks enforce. Agents review. SPECs define. `/coherence` orchestrates.

### Generated Projects

When the wizard generates a guardrails system for your project, it now generates a single unified skill instead of three separate ones. Fewer files, cleaner `.claude/skills/` directory, same functionality. The generated skill follows the same dispatcher pattern — parse the first argument, run the matching sub-command.

## What Changed Under the Hood

The implementation is straightforward. Claude Code skills don't have native sub-command support, so the unified SKILL.md is a single file that:

1. Parses the first argument as the sub-command name
2. Contains the full instructions for each sub-command inline
3. Shows the help table when called with no arguments

The three separate skill directories (`check-drift/`, `check-architecture/`, `test/`) are gone. One directory remains: `coherence/`. The plugin copy matches the template copy exactly — the dogfood check (#6) still verifies this.

Every reference across the repo was updated: README, CLAUDE.md, all four SPEC documents, both copies of the blog post, the Astro site pages and components, the agent descriptions, and the template files that adopters customize.

## Migration

If you're already using Coherence:

**Plugin users**: Update the plugin. The old commands will stop working; the new ones are ready immediately.

**Manual template users**: Replace your `skills/` directory contents. Delete `check-drift/`, `check-architecture/`, and `test/`. The new `coherence/SKILL.md` contains everything.

**Muscle memory**: `/check-drift` becomes `/coherence check-drift`. `/check-architecture` becomes `/coherence check-architecture`. `/test` becomes `/coherence test`. The old `/coherence` (wizard) becomes `/coherence init`.

## What Didn't Change

- Hooks still run on every edit — no change
- Agents are still read-only reviewers — no change
- SPEC documents are still the source of truth — no change
- The wizard still detects your stack and generates everything — just invoked as `/coherence init` now
- Dogfood mode still triggers when running inside the coherence repo itself

The four-layer architecture is intact. We just gave the skill layer a single front door.

---

*Coherence v1.2.0 is available now. Run `/plugin marketplace add viewyonder/coherence` to get started, or update your existing installation.*
