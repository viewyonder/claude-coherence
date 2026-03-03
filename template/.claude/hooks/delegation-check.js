#!/usr/bin/env node

/**
 * PreToolUse:Edit+Write hook — warns when API handlers contain too much
 * inline business logic instead of delegating to core/service modules.
 *
 * ENFORCEMENT: warning (non-blocking)
 */

// === CONFIGURATION ===
// Path substrings identifying API handler files.
const HANDLER_PATHS = ['/src/api/', '/src/routes/', '/pages/api/'];

// If a handler function body has more than this many "logic lines"
// (excluding validation, response formatting, imports, comments),
// the hook warns about delegation.
const MAX_LOGIC_LINES = 20;

// Patterns indicating direct database operations in handlers
// (should typically be in repositories/services).
const DB_PATTERNS = [
  /db\.prepare\s*\(/,
  /db\.query\s*\(/,
  /prisma\.\w+\.(find|create|update|delete|upsert)/,
  /pool\.query\s*\(/,
  /knex\(/,
];

// Patterns indicating request body parsing without validation.
const UNVALIDATED_INPUT_PATTERNS = {
  bodyParse: /await\s+(c\.req|req)\.json\s*\(\s*\)/,
  zodImport: /import.*from\s+['"]zod['"]/,
  zodParse: /\.parse\s*\(|\.safeParse\s*\(/,
  manualValidation: /if\s*\(\s*!body\.|if\s*\(\s*typeof\s+body/,
};
// === END CONFIGURATION ===

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

    // Only check handler files
    if (!HANDLER_PATHS.some(p => filePath.includes(p))) {
      process.exit(0);
    }

    // Skip type definitions
    if (filePath.endsWith('.d.ts')) {
      process.exit(0);
    }

    const warnings = [];

    // Check for unvalidated input
    const hasBodyParse = UNVALIDATED_INPUT_PATTERNS.bodyParse.test(newContent);
    const hasValidation =
      UNVALIDATED_INPUT_PATTERNS.zodImport.test(newContent) ||
      UNVALIDATED_INPUT_PATTERNS.zodParse.test(newContent) ||
      UNVALIDATED_INPUT_PATTERNS.manualValidation.test(newContent);

    if (hasBodyParse && !hasValidation) {
      warnings.push({
        rule: 'input-validation',
        message: 'Request body parsed without apparent validation.',
        fix: 'Add schema validation (e.g., Zod) or explicit type checks.',
      });
    }

    // Check for excessive inline logic
    const functionBlocks = newContent.split(/(?:async\s+)?function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
    for (const block of functionBlocks) {
      const logicLines = block.split('\n').filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return false;
        if (trimmed.includes('parse(') || trimmed.includes('safeParse(')) return false;
        if (trimmed.includes('.json(') || trimmed.includes('return ')) return false;
        if (trimmed.includes('const body') || trimmed.includes('let body')) return false;
        if (trimmed.startsWith('import') || trimmed.startsWith('export')) return false;
        if (trimmed === '{' || trimmed === '}' || trimmed === '};') return false;
        return true;
      });

      if (logicLines.length > MAX_LOGIC_LINES) {
        warnings.push({
          rule: 'delegate-to-core',
          message: `Handler has ~${logicLines.length} lines of logic. Consider delegating to a service/core module.`,
          fix: 'Extract business logic to a dedicated module and call it from the handler.',
        });
        break;
      }
    }

    // Check for direct database operations
    for (const pattern of DB_PATTERNS) {
      if (pattern.test(newContent)) {
        warnings.push({
          rule: 'no-direct-db',
          message: 'Direct database operations in API handler.',
          fix: 'Move DB operations to a repository/service module and call it from the handler.',
        });
        break;
      }
    }

    if (warnings.length > 0) {
      logEvent('delegation-check', 'WARN', filePath, warnings.map(w => w.rule).join(', '));
      const result = {
        message: `API delegation warning:\n${warnings.map((w, i) => `${i + 1}. [${w.rule}] ${w.message}\n   Fix: ${w.fix}`).join('\n')}`,
      };
      process.stdout.write(JSON.stringify(result));
    }

    process.exit(0);
  } catch (error) {
    process.exit(0);
  }
});
