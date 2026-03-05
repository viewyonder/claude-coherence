/**
 * Hand-curated changelog entries.
 * Edit the `text` fields to be human-friendly — these are displayed as-is.
 */
export const changelog = [
  // --- 2026-03-05 (v1.11.0) ---
  { date: '2026-03-05', text: 'Remove /coherence:uninstall skill — uninstalling is now handled through Claude Code\'s built-in plugin management UI' },
  { date: '2026-03-05', text: 'Split plugin into individual /coherence:* skills (colon syntax replaces space-separated sub-commands for plugin users)' },
  { date: '2026-03-05', text: 'Update all site pages and blog posts to use /coherence:skill format' },
  { date: '2026-03-05', text: 'Add "Letting Go of the Lever" blog post on the uninstall removal and skill reorganization' },

  // --- 2026-03-04 (v1.7.0) ---
  { date: '2026-03-04', text: 'Add --purge flag to /coherence uninstall — delete all Coherence project files after confirmation' },
  { date: '2026-03-04', text: 'Add plugin cache cleanup to global uninstall (removes ~/.claude/plugins/cache/viewyonder-coherence)' },
  { date: '2026-03-04', text: 'Update site pages to document --force and --purge flags on uninstall' },
  { date: '2026-03-04', text: 'Bump version to 1.7.0' },

  // --- 2026-03-03 (v1.5.0) ---
  { date: '2026-03-03', text: 'Add /coherence config sub-command — unified overview of local project configuration' },
  { date: '2026-03-03', text: 'Add "The Whole Picture" blog post on the config sub-command' },
  { date: '2026-03-03', text: 'Bump version to 1.5.0' },

  // --- 2026-03-03 (v1.4.0) ---
  { date: '2026-03-03', text: 'Add /coherence hook sub-command — list installed hooks with enforcement levels and file status' },
  { date: '2026-03-03', text: 'Add /coherence spec sub-command — list SPEC documents with verification metadata' },
  { date: '2026-03-03', text: 'Add "Show Your Work" blog post on the inspection sub-commands' },
  { date: '2026-03-03', text: 'Bump version to 1.4.0' },

  // --- 2026-03-03 (v1.3.1) ---
  { date: '2026-03-03', text: 'Rename check-architecture to check-principles — name now reflects what the sub-command actually checks' },
  { date: '2026-03-03', text: 'Add "Names Are Load-Bearing" blog post on the rename rationale' },

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
