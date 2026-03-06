---
title: "Entropy at Velocity"
subtitle: "How AI-assisted development shifts the bottleneck from writing code to keeping it coherent — and what you can do about it"
date: 2026-02-23
author: "Injectionator"
draft: false
---

> **TL;DR** — AI didn't mass-produce bugs. It mass-produced *drift*. When code flows ten times faster, the bottleneck shifts from writing it to keeping it coherent — and your current review process can't keep up. We break down why obvious solutions fail and introduce a four-layer system that encodes architectural constraints directly into the generation loop.

## The Constraint Shift

For most of software engineering's history, the bottleneck was writing code. Not thinking about it, not designing it — *writing* it. The mechanical act of translating intention into syntax, spread across files, tested, debugged, committed. That's where most of the clock burned.

AI-assisted development largely removes that bottleneck. What used to take an afternoon now takes minutes. You describe what you want, an agent produces it, you review and refine. The throughput increase isn't marginal — it's an order of magnitude.

But removing a bottleneck doesn't eliminate work. It reveals the next constraint. And the constraint that emerges when code flows freely is *coherence*: keeping a codebase internally consistent as it changes faster than any human can manually track.

This is entropy at velocity. The same force that makes your desk messier over time, applied to software architecture at ten times the usual rate of change. Every generated file is syntactically correct and locally sensible. But does it follow the conventions the rest of the codebase established? Does it know about the routing prefix every endpoint requires? Does it understand why the database queries need tenant filters?

These aren't hypothetical concerns. These are the things that actually break production. And they break silently — the code compiles, the tests pass, and the problem doesn't surface until a customer reports that they're seeing someone else's data.

## Two Kinds of Drift

When people talk about "drift" in a codebase, they usually mean one thing. But there are actually two distinct forces at work, and conflating them leads to the wrong solutions.

**Force 1: You drift from the architecture.** This is the familiar one. Your design says inspectors return verdicts and don't mutate state. But under time pressure, someone writes an inspector that directly modifies `ticket.payload`. It works. It ships. Now you have an exception, and exceptions breed. The next person sees the precedent and follows it. Within a few weeks, your clean boundary — "inspectors return verdicts; the switchboard executes" — has quietly dissolved.

This kind of drift accelerates with AI assistance because the agent doesn't know about your unwritten conventions unless you tell it. It will generate perfectly functional code that violates architectural boundaries it's never been told about. Not out of negligence — out of ignorance.

**Force 2: The architecture drifts from reality.** This one is less discussed but equally corrosive. Your spec document says you have 14 inspectors. You actually have 18 — four were added last month and nobody updated the spec. Your API reference lists 23 endpoints. The codebase has 31. The spec isn't wrong in the traditional sense; it's *stale*. It describes a system that no longer exists.

Stale specs are arguably worse than no specs. A developer who consults the spec and doesn't find the endpoint they need might duplicate it. An agent given the spec as context will generate code that assumes the old structure. You've created a source of authoritative misinformation.

These two forces require different responses. Force 1 needs enforcement — something that catches violations at the moment of creation. Force 2 needs detection — something that periodically compares documentation against reality and surfaces the gaps.

## What Entropy Costs

The costs of architectural drift are well-known in theory but persistently underestimated in practice, because they're distributed. No single incident is catastrophic. The damage accumulates.

**Re-doing work.** An agent adds an API endpoint at `/api/v1/configs` instead of `/alpha/api/v1/configs`. Everything works in development. It breaks in production because the Cloudflare routing rules only forward `/alpha/*` paths to the worker. Someone debugs this for an hour, discovers the missing prefix, and fixes it. This happens three more times over the next month because the knowledge lives in one person's head, not in the system.

**Spec rot.** A new inspector is created, registered, tested, and deployed. The spec document isn't updated. Two months later, someone consults the spec to plan capacity for the LLM budget and misses four inspectors that make LLM calls. The estimate is wrong. The bill is a surprise.

