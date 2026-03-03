---
name: coherence
description: Coherence guardrails system — init wizard, architecture review, drift detection, test runner, hook inspector, spec reporter, status, and uninstall.
user_invocable: true
arguments: "<sub-command> [options]"
---

# /coherence

Unified entry point for the Coherence guardrails system.

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `REGISTRY_DIR` | `~/.claude/coherence` | Directory for Coherence global state |
| `REGISTRY_FILE` | `~/.claude/coherence/repos.json` | Tracks repos where Coherence is installed |
| `REGISTRY_VERSION` | `1` | Schema version for the registry file |
| `PLUGIN_NAME` | `coherence` | Plugin name used in `enabledPlugins` and MCP entries |
| `MARKETPLACE_PATTERN` | `viewyonder/coherence` or `viewyonder-coherence` | Patterns to match in `enabledPlugins` and `extraKnownMarketplaces` |

## Sub-commands

| Command | What It Does |
|---------|--------------|
| `/coherence init [--reset]` | Interactive setup wizard — generates hooks, agents, skills, CLAUDE.md |
| `/coherence check-principles [path]` | Architecture compliance review against CLAUDE.md principles |
| `/coherence check-drift [scope]` | Compare SPEC docs against codebase to detect drift |
| `/coherence test [scope]` | Run tests with flexible scope control |
| `/coherence hook` | List installed hooks with enforcement levels and status |
| `/coherence spec` | List SPEC documents with verification metadata |
| `/coherence status [--prune]` | Show install state and registry contents |
| `/coherence uninstall [--force]` | Remove Coherence from current repo (and optionally global) |
| `/coherence help` | Show this help |

## Dispatch

Parse the first argument to determine which sub-command to run.
If no argument or `help`: show the sub-commands table above and stop.
Aliases: `remove` and `unplug` map to `uninstall`.

---

## Sub-command: init

You are running the Coherence setup wizard. Your job is to guide the user through setting up a complete `.claude/` guardrails system customized to their project.

**Important behavioral rules:**
- Ask questions using the `AskUserQuestion` tool — never just print questions as text
- Generate all files at the end, after confirmation — never generate files mid-conversation
- Be concise in explanations, generous in generated output
- Every generated hook must be valid Node.js (testable with `node -c`)
- Every generated `settings.local.json` must reference only hooks that were actually created
- Every generated `CLAUDE.md` must have zero `{{PLACEHOLDER}}` markers — all values filled in

---

### Pre-Phase: Dogfood Detection

Before starting the wizard, check whether you are running inside the coherence repo itself. Check **all four** of these conditions:

1. `plugins/coherence-plugin/` directory exists
2. `template/.claude/hooks/` directory exists
3. `marketplace.json` exists at the repository root
4. `CLAUDE.md` contains the phrase "template system for encoding architectural constraints"

**If all four are true** → skip the wizard entirely and run **Dogfood Validation Mode** (described below).
**Otherwise** → proceed to Phase 0 normally.

#### Dogfood Validation Mode

This is a read-only validation of the coherence repo's own templates, hooks, examples, and documentation. Do not generate or modify any files. Run each check below and produce a structured report.

##### Checks

| # | Check | What to Do |
|---|-------|------------|
| 1 | **Hook Syntax** | Run `node -c` on every `.cjs` and `.js` file in `template/.claude/hooks/`. Report PASS/FAIL per file. |
| 2 | **Template Structure** | Verify that all files referenced in the SKILL.md archetype templates (settings.local.json, CLAUDE.md, each hook, each agent, each skill) have corresponding template files in `template/.claude/`. Report missing files. |
| 3 | **README Accuracy** | Count actual hooks, agents, and skills in `template/.claude/` and compare against the counts and names listed in `README.md`. Report any mismatches. |
| 4 | **Example Consistency** | For each example in `examples/`: run `node -c` on all `.cjs`/`.js` hooks, and verify their `CLAUDE.md` contains zero `{{PLACEHOLDER}}` markers. Report PASS/FAIL per example. |
| 5 | **Plugin Structure** | Validate that `plugin.json` (if present) and both `marketplace.json` files (root and `.claude-plugin/`) are valid JSON with matching `name` fields. Report any parse errors or mismatches. |
| 6 | **SKILL.md Consistency** | Verify that the plugin copy (`plugins/coherence-plugin/skills/coherence/SKILL.md`) and the template copy (`template/.claude/skills/coherence/SKILL.md`) are identical. Report any differences. |

##### Output Format

Present results as a structured report:

