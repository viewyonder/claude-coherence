---
name: coherence
description: Interactive setup wizard that generates a complete .claude/ guardrails system customized to your project — hooks, agents, skills, CLAUDE.md, and settings.
user_invocable: true
arguments: "[--reset]"
---

# /coherence — Project Guardrails Setup

You are running the Coherence setup wizard. Your job is to guide the user through setting up a complete `.claude/` guardrails system customized to their project.

**Important behavioral rules:**
- Ask questions using the `AskUserQuestion` tool — never just print questions as text
- Generate all files at the end, after confirmation — never generate files mid-conversation
- Be concise in explanations, generous in generated output
- Every generated hook must be valid Node.js (testable with `node -c`)
- Every generated `settings.local.json` must reference only hooks that were actually created
- Every generated `CLAUDE.md` must have zero `{{PLACEHOLDER}}` markers — all values filled in

---

## Pre-Phase: Dogfood Detection

Before starting the wizard, check whether you are running inside the coherence repo itself. Check **all four** of these conditions:

1. `plugins/coherence-plugin/` directory exists
2. `template/.claude/hooks/` directory exists
3. `marketplace.json` exists at the repository root
4. `CLAUDE.md` contains the phrase "template system for encoding architectural constraints"

**If all four are true** → skip the wizard entirely and run **Dogfood Validation Mode** (described below).
**Otherwise** → proceed to Phase 0 normally.

### Dogfood Validation Mode

This is a read-only validation of the coherence repo's own templates, hooks, examples, and documentation. Do not generate or modify any files. Run each check below and produce a structured report.

#### Checks

| # | Check | What to Do |
|---|-------|------------|
| 1 | **Hook Syntax** | Run `node -c` on every `.cjs` and `.js` file in `template/.claude/hooks/`. Report PASS/FAIL per file. |
| 2 | **Template Structure** | Verify that all files referenced in the SKILL.md archetype templates (settings.local.json, CLAUDE.md, each hook, each agent, each skill) have corresponding template files in `template/.claude/`. Report missing files. |
| 3 | **README Accuracy** | Count actual hooks, agents, and skills in `template/.claude/` and compare against the counts and names listed in `README.md`. Report any mismatches. |
| 4 | **Example Consistency** | For each example in `examples/`: run `node -c` on all `.cjs`/`.js` hooks, and verify their `CLAUDE.md` contains zero `{{PLACEHOLDER}}` markers. Report PASS/FAIL per example. |
| 5 | **Plugin Structure** | Validate that `plugin.json` (if present) and both `marketplace.json` files (root and `.claude-plugin/`) are valid JSON with matching `name` fields. Report any parse errors or mismatches. |
| 6 | **SKILL.md Consistency** | Verify that the plugin copy (`plugins/coherence-plugin/skills/coherence/SKILL.md`) and the template copy (`template/.claude/skills/coherence/SKILL.md`) are identical. Report any differences. |

#### Output Format

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

## Phase 0: Project Scan

Before asking any questions, silently scan the project to inform your questions.

### Scan checklist:
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

### Idempotency check

If `.claude/` already exists:
- Ask whether to **overwrite** (replace everything), **merge** (add missing files, keep existing), or **abort**
- If `--reset` argument was passed, skip this question and overwrite

---

## Phase 1: Project Classification

### Q1: Project Type

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

### Q2: Stack Confirmation (conditional)

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

## Phase 2: Constraint Discovery

Ask 2-3 questions adapted to the project type.

### For Web Application

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

### For API / Backend Service

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

### For CLI Tool / Library

**Q3**: "What boundaries matter most?"
- Public API surface vs internals
- Plugin / extension boundaries
- Input validation at CLI boundary
- No special boundaries

**Q4**: "How should tests be enforced?"
- Required before commit (strict)
- Suggested but not required
- No test infrastructure yet

### For Infrastructure / DevOps

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

### For Writing / Content

**Q3**: "What consistency matters most?" (multi-select)
- Terminology (product names, technical terms)
- Voice and tone (formal/informal, person, style)
- Structure (heading hierarchy, required sections)
- Cross-reference accuracy

**Q4**: "How strict should enforcement be?"
- Block on violations (strict brand/style guide)
- Warn but allow (editorial suggestions)
- Informational only (gentle nudges)

### For Marketing / Brand

**Q3**: "What brand constraints exist?"
- Specific terminology required (product names, taglines)
- Competitor mentions restricted
- Tone/voice rules (casual, professional, playful)
- All of the above

**Q4**: "How strict should enforcement be?"
- Block on violations (strict brand compliance)
- Warn but allow
- Informational only

