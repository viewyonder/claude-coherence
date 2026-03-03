#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — blocks runtime-inappropriate imports.
 *
 * Prevents the agent from using APIs that aren't available in your
 * production runtime (e.g., Node.js fs in a browser bundle, Bun APIs
 * in a Cloudflare Worker, server-only imports in client code).
 *
 * ENFORCEMENT: blocking
 */

// === CONFIGURATION ===
// Patterns that should never appear in runtime source files.
// Each entry: { pattern: RegExp, message: string }
const FORBIDDEN_PATTERNS = [
  {
    pattern: /require\(['"]fs['"]\)|from ['"]fs['"]|from ['"]node:fs['"]/,
    message: 'Node.js fs module is not available in this runtime',
  },
  {
    pattern: /Bun\.serve|Bun\.file|Bun\.\$/,
    message: 'Bun APIs (Bun.serve, Bun.file, Bun.$) are not available in this runtime',
  },
  // Add your own:
  // {
  //   pattern: /from ['"]server-only['"]/,
  //   message: 'server-only imports cannot be used in client components',
  // },
];

// Paths to skip (build scripts, tests, config files, hooks themselves).
// Files matching any of these substrings are allowed to use forbidden APIs.
const SKIP_PATHS = [
  '/scripts/',
  '/tests/',
  '/.claude/',
  '/packages/',
];

// File extensions to skip (non-source files).
const SKIP_EXTENSIONS = [
  '.json', '.md', '.yaml', '.yml', '.css', '.html', '.svg',
];
// === END CONFIGURATION ===

const fs = require('fs');
const { logEvent } = require('./_log.cjs');

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path || '';
const content = input.tool_input?.content || input.tool_input?.new_string || '';

// Skip non-runtime paths
if (SKIP_PATHS.some(p => filePath.includes(p))) {
  process.exit(0);
}

// Skip non-source extensions
if (SKIP_EXTENSIONS.some(ext => filePath.endsWith(ext))) {
  process.exit(0);
}

const violations = [];

for (const { pattern, message } of FORBIDDEN_PATTERNS) {
  if (pattern.test(content)) {
    violations.push(message);
  }
}

if (violations.length > 0) {
  logEvent('forbidden-imports', 'BLOCK', filePath, violations[0]);
  const result = {
    decision: 'block',
    reason: `Forbidden import violation:\n${violations.join('\n')}`,
  };
  process.stdout.write(JSON.stringify(result));
}

process.exit(0);