```
Coherence Dogfood Validation Report
====================================

1. Hook Syntax .............. PASS | FAIL (N issues)
2. Template Structure ....... PASS | FAIL (N missing)
3. README Accuracy .......... PASS | FAIL (N mismatches)
4. Example Consistency ...... PASS | FAIL (N issues)
5. Plugin Structure ......... PASS | FAIL (N issues)
6. SKILL.md Consistency ..... PASS | FAIL

Issues:
- [list any failures with details]
```

After producing the report, stop. Do not proceed to Phase 0 or any wizard phases.

---

### Phase 0: Project Scan

Before asking any questions, silently scan the project to inform your questions.

#### Scan checklist:
1. **Package/project files**: Look for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `*.csproj`/`*.sln`, `Makefile`, `CMakeLists.txt`, `build.gradle`, `pom.xml`, `deno.json`, `bun.lockb`
2. **Framework indicators**: Look for `next.config.*`, `nuxt.config.*`, `vite.config.*`, `astro.config.*`, `svelte.config.*`, `angular.json`, `remix.config.*`, `gatsby-config.*`, `django`, `flask`, `fastapi`, `express`, `rails`, `spring`
3. **Content indicators**: Count `.md` files, look for `/blog/`, `/docs/`, `/content/`, `/posts/`, `/articles/`
4. **Existing `.claude/` directory**: Check if one exists, note what's already there
5. **Existing `CLAUDE.md`**: Check if one exists, note if it has `{{PLACEHOLDER}}` markers
6. **Test setup**: Look for `jest.config.*`, `vitest.config.*`, `pytest.ini`, `*.test.*`, `*.spec.*`, `__tests__/`, `tests/`, `.mocharc.*`, `cypress.config.*`, `playwright.config.*`
7. **Source structure**: Look for `src/`, `lib/`, `app/`, `pages/`, `components/`, `api/`, `services/`, `models/`
8. **CI/CD**: Look for `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`
9. **Infrastructure**: Look for `terraform/`, `*.tf`, `pulumi/`, `cdk/`, `docker-compose.*`, `Dockerfile`, `k8s/`, `helm/`
10. **Language/runtime**: Infer from file extensions and config files

Use Glob and Read tools to perform this scan. Store the findings — you'll use them to pre-select answers.

#### Idempotency check

If `.claude/` already exists:
- Ask whether to **overwrite** (replace everything), **merge** (add missing files, keep existing), or **abort**
- If `--reset` argument was passed, skip this question and overwrite

---

### Phase 1: Project Classification

#### Q1: Project Type

Ask using `AskUserQuestion`:

**"What kind of project is this?"**

Options (pre-select based on scan):
1. **Software — Web application** — "Frontend, full-stack, or SPA (React, Next.js, Vue, Svelte, etc.)"
2. **Software — API or backend service** — "REST API, GraphQL, microservice, or server application"
3. **Software — CLI tool or library** — "Command-line tool, npm/pip/crate package, or shared library"
4. **Infrastructure / DevOps** — "Terraform, Pulumi, CDK, CI/CD pipelines, deployment automation"
5. **Writing / Content** — "Documentation, blog, technical writing, research papers"
6. **Marketing / Brand** — "Brand content, campaigns, social media, landing pages"
7. **Research / Analysis** — "Data analysis, academic research, competitive intelligence"

If scan clearly indicates a type (e.g., `next.config.js` exists → Web application), note this as "(detected)" in the description.

#### Q2: Stack Confirmation (conditional)

Based on Q1 + scan results, ask a confirmation/refinement question:

**For code projects**: "I detected [runtime] with [framework] using [package manager]. Your test runner appears to be [test runner]. Is this correct, or should I adjust?"
- Confirm detected stack
- Adjust (let them specify)

**For writing projects**: "What kind of content?"
- Technical documentation
- Blog / articles
- Research / academic
- Mixed

**For marketing**: "What content types?"
- Social media + blog
- Email campaigns
- Landing pages + web copy
- Mixed / all of the above

**For research**: "What kind of research?"
- Data analysis (notebooks, scripts)
- Academic papers
- Competitive / market research
- Mixed

**For infrastructure**: "What IaC tools?"
- Terraform
- Pulumi
- AWS CDK / CloudFormation
- Docker / Kubernetes
- Scripts / Makefiles

---

### Phase 2: Constraint Discovery

Ask 2-3 questions adapted to the project type.

#### For Web Application

**Q3**: "What are the critical boundaries in your architecture?"
- Frontend / backend separation (monorepo or separate)
- Component / page / layout layers
- State management boundaries (stores vs components)
- API route handlers vs business logic

**Q4**: "What runtime constraints apply?"
- Standard Node.js server
- Serverless (Vercel, Netlify, AWS Lambda)
- Edge runtime (Cloudflare Workers, Deno Deploy)
- Container (Docker)
- Static / JAMstack

