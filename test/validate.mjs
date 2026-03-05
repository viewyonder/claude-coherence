#!/usr/bin/env node

// Structural validation test bed for Coherence repository.
// Zero dependencies. TAP output. Run: node test/validate.mjs

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { execSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

// ── TAP harness ──────────────────────────────────────────────────────

let count = 0;
let failures = 0;

function ok(pass, description, diagnostic) {
  count++;
  if (pass) {
    console.log(`ok ${count} - ${description}`);
  } else {
    failures++;
    console.log(`not ok ${count} - ${description}`);
    if (diagnostic) console.log(`  ---\n  ${diagnostic}\n  ...`);
  }
  return pass;
}

function comment(text) {
  console.log(`# ${text}`);
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    fields[key] = val;
  }
  return fields;
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

function listDir(path) {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function syntaxCheck(filePath) {
  try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Paths ────────────────────────────────────────────────────────────

const PLUGIN_SKILLS = join(ROOT, 'plugins/coherence-plugin/skills');
const TEMPLATE_SKILL = join(ROOT, 'template/.claude/skills/coherence/SKILL.md');
const TEMPLATE_HOOKS = join(ROOT, 'template/.claude/hooks');
const TEMPLATE_AGENTS = join(ROOT, 'template/.claude/agents');
const TEMPLATE_CLAUDE_MD = join(ROOT, 'template/CLAUDE.md');
const PLUGIN_JSON = join(ROOT, 'plugins/coherence-plugin/.claude-plugin/plugin.json');
const MARKETPLACE_JSON = join(ROOT, 'marketplace.json');
const EXAMPLES_DIR = join(ROOT, 'examples');

const EXPECTED_SKILLS = [
  'check-drift', 'check-principles', 'config', 'help', 'history',
  'hook', 'init', 'spec', 'status', 'test-runner',
];

// ── 1. Plugin Skill Existence ────────────────────────────────────────

comment('1. Plugin Skill Existence');

for (const skill of EXPECTED_SKILLS) {
  const dir = join(PLUGIN_SKILLS, skill);
  const md = join(dir, 'SKILL.md');
  ok(isDir(dir) && existsSync(md), `plugin skill "${skill}" exists with SKILL.md`);
}

// ── 2. Plugin Skill Front Matter ─────────────────────────────────────

comment('2. Plugin Skill Front Matter');

for (const skill of EXPECTED_SKILLS) {
  const md = join(PLUGIN_SKILLS, skill, 'SKILL.md');
  if (!existsSync(md)) {
    ok(false, `${skill}/SKILL.md front matter — file missing`);
    continue;
  }
  const content = readText(md);
  const fm = parseFrontMatter(content);
  ok(fm !== null, `${skill}/SKILL.md has front matter`);
  if (!fm) continue;
  ok(fm.name !== undefined, `${skill}/SKILL.md has "name" field`);
  ok(fm.description !== undefined, `${skill}/SKILL.md has "description" field`);
  ok(fm.user_invocable !== undefined, `${skill}/SKILL.md has "user_invocable" field`);
  ok(fm.name === skill, `${skill}/SKILL.md name matches directory (got "${fm.name}")`);
}

// ── 3. Template Monolithic Skill ─────────────────────────────────────

comment('3. Template Monolithic Skill');

ok(existsSync(TEMPLATE_SKILL), 'template monolithic SKILL.md exists');
{
  const content = readText(TEMPLATE_SKILL);
  const fm = parseFrontMatter(content);
  ok(fm !== null, 'template SKILL.md has front matter');
  if (fm) {
    ok(fm.name !== undefined, 'template SKILL.md has "name" field');
  }

  // Every plugin skill (except help) should appear as a sub-command heading
  const subcommandRe = /^## Sub-command:\s+(.+)$/gm;
  const subcommands = new Set();
  let m;
  while ((m = subcommandRe.exec(content)) !== null) {
    subcommands.add(m[1].trim());
  }

  for (const skill of EXPECTED_SKILLS) {
    if (skill === 'help') continue; // help is the dispatch table, not a sub-command heading
    ok(subcommands.has(skill), `template has "## Sub-command: ${skill}" heading`);
  }
}

// ── 4. Hook Syntax ───────────────────────────────────────────────────

comment('4. Hook Syntax');

{
  const hookFiles = listDir(TEMPLATE_HOOKS)
    .filter(f => f.endsWith('.cjs') || f.endsWith('.js'));

  ok(hookFiles.length > 0, `template hooks directory has JS files (found ${hookFiles.length})`);

  for (const file of hookFiles) {
    const fullPath = join(TEMPLATE_HOOKS, file);
    ok(syntaxCheck(fullPath), `template hook "${file}" passes syntax check`);
  }

  // Example hooks
  for (const example of listDir(EXAMPLES_DIR)) {
    const hooksDir = join(EXAMPLES_DIR, example, '.claude/hooks');
    if (!isDir(hooksDir)) continue;
    const files = listDir(hooksDir).filter(f => f.endsWith('.cjs') || f.endsWith('.js'));
    for (const file of files) {
      ok(syntaxCheck(join(hooksDir, file)), `example "${example}" hook "${file}" passes syntax check`);
    }
  }
}

// ── 5. Agent Front Matter ────────────────────────────────────────────

comment('5. Agent Front Matter');

{
  const agentFiles = listDir(TEMPLATE_AGENTS)
    .filter(f => f.endsWith('.md') && f !== 'README.md');

  ok(agentFiles.length > 0, `agents directory has MD files (found ${agentFiles.length})`);

  for (const file of agentFiles) {
    const content = readText(join(TEMPLATE_AGENTS, file));
    const fm = parseFrontMatter(content);
    ok(fm !== null, `agent "${file}" has front matter`);
    if (!fm) continue;
    ok(fm.name !== undefined, `agent "${file}" has "name" field`);
    ok(fm.description !== undefined, `agent "${file}" has "description" field`);
    ok(fm.tools !== undefined, `agent "${file}" has "tools" field`);
  }
}

// ── 6. JSON Metadata ─────────────────────────────────────────────────

comment('6. JSON Metadata');

let pluginVersion, marketplaceVersion;

{
  ok(existsSync(PLUGIN_JSON), 'plugin.json exists');
  try {
    const plugin = JSON.parse(readText(PLUGIN_JSON));
    ok(true, 'plugin.json is valid JSON');
    ok(plugin.name !== undefined, 'plugin.json has "name" field');
    ok(plugin.version !== undefined, 'plugin.json has "version" field');
    pluginVersion = plugin.version;
  } catch (e) {
    ok(false, `plugin.json is valid JSON — ${e.message}`);
  }
}

{
  ok(existsSync(MARKETPLACE_JSON), 'marketplace.json exists');
  try {
    const mkt = JSON.parse(readText(MARKETPLACE_JSON));
    ok(true, 'marketplace.json is valid JSON');
    ok(mkt.plugins !== undefined && Array.isArray(mkt.plugins), 'marketplace.json has "plugins" array');
    if (mkt.plugins && mkt.plugins[0]) {
      marketplaceVersion = mkt.plugins[0].version;
      ok(mkt.plugins[0].version !== undefined, 'marketplace.json plugin has "version" field');
    }
  } catch (e) {
    ok(false, `marketplace.json is valid JSON — ${e.message}`);
  }
}

if (pluginVersion && marketplaceVersion) {
  ok(pluginVersion === marketplaceVersion,
    `version consistency: plugin.json (${pluginVersion}) === marketplace.json (${marketplaceVersion})`);
}

// ── 7. Cross-Reference Integrity ─────────────────────────────────────

comment('7. Cross-Reference Integrity');

{
  // Agent names from filesystem
  const agentNames = new Set(
    listDir(TEMPLATE_AGENTS)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .map(f => f.replace('.md', ''))
  );

  // Check skill files that reference agents
  const agentRefPattern = /(?:Use the|use the|Use|use)\s+`([a-z-]+)`\s+agent/g;
  for (const skill of EXPECTED_SKILLS) {
    const md = join(PLUGIN_SKILLS, skill, 'SKILL.md');
    if (!existsSync(md)) continue;
    const content = readText(md);
    let match;
    const re = new RegExp(agentRefPattern.source, 'g');
    while ((match = re.exec(content)) !== null) {
      const agentName = match[1];
      ok(agentNames.has(agentName),
        `skill "${skill}" references agent "${agentName}" which exists`);
    }
  }
}

// ── 8. Example Consistency ───────────────────────────────────────────

comment('8. Example Consistency');

{
  for (const example of listDir(EXAMPLES_DIR)) {
    const claudeMd = join(EXAMPLES_DIR, example, 'CLAUDE.md');
    if (!existsSync(claudeMd)) continue;
    const content = readText(claudeMd);
    const placeholders = content.match(/\{\{[A-Z_]+\}\}/g);
    ok(!placeholders,
      `example "${example}" CLAUDE.md has no {{PLACEHOLDER}} markers` +
      (placeholders ? ` (found: ${[...new Set(placeholders)].join(', ')})` : ''));
  }
}

// ── 9. Template Sanity ───────────────────────────────────────────────

comment('9. Template Sanity');

{
  ok(existsSync(TEMPLATE_CLAUDE_MD), 'template/CLAUDE.md exists');
  const content = readText(TEMPLATE_CLAUDE_MD);
  const placeholders = content.match(/\{\{[A-Z_]+\}\}/g);
  ok(placeholders && placeholders.length > 0,
    `template/CLAUDE.md still contains {{PLACEHOLDER}} markers (found ${placeholders ? placeholders.length : 0})`);
}

// ── Summary ──────────────────────────────────────────────────────────

console.log(`\n1..${count}`);
if (failures > 0) {
  console.log(`# ${failures} of ${count} tests failed`);
  process.exit(1);
} else {
  console.log(`# All ${count} tests passed`);
  process.exit(0);
}