### For Research / Analysis

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

## Phase 3: Enforcement Preferences

**Q6**: "Should I generate SPEC documents alongside the guardrails?"
- Yes — generate SPEC templates for this project type
- No — just CLAUDE.md, hooks, agents, and skills

---

## Phase 4: Summary & Confirmation

Present a summary of what will be generated:

```
Based on your answers, I'll generate:

📄 CLAUDE.md — Customized development guidelines
⚙️ .claude/settings.local.json — Hook registrations

🪝 Hooks:
  - forbidden-imports.cjs (blocking) — prevents [specific things]
  - boundary-guard.cjs (blocking) — enforces [specific boundaries]
  - ...

🤖 Agents:
  - architecture-reviewer.md — validates against CLAUDE.md principles
  - ...

🎯 Skills:
  - /check-drift — compare spec docs against codebase
  - /check-architecture — run architecture review
  - ...

📋 SPEC Templates (if selected):
  - docs/SPEC-API-SURFACE.md
  - ...

Total: N files
```

Ask for confirmation before proceeding.

---

## Phase 5: Generate Files

Generate all files based on the archetype and user answers. Use the templates below as starting points, customizing based on the specific answers.

**Critical rules for generation:**
1. Every hook referenced in `settings.local.json` must have a corresponding `.cjs` file
2. Every agent referenced in a skill must have a corresponding `.md` file
3. `CLAUDE.md` must have zero `{{PLACEHOLDER}}` markers
4. All hooks must pass `node -c` syntax check
5. Use the user's actual project details (name, paths, commands) discovered in the scan

---

## Archetype Templates

### TEMPLATE: settings.local.json

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

### TEMPLATE: CLAUDE.md for Code Projects

Use the template structure from the guardrails repo but fill in ALL placeholders with project-specific values. Key sections:

- **Architecture Overview**: Use detected runtime, framework, deployment target
- **Architectural Principles**: Customize Security/Boundary/Performance/Propagation principles based on the specific project type and user answers
- **Core Concepts**: Name the actual domain concepts for this project
- **Local Development**: Use detected commands (`npm run dev`, `cargo run`, `python manage.py runserver`, etc.)
- **Runtime Constraints**: Based on detected/confirmed runtime
- **Testing**: Use detected test runner and commands

### TEMPLATE: CLAUDE.md for Writing/Content Projects

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

### TEMPLATE: CLAUDE.md for Marketing/Brand Projects

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

### TEMPLATE: CLAUDE.md for Research Projects

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

### TEMPLATE: Hook — forbidden-imports.cjs

Customize the `FORBIDDEN_PATTERNS` array based on the project's runtime:

- **Browser/Edge**: Block `require('fs')`, `require('child_process')`, `require('net')`, Node.js built-ins
- **Serverless**: Block `require('fs')` (usually), long-running patterns (`setInterval`, `while(true)`)
- **Node.js server**: Block browser-only APIs (`document.`, `window.`, `localStorage`)
- **Python**: Block `import os` in web handlers, `import subprocess` in untrusted contexts
- **Infrastructure**: Block `rm -rf /`, `DROP DATABASE`, force push patterns

Set `SKIP_PATHS` based on detected project structure.

### TEMPLATE: Hook — boundary-guard.cjs

Customize `GUARDED_PATHS` based on user's boundary answers:

- **Web app**: Guard component files from direct store mutation, guard pages from business logic
- **API**: Guard route handlers from DB queries (must go through service layer), guard models from HTTP concepts
- **Library**: Guard public API surface from internal imports, guard core from platform-specific code
- **Infra**: Guard production configs from dev-only settings

### TEMPLATE: Hook — state-flow.cjs

Only generate for web applications with state management. Customize:
- `STORE_PATHS`: Based on detected state management (Redux, Zustand, Pinia, Svelte stores, etc.)
- `UI_PATHS`: Based on detected component structure
- `MUTATION_PATTERNS`: Based on the state management library's patterns

### TEMPLATE: Hook — data-isolation.cjs

Only generate for multi-tenant or user-scoped data applications. Customize:
- `DB_CALL_PATTERN`: Based on detected ORM/database library (Prisma, Drizzle, Sequelize, SQLAlchemy, etc.)
- `REQUIRED_FILTERS`: Based on user's isolation model (tenant_id, user_id, org_id, etc.)
- `CHECK_PATHS`: Based on detected source structure

### TEMPLATE: Hook — delegation-check.js

Only generate for API/backend projects. Customize:
- Handler paths based on detected routing structure
- Business logic indicators based on the framework

### TEMPLATE: Hook — required-prefix.cjs