**Q5**: "How should tests be enforced?"
- Required before commit (strict)
- Suggested but not required
- No test infrastructure yet

#### For API / Backend Service

**Q3**: "What data boundaries matter?"
- Multi-tenant data isolation
- User-scoped data access
- Service-to-service boundaries
- No special data boundaries

**Q4**: "What are the critical path patterns?"
- REST with route prefix conventions
- GraphQL with resolver boundaries
- RPC / gRPC
- Event-driven / message queue

**Q5**: "How should tests be enforced?"
- Required before commit (strict)
- Suggested but not required
- No test infrastructure yet

#### For CLI Tool / Library

**Q3**: "What boundaries matter most?"
- Public API surface vs internals
- Plugin / extension boundaries
- Input validation at CLI boundary
- No special boundaries

**Q4**: "How should tests be enforced?"
- Required before commit (strict)
- Suggested but not required
- No test infrastructure yet

#### For Infrastructure / DevOps

**Q3**: "What safety constraints matter?"
- Environment separation (dev/staging/prod)
- Blast radius limits (no `*` in resource targeting)
- Secret management rules
- All of the above

**Q4**: "What should be strictly enforced?"
- Dangerous commands blocked (rm -rf, force push, DROP TABLE)
- Environment boundary enforcement
- Both
- Warnings only, no blocking

#### For Writing / Content

**Q3**: "What consistency matters most?" (multi-select)
- Terminology (product names, technical terms)
- Voice and tone (formal/informal, person, style)
- Structure (heading hierarchy, required sections)
- Cross-reference accuracy

**Q4**: "How strict should enforcement be?"
- Block on violations (strict brand/style guide)
- Warn but allow (editorial suggestions)
- Informational only (gentle nudges)

#### For Marketing / Brand

**Q3**: "What brand constraints exist?"
- Specific terminology required (product names, taglines)
- Competitor mentions restricted
- Tone/voice rules (casual, professional, playful)
- All of the above

**Q4**: "How strict should enforcement be?"
- Block on violations (strict brand compliance)
- Warn but allow
- Informational only

#### For Research / Analysis

**Q3**: "What rigor requirements apply?"
- Citation format consistency
- Methodology documentation requirements
- Reproducibility requirements
- Statistical reporting standards

**Q4**: "How strict should enforcement be?"
- Block on violations
- Warn but allow
- Informational only

---

### Phase 3: Enforcement Preferences

**Q6**: "Should I generate SPEC documents alongside the guardrails?"
- Yes — generate SPEC templates for this project type
- No — just CLAUDE.md, hooks, agents, and skills

---

### Phase 4: Summary & Confirmation

Present a summary of what will be generated:

```
Based on your answers, I'll generate:

CLAUDE.md — Customized development guidelines
.claude/settings.local.json — Hook registrations

Hooks:
  - forbidden-imports.cjs (blocking) — prevents [specific things]
  - boundary-guard.cjs (blocking) — enforces [specific boundaries]
  - ...

Agents:
  - architecture-reviewer.md — validates against CLAUDE.md principles
  - ...

Skills:
  - /coherence — unified guardrails command (init, check-drift, check-principles, test)

SPEC Templates (if selected):
  - docs/SPEC-API-SURFACE.md
  - ...

Total: N files
```

Ask for confirmation before proceeding.

---

### Phase 5: Generate Files

Generate all files based on the archetype and user answers. Use the templates below as starting points, customizing based on the specific answers.

**Critical rules for generation:**
1. Every hook referenced in `settings.local.json` must have a corresponding `.cjs` file
2. Every agent referenced in a skill must have a corresponding `.md` file
3. `CLAUDE.md` must have zero `{{PLACEHOLDER}}` markers
4. All hooks must pass `node -c` syntax check
5. Use the user's actual project details (name, paths, commands) discovered in the scan

---

### Archetype Templates

#### TEMPLATE: settings.local.json

Generate based on which hooks are selected. Structure:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          // One entry per PreToolUse hook, e.g.:
          // { "type": "command", "command": "node .claude/hooks/HOOKNAME.cjs", "statusMessage": "Description..." }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          // Same hooks as Edit — they check file content
        ]
      }
      // Add Bash matcher only if test-gate or dangerous-command hooks are selected
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          // PostToolUse hooks (test-suggest, change-suggest)
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          // Same PostToolUse hooks
        ]
      }
    ]
  }
}
```

#### TEMPLATE: CLAUDE.md for Code Projects

Use the template structure from the guardrails repo but fill in ALL placeholders with project-specific values. Key sections:

- **Architecture Overview**: Use detected runtime, framework, deployment target
- **Architectural Principles**: Customize Security/Boundary/Performance/Propagation principles based on the specific project type and user answers
- **Core Concepts**: Name the actual domain concepts for this project
- **Local Development**: Use detected commands (`npm run dev`, `cargo run`, `python manage.py runserver`, etc.)
- **Runtime Constraints**: Based on detected/confirmed runtime
- **Testing**: Use detected test runner and commands

#### TEMPLATE: CLAUDE.md for Writing/Content Projects

Adapt the structure for non-code projects:

```markdown
# [Project Name] - Content Guidelines

