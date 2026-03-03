#!/usr/bin/env node

/**
 * PreToolUse:Bash hook — blocks git commit when new/modified source files
 * are missing corresponding test files.
 *
 * Fires on: Bash tool calls that contain "git commit"
 * Checks: staged files (git diff --cached --name-only)
 *
 * ENFORCEMENT: blocking
 */

// === CONFIGURATION ===
// Source directories that require tests.
const SOURCE_DIRS = ['src/core/', 'src/api/', 'src/middleware/', 'src/services/', 'src/lib/'];

// Patterns in file paths to skip (tests, types, generated, barrel exports).
const SKIP_PATTERNS = [
  '.test.', '.spec.', '__tests__/',
  'types.ts', 'types/', 'enums.ts', 'schemas.ts',
  '/generated/', 'index.ts',
];

// Mappings: source directory -> possible test directories.
const TEST_LOCATIONS = {
  'src/api/':        ['tests/api/', 'src/api/__tests__/'],
  'src/core/':       ['tests/core/', 'src/core/__tests__/'],
  'src/services/':   ['tests/services/', 'src/services/__tests__/'],
  'src/lib/':        ['tests/lib/', 'src/lib/__tests__/'],
  'src/middleware/':  ['tests/middleware/', 'src/middleware/__tests__/'],
};

// Source file extension.
const SOURCE_EXT = '.ts';
// === END CONFIGURATION ===

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { logEvent } = require('./_log.cjs');

const input = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
const command = input.tool_input?.command || '';

// Only fire on git commit commands
if (!command.includes('git commit')) process.exit(0);

// Don't block --amend
if (command.includes('--amend')) process.exit(0);

// Find project root
function findProjectRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch { return null; }
}

const projectRoot = findProjectRoot();
if (!projectRoot) process.exit(0);

// Get staged files
let stagedFiles;
try {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8', cwd: projectRoot,
  });
  stagedFiles = output.trim().split('\n').filter(Boolean);
} catch { process.exit(0); }

// Filter to source files that need tests
const sourceFiles = stagedFiles.filter(file => {
  if (!file.endsWith(SOURCE_EXT)) return false;
  if (!SOURCE_DIRS.some(dir => file.startsWith(dir))) return false;
  if (SKIP_PATTERNS.some(pat => file.includes(pat))) return false;
  return true;
});

if (sourceFiles.length === 0) process.exit(0);

// Check for test files
function hasTest(sourceFile) {
  const fileName = path.basename(sourceFile, SOURCE_EXT);

  for (const [srcPattern, testDirs] of Object.entries(TEST_LOCATIONS)) {
    if (sourceFile.includes(srcPattern)) {
      for (const testDir of testDirs) {
        const candidates = [
          path.join(projectRoot, testDir, `${fileName}.test${SOURCE_EXT}`),
          path.join(projectRoot, testDir, `${fileName}.spec${SOURCE_EXT}`),
        ];
        for (const testPath of candidates) {
          if (fs.existsSync(testPath)) return true;
        }
      }
    }
  }

  // Also check if test is being staged alongside the source
  const testVariants = [
    sourceFile.replace(SOURCE_EXT, `.test${SOURCE_EXT}`),
    sourceFile.replace(/^src\//, 'tests/').replace(SOURCE_EXT, `.test${SOURCE_EXT}`),
  ];
  for (const variant of testVariants) {
    if (stagedFiles.includes(variant)) return true;
  }

  // Check __tests__ sibling directory
  const dir = path.dirname(sourceFile);
  const siblingTest = path.join(dir, '__tests__', `${fileName}.test${SOURCE_EXT}`);
  if (stagedFiles.includes(siblingTest) || fs.existsSync(path.join(projectRoot, siblingTest))) {
    return true;
  }

  return false;
}

const missing = sourceFiles.filter(f => !hasTest(f));

if (missing.length > 0) {
  logEvent('test-gate', 'BLOCK', missing[0], `Missing tests for ${missing.length} file(s)`);
  const result = {
    error: `Test gate: commit blocked.\n\n` +
      `Missing tests for:\n${missing.map(f => `  - ${f}`).join('\n')}\n\n` +
      `Add test files for these source files, then retry the commit.\n` +
      `"No feature ships without a test proving it works"`,
  };
  process.stdout.write(JSON.stringify(result));
}

process.exit(0);