**Pattern inconsistency.** The codebase has two patterns for database access — one with tenant isolation filters, one without. Both exist because the second was added by an agent that didn't know about the first. Now every new database query is a coin flip: will it include the tenant filter? The inconsistency doesn't cause bugs until it does, and when it does, it's a data isolation violation.

**Reluctance.** This is the least visible and most damaging cost. When a codebase has accumulated enough inconsistency, developers become reluctant to change it. Not because the code is complex — because the *conventions* are unclear. Which pattern is the right one? Is this import style intentional or accidental? Uncertainty creates friction, and friction slows everything down, negating the velocity gains that created the entropy in the first place.

The irony is precise: AI-assisted development creates entropy faster than traditional development, and that entropy degrades the AI's effectiveness, because the agent is learning conventions from a codebase that no longer has consistent ones.

## Why Obvious Solutions Fail

The usual responses to architectural drift are: better documentation, stricter code review, and more linting rules.

These all share the same flaw: they rely on human attention at the wrong moment.

Better documentation only works if it's consulted before writing code and updated after. In practice, it's written once and consulted rarely. Stricter code review catches violations *after* the work is done — meaning someone has to explain the violation, the author has to redo the work, and both people spend time that didn't produce value. Linting rules are effective but narrow; they can catch syntax patterns, not architectural intent.

The fundamental mismatch is temporal. Human enforcement mechanisms activate *after* the code exists — during review, during deployment, during the incident that reveals the problem. But the agent generating the code needs to know the constraints *before* it writes the first line. By the time a reviewer catches that the route is missing its prefix, the agent has already written three files that assume the wrong path.

What you need is not better enforcement *after the fact*. You need architecture encoded *into the generation loop itself*.

## Encoding Architecture Into the Loop

There are four layers to this, each operating at a different point in the development cycle. None of them alone is sufficient. Together, they create a system where architectural knowledge is active rather than passive — it participates in the process of writing code rather than waiting to judge it afterward.

### Layer 1: Hooks (Automated Enforcement)

Hooks are small programs that run *before* a tool executes. When an agent is about to write a file, the hook sees the content before it hits disk and can block it if it violates a constraint.

This is not linting. Linters check syntax. Hooks check architectural intent.

In our system, we run 9 hooks across three enforcement levels:

**4 blocking hooks** prevent violations from ever reaching the codebase:
- **Forbidden imports** — Blocks runtime-inappropriate APIs (e.g., `require('fs')` in a Cloudflare Worker, `Bun.serve()` in edge runtime code). The hook knows which paths are runtime vs. build-time, so build scripts that legitimately use these APIs pass cleanly.
- **Route prefix** — Blocks routes missing a required prefix. Every endpoint must include `/alpha/` because the deployment's routing configuration only forwards those paths to the worker. Works locally, 404s in production. The hook eliminates this class of bug entirely.
- **Boundary guard** — Blocks architectural boundary violations. In our system, inspectors return verdicts — they don't mutate state. The hook detects `ticket.payload = ...` in inspector files and blocks it, citing the principle and suggesting the correct pattern.
- **Test gate** — Blocks `git commit` when staged source files lack corresponding tests. Fires only on commit, not on every edit, so it doesn't interrupt flow.

**2 warning hooks** surface concerns without blocking:
- **Data isolation** — Warns when database queries appear to lack tenant filters. Warns rather than blocks because some queries (admin dashboards, aggregate stats) are legitimately global. Turns an invisible default into a conscious decision.
- **Delegation check** — Warns when API handlers contain substantial business logic instead of delegating to core modules. Heuristic-based, so it advises rather than enforces.

**3 informational hooks** suggest follow-up actions:
- **Test suggest** — After editing source files, surfaces the related test file path and suggests running it. If no test exists, nudges toward creating one.
- **Change suggest** — After editing detection-critical files, suggests running the benchmark suite to verify detection rates haven't regressed.
- **State flow** — After editing frontend store code, checks that setters call `notify()`, that state isn't exported directly, and that event handlers go through stores rather than manipulating DOM directly.

