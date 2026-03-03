#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — warns when database queries lack tenant/user filters.
 *
 * Multi-tenant applications must filter data access by tenant identifier.
 * This hook detects raw database queries that appear to lack such a filter
 * and warns (but does not block, since some queries are legitimately global).
 *
 * ENFORCEMENT: warning (non-blocking)
 */

// === CONFIGURATION ===
// Regex matching your database query call sites.
const DB_CALL_PATTERN = /(?:db|prisma|pool|client|knex)\.(?:query|prepare|execute|findMany|findFirst|select|from)\s*\(/g;

// Strings that indicate a tenant filter is present.
// The hook checks the 200 characters after each DB call for these.
const REQUIRED_FILTERS = [
  'user_id', 'userId', 'tenant_id', 'tenantId',
  'client_id', 'clientId', 'org_id', 'orgId',
  'workspace_id', 'workspaceId',
];

// Only check these paths.
const CHECK_PATHS = ['/src/api/', '/src/core/', '/src/repositories/', '/src/services/'];

// Skip these paths.
const SKIP_PATTERNS = ['.test.', '.spec.', '.d.ts', '__tests__/'];
// === END CONFIGURATION ===

const fs = require('fs');
const { logEvent } = require('./_log.cjs');

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path || '';
const newContent = input.tool_input?.new_string || input.tool_input?.content || '';

// Only check relevant paths
if (!CHECK_PATHS.some(p => filePath.includes(p))) {
  process.exit(0);
}

// Skip test/type files
if (SKIP_PATTERNS.some(p => filePath.includes(p))) {
  process.exit(0);
}

const warnings = [];
let match;

while ((match = DB_CALL_PATTERN.exec(newContent)) !== null) {
  // Check surrounding context for tenant filter
  const contextAfter = newContent.substring(match.index, match.index + 200);
  const hasTenantFilter = REQUIRED_FILTERS.some(f =>
    new RegExp(f, 'i').test(contextAfter)
  );

  if (!hasTenantFilter) {
    warnings.push(
      `Database query at position ${match.index} may lack tenant filter. ` +
      `Ensure query includes one of: ${REQUIRED_FILTERS.slice(0, 4).join(', ')}.`
    );
  }
}

if (warnings.length > 0) {
  logEvent('data-isolation', 'WARN', filePath, `${warnings.length} query(s) may lack tenant filter`);
  // Warn but don't block — some queries are legitimately global (admin, stats)
  const result = {
    message: `Data isolation warning:\n${warnings.join('\n')}`,
  };
  process.stdout.write(JSON.stringify(result));
}

process.exit(0);