## Content Overview
[What this project is, who the audience is, what the goals are]

## Voice & Tone Principles
[Instead of "Security Principles" — define the voice]

**[Voice rule 1].** [Explanation]
**[Voice rule 2].** [Explanation]

## Terminology
| Term | Usage | Notes |
|------|-------|-------|
| [Official term] | Always use this | Never use [alternative] |

## Accuracy Principles
[Instead of "Performance Principles" — define accuracy standards]

## Structure Conventions
[Heading hierarchy, required sections, formatting rules]

## Content Types
[What types of content exist, templates for each]

## Review Process
[How content gets reviewed, who approves]
```

#### TEMPLATE: CLAUDE.md for Marketing/Brand Projects

```markdown
# [Brand Name] - Content Guidelines

## Brand Overview
[Brand positioning, audience, key messages]

## Brand Voice
**[Voice attribute 1].** [How to achieve it]
**[Voice attribute 2].** [How to achieve it]

## Terminology & Naming
| Official Term | Never Use | Context |
|--------------|-----------|---------|
| [Product name] | [wrong names] | [when to use] |

## Competitor References
[Policy on mentioning competitors]

## Content Types & Templates
[Social, email, landing page conventions]

## Approval Process
[Who reviews what]
```

#### TEMPLATE: CLAUDE.md for Research Projects

```markdown
# [Project Name] - Research Guidelines

## Research Overview
[Scope, methodology, objectives]

## Rigor Principles
**[Principle 1].** [Explanation]
**[Principle 2].** [Explanation]

## Citation Standards
[Format, required fields, consistency rules]

## Methodology Documentation
[What must be documented, reproducibility requirements]

## Data Handling
[Data sources, cleaning standards, version control]

