---
title: "QMD + Coherence: Semantic Search for Drift Detection"
subtitle: "When grep can't find what you're looking for — because the code uses different words than the spec"
date: 2026-03-03
author: "Injectionator"
draft: false
---

> **TL;DR** — Your spec says "input validation." Your code uses `schema.parse()`, `assertParams()`, and `checkPayload`. Grep finds none of them. That's not drift — it's a vocabulary gap, and it poisons every drift report with false positives. QMD's semantic search bridges the gap by matching *concepts*, not strings, and Coherence now uses it automatically when available.

## The Vocabulary Gap

Here's a scenario that plays out constantly in drift detection.

Your SPEC document says: *"All API endpoints validate input before processing."* You run `/coherence check-drift`. The drift detector greps for `validate` across your route handlers. It finds three matches out of twelve endpoints. Nine endpoints are flagged as DRIFTED.

But they aren't drifted. They *do* validate input. They just don't use the word "validate."

One uses Zod: `schema.parse(req.body)`. Another calls `assertParams(input)`. A third has a middleware called `checkPayload` that runs before the handler ever fires. They're all doing input validation. Grep doesn't know that because grep matches strings, not concepts.

This is the vocabulary gap — the distance between the terminology your SPEC uses and the terminology your code uses. It's not a bug in the code or a bug in the spec. It's an inherent consequence of the fact that specifications are written in English by humans and implementations are written in code by (increasingly) agents, and neither is obligated to use the same words.

The gap shows up everywhere:

- SPEC says **"audit trail"** — code uses `eventLog`, `activityRecord`, `trackChange`
- SPEC says **"tenant isolation"** — code uses `orgFilter`, `scopedQuery`, `workspaceGuard`
- SPEC says **"rate limiting"** — code uses `throttle`, `requestBudget`, `slidingWindow`

Every mismatch is a potential false positive in your drift report. And false positives are corrosive — they teach you to ignore the report, which means you miss the *real* drift hiding among the noise.

## What QMD Does

[QMD](https://github.com/tobi/qmd) is a local semantic search engine built by Tobi Lütke. It indexes markdown and code files into collections, then lets you search them by meaning rather than by exact text.

Three things matter about QMD for our purposes:

**It's local.** No cloud API, no data leaving your machine. The embeddings are generated and stored on-device. This matters for codebases with proprietary code — you're not sending your source files to a third-party service.

**It has three search modes.** Keyword search (BM25) works like traditional full-text search. Semantic search uses vector embeddings to find conceptually related content. Hybrid mode combines both and reranks the results. For drift detection, hybrid mode is the sweet spot — it catches exact matches *and* conceptual matches in a single query.

**It indexes code.** QMD isn't limited to documentation. You can index your `src/` directory, your test files, your config. When the drift detector searches for "input validation," QMD returns the Zod schemas, the assertion helpers, the middleware — all the implementations that are semantically related to the concept even though none of them contain the word "validate."

## How Coherence Uses It

The integration is deliberately lightweight. QMD is optional, auto-detected, and purely additive. Nothing breaks without it.

When Coherence's drift detector or architecture reviewer agents start a check, they run `qmd status` to see if QMD is available. If the command succeeds and shows indexed collections, the agents use QMD to supplement their existing Grep/Glob searches. If it fails — QMD isn't installed, or the project isn't indexed — the agents skip it silently and proceed as before.

The agents use QMD in three specific patterns:

### Broad constraint claims

SPEC says: *"All routes validate input."* This is a universal claim — it applies to every endpoint. Grep can find explicit `validate()` calls, but it misses all the other ways code validates input.

```bash
qmd search "input validation" -c myproject --json -n 15
```

QMD returns files containing Zod schemas, assertion functions, middleware validators, and custom check utilities. The drift detector can now verify the claim against a much more complete picture.

### Terminology mismatches

SPEC says: *"The system maintains an audit trail for all operations."* You grep for "audit" and find nothing. DRIFTED? No — the implementation uses `EventLog` and `ActivityRecord`, two classes that collectively *are* the audit trail.

```bash
qmd search "audit trail logging" -c myproject --json -n 10
```

QMD bridges the vocabulary gap because it searches by meaning. "Audit trail logging" matches against code that records events, tracks activity, and logs operations — regardless of what the variables and classes are named.

### Discovering undocumented components

Sometimes the problem isn't that code doesn't match the SPEC — it's that code exists that the SPEC doesn't know about. Glob patterns find files in expected locations. But what about the authentication middleware someone added in `lib/helpers/auth-check.ts` instead of `middleware/auth.ts`?

```bash
qmd query "what modules handle authentication?" -c myproject
```

The `query` command uses hybrid search with reranking — the highest-quality search mode. It finds every file in the project that deals with authentication, regardless of where it lives in the directory structure or what it's called.

## Setting It Up

Setup takes about two minutes.

**Install QMD:**

```bash
npm install -g @tobilu/qmd
```

**Create a collection and generate embeddings:**

```bash
qmd collection add ./src --name myproject
qmd embed
```

**Enable in Coherence:**

The template's `CLAUDE.md` includes a QMD section, commented out by default. Uncomment it and replace `{{QMD_COLLECTION_NAME}}` with your collection name:

```markdown
This project is indexed in QMD as collection `myproject`.

Use `qmd search` or `qmd query` via Bash to find relevant documentation,
design decisions, and context across the project's markdown files.
```

**Run a drift check:**

```
/coherence check-drift
```

That's it. The drift detector and architecture reviewer agents detect QMD automatically at runtime. No configuration changes to the agents themselves, no flags to set. If QMD is there, they use it. If it's not, they don't.

## What Changes in Practice

The difference shows up in three ways.

**Fewer false positives.** The most immediate improvement. Claims that previously reported DRIFTED because grep couldn't find the implementation now correctly report CURRENT. Your drift reports become more trustworthy, which means you actually read them.

**Better detection of scattered implementations.** Codebases aren't always tidy. Authentication logic might live in three different directories under four different names. QMD finds all of it because it searches by concept, not by file path pattern. The drift detector can verify that a capability exists even when it's spread across unexpected locations.

**Catches boundary violations with unexpected naming.** The architecture reviewer checks principles like "business logic belongs in core, not in handlers." Grep looks for known patterns. QMD finds the handler that does a database query through a helper called `fetchAndTransform` — which is business logic wearing a utility-function disguise.

## The Limits

QMD doesn't make drift detection perfect. It makes it less noisy.

Semantic search can surface false *negatives* — results that are conceptually adjacent but not actually relevant. A search for "rate limiting" might return code that deals with pagination limits or resource quotas. The agents still need to evaluate what QMD returns against the specific SPEC claim.

And QMD requires re-embedding when code changes significantly. If you add a new module and don't run `qmd embed`, the new code won't appear in search results. In practice, running `qmd embed` as part of your development workflow (or after significant changes) keeps the index fresh.

The integration is optional for a reason. Coherence works without it. Grep and Glob catch the majority of drift. QMD is for the long tail — the subtle mismatches that exact-match search can't bridge. If you're getting clean drift reports without it, you might not need it. If your drift reports are full of false positives because your team uses diverse terminology, QMD is the fix.
