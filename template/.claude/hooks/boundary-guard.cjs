#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — enforces module boundary constraints.
 *
 * Prevents code in guarded paths from violating architectural boundaries.
 * For example: plugins/inspectors should return results, not mutate state;
 * middleware should not contain business logic; models should not import views.
 *
 * ENFORCEMENT: blocking
 */

// === CONFIGURATION ===
// Each entry defines a guarded path and the patterns forbidden within it.
// `principle` is cited in the error message so the agent understands *why*.
const GUARDED_PATHS = [
  {
    // Example: inspectors/validators/plugins must not mutate shared state
    pathContains: '/src/plugins/',
    forbiddenPatterns: [
      {
        pattern: /context\.state\s*=/g,
        message: 'Direct state mutation: `context.state = ...` — Plugins return results; they must not mutate shared state.',
        fix: 'Return a result object with the modified value instead.',
      },
    ],
    principle: 'Plugins return results; the orchestrator executes. (CLAUDE.md)',
  },
  {
    // Example: no module-level mutable state in stateless runtime handlers
    pathContains: '/src/handlers/',
    forbiddenPatterns: [
      {
        pattern: /^(?:export\s+)?(?:let|var)\s+\w+/m,
        message: 'Module-level mutable state in a handler file.',
        fix: 'Use `const` or move state inside the handler function. Handlers run in a stateless runtime.',
      },
    ],
    principle: 'Handlers are stateless. No persistent state between requests. (CLAUDE.md)',
  },
];

// Paths to always skip (type definitions, tests).
const SKIP_SUFFIXES = ['.d.ts', 'types.ts', '.test.ts', '.spec.ts'];
// === END CONFIGURATION ===

const fs = require('fs');
const { logEvent } = require('./_log.cjs');

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path || '';
const newContent = input.tool_input?.new_string || input.tool_input?.content || '';

// Skip type/test files
if (SKIP_SUFFIXES.some(s => filePath.endsWith(s))) {
  process.exit(0);
}

const violations = [];
let matchedPrinciple = '';

for (const guard of GUARDED_PATHS) {
  if (!filePath.includes(guard.pathContains)) continue;

  for (const { pattern, message, fix } of guard.forbiddenPatterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(newContent)) {
      violations.push(`${message}\n   Fix: ${fix}`);
      matchedPrinciple = guard.principle;
    }
  }
}

if (violations.length > 0) {
  logEvent('boundary-guard', 'BLOCK', filePath, violations[0].split('\n')[0]);
  const result = {
    decision: 'block',
    reason: `Boundary violation:\n${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\nPrinciple: ${matchedPrinciple}`,
  };
  process.stdout.write(JSON.stringify(result));
}

process.exit(0);
