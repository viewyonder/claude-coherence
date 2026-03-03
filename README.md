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
3. **SPEC docs** — Copy `docs/SPEC-TEMPLATE.md` to something like `docs/SPEC-API-SURFACE.md`, fill in your actual components, and run `/check-drift` to verify.

---

## What's Inside

### The Four Layers

| Layer | What It Does | When It Runs |
|-------|-------------|--------------|
| **Hooks** | Enforce known constraints (block, warn, suggest) | Every file edit/write/commit |
| **Agents** | Detect drift and review architecture | On demand via skills |
| **SPEC Docs** | Define what "correct" means (falsifiable claims) | Referenced by agents and humans |
| **Skills** | Multi-step workflows with built-in compliance | User-invoked (`/check-drift`) |

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

### Skills (4 included)

| Command | What It Does |
|---------|--------------|
| `/coherence` | Interactive setup wizard — generates a customized guardrails system |
| `/check-drift` | Invoke drift detector, compare specs against code |
| `/check-architecture` | Compliance review of staged changes or a path |
| `/test` | Run tests with flexible scope control |

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

**Skills** are named multi-step workflows. `/check-drift` doesn't just run a grep — it invokes the drift-detector agent, which reads every SPEC document, compares against code, and produces a structured report.

See [the blog post](blog/entropy-at-velocity.md) for the full rationale behind this approach.

---

## License

MIT. See [LICENSE](LICENSE).

---

Built by [View Yonder](https://viewyonder.com). Inspired by the patterns we developed while building software with Claude Code as a primary development tool.
