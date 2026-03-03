---
title: "Show Your Work"
subtitle: "Two new /coherence sub-commands that answer 'what's installed?' without reading JSON"
date: 2026-03-03
author: "Injectionator"
draft: false
---

*Two new `/coherence` sub-commands that answer "what's installed?" without reading JSON.*

---

## The Inspection Gap

Coherence generates a lot of configuration. Hooks get registered in `settings.local.json`. SPEC documents accumulate in `docs/`. After a few weeks of iteration, the natural question is: what do I actually have installed?

The answer, until now, was "go read the JSON" or "scan the docs directory yourself." That's fine when you set things up yesterday. It's less fine when you're onboarding a teammate, debugging a hook that isn't firing, or trying to remember which SPEC documents exist.

Configuration that can't explain itself is configuration that gets forgotten.

## `/coherence hook`

The `hook` sub-command reads your `settings.local.json`, finds every registered hook, checks whether each file exists on disk, reads its JSDoc header for the enforcement level and purpose, and presents a structured report.

```
Coherence Hooks
================

PreToolUse (6 hooks):
  Edit, Write:
    ● forbidden-imports.cjs    BLOCK   Block runtime-inappropriate APIs
    ● boundary-guard.cjs       BLOCK   Enforce module boundaries
    ● data-isolation.cjs       WARN    Warn on unfiltered DB queries
    ● required-prefix.cjs      BLOCK   Enforce API route prefix conventions
  Bash:
    ● test-gate.cjs            BLOCK   Block commits without passing tests

PostToolUse (2 hooks):
  Edit, Write:
    ○ test-suggest.cjs         INFO    Suggest running related tests
    ○ change-suggest.cjs       INFO    Suggest related follow-up actions
```

The symbols tell you what you need to know at a glance. `●` for PreToolUse hooks (they run before the tool executes), `○` for PostToolUse (they run after). BLOCK, WARN, and INFO map directly to the three enforcement tiers. If a hook file has gone missing — someone deleted the `.cjs` but forgot to update `settings.local.json` — it shows up with `✗` and `FILE MISSING`.

No JSON to parse. No file paths to remember. Just a list of what's active and what it does.

## `/coherence spec`

The `spec` sub-command scans `docs/` for SPEC documents, reads each file's verification header, and reports what you have.

```
SPEC Documents
===============

Found 3 SPEC documents in docs/:

  SPEC-HOOKS.md          verified 2026-02-25   Hook system (11 hooks, 3 tiers)
  SPEC-SKILLS.md         verified 2026-03-03   Skill system (1 skill, 9 sub-commands)
  SPEC-API.md            verified 2026-02-20   API endpoints and routes

  Template: SPEC-TEMPLATE.md
```

Every SPEC document in Coherence carries a verification header — when it was last checked, by whom, and how. The `spec` sub-command surfaces that metadata so you can see at a glance which documents are fresh and which might need attention. If a SPEC hasn't been verified in a while, that's a signal to run `/coherence check-drift`.

## Why These Are Read-Only

Both sub-commands are purely diagnostic. They don't modify configuration, don't run agents, don't write files. They read what's there and report it.

This is deliberate. The existing sub-commands already cover modification: `init` generates, `uninstall` removes, `check-drift` detects problems. What was missing was the simple ability to see what you have — without needing to understand the file formats those other commands operate on.

## The Sub-command Count

With `hook` and `spec`, Coherence now has nine sub-commands:

| Command | What It Does |
|---------|--------------|
| `init` | Setup wizard |
| `check-principles` | Architecture compliance review |
| `check-drift` | SPEC drift detection |
| `test` | Run tests |
| `hook` | List installed hooks |
| `spec` | List SPEC documents |
| `status` | Show install state |
| `uninstall` | Remove Coherence |
| `help` | Show available commands |

The pattern is consistent: every noun in the system (hooks, specs, repos) has a corresponding sub-command that lets you inspect it. If Coherence knows about it, you can ask Coherence to show it to you.

---

*Coherence v1.4.0 is available now. Run `/coherence hook` or `/coherence spec` to see what you're working with.*
