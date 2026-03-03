#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — enforces prose style and formatting rules.
 *
 * Checks content files for style violations: passive voice overuse,
 * inconsistent formatting, banned phrases, structure requirements.
 * Works for writing, documentation, marketing, and research projects.
 *
 * ENFORCEMENT: warning (non-blocking)
 */

// === CONFIGURATION ===
// Style rules to enforce. Each rule checks content against a pattern
// and produces a warning or block if matched.
const STYLE_RULES = [
  // Example: discourage passive voice
  // {
  //   pattern: /\b(?:was|were|been|being|is|are)\s+(?:\w+ed|built|made|done|shown|given|taken)\b/gi,
  //   message: 'Passive voice detected. Prefer active voice for clarity.',
  //   maxOccurrences: 3,  // Allow some passive voice, flag if excessive
  //   severity: 'warn',
  // },
  // Example: ban weasel words
  // {
  //   pattern: /\b(?:very|really|quite|basically|actually|literally|simply|just)\b/gi,
  //   message: 'Weasel word detected. Remove or replace with specific language.',
  //   maxOccurrences: 2,
  //   severity: 'warn',
  // },
  // Example: enforce sentence length
  // {
  //   pattern: /[^.!?]{200,}[.!?]/g,
  //   message: 'Very long sentence detected (200+ chars). Consider breaking it up.',
  //   maxOccurrences: 0,
  //   severity: 'warn',
  // },
  // Example: ban marketing buzzwords
  // {
  //   pattern: /\b(?:synergy|leverage|paradigm|disrupt|revolutionize|game-changing)\b/gi,
  //   message: 'Marketing buzzword detected. Use concrete, specific language instead.',
  //   maxOccurrences: 0,
  //   severity: 'warn',
  // },
  // Example: enforce heading hierarchy (no jumping from # to ###)
  // Handled separately in STRUCTURE_RULES below
];

// Structure rules check document-level patterns (headings, sections, etc.)
const STRUCTURE_RULES = [
  // Example: require front matter in blog posts
  // {
  //   pathContains: '/blog/',
  //   pattern: /^---\n[\s\S]*?\n---/,
  //   mustMatch: true,
  //   message: 'Blog posts must start with YAML front matter (---).',
  // },
  // Example: require H1 heading
  // {
  //   pathContains: '/docs/',
  //   pattern: /^# .+/m,
  //   mustMatch: true,
  //   message: 'Documentation files must have an H1 heading.',
  // },
];

// Citation/reference format rules (for research projects).
const CITATION_RULES = [
  // Example: enforce consistent citation format
  // {
  //   pattern: /\[\d+\]/g,
  //   conflictsWith: /\([\w\s]+,\s*\d{4}\)/g,
  //   message: 'Mixed citation styles detected. Use either [N] or (Author, Year), not both.',
  // },
];

// File extensions to check.
const CHECK_EXTENSIONS = [
  '.md', '.mdx', '.txt', '.rst', '.html',
];

// Paths to skip.
const SKIP_PATHS = [
  '/.claude/',
  '/node_modules/',
  '/vendor/',
  '/dist/',
  'CHANGELOG',
  'LICENSE',
];
// === END CONFIGURATION ===

const fs = require('fs');
const { logEvent } = require('./_log.cjs');

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path || '';
const content = input.tool_input?.content || input.tool_input?.new_string || '';

// Skip irrelevant paths
if (SKIP_PATHS.some(p => filePath.includes(p))) {
  process.exit(0);
}

// Only check content files
if (!CHECK_EXTENSIONS.some(ext => filePath.endsWith(ext))) {
  process.exit(0);
}

const warnings = [];
const blocks = [];

// Check style rules
for (const rule of STYLE_RULES) {
  rule.pattern.lastIndex = 0;
  const matches = content.match(rule.pattern);
  if (matches && matches.length > (rule.maxOccurrences || 0)) {
    const msg = `${rule.message} (found ${matches.length} occurrence${matches.length === 1 ? '' : 's'})`;
    if (rule.severity === 'block') {
      blocks.push(msg);
    } else {
      warnings.push(msg);
    }
  }
}

// Check structure rules
for (const rule of STRUCTURE_RULES) {
  if (rule.pathContains && !filePath.includes(rule.pathContains)) continue;

  const matches = rule.pattern.test(content);
  if (rule.mustMatch && !matches) {
    warnings.push(rule.message);
  } else if (!rule.mustMatch && matches) {
    warnings.push(rule.message);
  }
}

// Check citation consistency
for (const rule of CITATION_RULES) {
  rule.pattern.lastIndex = 0;
  rule.conflictsWith.lastIndex = 0;
  const hasStyle1 = rule.pattern.test(content);
  const hasStyle2 = rule.conflictsWith.test(content);
  if (hasStyle1 && hasStyle2) {
    warnings.push(rule.message);
  }
}

if (blocks.length > 0) {
  logEvent('style-guard', 'BLOCK', filePath, blocks[0]);
  const result = {
    decision: 'block',
    reason: `Style violation:\n${blocks.join('\n')}`,
  };
  process.stdout.write(JSON.stringify(result));
  process.exit(0);
}

if (warnings.length > 0) {
  logEvent('style-guard', 'WARN', filePath, `${warnings.length} style issue(s)`);
  const result = {
    message: `Style check:\n${warnings.join('\n')}`,
  };
  process.stdout.write(JSON.stringify(result));
}

process.exit(0);
