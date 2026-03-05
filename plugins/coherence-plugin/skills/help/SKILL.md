---
name: help
description: Show all available Coherence skills with descriptions and usage examples.
user_invocable: true
---

# /coherence:help

Show all available Coherence skills.

## Coherence Skills

**v2.0.0** — Multi-skill layout. Each command is invoked as `/coherence:<command>`.

> **Note:** If you upgraded from v1.x, the invocation syntax changed from `/coherence <command>` to `/coherence:<command>`.

| Command | Arguments | What It Does |
|---------|-----------|--------------|
| `/coherence:init` | `[--reset]` | Interactive setup wizard — generates hooks, agents, skills, CLAUDE.md |
| `/coherence:check-principles` | `[path \| --all]` | Architecture compliance review against CLAUDE.md principles |
| `/coherence:check-drift` | `[scope]` | Compare SPEC docs against codebase to detect drift |
| `/coherence:test-runner` | `[scope \| --filter <pattern>]` | Run tests with flexible scope control |
| `/coherence:hook` | | List installed hooks with enforcement levels and status |
| `/coherence:spec` | | List SPEC documents with verification metadata |
| `/coherence:config` | | Show local project configuration — hooks, agents, skills, SPEC docs |
| `/coherence:history` | `[--on \| --off \| --clear \| --last N]` | View activity log, enable/disable logging |
| `/coherence:status` | `[--prune]` | Show global install state and registered repos |
| `/coherence:uninstall` | `[--force] [--purge]` | Remove Coherence from current repo |
| `/coherence:help` | | Show this help |

### Quick Start

```
/coherence:init                          # Set up Coherence in your project
/coherence:check-principles              # Check staged changes for violations
/coherence:check-drift                   # Detect SPEC-to-code drift
/coherence:config                        # See what's installed
```

### Updating the Plugin

To update Coherence to the latest version:

```
/plugin update coherence@viewyonder-coherence
```

You can also enable auto-updates for the marketplace so new versions are fetched on startup.

### Project-Local Skill

When Coherence generates a `/coherence` skill into your project (via `/coherence:init`), that project-local skill uses sub-command dispatch: `/coherence check-drift`, `/coherence check-principles`, etc. The plugin uses the multi-skill `/coherence:<command>` syntax.