This graduated approach — block, warn, inform — reflects a mature understanding of what automation can decide and what requires human judgment. The forbidden-imports hook is confident enough to block: there's no legitimate reason to use `Bun.serve()` in a Cloudflare Worker. The tenant-isolation hook is not confident enough to block: it can't distinguish a legitimate global query from a bug. The benchmark-suggest hook doesn't even need to be confident — it's just reminding you that a related action exists.

Consider how the boundary guard hook works in practice. An agent writes an inspector that directly mutates ticket state:

```
Inspector boundary violation:
1. Direct mutation: `ticket.payload = ...` — Inspectors return
   verdicts; they must not mutate ticket state. Return a clip
   with Verdict.MODIFY and the modified content instead.

Principle: "Inspectors return verdicts; Switchboard executes."
(CLAUDE.md)
```

Notice the error message. It doesn't just say "don't do this." It explains the architectural principle being violated and cites where that principle is defined. The agent can read the principle, understand the *intent*, and generate a correct implementation. It's teaching, not just blocking.

The route prefix hook catches a subtler class of production bug — one that's invisible in development:

```
Route prefix violation:
1. Route "/api/v1/configs" is missing /alpha/ prefix.
   All routes must be prefixed with /alpha/.
```

This is a constraint that no amount of documentation can reliably enforce, because the developer (or agent) who forgets the prefix *doesn't know they forgot it*. The code works in their environment. Only the hook, running at the moment of creation, catches it.

And the data isolation hook makes the invisible visible:

```
Tenant isolation warning:
D1 query at position 847 may lack tenant filter.
Ensure WHERE clause includes userId, clientId, or fingerprint.
```

The hook can't know whether the query *should* be filtered. But it can ensure that the question is asked.

### Layer 2: Agents (Contextual Knowledge)

Hooks catch known violations. But what about unknown drift — the gap between what the documentation says and what the code actually does?

This is where specialized agents earn their keep. We run 9 agents, falling into three categories:

**4 review agents** analyze code against established standards:
- **Architecture reviewer** — Systematic compliance check against CLAUDE.md principles. Produces a structured report with per-principle status (compliant, needs attention, violation) covering security, boundary, performance, and propagation principles.
- **Code reviewer** — General quality, maintainability, and best practices review. Focuses on significant issues rather than nitpicks.
- **Security auditor** — OWASP Top 10 focused. Severity-classified (CRITICAL/HIGH/MEDIUM/LOW) with exploit scenarios and fix recommendations. Required for security-critical code paths.
- **Drift detector** — Compares SPEC documents against the actual codebase and produces a report categorizing each component as CURRENT, DRIFTED, or UNDOCUMENTED.

Review agents are read-only — they have access to Read, Grep, Glob, and Bash for investigation, but not Write or Edit. They observe and report; they don't change code. This is deliberate. The review should surface information, not act on it unilaterally.

**3 generative agents** create code following established patterns:
- **Inspector generator** — Creates new inspectors following the documented 6-step process, including tests and registry updates.
- **Route generator** — Scaffolds new routes with HTML/CSS/JS, route config, and registration.
- **Test specialist** — Writes tests, improves coverage, and debugs test failures.

Generative agents have Write and Edit access because their purpose is to create code. But they're constrained by the same hooks that constrain manual edits — if the inspector generator produces code that violates the boundary guard hook, the write is blocked.

**2 operational agents** manage infrastructure concerns:
- **Benchmark runner** — Executes detection benchmarks, analyzes results, and compares against baselines.
- **Cloudflare Workers expert** — Answers runtime questions, API usage, performance optimization specific to the Workers environment.

The drift detector deserves particular attention. Its taxonomy matters:

- **CURRENT**: The spec matches the code. No action needed.
- **DRIFTED**: The spec describes something the code no longer matches. The spec needs updating or the code needs fixing.
- **UNDOCUMENTED**: The code contains something the spec doesn't mention. The spec needs extending.

"Drifted" and "undocumented" are different problems with different solutions. A drifted inspector might have been intentionally redesigned without updating the docs. An undocumented endpoint might have been added hastily and needs review. Lumping them together as "out of sync" loses the signal about what actually happened.

