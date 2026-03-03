---
title: "What Happened"
subtitle: "A new /coherence history sub-command that logs hook decisions and lets you spot patterns"
date: 2026-03-03
author: Injectionator
template: https://github.com/viewyonder/coherence
---

# What Happened

*A new `/coherence history` sub-command that logs hook decisions and lets you spot patterns.*

---

## The Blind Spot

Coherence hooks fire constantly. Every file edit, every write, every commit attempt runs through the hook chain. Blocks and warnings appear inline and then scroll away. If you're paying attention at the moment, you see them. If you're not, they're gone.

This creates a peculiar situation: the guardrails are doing their job, but there's no record of it. You can't answer basic questions. How often does `boundary-guard` actually fire? Is `data-isolation` catching real issues or just creating noise? Did anything get blocked in the last hour while you were focused on something else?

Hooks that can't prove they ran are hooks that get questioned.

## Activity Logging

Coherence hooks now log their BLOCK and WARN decisions to `.claude/coherence.log`. The log is opt-in — create a sentinel file to turn it on, remove it to turn it off. When enabled, each hook appends a single fixed-width line at the point where it produces a block or warning:

```
2026-03-03 14:22:01  BLOCK  forbidden-imports         src/api/handler.ts        Node.js fs not available
2026-03-03 14:22:05  WARN   data-isolation            src/db/queries.ts         Query lacks tenant filter
2026-03-03 14:23:12  SKILL  check-drift               —                         3 drift issues found
```

ALLOW decisions (exit 0, no output) are never logged. Neither are INFO hooks. Only the events that represent actual enforcement — something was stopped or something was flagged. This keeps the log useful rather than overwhelming.

## The Implementation

A shared utility, `_log.cjs`, lives alongside the hooks in `.claude/hooks/`. Each hook requires it and calls `logEvent()` at its decision point — two lines of code per hook. The underscore prefix signals "not a hook" so `/coherence config` skips it during inventory.

The entire logging path is wrapped in `try/catch`. If the sentinel file doesn't exist, `logEvent` returns immediately. If logging somehow fails — disk full, permissions, anything — the hook still runs normally. Logging never breaks enforcement.

Log rotation is automatic. When the file exceeds 100KB, it truncates to the most recent 500 lines. This happens on the same write path, so there's no separate rotation process to manage.

Both the log file and the sentinel file are gitignored. Logging is per-developer, not per-team. You can turn it on without affecting anyone else's workflow.

## `/coherence history`

The `history` sub-command is the interface to all of this:

```
/coherence history              # Show status + last 20 entries
/coherence history --on         # Enable logging
/coherence history --off        # Disable logging
/coherence history --clear      # Clear the log
/coherence history --last 50    # Show last 50 entries
```

The default view shows logging status, recent activity, and summaries:

```
Coherence History
==================
Logging:   enabled
Log file:  .claude/coherence.log (142 entries, 12.4 KB)

Recent Activity (last 20):
Time                 Level  Source                    File                      Detail
----------------------------------------------------------------------
2026-03-03 14:22:01  BLOCK  forbidden-imports         src/api/handler.ts        Node.js fs not available
2026-03-03 14:22:05  WARN   data-isolation            src/db/queries.ts         Query lacks tenant filter
2026-03-03 14:23:12  SKILL  check-drift               —                         3 drift issues found

Summary (last 24h): 2 blocks, 5 warnings, 3 skill runs
Summary (all time): 12 blocks, 45 warnings, 18 skill runs
```

The summaries are where the value compounds. A project with 45 warnings and 12 blocks tells a different story than one with 2 warnings and 0 blocks. The first project might have hooks that need tuning — too many false positives erode trust. The second might have hooks that are too permissive, or a team that's already internalized the constraints.

## What Gets Logged

Three levels appear in the log:

- **BLOCK** — A hook prevented a tool from executing. These are the hard stops.
- **WARN** — A hook flagged a concern but allowed the operation to proceed.
- **SKILL** — A `/coherence` sub-command ran and produced a result. Check-principles, check-drift, and test-runner each log their outcome.

INFO-level hooks (test-suggest, change-suggest, state-flow suggestions) are not logged. They fire on nearly every edit and would drown out the signal.

## The Sub-command Count

With `history`, Coherence now has eleven sub-commands:

| Command | What It Does |
|---------|--------------|
| `init` | Setup wizard |
| `check-principles` | Architecture compliance review |
| `check-drift` | SPEC drift detection |
| `test-runner` | Run tests |
| `hook` | List installed hooks |
| `spec` | List SPEC documents |
| `config` | Show project configuration |
| `history` | View activity log |
| `status` | Show install state |
| `uninstall` | Remove Coherence |
| `help` | Show available commands |

The pattern holds: every system concept gets a sub-command. Hooks have `hook`. Specs have `spec`. And now enforcement decisions have `history`.

---

*Coherence v1.6.0 is available now. Run `/coherence history --on` to start logging, then `/coherence history` to see what your hooks have been doing.*
