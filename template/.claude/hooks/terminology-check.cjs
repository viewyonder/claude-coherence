#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — enforces consistent terminology.
 *
 * Prevents use of deprecated, incorrect, or off-brand terms in content files.
 * Works for writing projects (blog posts, docs, marketing copy) and code
 * projects (consistent naming in user-facing strings).
 *
 * ENFORCEMENT: warning (non-blocking by default; change to blocking for strict brand enforcement)
 */

// === CONFIGURATION ===
// Each entry: a term to flag and its required replacement.
// `pattern` is a RegExp (case-insensitive by default).
// `replacement` is the correct term to use instead.
// `context` explains why this matters.
const TERMINOLOGY_RULES = [
  // Example: product naming consistency
  // {
  //   pattern: /\bour product\b/gi,
  //   replacement: 'Acme Platform',
  //   context: 'Always use the official product name, not generic references.',
  // },
  // Example: deprecated terminology
  // {
  //   pattern: /\bmaster\b/gi,
  //   replacement: 'main',
  //   context: 'We use "main" for the default branch name.',
  //   skipPaths: ['/git/', '.gitconfig'],
  // },
  // Example: competitor mentions
  // {
  //   pattern: /\b(Competitor|RivalCo)\b/g,
  //   replacement: '[remove or use "alternative solutions"]',
  //   context: 'Do not reference competitors by name in public-facing content.',
  // },
  // Example: technical accuracy
  // {
  //   pattern: /\bAI model\b/gi,
  //   replacement: 'language model',
  //   context: 'Be specific about the type of model when discussing LLMs.',
  // },
];

// File extensions to check. Add/remove based on your content types.
const CHECK_EXTENSIONS = [
  '.md', '.mdx', '.txt', '.rst',           // Documentation
  '.html', '.htm',                          // Web content
  '.json',                                  // Structured content (e.g., i18n)
  '.ts', '.js', '.tsx', '.jsx',             // User-facing strings in code
  '.yaml', '.yml',                          // Config with user-facing text
];

// Paths to skip entirely.
const SKIP_PATHS = [
  '/.claude/',
  '/node_modules/',
  '/vendor/',
  '/dist/',
  '/build/',
  '.lock',
];

// Set to 'block' for strict enforcement, 'warn' for advisory.
const ENFORCEMENT = 'warn';
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

// Only check configured extensions
if (!CHECK_EXTENSIONS.some(ext => filePath.endsWith(ext))) {
  process.exit(0);
}

const violations = [];

for (const rule of TERMINOLOGY_RULES) {
  // Skip if this rule has path-specific exclusions
  if (rule.skipPaths && rule.skipPaths.some(p => filePath.includes(p))) {
    continue;
  }

  rule.pattern.lastIndex = 0;
  const matches = content.match(rule.pattern);
  if (matches) {
    violations.push(
      `Found "${matches[0]}" → use "${rule.replacement}" instead. ${rule.context}`
    );
  }
}

if (violations.length > 0) {
  logEvent('terminology-check', ENFORCEMENT === 'block' ? 'BLOCK' : 'WARN', filePath, `${violations.length} term(s) flagged`);
  if (ENFORCEMENT === 'block') {
    const result = {
      decision: 'block',
      reason: `Terminology violation:\n${violations.join('\n')}`,
    };
    process.stdout.write(JSON.stringify(result));
  } else {
    const result = {
      message: `Terminology check:\n${violations.join('\n')}`,
    };
    process.stdout.write(JSON.stringify(result));
  }
}

process.exit(0);