The drift detector doesn't fix anything. It surfaces information. It turns "I think the specs are probably up to date" into "here are the 7 specific items that aren't." That specificity is what makes the difference between documentation that decays and documentation that's maintained.

### Layer 3: SPEC Documents (Verified Ground Truth)

Hooks enforce patterns. Agents detect drift. But both need something to enforce *against* — a definition of what "correct" means that's more precise than prose and less brittle than unit tests.

This is the role of specification documents. Not design documents — those describe intent and rationale. Specification documents describe *what exists*: every inspector, every API endpoint, every store, every binding. They're the kind of document that can be mechanically compared against code because they make specific, falsifiable claims.

We maintain 5 SPEC documents, each covering a distinct architectural surface:

| SPEC Document | What It Specifies | Verified Against |
|---|---|---|
| **SPEC-INSPECTOR-REGISTRY** | All 18 inspectors: names, files, detection methods, legs, config schemas | `src/inspectors/*.ts`, `inspector-registry.ts` |
| **SPEC-SYSTEM-ARCHITECTURE** | Bindings, stations, modes, packages, middleware stack | `src/index.ts`, `wrangler.toml` |
| **SPEC-API-SURFACE** | Every API endpoint, auth middleware, handler functions | `src/api/`, route registrations |
| **SPEC-FRONTEND-CONTRACTS** | Store state, asset pipeline, design tokens | `src/pages/labs/stores/` |
| **SPEC-MULTI-TENANT** | Tenant identity flow, D1 isolation, passport system | Auth middleware, repositories |

Each SPEC document includes a "Last verified" date header — a timestamp of when someone (or an agent) last confirmed that the spec matches reality. This isn't decoration. A spec with "Last verified: 3 months ago" is a signal that drift detection is overdue. A spec with "Last verified: today" gives you confidence to rely on it.

The key property of SPEC documents is *falsifiability*. The statement "we have 18 inspectors" is either true or false, checkable by running `ls src/inspectors/*.ts`. The statement "our API is well-designed" is an opinion. SPEC documents make the first kind of claim, not the second. This is what makes them useful as an enforcement target — the drift detector can mechanically compare them against code.

The drift policy makes this explicit: if code contradicts a spec, the spec gets updated and the change gets called out. If a feature is added, the relevant spec is updated as part of the same change. The specifications aren't aspirational — they're descriptive. They track reality or they're wrong.

This is an unusual relationship between documentation and code. Most documentation describes what the code *should* do. Specifications describe what it *does*. That distinction makes them useful as a reference for both humans and agents — they're a shared understanding of the system's current shape, not its desired future state.

### Layer 4: Skills (Workflow as Architecture)

The final layer integrates architectural compliance into the workflow itself. We define 7 skills — named operations that encode multi-step processes:

**Generative skills** create code with built-in compliance:
- `/add-inspector` — 6-step process: create inspector, register it, add to route config, create tests, update SPEC-INSPECTOR-REGISTRY, run verification.
- `/add-route` — 5-step process: create page files, build assets, create route config, register route, add wrangler pattern.
- `/add-test` — Creates tests following project patterns for a specific file or feature.

**Operational skills** run predefined workflows:
- `/coherence test-runner` — Flexible test runner with scope control (all, inspector-specific, API, integration, E2E).
- `/benchmark` — Detection rate benchmarks against payload sets with baseline comparison.

**Audit skills** invoke review agents:
- `/coherence check-drift` — Invokes the drift detector agent. Accepts scope: `inspectors`, `api`, `stores`, `architecture`, or `all`.
- `/coherence check-principles` — Invokes the architecture reviewer agent against staged changes or a specific path.

The `/add-inspector` skill deserves particular attention because it demonstrates *architecture by construction*. When an agent creates a new inspector, the process includes updating the specification registry as Step 5 of 6 — between creating tests and running verification. Not as an afterthought. Not as a separate task that can be forgotten. It's part of the same operation that creates the code.

