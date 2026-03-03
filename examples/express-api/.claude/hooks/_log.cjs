#!/usr/bin/env node

/**
 * Shared logging utility for Coherence hooks.
 *
 * Logs BLOCK and WARN events to .claude/coherence.log when logging is enabled.
 * Logging is opt-in: create .claude/coherence-log-enabled to activate.
 *
 * Usage in hooks:
 *   const { logEvent } = require('./_log.cjs');
 *   logEvent('forbidden-imports', 'BLOCK', filePath, 'Node.js fs module not available');
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = __dirname;
const CLAUDE_DIR = path.dirname(HOOKS_DIR);
const SENTINEL = path.join(CLAUDE_DIR, 'coherence-log-enabled');
const LOG_FILE = path.join(CLAUDE_DIR, 'coherence.log');
const MAX_SIZE = 100 * 1024; // 100KB triggers truncation
const KEEP_LINES = 500;

function logEvent(hookName, level, filePath, detail) {
  try {
    if (!fs.existsSync(SENTINEL)) return;

    const now = new Date();
    const ts = now.toISOString().replace('T', ' ').substring(0, 19);
    const src = (hookName || '—').padEnd(25);
    const fp = (filePath || '—').padEnd(25);
    const line = `${ts}  ${level.padEnd(5)}  ${src}  ${fp}  ${detail}\n`;

    fs.appendFileSync(LOG_FILE, line);

    // Rotate if needed
    try {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size > MAX_SIZE) {
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = content.split('\n').filter(Boolean);
        const trimmed = lines.slice(-KEEP_LINES).join('\n') + '\n';
        fs.writeFileSync(LOG_FILE, trimmed);
      }
    } catch (_) { /* rotation failure is non-fatal */ }
  } catch (_) { /* logging never breaks a hook */ }
}

module.exports = { logEvent };
