# Coherence for Claude

**Maintain architectural coherence when AI writes your code.**

A system of hooks, agents, skills, and specification documents that encode your project's architectural constraints into the Claude Code development loop. Instead of catching violations during review, they're caught at the moment of creation.

Website: [coherence.viewyonder.com](https://coherence.viewyonder.com) | [Getting Started](https://coherence.viewyonder.com/getting-started) | [Entropy at Velocity](blog/entropy-at-velocity.md) (blog post)

---

## Install

**Step 1.** Add the marketplace source (once per machine):

```
/plugin marketplace add viewyonder/coherence
```

**Step 2.** Install the plugin into your project:

```
/plugin install coherence
```

Then run `/coherence` to launch the interactive setup wizard. It walks you through your stack, generates customized hooks, agents, skills, a `CLAUDE.md`, and `settings.local.json` — all tailored to your project.

---

## Manual Installation

If you prefer more control or can't use the plugin system, copy the template directly:

```bash
cd /path/to/your/project

# Copy the .claude directory
cp -r /path/to/coherence/template/.claude .

# Copy the CLAUDE.md template
cp /path/to/coherence/template/CLAUDE.md .

# Copy the SPEC template and memory template
mkdir -p docs
cp /path/to/coherence/template/docs/SPEC-TEMPLATE.md docs/
cp /path/to/coherence/template/docs/MEMORY.md docs/
```

Then customize manually:

1. **CLAUDE.md** — Replace `{{PLACEHOLDER}}` markers with your project's values
2. **Hooks** — Edit the `// === CONFIGURATION ===` block at the top of each hook in `.claude/hooks/`. Remove hooks that don't apply and update `settings.local.json` accordingly.
3. **SPEC docs** — Copy `docs/SPEC-TEMPLATE.md` to something like `docs/SPEC-API-SURFACE.md`, fill in your actual components, and run `/coherence check-drift` to verify.

---

## What's Inside

### The Four Layers

| Layer | What It Does | When It Runs |
|-------|-------------|--------------|
| **Hooks** | Enforce known constraints (block, warn, suggest) | Every file edit/write/commit |
| **Agents** | Detect drift and review architecture | On demand via skills |
| **SPEC Docs** | Define what "correct" means (falsifiable claims) | Referenced by agents and humans |
| **Skills** | Multi-step workflows with built-in compliance | User-invoked (`/coherence <sub-command>`) |

### Hooks (11 included)

| Hook | Enforcement | Purpose |
|------|-------------|---------|
| `forbidden-imports.cjs` | Blocking | Block runtime-inappropriate APIs |
| `required-prefix.cjs` | Blocking | Enforce route path prefix |
| `boundary-guard.cjs` | Blocking | Enforce module boundaries |
| `test-gate.cjs` | Blocking | Block commits without tests |
| `data-isolation.cjs` | Warning | Warn on unfiltered DB queries |
| `delegation-check.js` | Warning | Warn on inline business logic |
| `terminology-check.cjs` | Warning | Enforce consistent terminology |
| `style-guard.cjs` | Warning | Enforce voice, tone, and structure rules |
| `state-flow.cjs` | Blocking/Warning | Enforce unidirectional state |
| `test-suggest.cjs` | Informational | Suggest running related tests |
| `change-suggest.cjs` | Informational | Suggest related actions |

### Agents (5 included)

| Agent | Role |
|-------|------|
| `architecture-reviewer` | Compliance check against CLAUDE.md principles |
| `drift-detector` | Compare SPEC docs against codebase reality |
| `code-reviewer` | Quality, security, and best practices review |
| `security-auditor` | OWASP-focused vulnerability detection |
| `consistency-reviewer` | Terminology, voice, and structural consistency |

### Skills (1 unified command, 11 sub-commands)

| Command | Category | What It Does |
|---------|----------|--------------|
| `/coherence init [--reset]` | Setup | Interactive wizard to generate full guardrails system |
| `/coherence check-principles [path]` | Review | Architecture compliance check against CLAUDE.md |
| `/coherence check-drift [scope]` | Review | SPEC vs. codebase drift detection |
| `/coherence test-runner [scope]` | Testing | Run tests with scope control |
| `/coherence hook` | Inspection | List hooks with enforcement levels and status |
| `/coherence spec` | Inspection | List SPEC docs with verification metadata |
| `/coherence config` | Inspection | Unified overview of entire `.claude/` setup |
| `/coherence history [options]` | Logging | View/control activity log |
| `/coherence status [--prune]` | Global | Show global install state and repo registry |
| `/coherence uninstall [--force]` | Global | Remove Coherence from current repo |
| `/coherence help` | Meta | Show available sub-commands |

---

## Sub-commands

### `/coherence init [--reset]`

Interactive setup wizard that generates a complete `.claude/` guardrails system customized to your project — hooks, agents, skills, `CLAUDE.md`, and `settings.local.json`.

```
/coherence init           # First-time setup
/coherence init --reset   # Re-run wizard, regenerate everything
```

### `/coherence check-principles [path]`

Architecture compliance check against the principles defined in your `CLAUDE.md`. Invokes the architecture-reviewer agent to validate code against security, boundary, performance, and propagation principles.

```
/coherence check-principles              # Check staged changes
/coherence check-principles src/api/     # Check a specific path
```

### `/coherence check-drift [scope]`

Compare SPEC documents against the actual codebase to detect architectural drift. Invokes the drift-detector agent, which reads every SPEC document and reports items as CURRENT, DRIFTED, or UNDOCUMENTED.

```
/coherence check-drift                   # Check all SPEC docs
/coherence check-drift SPEC-API.md       # Check a specific SPEC
```

### `/coherence test-runner [scope]`

Run tests with flexible scope control — all tests, a specific module, or a custom filter.

```
/coherence test-runner                   # Run all tests
/coherence test-runner auth              # Run tests matching "auth"
```

### `/coherence hook`

List all installed Coherence hooks with their enforcement levels, tool matchers, and file status. Shows hooks grouped by execution phase (PreToolUse/PostToolUse) with active, orphaned, and missing status indicators.

```
/coherence hook
```

Example output:

```
PreToolUse (6 hooks):
  Edit, Write:
    ● forbidden-imports.cjs    BLOCK   Block runtime-inappropriate APIs
    ● boundary-guard.cjs       BLOCK   Enforce module boundaries
    ● data-isolation.cjs       WARN    Warn on unfiltered DB queries
  Bash:
    ● test-gate.cjs            BLOCK   Block commits without tests
```

### `/coherence spec`

List all SPEC documents with verification metadata — last verified date, verified by, and a one-line description extracted from each document's header.

```
/coherence spec
```

Example output:

```
Found 3 SPEC documents in docs/:

  SPEC-HOOKS.md          verified 2026-02-25   Hook system (11 hooks, 3 tiers)
  SPEC-SKILLS.md         verified 2026-03-03   Skill system (1 skill, 11 sub-commands)
  SPEC-API.md            verified 2026-02-20   API endpoints and routes
```

### `/coherence config`

Unified overview of your project's entire `.claude/` setup — hooks (with active/orphaned/missing status), agents, skills, SPEC documents, and project files like `CLAUDE.md`.

```
/coherence config
```

Example output:

```
Hooks (.claude/hooks/):
  ● forbidden-imports.cjs     active
  ● boundary-guard.cjs        active
  4 active, 0 orphaned, 0 missing

Agents: 5   Skills: 1   SPECs: 3 (+ template)
CLAUDE.md: found, configured
```

### `/coherence history [options]`

View the activity log recorded by hooks, or enable/disable hook logging.

```
/coherence history                       # Show recent activity
/coherence history --enable              # Turn on hook logging
/coherence history --disable             # Turn off hook logging
```

### `/coherence status [--prune]`

Show global Coherence install state — plugin config, registered repos, and stale entries. Useful for managing Coherence across multiple projects.

```
/coherence status                        # Show install state
/coherence status --prune                # Remove stale registry entries
```

Example output:

```
Registered Repos (2 total, 0 stale):
  ✓ /path/to/repo-1         registered 2026-01-15
  ✓ /path/to/repo-2         registered 2026-02-20
```

### `/coherence uninstall [--force]`

Remove Coherence hook registrations from the current repo. Does **not** delete `.claude/hooks/`, `.claude/agents/`, `.claude/skills/`, or `CLAUDE.md` — those contain your customizations.

```
/coherence uninstall                     # Remove from current repo
/coherence uninstall --force             # Also remove global config
```

If other repos still use Coherence, global config is left intact unless `--force` is passed.

### `/coherence help`

Show all available sub-commands with brief descriptions.

```
/coherence help
```

---

## Examples

The `examples/` directory shows how the template adapts to different stacks:

### Express + PostgreSQL (`examples/express-api/`)

- CLAUDE.md adapted for Node.js/Express patterns
- `forbidden-imports.cjs` blocks browser APIs and `eval()`
- `data-isolation.cjs` checks for `org_id` in PostgreSQL queries

### Next.js + Prisma (`examples/next-app/`)

- CLAUDE.md adapted for Next.js App Router patterns
- `forbidden-imports.cjs` enforces server/client boundary (no Prisma in client components)
- `boundary-guard.cjs` ensures Prisma stays in `lib/db/`

---

## How It Works

**Hooks** run as small Node.js programs before/after Claude Code executes tools. They read the proposed change from stdin, check it against your constraints, and output a decision (block, warn, or allow).

**Agents** are specialized personas with defined tools and output formats. They're invoked by skills or automatically when the task matches their description.

**SPEC documents** are falsifiable descriptions of what the code currently does — not what it should do. They make claims like "we have 18 inspectors" that can be mechanically verified against the codebase.

**Skills** are named multi-step workflows. `/coherence check-drift` doesn't just run a grep — it invokes the drift-detector agent, which reads every SPEC document, compares against code, and produces a structured report.

See [the blog post](blog/entropy-at-velocity.md) for the full rationale behind this approach.

---

## License

MIT. See [LICENSE](LICENSE).

---

Built by [View Yonder](https://viewyonder.com). Inspired by the patterns we developed while building software with Claude Code as a primary development tool.