The spec doesn't drift because updating it isn't a separate task — it's part of the workflow. This approach works because it aligns the moment of maximum knowledge with the moment of documentation. The agent that just created the inspector knows everything about it: its name, detection method, configuration schema, which legs it runs on. Asking it to write the spec entry at that moment is trivial. Asking a different person to do it three days later is a game of forensic reconstruction.

## The Template

These patterns aren't specific to our project. The principles — graduated enforcement, drift detection, verified specifications, workflow-as-architecture — apply to any codebase where an AI agent is a primary author of code.

We've extracted the system into a [companion template](https://github.com/viewyonder/coherence) that you can adopt in about 15 minutes. It includes:

- **9 generalized hooks** with configuration blocks at the top of each file. Swap the path patterns and constraint definitions for your project's conventions. The forbidden-imports hook ships with Node.js/Bun/Deno patterns; the route-prefix hook takes your prefix as a constant; the boundary-guard hook takes your module paths and forbidden patterns.
- **4 universal agents** (architecture reviewer, drift detector, code reviewer, security auditor) with project-agnostic prompts. They reference your CLAUDE.md principles rather than hardcoded rules.
- **A unified `/coherence` skill** with sub-commands (`check-drift`, `check-principles`, `test-runner`) ready to invoke.
- **A template CLAUDE.md** with `{{PLACEHOLDER}}` markers for your project name, runtime, deployment target, and architectural principles.
- **A SPEC document template** with the "Last verified" header pattern and falsifiable claim structure.
- **Two worked examples** (Express + PostgreSQL, Next.js + Prisma) showing how the same hooks adapt to different stacks.

The template is opinionated about *structure* (how hooks, agents, and specs relate to each other) but not about *content* (what your specific constraints are). Your project's forbidden imports, route prefixes, module boundaries, and isolation requirements are different from ours. The template gives you the machinery; you supply the knowledge.

## What This Changes

The honest answer is: some things, not everything.

What it solves well: *known constraints with detectable patterns*. Route prefixes, runtime API restrictions, tenant isolation, boundary violations — these are well-defined rules with clear signatures. Hooks catch them reliably. The false positive rate is low because the rules are specific.

What it partially solves: *documentation decay*. Drift detection surfaces gaps. Workflow integration reduces them. But documentation still requires human judgment about *what to document* and *how* — no automation can decide whether a three-line utility function deserves a spec entry.

What it doesn't solve: *design quality*. Nothing in this system prevents you from building the wrong abstraction, choosing the wrong algorithm, or misunderstanding the user's needs. These are hooks that enforce constraints, not oracles that evaluate wisdom. A perfectly consistent codebase can still implement a bad idea consistently.

There's also an important limitation around granularity. Hooks that are too strict become obstacles. Hooks that are too loose become noise. Finding the right threshold requires iteration and judgment. The tenant isolation hook warns rather than blocks because the system's designers knew they couldn't distinguish legitimate global queries from bugs. That calibration is itself a design decision that requires experience.

## The Interesting Question Ahead

We've spent decades building tools that help individual developers write better code. IDEs, type systems, linters, formatters — all amplify individual capability. The interesting question now is different: **how do you maintain architectural coherence when the primary author of code is not a person?**

The answer isn't "better AI." It's better *context* for AI. An agent that knows your constraints produces better code than a smarter agent that doesn't. The quality of generated code is bounded not by model capability but by the quality of the architectural knowledge available at generation time.

This suggests that the role of the senior engineer shifts — from someone who writes code and reviews code to someone who *encodes architectural knowledge into systems that write code*. The expertise doesn't disappear. It moves from the inner loop of implementation to the outer loop of constraint design.

Entropy doesn't stop. Systems still drift. Specs still rot, conventions still diverge, and production still surprises you. But the rate of drift is something you can influence, and the tools for influencing it are no longer limited to human attention applied after the fact. The architecture can participate in its own enforcement. That's new. That matters.

---

*This post describes patterns implemented in [injectionator-alpha](https://injectionator.com), a prompt injection defense platform built on Cloudflare Workers. The hooks, agents, and specifications referenced are real — the [companion template](https://github.com/viewyonder/coherence) lets you adopt them in your own projects.*
