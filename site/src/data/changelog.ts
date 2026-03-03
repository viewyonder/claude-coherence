/**
 * Hand-curated changelog entries.
 * Edit the `text` fields to be human-friendly — these are displayed as-is.
 */
export const changelog = [
  // --- 2026-03-03 (v1.3.0) ---
  { date: '2026-03-03', text: 'Add /coherence status sub-command — show install state, registered repos, and stale entries' },
  { date: '2026-03-03', text: 'Add /coherence uninstall sub-command — clean local hooks and optionally remove global config' },
  { date: '2026-03-03', text: 'Add repo registry (~/.claude/coherence/repos.json) to track installations across repos' },
  { date: '2026-03-03', text: 'Add Phase 7 (Register) to init wizard — repos auto-register after setup' },
  { date: '2026-03-03', text: 'Add "Clean Exits" blog post on the uninstall lifecycle' },
  { date: '2026-03-03', text: 'Bump version to 1.3.0' },

  // --- 2026-03-03 (v1.2.1) ---
  { date: '2026-03-03', text: 'Add missing Consistency Reviewer to homepage agent cards' },
  { date: '2026-03-03', text: 'Show all 5 /coherence sub-commands on homepage' },
  { date: '2026-03-03', text: 'Fix Getting Started file tree to show consolidated skills/coherence/ directory' },

  // --- 2026-03-03 (v1.2.0) ---
  { date: '2026-03-03', text: 'Consolidate all skills under /coherence with sub-commands: init, check-drift, check-architecture, test, help' },
  { date: '2026-03-03', text: 'Wizard-generated projects now produce a single unified skill instead of three separate skills' },
  { date: '2026-03-03', text: 'Update all SPEC docs, READMEs, blog posts, and site pages to reflect new command names' },
  { date: '2026-03-03', text: 'Add "One Command to Rule Them All" blog post explaining the consolidation' },
  { date: '2026-03-03', text: 'Add CHANGELOG.md to repository root' },
  { date: '2026-03-03', text: 'Bump version to 1.2.0' },

  // --- 2026-02-25 ---
  { date: '2026-02-25', text: 'Separate install commands into individual code blocks' },
  { date: '2026-02-25', text: 'Update README to lead with plugin marketplace installation' },
  { date: '2026-02-25', text: 'Fix skill template arguments to use flag-style format' },
  { date: '2026-02-25', text: 'Update README, fix URLs, and add SPEC documents for repo components' },
  { date: '2026-02-25', text: 'Update hero tagline to "The elastic between your plan and your actual."' },

  // --- 2026-02-24 ---
  { date: '2026-02-24', text: 'Rename "Claude Coherence" to "Coherence for Claude" and update repo URLs' },
  { date: '2026-02-24', text: 'Add FAQ system with tagged questions across site pages' },
  { date: '2026-02-24', text: 'Add plugin marketplace, plugins page, and plugin-first getting started' },
  { date: '2026-02-24', text: 'Rename project from Claude Code Guardrails to Claude Coherence' },
  { date: '2026-02-24', text: 'Fix Astro 5 content collections, add Getting Started page, fix site issues' },
  { date: '2026-02-24', text: 'Add /coherence interactive setup skill with supporting hooks and agent' },
  { date: '2026-02-24', text: 'Add terminology-check hook for consistent naming enforcement' },

  // --- 2026-02-23 ---
  { date: '2026-02-23', text: 'Add Astro site for GitHub Pages' },
  { date: '2026-02-23', text: 'Add CLAUDE.md with repo guidance for Claude Code' },
  { date: '2026-02-23', text: 'Initial commit: template system and blog post' },
];
