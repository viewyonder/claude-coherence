# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-03-03

### Added

- **`/coherence hook` sub-command.** Read-only report of all installed hooks — parses `settings.local.json`, checks file existence, reads JSDoc headers for enforcement level (BLOCK/WARN/INFO) and purpose. Groups by PreToolUse/PostToolUse and matcher.
- **`/coherence spec` sub-command.** Read-only report of all SPEC documents — scans `docs/SPEC-*.md`, reads verification metadata (last verified date, method), extracts one-line descriptions from Overview sections.
- "Show Your Work" blog post explaining the rationale for inspection sub-commands

### Changed

- Updated SPEC-SKILLS.md sub-command count from 7 to 9
- Bump version to 1.4.0

## [1.3.1] - 2026-03-03

### Changed

- **Rename `check-architecture` sub-command to `check-principles`.** The old name suggested structural verification (like `check-drift`), when it actually checks adherence to the *principles* section of CLAUDE.md. The new name makes the distinction immediately clear.
- Updated all 18 files across SKILL.md (template + plugin), CLAUDE.md, README, SPEC documents, site pages, and changelog data
- Added "Names Are Load-Bearing" blog post explaining the rationale

## [1.2.1] - 2026-03-03

### Fixed

- Add missing Consistency Reviewer to homepage agent cards (5 agents now shown, matching template)
- Update homepage sub-commands list to show all 5 `/coherence` sub-commands
- Fix Getting Started file tree to show consolidated `skills/coherence/` instead of old separate skill directories

## [1.2.0] - 2026-03-03

### Changed

- **Unified `/coherence` command with sub-commands.** All skill functionality consolidated under a single entry point:
  - `/coherence init [--reset]` — setup wizard (was `/coherence`)
  - `/coherence check-drift [scope]` — SPEC drift detection (was `/check-drift`)
  - `/coherence check-architecture [path]` — architecture compliance review (was `/check-architecture`)
  - `/coherence test [scope]` — test runner (was `/test`)
  - `/coherence help` — show available sub-commands
- Wizard-generated projects now produce a single unified skill instead of three separate skills
- Updated all SPEC documents, READMEs, blog posts, and site pages to reflect new command names

### Removed

- `template/.claude/skills/check-drift/` — merged into `coherence/SKILL.md`
- `template/.claude/skills/check-architecture/` — merged into `coherence/SKILL.md`
- `template/.claude/skills/test/` — merged into `coherence/SKILL.md`

## [1.1.0] - 2026-02-28

### Added

- Install scope warnings in documentation to prevent local-scope confusion
- SEO meta tags, sitemap, hero refresh, and bottom CTAs for the website
- Viewyonder branding across site
- Restructured navbar into Get Started / Docs / More dropdowns
- Separate install commands documentation

## [1.0.0] - 2026-02-25

### Added

- Initial release
- 11 hooks across three enforcement levels (blocking, warning, informational)
- 5 agents (architecture-reviewer, drift-detector, code-reviewer, security-auditor, consistency-reviewer)
- 4 skills (`/coherence`, `/check-drift`, `/check-architecture`, `/test`)
- Template system with `{{PLACEHOLDER}}` markers
- SPEC document templates for falsifiable architectural claims
- Two worked examples (Express + PostgreSQL, Next.js + Prisma)
- Plugin distribution via Claude Code marketplace
- "Entropy at Velocity" blog post
