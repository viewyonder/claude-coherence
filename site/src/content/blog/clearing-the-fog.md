---
title: "Clearing the Fog"
subtitle: "How ten skills answer the four questions every AI-assisted project eventually asks"
date: 2026-03-03
author: "Injectionator"
draft: false
---

## The Fog

AI-assisted development solved the throughput problem. Code flows faster than it ever has. But throughput without visibility creates a new kind of problem — one that doesn't feel like a bug, because nothing is broken. It feels like fog.

You don't know what your setup looks like. You're not sure what happened while you were focused on something else. You can't say with confidence whether the codebase is still on its Happy Path or has quietly drifted off it. The code compiles, the tests pass, and you have no idea whether the last three hours of generated changes respected the constraints you spent a week encoding.

This isn't about code quality. It's about situational awareness. The fog isn't caused by bad tooling — it's caused by fast tooling that doesn't report back.

Over several releases, we added ten skills to Coherence. Each got its own blog post explaining what it does. What we haven't done is explain why they exist *as a set* — what questions they answer together that none of them answers alone.

## Four Questions

Every skill answers one of four questions. Once you see the grouping, the system stops looking like a list and starts looking like an instrument panel.

| Question | Skills | What They Tell You |
|----------|-------------|-------------------|
| Where am I? | `init`, `status` | Lifecycle state |
| What do I have? | `hook`, `spec`, `config` | Installed setup |
| What happened? | `history` | Enforcement decisions over time |
| Am I still on track? | `check-principles`, `check-drift`, `test-runner` | Compliance and drift |
| *(discoverable)* | `help` | All of the above |

The first three groups give you clarity. The fourth gives you confidence. Together, they clear the fog.

## Where Am I?

These are lifecycle skills. They tell you where you stand in the install → use arc.

`init` sets up the guardrails system — hooks, agents, skills, CLAUDE.md, and settings — customized to your project. `status` reports where Coherence is installed across your machine, whether each installation is healthy, and whether any registered repos have gone stale. To remove Coherence, use Claude Code's built-in `/plugin uninstall coherence` — it handles cleanup through the standard plugin management UI.

## What Do I Have?

These are inspection skills. They read configuration and report it back without changing anything.

`hook` lists every installed hook with its enforcement level, tool matcher, and file status — active, orphaned, or missing. `spec` lists SPEC documents with their verification dates and descriptions, so you can see at a glance which ones might need attention. `config` is the table of contents: everything in `.claude/` in one view, with the other two sub-commands serving as the chapters.

The inspection skills are covered in [Show Your Work](show-your-work.md) (hook, spec) and [The Whole Picture](the-whole-picture.md) (config). The underlying principle is simple: configuration that can't explain itself is configuration that gets forgotten.

## What Happened?

This is a single skill — `history` — but it answers a question the others can't.

Hooks fire constantly. Blocks and warnings appear inline and scroll away. Without a record, you can't tell whether your guardrails are doing real work or generating noise. `history` logs BLOCK and WARN decisions to a local file, and the summaries over time reveal patterns. A project with 45 warnings and 12 blocks tells a different story than one with 2 warnings and 0 blocks. The first might have hooks that need tuning. The second might have a team that's already internalized the constraints.

The full story is in [What Happened](what-happened.md). The key insight: hooks that can't prove they ran are hooks that get questioned.

## Am I Still on Track?

This is the core question — the one that clears the fog or confirms it.

Three skills address it, each from a different angle. `check-principles` is evaluative: it invokes an agent to judge whether code adheres to the principles in your CLAUDE.md. `check-drift` is forensic: it mechanically compares SPEC documents against the codebase and reports what's CURRENT, DRIFTED, or UNDOCUMENTED. `test-runner` is verification: it runs your tests with scope control and confirms that things still pass.

The distinction between evaluative and forensic checking matters — it's why we renamed `check-architecture` to `check-principles` in v1.3.1. One counts things. The other judges things. The old name obscured this. [Names Are Load-Bearing](names-are-load-bearing.md) covers the reasoning.

Together, these three skills answer "am I still on my Happy Path?" If principles are followed, specs match reality, and tests pass — you are. If any of those report otherwise, you know exactly where the drift started.

## From Guardrails to Clarity

The skills didn't arrive all at once. They accumulated across several releases, each one filling a gap that the previous release revealed.

| Version | What Arrived | Gap It Filled |
|---------|-------------|---------------|
| v1.2 | Unified `/coherence` with `init`, `check-drift`, `check-principles`, `test-runner`, `help` | Scattered commands → single entry point |
| v1.3 | `status` | No lifecycle management |
| v1.3.1 | Renamed `check-architecture` → `check-principles` | Misleading name |
| v1.4 | `hook`, `spec` | Can't see what's installed |
| v1.5 | `config` | No unified overview |
| v1.5.1 | Renamed `test` → `test-runner` | Clearer intent |
| v1.6 | `history` | No record of enforcement |
| v1.11.0 | Split into individual `/coherence:*` skills | Cleaner Claude Code integration |

The pattern is visible in hindsight. v1.2 gave us guardrails. Everything after that gave us instruments — ways to see what the guardrails are, what they've done, and whether they're still aligned with the codebase they protect.

That's the shift from guardrails to clarity. Guardrails block you from going off the road. Clarity tells you where the road is, which direction you're heading, and how far you've come. Both matter. But at velocity, clarity matters more — because the fog isn't caused by bad code. It's caused by not knowing.

[Entropy at Velocity](entropy-at-velocity.md) argued that the bottleneck shifts from writing code to keeping it coherent. Ten skills later, the mechanism for coherence isn't just enforcement. It's visibility. The fog clears not by slowing down, but by building instruments to see through it.

---

*Run `/coherence:help` to see all ten skills, or start with `/coherence:config` to see where you stand.*
