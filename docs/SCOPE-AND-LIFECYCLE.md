# Scope and Lifecycle

Where things live, when they activate, and what each session can see.

---

## How the layers fit together

```
~/.claude/                          <-- USER scope (all repos, all sessions)
  settings.json                         marketplace source + enabled plugins
  plugins/cache/viewyonder-coherence/   cached plugin code + skills

~/your-project/                     <-- PROJECT scope (this repo only)
  .claude/
    hooks/                              enforcement hooks
    agents/                             review agents
    skills/coherence/                   local skill dispatcher
    settings.local.json                 hook registrations
  CLAUDE.md                             project instructions
  docs/SPEC-*.md                        architectural specs

Claude Code session                 <-- SESSION scope (this terminal)
  loads ~/.claude/settings.json         sees plugin skills
  loads .claude/settings.local.json     sees hooks + local skills
  must restart to pick up changes       to either scope
```

---

## Step by step

### 1. Add the marketplace (user scope)

```
/plugin marketplace add viewyonder/coherence
```

Writes an entry to `~/.claude/settings.json` under `extraKnownMarketplaces`. This tells Claude Code where to find Coherence. Applies to every session and every repo on this machine.

### 2. Install the plugin (user scope)

```
/plugin install coherence
```

Downloads the plugin to `~/.claude/plugins/cache/viewyonder-coherence/` and adds it to `enabledPlugins` in `~/.claude/settings.json`. User scope is the default — the plugin is available in every repo without re-installing.

Installing also enables the plugin. There is no separate enable step.

### 3. Restart Claude Code

Plugin skills won't appear until the session reloads its plugin registry. The safest way is to `/exit` and relaunch Claude Code. You can also try `/reload-plugins` if available in your version, but a full restart is the reliable path.

### 4. Run `/coherence:init` (project scope)

```
/coherence:init
```

This is the only step that writes to the current repo. It creates `.claude/hooks/`, `.claude/agents/`, `.claude/skills/`, `.claude/settings.local.json`, `CLAUDE.md`, and optionally `docs/SPEC-*.md` — all customized to your project's stack.

Nothing touches other repos. Nothing touches `~/.claude/` beyond what the install step already did.

### 5. Other sessions in the same repo

If you open a second terminal in the same repo:

- **Plugin skills** (`/coherence:check-drift`, etc.) work immediately if the plugin is installed and that session has loaded it (i.e., it was started after Step 2-3).
- **Hooks** activate automatically — they're registered in `.claude/settings.local.json`, which every session reads from the repo.
- **If skills are missing**, restart that session. The plugin registry is loaded at session start.

### 6. A different repo

The plugin is installed at user scope, so `/coherence:init`, `/coherence:help`, and other plugin skills are available in any repo. But no hooks, agents, or SPEC docs exist until you run `/coherence:init` in that repo.

### 7. Teammates

Teammates install the plugin independently (Steps 1-3). If your team commits the `.claude/` directory, they get hooks and agents immediately. If `.claude/` is gitignored, each teammate runs `/coherence:init` in their own checkout.

The plugin itself is never shared via git — it's always per-user.

---

## Quick reference

| Action | Scope | What it affects |
|--------|-------|-----------------|
| Add marketplace | User | `~/.claude/settings.json` — all repos |
| Install plugin | User | `~/.claude/plugins/cache/` + `enabledPlugins` — all repos |
| Restart session | Session | Loads updated plugin registry |
| `/coherence:init` | Project | Creates `.claude/`, `CLAUDE.md`, `docs/` — this repo only |
| Edit a hook | Project | `.claude/hooks/` — this repo only |
| Edit SPEC docs | Project | `docs/SPEC-*.md` — this repo only |

---

## Common confusion points

**"I installed the plugin but skills don't show up."**
Restart Claude Code. The plugin registry is loaded once at session start.

**"My other terminal doesn't have the plugin skills."**
That session was started before the plugin was installed. Restart it.

**"I ran init in one repo but my other project doesn't have hooks."**
`/coherence:init` is project-scoped. Run it in each repo that needs Coherence.

**"Should I install as user scope or project scope?"**
User scope (the default). This makes plugin skills available everywhere. The project-specific files are created by `/coherence:init`, not by the plugin install.

**"Will this affect my teammate's setup?"**
No. The plugin install is per-user (`~/.claude/`). Project files in `.claude/` can be committed to git if your team wants shared hooks, but each person installs the plugin independently.

**"I updated the plugin but don't see new skills."**
Restart Claude Code to reload the plugin cache.
