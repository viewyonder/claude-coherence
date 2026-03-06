---
title: "Letting Go of the Lever"
subtitle: "Why we removed /coherence uninstall and embraced Claude Code's native plugin UI"
date: 2026-03-05
author: "Injectionator"
draft: false
---

> **TL;DR** — We built a thorough, well-designed uninstall command — and then deleted it. Destructive operations shouldn't be interpreted by an LLM when the platform already handles them deterministically. Skills are for judgment; plumbing should be mechanical.

## The Urge to Own Everything

When you build a plugin, there's a natural urge to own the entire lifecycle. Install, configure, inspect, remove — all under your roof, all using your commands. We gave in to that urge in v1.3 when we shipped `/coherence uninstall`. It was thorough. It handled local cleanup, global cleanup, registry management, `--force` for multi-repo edge cases, `--purge` for full file deletion. We even added aliases — `remove` and `unplug` — because we wanted every intuitive word to work.

It was, by any reasonable measure, a well-designed feature. And we're removing it.

## What Went Wrong

The problem wasn't the feature's design. It was its *surface*. `/coherence uninstall` was a skill — a set of instructions that Claude interprets and executes step by step. That means Claude is reading a 150-line SKILL.md, deciding how to walk through eight phases of cleanup, modifying `settings.local.json`, editing `~/.claude/settings.json`, deleting cache directories, and managing a registry file — all through natural language interpretation of procedural instructions.

That's a lot of moving parts for a destructive operation.

Claude is remarkably capable at following complex instructions. But "remarkably capable" and "deterministic" are different things. An uninstall command that *usually* cleans everything up correctly is worse than one that *always* does, because the failure mode is silent: an orphaned config entry, a stale registry record, a hook registration that survived the cleanup. You don't notice until something weird happens in a different repo three weeks later.

Meanwhile, Claude Code has a perfectly good plugin management UI. `/plugin uninstall coherence` does what it says — deterministically, through native code, with no interpretation layer. It was always there. We just didn't trust it enough to let go of the lever.

## Two Kinds of Reliability

There's a useful distinction between *interpreted reliability* and *mechanical reliability*.

Interpreted reliability is what you get from a skill. Claude reads the instructions, understands the intent, and executes. It's flexible — it can handle edge cases the author didn't anticipate, adapt to unexpected state, explain what it's doing. But it's probabilistic. Every execution is a fresh interpretation.

Mechanical reliability is what you get from native code. `/plugin uninstall` runs the same code path every time. No interpretation, no judgment calls, no risk of misreading a step. It's rigid — it can't adapt to situations its authors didn't code for. But for a destructive, state-modifying operation like uninstall, rigid is exactly what you want.

Skills excel at tasks that benefit from judgment: analyzing code, generating configuration, detecting drift, reviewing architecture. Uninstalling a plugin is not one of those tasks. It's plumbing. Plumbing should be mechanical.

## What Changes

For users, the change is simple:

**Before (v1.x):**
```
/coherence uninstall              # clean local config
/coherence uninstall --force      # also clean global config
/coherence uninstall --purge      # also delete project files
```

**Now (v1.11.0):**
```
/plugin uninstall coherence       # remove the plugin
```

To clean up generated project files (`.claude/hooks/`, `.claude/agents/`, etc.), delete them directly or ask Claude to help. Those files are yours — they contain your customized guardrails, and the decision about what to keep should be yours too, not automated by a blanket `--purge`.

The repo registry and `/coherence:status` remain. They're useful for visibility — knowing where Coherence is installed across your machine — and they don't perform destructive operations.

## The Colon

You'll also notice a syntax change. Plugin skills now use colon syntax: `/coherence:init`, `/coherence:check-drift`, `/coherence:status`. This replaces the space-separated sub-command format (`/coherence init`, `/coherence check-drift`) that the plugin used in v1.x.

The colon format is Claude Code's native convention for plugin skills. Each skill is a separate, independently discoverable command — not a monolithic dispatcher that parses arguments. This means Claude Code's built-in help and autocomplete work naturally. When you type `/coherence:`, you see all available skills. No need to remember sub-command names or run `/coherence help` to see what's available.

The local template skill (installed into your project by `/coherence:init`) still uses the space-separated format — `/coherence check-drift` — because it's a single monolithic skill with sub-command dispatch. That's the right design for a project-local skill that doesn't go through the plugin system. Two interfaces, two conventions, each appropriate to its context.

## The Broader Pattern

This is a general lesson for plugin authors: don't replicate what the platform already provides. Claude Code has native commands for plugin installation, removal, enabling, disabling, and updating. Building a parallel uninstall path inside your plugin creates two sources of truth for the same operation — and users will inevitably use both, in unpredictable combinations.

Own what's yours: the domain-specific intelligence, the configuration generation, the drift detection, the compliance checking. Defer to the platform for lifecycle management. Your plugin is a guest in the user's environment. Guests don't rewire the plumbing.

---

*Coherence v1.11.0 is available now. Run `/coherence:help` to see all ten skills, or `/coherence:status` to check your installations.*