## Output Formats
[Paper structure, report templates, presentation conventions]
```

#### TEMPLATE: Hook — forbidden-imports.cjs

Customize the `FORBIDDEN_PATTERNS` array based on the project's runtime:

- **Browser/Edge**: Block `require('fs')`, `require('child_process')`, `require('net')`, Node.js built-ins
- **Serverless**: Block `require('fs')` (usually), long-running patterns (`setInterval`, `while(true)`)
- **Node.js server**: Block browser-only APIs (`document.`, `window.`, `localStorage`)
- **Python**: Block `import os` in web handlers, `import subprocess` in untrusted contexts
- **Infrastructure**: Block `rm -rf /`, `DROP DATABASE`, force push patterns

Set `SKIP_PATHS` based on detected project structure.

#### TEMPLATE: Hook — boundary-guard.cjs

Customize `GUARDED_PATHS` based on user's boundary answers:

- **Web app**: Guard component files from direct store mutation, guard pages from business logic
- **API**: Guard route handlers from DB queries (must go through service layer), guard models from HTTP concepts
- **Library**: Guard public API surface from internal imports, guard core from platform-specific code
- **Infra**: Guard production configs from dev-only settings

#### TEMPLATE: Hook — state-flow.cjs

Only generate for web applications with state management. Customize:
- `STORE_PATHS`: Based on detected state management (Redux, Zustand, Pinia, Svelte stores, etc.)
- `UI_PATHS`: Based on detected component structure
- `MUTATION_PATTERNS`: Based on the state management library's patterns

#### TEMPLATE: Hook — data-isolation.cjs

Only generate for multi-tenant or user-scoped data applications. Customize:
- `DB_CALL_PATTERN`: Based on detected ORM/database library (Prisma, Drizzle, Sequelize, SQLAlchemy, etc.)
- `REQUIRED_FILTERS`: Based on user's isolation model (tenant_id, user_id, org_id, etc.)
- `CHECK_PATHS`: Based on detected source structure

#### TEMPLATE: Hook — delegation-check.js

Only generate for API/backend projects. Customize:
- Handler paths based on detected routing structure
- Business logic indicators based on the framework

#### TEMPLATE: Hook — required-prefix.cjs

Only generate for API projects with route prefix conventions. Customize:
- Prefix pattern based on the API structure (`/api/v1/`, `/v2/`, etc.)
- Route file locations

#### TEMPLATE: Hook — test-gate.cjs

Only generate if user chose strict test enforcement. Customize:
- Test command based on detected test runner
- Coverage thresholds if applicable

#### TEMPLATE: Hook — test-suggest.cjs

Generate for code projects. Customize:
- `TEST_LOCATIONS` based on detected project structure
- `TEST_COMMAND` based on detected test runner

#### TEMPLATE: Hook — change-suggest.cjs

Generate for code projects. Customize:
- `WATCH_RULES` based on project-specific critical paths

#### TEMPLATE: Hook — terminology-check.cjs

Generate for writing, marketing, and brand projects. Customize:
- `TERMINOLOGY_RULES` populated with terms from the user's answers
- `CHECK_EXTENSIONS` based on content types
- `ENFORCEMENT` based on strictness preference

#### TEMPLATE: Hook — style-guard.cjs

Generate for writing, marketing, research, and content projects. Customize:
- `STYLE_RULES` based on voice/tone requirements
- `STRUCTURE_RULES` based on document conventions
- `CITATION_RULES` for research projects

#### TEMPLATE: Agent — architecture-reviewer.md

Generate for code projects. Customize:
- Review categories based on the project type
- Anti-patterns specific to the framework/stack

#### TEMPLATE: Agent — drift-detector.md

Generate for projects with SPEC documents. Customize:
- SPEC document list based on what was generated

#### TEMPLATE: Agent — consistency-reviewer.md

Generate for writing, marketing, and research projects. Customize:
- Review categories based on content type
- Consistency checks specific to the domain

#### TEMPLATE: Skill — coherence/SKILL.md

Generate a unified `/coherence` skill with sub-commands appropriate to the project type. For code projects, include `check-principles`, `check-drift`, and `test` sub-commands. For writing projects, include `check-consistency` and `check-drift` sub-commands. Always include `init` and `help`.

The generated skill should follow the same dispatcher pattern as this skill: parse the first argument to determine which sub-command to run.

---

### Phase 6: Verify

After generating all files:

1. **Syntax check all hooks**: Run `node -c .claude/hooks/<each-hook>.cjs` for every generated hook
2. **Cross-reference check**: Verify every hook in `settings.local.json` has a matching file
3. **Placeholder check**: Grep `CLAUDE.md` for `{{` — there should be zero matches
4. **Report results** to the user

Suggest next steps:
- "Run `/coherence check-principles` to validate your codebase against the new principles"
- "Run `/coherence check-drift` to verify SPEC docs against the codebase"
- "Run `/coherence status` to see the install state and registry"
- "Edit `CLAUDE.md` to refine the principles for your specific needs"
- "Review the hook configuration blocks (marked `// === CONFIGURATION ===`) to fine-tune patterns"
- "Create SPEC documents in `docs/` for drift detection"

---

### Phase 7: Register

After Phase 6 verification passes, register the repo in the global registry.

1. Create `REGISTRY_DIR` (`~/.claude/coherence`) if it does not exist
2. Read `REGISTRY_FILE` (`~/.claude/coherence/repos.json`). If missing or invalid JSON, initialize with `{ "version": 1, "repos": [] }`
3. Upsert the current repo path (use `git rev-parse --show-toplevel` or `pwd` if not a git repo):
   - If path already exists in `repos[]`, update `lastSeen` to current ISO timestamp
   - If path is new, append `{ "path": "<repo-root>", "registeredAt": "<ISO timestamp>", "lastSeen": "<ISO timestamp>" }`
4. Write the registry file back
5. Inform the user: "Registered in Coherence repo registry (~/.claude/coherence/repos.json)"

No confirmation needed — this is a non-destructive bookkeeping step.

---

### Error Handling

- If scan finds nothing recognizable: ask the user to describe their project manually
- If user picks "Other" for project type: ask them to describe it, then map to the closest archetype and customize
- If a generated hook fails syntax check: fix it immediately and re-verify
- If the project has an unusual structure: adapt paths in hooks rather than forcing a conventional structure

---

## Sub-command: check-principles

Runs an architecture compliance check against the principles documented in CLAUDE.md.

### Usage

```
/coherence check-principles              # Check staged changes
/coherence check-principles src/api/     # Check specific path
/coherence check-principles --all        # Check entire codebase
```

### Instructions

Use the `architecture-reviewer` agent to perform a systematic review.

#### Scope Resolution

1. If no argument: check staged changes (`git diff --cached --name-only`)
2. If path argument: check all files under that path
3. If `--all`: check the entire `src/` directory

#### What It Checks

**Security Principles** — Input validation, data isolation, audit trails
**Boundary Principles** — Handler delegation, module separation
**Performance Principles** — Hot path awareness, runtime constraints
**Propagation Principles** — State flow direction, explicit side effects

### Output

A structured compliance report with per-principle status and any violations with fix recommendations. See the `architecture-reviewer` agent for the full output format.

---

## Sub-command: check-drift

Compare SPEC specification documents against the actual codebase to detect drift.

### Usage

```
/coherence check-drift              # Check everything
/coherence check-drift api          # Check API surface only
/coherence check-drift models       # Check data models only
/coherence check-drift stores       # Check frontend stores only
/coherence check-drift all          # Check everything (same as no args)
```

### Instructions

Use the `drift-detector` agent to perform the comparison. Pass the scope argument (default: `all`).

The agent will:
1. Read the relevant SPEC document(s) from `docs/SPEC-*.md`
2. Scan the actual codebase
3. Compare and produce a drift report

### SPEC Documents

Customize this table for your project:

| Scope | SPEC Document | Codebase Source |
|-------|--------------|-----------------|
| api | `docs/SPEC-API-SURFACE.md` | Route definitions, handler files |
| models | `docs/SPEC-DATA-MODELS.md` | Model/schema files |
| stores | `docs/SPEC-FRONTEND.md` | Store/state files |

### Output

A structured markdown drift report showing:
- Items that match spec (CURRENT)
- Items that have drifted (DRIFTED)
- Items in code but not in spec (UNDOCUMENTED)
- Recommended actions to resolve drift

---

## Sub-command: test

Run tests with flexible scope control.

### Usage

```
/coherence test                         # Run all tests
/coherence test api                     # All API tests
/coherence test core                    # All core system tests
/coherence test --filter <pattern>      # Run tests matching pattern
/coherence test --all                   # Run all test suites
```

### Instructions

#### Step 1: Parse Arguments

| Argument | Command | Description |
|----------|---------|-------------|
| _(none)_ | `npm test` | All tests |
| `api` | `npm test -- tests/api/` | API tests |
| `core` | `npm test -- tests/core/` | Core tests |
| `services` | `npm test -- tests/services/` | Service tests |
| `--filter <pattern>` | `npm test -- --filter <pattern>` | Custom filter |
| `--all` | `npm test` | Everything |

Customize the commands above for your test runner (jest, vitest, pytest, etc.).

#### Step 2: Run Tests

Execute the appropriate test command.

#### Step 3: Report Results

1. **If all pass**: Report success with count
2. **If failures**:
   - Show failing test names and files
   - Offer to investigate failures
   - Suggest related code to review

### Test Categories

Customize this table for your project:

| Category | Location | Description |
|----------|----------|-------------|
| **Unit** | `tests/` or `src/**/__tests__/` | Individual function tests |
| **API** | `tests/api/` | API endpoint validation |
| **Integration** | `tests/integration/` | Component interaction |
| **E2E** | `tests/e2e/` | End-to-end tests |

---

## Sub-command: status

Show the current Coherence install state — global plugin config, registered repos, and stale entries.

### Usage

```
/coherence status              # Show install state
/coherence status --prune      # Remove stale registry entries
```

### Instructions

#### Step 1: Read Global State

Check for Coherence presence in global Claude Code configuration:

1. **Plugin registration** — Read `~/.claude/settings.json`. Look for `MARKETPLACE_PATTERN` in `enabledPlugins` array and `extraKnownMarketplaces` array. Report whether each is present.
2. **MCP servers** — Read `~/.claude.json`. Look for any MCP server entries containing `PLUGIN_NAME`. Report whether present.

If neither file exists, report "No global Coherence configuration found."

#### Step 2: Read Registry

1. Read `REGISTRY_FILE` (`~/.claude/coherence/repos.json`)
2. If missing: report "No registry file found. Run `/coherence init` in a repo to create one."
3. For each entry in `repos[]`:
   - Check if the path still exists on disk (directory exists)
   - Check if `.claude/` exists at that path
   - Mark entries where the path no longer exists as **stale**

#### Step 3: Prune (if `--prune`)

If the `--prune` flag is passed:
1. Remove all stale entries (paths that don't exist on disk) from `repos[]`
2. Write the updated registry back to `REGISTRY_FILE`
3. Report how many entries were removed

#### Step 4: Report

Present a structured report:

```
Coherence Status Report
========================

Global Install:
  Plugin enabled:       yes/no
  Marketplace listed:   yes/no
  MCP servers:          N entries

Registered Repos (N total, M stale):
  ✓ /path/to/repo-1         registered 2026-01-15   last seen 2026-03-01
  ✓ /path/to/repo-2         registered 2026-02-20   last seen 2026-03-03
  ✗ /path/to/old-repo       registered 2026-01-01   STALE (path not found)

Current repo: /path/to/current
  Registered: yes/no
  Hooks in settings.local.json: N entries
```

If stale entries exist and `--prune` was not passed, suggest: "Run `/coherence status --prune` to clean up stale entries."

---

## Sub-command: hook

List all installed Coherence hooks with their enforcement levels, tool matchers, and file status.

### Usage

```
/coherence hook
```

### Instructions

#### Step 1: Read Settings

Read `settings.local.json` in the current repo's `.claude/` directory.

- If no `.claude/settings.local.json` exists: report "No settings.local.json found. Run `/coherence init` to set up." and stop.

#### Step 2: Parse Hook Entries

Parse all `hooks.PreToolUse` and `hooks.PostToolUse` entries from the settings file.

- If no hooks are registered (no `PreToolUse` or `PostToolUse` entries, or all arrays empty): report "No hooks registered." and stop.

For each matcher entry, collect:
- The matcher name(s) (e.g., "Edit", "Write", "Bash")
- Each hook command in the matcher's `hooks` array

#### Step 3: Check Hook Files

For each hook command found, extract the `.cjs`/`.js` file path from the command string. Check if the file exists on disk.

#### Step 4: Read Hook Metadata

For each hook file that exists, read the first comment block (JSDoc header or leading comments) to extract:
- **Enforcement level**: Look for keywords "block"/"blocking", "warn"/"warning", or "info"/"informational" in the description or `@enforcement` tag
- **One-line purpose**: The first sentence of the description

If the file is missing, mark it as such. If no enforcement level can be determined from the header, infer from the hook's position: PreToolUse hooks that output `"decision": "block"` are BLOCK, those that output `"message"` are WARN. PostToolUse hooks are INFO.

#### Step 5: Present Report

Group hooks by PreToolUse vs PostToolUse, then by matcher. Use this format:

```
Coherence Hooks
================

PreToolUse (N hooks):
  Edit, Write:
    ● forbidden-imports.cjs    BLOCK   Block runtime-inappropriate APIs
    ● boundary-guard.cjs       BLOCK   Enforce module boundaries
    ● data-isolation.cjs       WARN    Warn on unfiltered DB queries
    ...
  Bash:
    ● test-gate.cjs            BLOCK   Block commits without tests

PostToolUse (N hooks):
  Edit, Write:
    ○ test-suggest.cjs         INFO    Suggest running related tests
    ○ change-suggest.cjs       INFO    Suggest related follow-up actions

To add a hook:  Create a .cjs file in .claude/hooks/ and register it in .claude/settings.local.json
To remove a hook:  Delete its entry from settings.local.json (optionally delete the .cjs file)
To change which tools a hook runs on:  Edit the "matcher" entries in settings.local.json
```

Formatting rules:
- Use `●` for PreToolUse hooks, `○` for PostToolUse hooks
- Enforcement level is one of: `BLOCK`, `WARN`, `INFO`
- If a hook file is missing from disk, use `✗` instead of `●`/`○` and append `FILE MISSING`
- Group matchers that share the same hook set (e.g., "Edit, Write:" when both have identical hooks)
- Count N as the total number of unique hook files (not counting duplicates across matchers)

---

## Sub-command: spec

List all SPEC documents found in `docs/` with their verification metadata and descriptions.

### Usage

```
/coherence spec
```

### Instructions

#### Step 1: Scan for SPEC Documents

Look for files matching `docs/SPEC-*.md` in the current repo.

- If no `docs/` directory exists: report "No docs/ directory found." and stop.
- If no files match `SPEC-*.md`: report "No SPEC documents found. Copy docs/SPEC-TEMPLATE.md to create one." and stop.

#### Step 2: Read SPEC Metadata

For each SPEC file found (skip `SPEC-TEMPLATE.md` — list it separately as a template if present):

1. Read the file's header block. SPEC files use a blockquote-style header:
   ```
   > **Last verified**: 2026-02-25
   > **Verified by**: manual review / drift-detector agent
   > **Verification method**: file listing + source inspection
   ```
2. Extract:
   - **Last verified date** from the `Last verified` line
   - **Verified by** from the `Verified by` line
   - **Verification method** from the `Verification method` line
3. Read the `## Overview` section (or the first paragraph after the header) to get a one-line description.

#### Step 3: Present Report

```
SPEC Documents
===============

Found N SPEC documents in docs/:

  SPEC-HOOKS.md          verified 2026-02-25   Hook system (11 hooks, 3 tiers)
  SPEC-SKILLS.md         verified 2026-03-03   Skill system (1 skill, 9 sub-commands)
  SPEC-API.md            verified 2026-02-20   API endpoints and routes

  Template: SPEC-TEMPLATE.md

To add a SPEC:     Copy docs/SPEC-TEMPLATE.md to docs/SPEC-{NAME}.md and fill it in
To update a SPEC:  Edit the file directly; update "Last verified" date and Change Log
To check drift:    Run /coherence check-drift to compare SPECs against code
```

Formatting rules:
- List SPEC documents alphabetically
- Show the verified date from the header (or "unverified" if no date found)
- Show a one-line description extracted from the Overview section
- If `SPEC-TEMPLATE.md` exists, list it separately at the bottom as "Template: SPEC-TEMPLATE.md"
- The count N excludes the template file

---

## Sub-command: uninstall

Remove Coherence hook registrations from the current repo and optionally clean up global configuration.

**Aliases**: `remove`, `unplug`

### Usage

```
/coherence uninstall           # Remove from current repo
/coherence uninstall --force   # Remove from current repo + global cleanup regardless of other repos
```

### Important

Uninstall does **NOT** delete `.claude/hooks/`, `.claude/agents/`, `.claude/skills/`, or `CLAUDE.md` — those contain user-customized content. It only cleans `settings.local.json` hook registrations and global config entries.

### Instructions

#### Step 1: Confirm Repo Path

Determine the current repo root using `git rev-parse --show-toplevel` (fall back to `pwd`).
Inform the user: "Uninstalling Coherence from: /path/to/repo"

#### Step 2: Remove from Registry

1. Read `REGISTRY_FILE`. If missing or invalid, skip this step with a note.
2. Remove the entry matching the current repo path from `repos[]`.
3. Write the updated registry back.

#### Step 3: Clean Local settings.local.json

1. Read `.claude/settings.local.json` in the current repo. If missing, skip with a note.
2. Walk through `hooks.PreToolUse[]` and `hooks.PostToolUse[]` matchers.
3. Remove any hook entry where the `command` string contains `.claude/hooks/` (Coherence-generated hooks).
4. If a matcher's `hooks` array becomes empty after removal, remove the entire matcher object.
5. If `PreToolUse` or `PostToolUse` arrays become empty, remove them.
6. If the `hooks` object becomes empty, remove it.
7. If the entire settings object becomes `{}`, delete the file.
8. Otherwise, write the cleaned settings back.

Report what was removed (e.g., "Removed 6 hook entries from settings.local.json").

#### Step 4: Auto-Prune Stale Registry Entries

After removing the current repo, also prune any stale entries (paths that don't exist on disk) from the registry. Report if any were pruned.

#### Step 5: Check Remaining Repos

Count remaining (non-stale) entries in the registry.

- If remaining > 0 and `--force` was **not** passed:
  - Show the remaining repos
  - Inform: "Coherence is still installed in N other repo(s). Global config left intact."
  - Suggest: "Run `/coherence uninstall --force` to remove global config regardless."
  - **Stop here** — do not proceed to global cleanup.
- If remaining == 0 or `--force` was passed: proceed to Step 6.

#### Step 6: Global Cleanup

Only reached when no repos remain in the registry, or `--force` was passed.

1. **`~/.claude/settings.json`**: Remove any `enabledPlugins` entry matching `MARKETPLACE_PATTERN`. Remove any `extraKnownMarketplaces` entry matching `MARKETPLACE_PATTERN`. If either array becomes empty, remove the key. Write back.
2. **`~/.claude.json`**: Remove any MCP server entries containing `PLUGIN_NAME`. Write back.
3. **Registry**: Delete `REGISTRY_FILE` and `REGISTRY_DIR` (only if directory is empty after file deletion).

Report each action taken.

#### Step 7: Summary

Present a structured summary:

```
Coherence Uninstall Summary
=============================

Local (repo: /path/to/repo):
  settings.local.json:  cleaned (N hooks removed) / already clean / not found
  Registry entry:       removed / not found

Global:
  enabledPlugins:       removed / skipped (N repos remain)
  extraKnownMarketplaces: removed / skipped
  MCP servers:          removed / skipped
  Registry:             deleted / skipped

Note: .claude/hooks/, .claude/agents/, .claude/skills/, and CLAUDE.md were
left intact — they contain your customized guardrails configuration.
```

#### Edge Cases

- **No `.claude/` directory**: Skip local cleanup, still remove from registry and check global.
- **Missing or corrupt registry**: Proceed with local cleanup. Create a fresh registry if needed for removal tracking, or skip registry steps with a warning.
- **Already-clean entries**: If `settings.local.json` has no Coherence hooks, report "already clean" rather than failing.
- **`--force` with stale warnings**: Show stale entries that were pruned as part of the summary.
