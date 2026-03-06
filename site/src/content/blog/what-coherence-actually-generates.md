---
title: "What Coherence Actually Generates"
subtitle: "A security SaaS with 18 inspectors, 5 SPECs, and strict tenant isolation — here's what /coherence:init produced and what it catches"
date: 2026-03-05
author: "Injectionator"
draft: false
---

## From the Field

We talk a lot about what Coherence *can* do. Here's what it *did* — for a real project, in production, over two months of daily use.

The project is a security SaaS built on Cloudflare Workers: prompt injection detection, multi-tenant isolation, a store-based frontend, and strict architectural boundaries. The codebase has 18 inspectors, 5 SPEC documents, and the kind of constraints where one wrong import or a leaked tenant ID means a real security incident.

The developer ran `/coherence:init`. They expected scaffolding. What they got was a guardrails system that understood their project — and has been catching real mistakes ever since.

## 9 Hooks That Encode Architecture

Coherence generated nine hooks, each one specific to the project's actual boundaries. Not linting rules. Architectural rules.

| Hook | What It Enforces |
|------|-----------------|
| `inspector-boundary.cjs` | Inspectors return verdicts. They don't terminate requests or touch global state. |
| `cloudflare-workers.cjs` | No `fs`, no `process.env`, no `Bun.serve` in runtime code. Build scripts get a pass. |
| `tenant-isolation.cjs` | Every data access needs a `clientId` or passport check. Unscoped D1 queries get flagged. |
| `store-unidirectional.cjs` | State flows one way: config → store → view. No direct DOM mutations from event handlers. |
| `route-prefix.cjs` | All paths must use the `/alpha` prefix. Easy to forget, hard to debug in production. |
| `test-gate.cjs` | Runs before commits. Changed files must have corresponding tests. |
| `test-suggest.cjs` | Post-edit nudge: "You changed an inspector — want to run the tests?" |
| `benchmark-suggest.cjs` | Post-edit nudge: "You changed an inspector — want to run the benchmark?" |

None of these are generic. `tenant-isolation.cjs` knows about D1 queries and passport checks because the wizard asked about data isolation and the project scan found the patterns. `cloudflare-workers.cjs` exists because the scan detected a Workers runtime — and it knows build scripts are exempt because the project structure makes the boundary clear.

This is the difference between a linter and an architectural guardrail. A linter checks syntax. These hooks check *intent*.

## 8 Skills That Codify Workflows

This is the part that surprised the developer most. Coherence didn't just generate hooks and agents — it generated project-local skills. Eight of them, each a multi-step workflow tailored to how this specific project works.

`/add-inspector` doesn't just create a file. It asks for the detection type (pattern, semantic, LLM, hybrid), which legs it runs on (detect, evaluate, both), and what's configurable. Then it generates the inspector, registers it in the registry with full metadata, creates tests for benign and malicious inputs, and runs verification. It knows that LLM inspectors need justification fields and that inspectors must never throw exceptions.

`/release` knows the project uses semver tags alongside monotonic build numbers. `/test` knows about the vitest-on-workerd setup and the difference between unit and integration test paths. `/add-route` knows the `/alpha` prefix convention and the middleware chain.

The value: workflow knowledge lives in the project, not in the developer's head. A new contributor runs `/add-inspector` and gets the same result as someone who's been on the project for months — because the skill encodes the process, not just the output.

## 9 Agents for Specialized Review

The wizard generated nine agents, each a focused persona with project-specific context: architecture reviewer, security auditor, drift detector, benchmark runner, test specialist, and more.

The key word is *project-specific*. When the architecture reviewer runs, it already knows the principles — inspector boundaries, tenant isolation, unidirectional state flow. It doesn't need prompting from scratch. The CLAUDE.md and SPEC documents give it the context to evaluate changes against the project's actual rules, not generic best practices.

## SPEC Drift Detection

The project maintains five SPEC documents as ground truth: inspector registry, system architecture, API surface, frontend contracts, multi-tenant model. `/coherence:check-drift` compares these against actual code and reports what's CURRENT, DRIFTED, or UNDOCUMENTED.

This is what keeps documentation honest. Not "we should update the docs" — a vague guilt that everyone ignores. Instead: "SPEC-API-SURFACE.md says 42 endpoints, code has 47. Here are the 5 undocumented ones." Concrete, actionable, falsifiable.

The developer runs this periodically and before major changes. Every time, it finds something. Not because the team is sloppy — because code moves faster than documentation, and without mechanical checking, the gap grows silently.

## What This Feels Like

The developer's summary: "I don't think about Coherence most of the time. That's the point."

They edit a file. If they're about to break a boundary, a hook tells them before the change lands. They need to add a feature. The skill walks them through the project's actual process. They wonder if the docs have drifted. They get a concrete answer.

`/coherence:config` shows everything at a glance — 9 active hooks, 4 orphaned `.js` files from a migration to `.cjs`, 9 agents, 8 skills, 5 SPECs. A dashboard for the project's guardrail system.

The real value isn't any single hook or skill. It's that the project's architectural decisions are *executable*. They run on every edit, not just when someone remembers to check.

## What This Means

This is one project. The numbers will be different for yours — different hooks, different skills, different boundaries. A Next.js app gets `boundary-guard.cjs` and `state-flow.cjs`. A Rails API gets `data-isolation.cjs` and `required-prefix.cjs`. A documentation project gets `terminology-check.cjs` and `style-guard.cjs`.

But the pattern is the same: `/coherence:init` reads your project, asks about your constraints, and generates guardrails that encode *your* architecture — not a generic template. The hooks fire on every edit. The skills codify your workflows. The agents review against your principles. The SPECs keep your documentation honest.

Two months in, the developer hasn't turned off a single hook. That's the real test.

---

*Run `/coherence:init` in your project to see what it generates. The wizard takes about five minutes. The guardrails last as long as the project does.*
