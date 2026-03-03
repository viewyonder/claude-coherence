#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — blocks routes not prefixed with the required path.
 *
 * Many deployments require a path prefix (e.g., /api, /v1, /alpha) because
 * of reverse proxy rules, CDN routing, or multi-service architectures.
 * Routes that work locally but miss the prefix will 404 in production.
 *
 * ENFORCEMENT: blocking
 */

// === CONFIGURATION ===
// The prefix all routes must start with. Set to your project's required prefix.
const REQUIRED_PREFIX = '/api';

// Glob-style path substrings that identify route definition files.
const ROUTE_FILE_PATTERNS = [
  '/src/routes/',
  '/src/api/',
  '/src/index.',
];

// Paths that are exempt from the prefix requirement.
const EXCEPTIONS = [
  '/',
  '/health',
  '/healthz',
  '/ready',
  '/internal',
];
// === END CONFIGURATION ===

const fs = require('fs');
const { logEvent } = require('./_log.cjs');

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path || '';
const newContent = input.tool_input?.new_string || input.tool_input?.content || '';

// Only check route-related files
const isRouteFile = ROUTE_FILE_PATTERNS.some(p => filePath.includes(p));
if (!isRouteFile) {
  process.exit(0);
}

const violations = [];

// Match route definitions: app.get('/path', ...), router.post('/path', ...), etc.
const routePattern = /\.(?:get|post|put|patch|delete|route|use|all)\s*\(\s*['"](\/?[^'"*]+)['"]/g;
let match;

while ((match = routePattern.exec(newContent)) !== null) {
  const path = match[1];

  // Allow exceptions
  if (
    EXCEPTIONS.includes(path) ||
    path.startsWith(REQUIRED_PREFIX) ||
    path.startsWith('*') ||
    !path.startsWith('/')  // Relative paths in sub-routers
  ) {
    continue;
  }

  violations.push(
    `Route "${path}" is missing ${REQUIRED_PREFIX} prefix. ` +
    `All routes must be prefixed with ${REQUIRED_PREFIX} (see CLAUDE.md).`
  );
}

if (violations.length > 0) {
  logEvent('required-prefix', 'BLOCK', filePath, violations[0]);
  const result = {
    decision: 'block',
    reason: `Route prefix violation:\n${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}`,
  };
  process.stdout.write(JSON.stringify(result));
}

process.exit(0);
