# Changelog

All notable changes to this project will be documented in this file.

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
