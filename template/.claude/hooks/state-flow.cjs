#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — enforces unidirectional state flow.
 *
 * Validates that frontend code follows the propagation principle:
 * State -> Store -> View (unidirectional). No reverse flows.
 *
 * ENFORCEMENT: blocking for violations, warning for suggestions
 */

// === CONFIGURATION ===
// Path substrings that identify store files.
const STORE_PATHS = ['/stores/', '/state/'];

// Path substrings that identify UI/view files.
const UI_PATHS = ['/pages/', '/components/', '/views/', '/ui/'];

// Patterns that indicate direct store mutation from UI code (bad).
// storeName.property = value (not using a setter)
const MUTATION_PATTERNS = [
  {
    // Direct property assignment on a store object
    pattern: /(\w+(?:Store|State))\.((?!subscribe|get|set|notify|unsubscribe|dispatch|on|off)\w+)\s*=\s*[^=]/g,
    message: (match) => `Direct store mutation: ${match[1]}.${match[2]} = ... Use a store setter instead.`,
    inStoreFile: false, // Only flag in UI files, not in store definitions
  },
];

// Patterns that suggest reverse flow (view -> config).
const REVERSE_FLOW_PATTERNS = [
  /config\s*=\s*/,
  /currentConfig\s*=\s*/,
  /\.config\s*=\s*/,
];

// File extensions to check.
const CHECK_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];
// === END CONFIGURATION ===

const fs = require('fs');
const { logEvent } = require('./_log.cjs');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });

process.stdin.on('end', () => {
  try {
    const context = JSON.parse(input);
    const ti = context.tool_input || context;
    const filePath = ti.file_path || ti.filePath || '';
    const newContent = ti.new_string || ti.content || ti.new_content || '';

    // Only check frontend files
    const isUIFile = UI_PATHS.some(p => filePath.includes(p));
    const isStoreFile = STORE_PATHS.some(p => filePath.includes(p));
    if (!isUIFile && !isStoreFile) process.exit(0);

    // Only check relevant extensions
    if (!CHECK_EXTENSIONS.some(ext => filePath.endsWith(ext))) process.exit(0);

    const violations = [];
    const warnings = [];

    // Check for direct mutation in UI files
    for (const { pattern, message, inStoreFile } of MUTATION_PATTERNS) {
      if (isStoreFile && !inStoreFile) continue;
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(newContent)) !== null) {
        violations.push(message(match));
      }
    }

    // In store files, check that setters call notify/dispatch
    if (isStoreFile) {
      const setterPattern = /export\s+function\s+set\w+\s*\([^)]*\)\s*\{([^}]+)\}/g;
      let match;
      while ((match = setterPattern.exec(newContent)) !== null) {
        const body = match[1];
        if (!body.includes('notify(') && !body.includes('dispatch(') && !body.includes('emit(')) {
          warnings.push('Store setter may be missing notify/dispatch call after mutation.');
        }
      }

      // Check for exported mutable state
      const exportedLetPattern = /export\s+let\s+(\w+)/g;
      while ((match = exportedLetPattern.exec(newContent)) !== null) {
        violations.push(
          `Exported mutable variable: ${match[1]}. Store state should be private. Export only getters/setters.`
        );
      }
    }

    // Check for reverse flow in UI files
    if (isUIFile && !isStoreFile) {
      for (const pattern of REVERSE_FLOW_PATTERNS) {
        if (pattern.test(newContent)) {
          warnings.push(
            'Potential reverse flow: config/state being set directly from UI code. ' +
            'UI should call store setter -> store calls API -> API response updates store.'
          );
          break;
        }
      }
    }

    if (violations.length > 0) {
      logEvent('state-flow', 'BLOCK', filePath, violations[0]);
      const result = {
        decision: 'block',
        reason: `State flow violation:\n${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\nPrinciple: State flows one direction: Store -> View. (CLAUDE.md)`,
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }

    if (warnings.length > 0) {
      logEvent('state-flow', 'WARN', filePath, warnings[0]);
      const result = {
        message: `State flow warning:\n${warnings.join('\n')}`,
      };
      process.stdout.write(JSON.stringify(result));
    }

    process.exit(0);
  } catch (error) {
    // Don't block on hook errors
    process.exit(0);
  }
});
