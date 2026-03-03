---
title: "Clean Exits"
subtitle: "Why every plugin needs an uninstall story — and how Coherence v1.3 closes the lifecycle gap"
date: 2026-03-03
author: Injectionator
template: https://github.com/viewyonder/coherence
---

# Clean Exits

*Why every plugin needs an uninstall story — and how Coherence v1.3 closes the lifecycle gap.*

---

## The Missing Ceremony

Installing tools is a ceremony we've gotten good at. `npm install`, `brew install`, `claude plugin add` — each has a clean, predictable entry point. You run a command, things appear where they should, and you move on.

Uninstalling is the ceremony nobody thinks about until they need it. And by then, the tool has scattered configuration across three locations, registered itself in two config files, and left hooks wired into your settings that you'd need to find and remove by hand.

Coherence v1.2 had exactly this problem. `/coherence init` generated hooks, registered them in `settings.local.json`, and (via the marketplace plugin) added entries to `~/.claude/settings.json` and `~/.claude.json`. If you decided to stop using Coherence in a repo — or stop using it entirely — the cleanup was manual. Grep through JSON files, delete the right entries, hope you didn't miss one.

That's not good enough. If you respect your users enough to build a setup wizard, you should respect them enough to build a teardown.

## Three New Things

Coherence v1.3 adds three capabilities that close the lifecycle gap.

### A Repo Registry

Every time `/coherence init` runs, it now registers the repo in `~/.claude/coherence/repos.json`. The schema is minimal:

```json
{
  "version": 1,
  "repos": [
    {
      "path": "/Users/you/projects/my-app",
      "registeredAt": "2026-03-01T10:00:00Z",
      "lastSeen": "2026-03-03T14:30:00Z"
    }
  ]
}
```

This registry serves two purposes: it lets `status` report where Coherence is installed, and it lets `uninstall` know whether it's safe to remove global configuration.

### `/coherence status`

Ask a simple question, get a simple answer: where is Coherence installed and is everything healthy?

```
/coherence status
```

The report shows global plugin state (enabled? marketplace listed? MCP servers?), every registered repo, and whether each repo's path still exists on disk. Paths that have been moved or deleted show up as stale.

`/coherence status --prune` cleans up stale entries — repos that no longer exist on disk get quietly removed from the registry.

### `/coherence uninstall`

The main event. Running `/coherence uninstall` in a repo does three things:

1. **Cleans `settings.local.json`** — removes all Coherence hook entries, collapses empty matchers and arrays, deletes the file entirely if nothing remains
2. **Removes the repo from the registry** — so `status` stops listing it
3. **Checks remaining repos** — if other repos still use Coherence, global config stays intact with a note

If this was the last repo (or you pass `--force`), it also cleans global configuration: `enabledPlugins`, `extraKnownMarketplaces`, and MCP server entries.

What it does *not* touch: `.claude/hooks/`, `.claude/agents/`, `.claude/skills/`, or `CLAUDE.md`. Those contain your customized guardrails — code you've reviewed, tuned, and made your own. Deleting generated configuration is cleanup. Deleting user-authored configuration is data loss.

## The Decision Boundary

The interesting design question was: when should uninstall remove global config?

The naive approach is "always." Remove everything, every time. But that breaks multi-repo setups. If you have three repos using Coherence and you uninstall from one, nuking the global plugin registration breaks the other two.

The conservative approach is "never." Only remove local config, leave global alone. But that leaves orphaned entries when you truly want out.

We landed on a registry-aware middle ground:

- **Other repos remain** → clean local only, leave global intact, tell you what's still connected
- **Last repo (or `--force`)** → clean everything, including global config and the registry itself

The registry makes this decision mechanical rather than speculative. It knows exactly how many repos are connected because it tracked them on the way in.

## Aliases

If you don't want to type `uninstall`, you can use `remove` or `unplug`. All three map to the same sub-command. Small thing, but it means the command you reach for intuitively will probably work.

## What This Means for Plugin Authors

If you're building Claude Code plugins, consider this a pattern worth stealing. The lifecycle isn't just install → use. It's install → use → check → remove. Users who can confidently remove your tool are users who will confidently install it in the first place.

The registry pattern is simple enough to adopt: a JSON file in `~/.claude/<your-plugin>/`, updated on init, read on status, decremented on uninstall. A few kilobytes of bookkeeping that turns "I think I uninstalled it?" into "I know exactly what's installed where."

---

*Coherence v1.3.0 is available now. Run `/coherence status` to see where you stand, or `/coherence uninstall` when you're ready to leave.*