Only generate for API projects with route prefix conventions. Customize:
- Prefix pattern based on the API structure (`/api/v1/`, `/v2/`, etc.)
- Route file locations

### TEMPLATE: Hook — test-gate.cjs

Only generate if user chose strict test enforcement. Customize:
- Test command based on detected test runner
- Coverage thresholds if applicable

### TEMPLATE: Hook — test-suggest.cjs

Generate for code projects. Customize:
- `TEST_LOCATIONS` based on detected project structure
- `TEST_COMMAND` based on detected test runner

### TEMPLATE: Hook — change-suggest.cjs

Generate for code projects. Customize:
- `WATCH_RULES` based on project-specific critical paths

### TEMPLATE: Hook — terminology-check.cjs

Generate for writing, marketing, and brand projects. Customize:
- `TERMINOLOGY_RULES` populated with terms from the user's answers
- `CHECK_EXTENSIONS` based on content types
- `ENFORCEMENT` based on strictness preference

### TEMPLATE: Hook — style-guard.cjs

Generate for writing, marketing, research, and content projects. Customize:
- `STYLE_RULES` based on voice/tone requirements
- `STRUCTURE_RULES` based on document conventions
- `CITATION_RULES` for research projects

### TEMPLATE: Agent — architecture-reviewer.md

Generate for code projects. Customize:
- Review categories based on the project type
- Anti-patterns specific to the framework/stack

### TEMPLATE: Agent — drift-detector.md

Generate for projects with SPEC documents. Customize:
- SPEC document list based on what was generated

### TEMPLATE: Agent — consistency-reviewer.md

Generate for writing, marketing, and research projects. Customize:
- Review categories based on content type
- Consistency checks specific to the domain

### TEMPLATE: Skill — check-drift/SKILL.md

Generate for projects with SPEC documents. Customize:
- Scope options based on project type
- SPEC document table

### TEMPLATE: Skill — check-architecture/SKILL.md

Generate for code projects. Standard structure:

```markdown
---
name: check-architecture
description: Run an architecture review against CLAUDE.md principles.
user_invocable: true
arguments: "[path or --staged]"
---

# /check-architecture

Run the architecture-reviewer agent to validate code against documented principles.

## Usage
/check-architecture              # Review recent changes
/check-architecture src/api/     # Review specific path
/check-architecture staged       # Review staged changes

## Instructions
Use the `architecture-reviewer` agent to perform the review. Pass the path argument.
```

### TEMPLATE: Skill — check-consistency/SKILL.md

Generate for writing/marketing/research projects:

```markdown
---
name: check-consistency
description: Review content for terminology, voice, and structural consistency.
user_invocable: true
arguments: "[path or --all]"
---

# /check-consistency

Run the consistency-reviewer agent to check content consistency.

## Usage
/check-consistency              # Review all content
/check-consistency docs/        # Review specific directory
/check-consistency staged       # Review staged changes

## Instructions
Use the `consistency-reviewer` agent to perform the review. Pass the path argument.
```

### TEMPLATE: Skill — test/SKILL.md

Generate for code projects with test infrastructure:

```markdown
---
name: test
description: Run tests with coverage reporting.
user_invocable: true
arguments: "[path or test name filter]"
---

# /test

Run the project's test suite.

## Usage
/test                    # Run all tests
/test src/api/           # Run tests for specific path
/test auth               # Run tests matching "auth"

## Instructions
Run the test command: `[DETECTED_TEST_COMMAND]`
If a path is provided, filter to that path.
Report results and any failures.
```

---

## Phase 6: Verify

After generating all files:

1. **Syntax check all hooks**: Run `node -c .claude/hooks/<each-hook>.cjs` for every generated hook
2. **Cross-reference check**: Verify every hook in `settings.local.json` has a matching file
3. **Placeholder check**: Grep `CLAUDE.md` for `{{` — there should be zero matches
4. **Report results** to the user

Suggest next steps:
- "Run `/check-architecture` to validate your codebase against the new principles"
- "Run `/check-consistency` to review content against the new guidelines"
- "Edit `CLAUDE.md` to refine the principles for your specific needs"
- "Review the hook configuration blocks (marked `// === CONFIGURATION ===`) to fine-tune patterns"
- "Create SPEC documents in `docs/` for drift detection"

---

## Error Handling

- If scan finds nothing recognizable: ask the user to describe their project manually
- If user picks "Other" for project type: ask them to describe it, then map to the closest archetype and customize
- If a generated hook fails syntax check: fix it immediately and re-verify
- If the project has an unusual structure: adapt paths in hooks rather than forcing a conventional structure
