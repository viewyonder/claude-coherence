---
title: "Names Are Load-Bearing"
subtitle: "Why we renamed check-architecture to check-principles — and what the distinction reveals about how guardrails actually work"
date: 2026-03-03
author: "Injectionator"
draft: false
---

# Names Are Load-Bearing

*Why we renamed `check-architecture` to `check-principles` — and what the distinction reveals about how guardrails actually work.*

---

## The Confusion

Coherence has two check sub-commands:

- `/coherence check-drift` — compares SPEC documents against the codebase
- `/coherence check-architecture` — reviews code against CLAUDE.md principles

Both names sound like they verify structural facts. "Check the architecture" implies: count the endpoints, verify the module boundaries exist, confirm the file tree matches the diagram. Structural verification. That's what `check-drift` does — it reads SPEC documents full of falsifiable claims ("we have 18 inspectors") and compares them against code.

But `check-architecture` doesn't do that. It invokes the `architecture-reviewer` agent, which reads the *principles* section of CLAUDE.md — security principles, boundary principles, performance principles, propagation principles — and evaluates whether code *adheres* to them. It's not checking structure. It's checking intent.

The name was wrong. Not catastrophically wrong — people figured out what it did. But wrong enough that every new user had the same moment of confusion: "How is this different from check-drift?"

## Two Different Questions

The distinction matters because the two sub-commands answer fundamentally different questions:

**`check-drift`** asks: *Does the documentation match reality?*

This is a factual comparison. The SPEC says 18 inspectors exist. Do they? The SPEC lists 31 API endpoints. Are there 31? The answer is yes or no, mechanically verifiable. The output is CURRENT / DRIFTED / UNDOCUMENTED. No judgment required.

**`check-principles`** asks: *Does the code follow the rules we set for ourselves?*

This is a judgment call. The principle says "API handlers validate and delegate." Does this handler delegate, or does it contain inline business logic? The principle says "every input is hostile." Does this endpoint validate its parameters? The output is a compliance report with per-principle status. It requires interpretation — which is why it delegates to an agent rather than running a mechanical comparison.

Drift detection is *forensic*. Principles checking is *evaluative*. One counts things. The other judges things. The old name obscured this, making both sound forensic.

## Why Names Matter in Tooling

In a traditional codebase, a misleading function name is a minor annoyance. You read the implementation, understand what it does, and move on. The name is a hint, not a contract.

In an AI-assisted workflow, names carry more weight. When a user types `/coherence` and sees a list of sub-commands, the name is often the *only* thing they read before deciding which one to run. There's no implementation to skim. The name *is* the interface.

A user who wants to verify their SPEC documents are accurate might run `check-architecture` because it sounds like it checks architectural facts. They'd get a principles compliance report instead — useful, but not what they needed. They should have run `check-drift`.

With the new names, the distinction is immediate:
- **check-drift** — check if documentation has drifted from code
- **check-principles** — check if code follows your principles

No ambiguity. No overlap in mental model. The name tells you what you're getting.

## What Changed

The rename touched 18 files across the repo:

- Both SKILL.md copies (template and plugin) — sub-command tables, section headers, usage examples, instructions
- CLAUDE.md — the four-layer architecture table and key conventions
- README.md — the command table
- All three SPEC documents — cross-references
- Four site pages — getting-started, wtf, agent cards, changelog
- The site changelog data

What *didn't* change: the `architecture-reviewer.md` agent file keeps its name. It *is* an architecture reviewer — that's its role, not its sub-command. The agent reviews architecture; the sub-command that invokes it checks principles. Different things, appropriately named.

## The Pattern

This is a small change. One string, 18 files, zero behavioral difference. But it reflects something worth stating explicitly: **in a system where names are the primary interface, getting names right is a functional requirement, not a cosmetic one.**

Coherence is a system built on the premise that architectural knowledge should be active — encoded into the development loop, not written in a document and forgotten. The names of the sub-commands are part of that encoding. When the name misleads, the system misleads. When the name clarifies, the system teaches.

`check-principles` teaches. `check-architecture` didn't.

---

*Coherence v1.3.1 renames `check-architecture` to `check-principles`. If you're using the plugin, update to get the new name. If you're using the template directly, find-and-replace across your SKILL.md.*
