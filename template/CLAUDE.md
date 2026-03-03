# {{PROJECT_NAME}} - Development Guidelines

## Architecture Overview

This is a **{{RUNTIME}}** application built with {{FRAMEWORK}}. It runs on {{DEPLOYMENT}} and serves as {{PROJECT_DESCRIPTION}}.

**IMPORTANT**: {{RUNTIME_CAVEAT}}

<!-- Example: "This is NOT a Bun application, despite Bun being used for build scripts. The runtime is Cloudflare Workers, not Node.js or Bun." -->

---

## Architectural Principles

These principles guide all development decisions. Review them before making changes.

### Security Principles

**Every input is hostile.** User payloads, API parameters, configuration values — all are potential attack vectors. Validate at system boundaries.

<!-- Customize: Add project-specific security constraints. What data is sensitive? What are your trust boundaries? -->

**Audit everything.** Every significant operation should produce a traceable record. "Nothing happened" is itself an auditable outcome.

**{{ISOLATION_PRINCIPLE}}.**
<!-- Example: "Tenant isolation is non-negotiable. User A must never see User B's data." -->
<!-- Example: "Request isolation is strict. Each request handler operates on its own state." -->

### Boundary Principles

**{{BOUNDARY_RULE_1}}.**
<!-- Example: "Validators return results; controllers execute." -->
<!-- Example: "Middleware handles cross-cutting; handlers handle business logic." -->

**{{BOUNDARY_RULE_2}}.**
<!-- Example: "Stores are truth; views subscribe." -->
<!-- Example: "Models own data; views own rendering." -->

**API handlers validate and delegate.** Route handlers validate input, call core functions, format responses. Business logic belongs in `{{CORE_PATH}}`, not in `{{API_PATH}}`.

### Performance Principles

**{{HOT_PATH_DESCRIPTION}}.** The `{{HOT_PATH_PATTERN}}` endpoints are latency-critical. Every millisecond matters. Avoid unnecessary allocations, deep clones, or synchronous operations.

**{{RUNTIME_CONSTRAINTS_PRINCIPLE}}.**
<!-- Example: "Cloudflare Workers constraints are non-negotiable. No filesystem, no long-running processes, no persistent state between requests." -->
<!-- Example: "Lambda cold starts matter. Minimize dependency tree and initialization cost." -->

### Change Propagation Principles

**{{STATE_FLOW_PRINCIPLE}}.**
<!-- Example: "Config -> Store -> View (unidirectional). Configuration changes flow one way." -->
<!-- Example: "Redux pattern: Actions -> Reducers -> Store -> Components." -->

**Side effects are explicit.** API calls, database writes, event broadcasts — these are side effects. They happen in specific places ({{SIDE_EFFECT_LOCATIONS}}) not scattered throughout the codebase.

---

## Core Concepts

<!-- Document the key domain concepts for your project. Examples: -->

### {{CONCEPT_1_NAME}}

<!-- What is it? What does it contain? How does it flow through the system? -->

### {{CONCEPT_2_NAME}}

<!-- What is it? What are the types/variants? When is each used? -->

---

## Local Development

### Quick Start

```bash
# 1. Copy environment template
cp {{ENV_TEMPLATE}} {{ENV_FILE}}

# 2. Fill in required keys (see docs/ENVIRONMENT.md)

# 3. Start development server
{{DEV_COMMAND}}
```

### Ports Reference

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| {{SERVICE_1}} | {{PORT_1}} | http://localhost:{{PORT_1}} | {{NOTES_1}} |
| {{SERVICE_2}} | {{PORT_2}} | http://localhost:{{PORT_2}} | {{NOTES_2}} |

### Development Commands

```bash
{{DEV_COMMAND}}         # Start dev server
{{BUILD_COMMAND}}       # Build for production
{{TEST_COMMAND}}        # Run tests
{{DEPLOY_COMMAND}}      # Deploy
```

---

## Adding New Features

### Adding Routes / Endpoints

1. Create source files:
   ```
   {{ROUTE_FILE_PATTERN}}
   ```

2. {{BUILD_STEP_IF_NEEDED}}

3. Create route config:
   ```
   {{ROUTE_CONFIG_PATTERN}}
   ```

4. Register in {{ROUTE_REGISTRY}}

### Adding {{DOMAIN_COMPONENT}}

<!-- Document the process for adding your project's primary domain component -->
<!-- (e.g., inspectors, plugins, middleware, resolvers, handlers) -->

1. Create file: `{{COMPONENT_PATH}}/my-component.{{EXT}}`
2. Register in `{{COMPONENT_REGISTRY}}`
3. Add tests
4. Update SPEC document

---

## Build Pipeline

```bash
{{BUILD_STAGE_1}}    # {{BUILD_STAGE_1_DESC}}
{{BUILD_STAGE_2}}    # {{BUILD_STAGE_2_DESC}}
{{BUILD_STAGE_3}}    # {{BUILD_STAGE_3_DESC}}
```

**Generated files (DO NOT edit):**
- {{GENERATED_FILES}}

---

## Runtime Constraints

### DO

- {{DO_1}}
- {{DO_2}}
- {{DO_3}}
- Use environment variables via `{{ENV_ACCESS_PATTERN}}`

### DON'T

- {{DONT_1}}
- {{DONT_2}}
- {{DONT_3}}
- Assume persistent state between requests

---

## Testing

```bash
{{TEST_COMMAND}}              # Run all tests
{{TEST_SPECIFIC_COMMAND}}     # Run specific tests
```

### Test Patterns

```{{LANG}}
// Standard test structure for your framework
{{TEST_EXAMPLE}}
```

---

## Specification Documents (Ground Truth)

These SPEC docs are the **authoritative source of truth** for the codebase. They are verified against actual code and take precedence over other docs when conflicts arise.

| Spec | Purpose | Consult Before... |
|------|---------|-------------------|
| SPEC-{{SPEC_1}}.md | {{SPEC_1_PURPOSE}} | {{SPEC_1_TRIGGER}} |
| SPEC-{{SPEC_2}}.md | {{SPEC_2_PURPOSE}} | {{SPEC_2_TRIGGER}} |
| SPEC-{{SPEC_3}}.md | {{SPEC_3_PURPOSE}} | {{SPEC_3_TRIGGER}} |

### Drift Policy

- **If code contradicts a SPEC doc**: Update the SPEC and call it out in the PR description.
- **When adding features**: Update the relevant SPEC doc as part of the change.
- **Run `/check-drift`** periodically to detect undocumented changes.

---

## Knowledge Base (QMD)

<!-- Optional: If this project is indexed in QMD (https://github.com/tobi/qmd), -->
<!-- uncomment and customize the section below. Remove this section if not using QMD. -->

<!--
This project is indexed in QMD as collection `{{QMD_COLLECTION_NAME}}`.

Use `qmd search` or `qmd query` via Bash to find relevant documentation, design
decisions, and context across the project's markdown files — especially before
planning features or investigating unfamiliar areas. QMD semantic search finds
conceptually related documents even when terminology differs from what you'd grep for.

```bash
qmd search "topic" -c {{QMD_COLLECTION_NAME}}      # Fast keyword search
qmd query "question" -c {{QMD_COLLECTION_NAME}}     # Hybrid + reranking (best quality)
qmd search "topic" --all --files --min-score 0.3    # Cross-project search
```
-->

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| GETTING-STARTED.md | Quickstart guide |
| ENVIRONMENT.md | All environment variables |
| ARCHITECTURE.md | System design |
| TESTING.md | Test strategy |
| DEPLOYMENT.md | Build and deploy |
