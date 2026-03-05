---
title: "Learning the Happy Path"
subtitle: "Building an OpenClaw plugin with Coherence — how we taught Claude the rules before writing a single line of code"
date: 2026-03-05
author: "Injectionator"
draft: false
---

> **TL;DR** — We're integrating [OpenClaw](https://openclaw.ai) with [Injectionator](https://injectionator.com) to protect users from prompt injection. OpenClaw is someone else's repo with strict conventions and architectural boundaries. We want to respect their guidelines, and [Coherence](https://coherence.viewyonder.com) helps us do that — generating hooks, agents, and SPEC documents that enforce the project's rules as Claude writes code.

## Contributing to Someone Else's Codebase

We're building an integration plugin between [OpenClaw](https://openclaw.ai) and [Injectionator](https://injectionator.com) to help users protect themselves from prompt injections.

But before we wrote a single line of plugin code, we spent a session teaching Claude how the OpenClaw project works — using Coherence to generate architectural guardrails, specification documents, and enforcement hooks that keep Claude operating within the project's boundaries.

### What's in this post?

- [The Setup Session](#the-setup-session) — running `/coherence:init` in the OpenClaw repo
- [The Blocking Hook](#the-blocking-hook) — catching boundary violations at write time
- [The Informational Hooks](#the-informational-hooks) — contextual nudges after edits
- [How It's Wired](#how-its-wired) — `settings.local.json` registration
- [SPEC Documents](#spec-documents-the-drift-detection-contract) — drift detection contracts
- [Why This Matters for the Injectionator](#why-this-matters-for-the-injectionator) — the six hook points
- [What We Learned](#what-we-learned) — verified SDK surface, active enforcement, shared vocabulary

OpenClaw is a multi-channel AI gateway with 33 extension plugins, a plugin SDK with sub-path exports, a hook pipeline, and strict conventions documented in a 300+ line `CLAUDE.md`. The `extensions/` directory alone contains plugins for Discord, Telegram, Slack, Matrix, IRC, WhatsApp, Signal, iMessage, MS Teams, and many more.

When you point Claude at a repo this size and say "build a plugin," the risk isn't that Claude can't write TypeScript. The risk is that Claude writes TypeScript that violates the project's boundaries — importing from `../../src/agents/` instead of `openclaw/plugin-sdk`, putting `workspace:*` in `dependencies` instead of `peerDependencies`, or touching core routing code when the plugin should be self-contained.

The existing `CLAUDE.md` already documents these rules in prose. But prose is advisory. We wanted something that actively enforces the rules as Claude writes code.

## The Setup Session

We ran `/coherence:init` in the OpenClaw repo. Here's what the wizard detected and what we told it:

- **Project type**: CLI tool + gateway (detected: TypeScript ESM monorepo, pnpm + Bun, Vitest, Node 22+)
- **Primary boundary**: Plugin/extension isolation
- **Test enforcement**: Suggested but not required (PostToolUse hints, not blocking)
- **SPEC documents**: Yes — generate templates for drift detection

The wizard generated 10 files. Here's what each one does and why it matters for the Injectionator plugin.

## The Blocking Hook

This is the critical one. A `PreToolUse` hook that fires every time Claude tries to `Edit` or `Write` a file inside `extensions/`. It reads the tool input from stdin and checks for boundary violations:

```javascript
// .claude/hooks/plugin-boundary.cjs
const EXTENSION_PATH_PREFIX = "extensions/";
const FORBIDDEN_IN_EXTENSIONS = [
  {
    pattern: /from\s+["'](?:\.\.\/)+src\//g,
    message: "Extension must not import from core src/ -- use openclaw/plugin-sdk instead"
  },
  {
    pattern: /require\(["'](?:\.\.\/)+src\//g,
    message: "Extension must not require() from core src/ -- use openclaw/plugin-sdk instead"
  },
  {
    pattern: /"workspace:\*"/g,
    message: "Do not use workspace:* in extension dependencies"
  },
  {
    pattern: /"workspace:[^"]*"/g,
    message: "Do not use workspace: protocol in extension dependencies"
  },
];

function main() {
  const input = JSON.parse(require("fs").readFileSync("/dev/stdin", "utf8"));
  const toolName = input.tool_name;

  if (toolName !== "Edit" && toolName !== "Write") {
    console.log(JSON.stringify({ decision: "approve" }));
    return;
  }

  const filePath = input.tool_input?.file_path || "";
  const content = input.tool_input?.content || input.tool_input?.new_string || "";

  if (!filePath.includes(EXTENSION_PATH_PREFIX)) {
    console.log(JSON.stringify({ decision: "approve" }));
    return;
  }

  const violations = [];
  for (const rule of FORBIDDEN_IN_EXTENSIONS) {
    const matches = content.match(rule.pattern);
    if (matches) {
      violations.push(`${rule.message} (found: ${matches[0]})`);
    }
  }

  if (violations.length > 0) {
    console.log(JSON.stringify({
      decision: "block",
      reason: `Plugin boundary violation in ${filePath}:\n` +
        violations.map(v => `  - ${v}`).join("\n"),
    }));
  } else {
    console.log(JSON.stringify({ decision: "approve" }));
  }
}

main();
```

If Claude tries to write something like this in our Injectionator extension:

```typescript
// extensions/n8r/src/detector.ts
import { runVoidHook } from "../../../src/agents/pi-embedded-runner/run/attempt.ts";
//                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                        BLOCKED: Extension must not import from core src/
```

The hook returns `{ decision: "block" }` and Claude sees the violation message. It self-corrects and imports from the plugin SDK instead:

```typescript
// extensions/n8r/src/detector.ts
import type { InboundEnvelope, ReplyPayload } from "openclaw/plugin-sdk";
//            Correct: imports from the public SDK surface
```

## The Informational Hooks

Two `PostToolUse` hooks fire after every edit, providing context rather than blocking:

**test-suggest.cjs** nudges Claude to run tests when source files change:

```javascript
// Fires after editing a .ts file that isn't already a test file
console.log(JSON.stringify({
  decision: "approve",
  reason: `Source file changed: ${filePath}\n` +
    `Consider running: pnpm test\n` +
    `Colocated test: ${baseName}.test${ext}`,
}));
```

**change-suggest.cjs** flags when high-impact paths are touched, reminding Claude to update the corresponding SPEC:

```javascript
const WATCH_RULES = [
  {
    pattern: "src/plugin-sdk/",
    message: "Plugin SDK changed -- this is the public API surface for all extensions. "
      + "Ensure backward compatibility and update SPEC-PLUGIN-SDK.md if the export surface changed.",
  },
  {
    pattern: "src/routing/",
    message: "Message routing changed -- this affects all channels. "
      + "Test with multiple channel types.",
  },
  {
    pattern: "src/acp/",
    message: "ACP (Agent Control Plane) changed -- test agent spawn/session lifecycle.",
  },
];
```

## How It's Wired

All hooks are registered in `.claude/settings.local.json` and fire automatically — Claude doesn't need to "remember" to check boundaries:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [{
          "type": "command",
          "command": "node .claude/hooks/plugin-boundary.cjs",
          "statusMessage": "Checking plugin boundary isolation..."
        }]
      },
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "node .claude/hooks/plugin-boundary.cjs",
          "statusMessage": "Checking plugin boundary isolation..."
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/test-suggest.cjs" },
          { "type": "command", "command": "node .claude/hooks/change-suggest.cjs" }
        ]
      }
    ]
  }
}
```

`PreToolUse` hooks fire *before* the edit is applied. If `plugin-boundary.cjs` returns `block`, the edit never happens. `PostToolUse` hooks fire *after* the edit succeeds and surface contextual reminders.

## SPEC Documents: The Drift Detection Contract

Coherence generated three SPEC documents that serve as machine-readable reference points for the codebase.

**`docs/SPEC-PLUGIN-SDK.md`** documents the exact sub-path exports that plugins are allowed to use:

```markdown
## Package Exports

| Export Path                | Entry Point                | Description                              |
|----------------------------|----------------------------|------------------------------------------|
| `openclaw/plugin-sdk`      | `dist/plugin-sdk/index.js` | Main plugin SDK — types, helpers, lifecycle |
| `openclaw/plugin-sdk/core` | `dist/plugin-sdk/core.js`  | Core primitives (minimal surface)        |
| `openclaw/plugin-sdk/compat` | `dist/plugin-sdk/compat.js` | Backward-compatible shims              |

## Plugin Contract

Extensions must:
1. Import only from `openclaw/plugin-sdk` (or sub-paths above)
2. Never import from `../../src/` or other core internals
3. Use `peerDependencies` or `devDependencies` for `openclaw` — never `dependencies` with `workspace:*`
4. Export a default function or object matching `ChannelLifecycle`
```

These aren't just documentation. The drift detector agent reads these SPECs and compares them against the actual source code, classifying every item as `CURRENT`, `DRIFTED`, `UNDOCUMENTED`, or `REMOVED`:

```markdown
# Drift Report — plugin-sdk

## Summary
- Checked: 23 items | Current: 19 | Drifted: 1 | Undocumented: 3 | Removed: 0

## DRIFTED
| Item      | SPEC Says     | Code Says       | File                         |
|-----------|---------------|-----------------|------------------------------|
| FetchAuth | fetch-auth.ts | fetch-auth.ts (+ new) | src/plugin-sdk/fetch-auth.ts |

## UNDOCUMENTED
| Item              | Location                      | Suggested SPEC Entry      |
|-------------------|-------------------------------|---------------------------|
| SsrfPolicy        | src/plugin-sdk/ssrf-policy.ts | SSRF validation helpers   |
| OAuthUtils        | src/plugin-sdk/oauth-utils.ts | OAuth flow utilities      |
| OnboardingHelpers | src/plugin-sdk/onboarding.ts  | Onboarding flow helpers   |
```

Running `/coherence:check-drift plugin-sdk` before starting plugin development gives us a verified snapshot of what the SDK actually exports today — not what the docs say it exports.

## Why This Matters for the Injectionator

The [Injectionator proposal](https://github.com/viewyonder/injectionator) hooks into OpenClaw's agent pipeline at six points:

| Hook                  | Type                    | Can block? | Plugin behavior                                        |
|-----------------------|-------------------------|------------|--------------------------------------------------------|
| `message_received`    | Parallel (void)         | No         | Scan inbound text, store detection result, log + alert |
| `before_prompt_build` | Sequential (modifying)  | Yes        | If injection detected: prepend security context        |
| `llm_input`           | Parallel (void)         | No         | Telemetry: log full prompt with injection score        |
| `llm_output`          | Parallel (void)         | No         | Telemetry: log response with injection score           |
| `message_sending`     | Sequential (modifying)  | Yes        | Primary output gate: cancel delivery if detected       |
| `before_tool_call`    | Sequential (modifying)  | Yes        | Block tool calls when injection suspected              |

The plugin needs to import types like `InboundEnvelope` and use SDK helpers like `FetchAuth` (for calling the n8r service with SSRF protection). Without the Coherence setup, Claude might:

- Import `runVoidHook` directly from `src/agents/pi-embedded-runner/` to understand how void hooks work (reaching into core internals)
- Add `"openclaw": "workspace:*"` to `extensions/n8r/package.json` dependencies (breaks `npm install` for end users)
- Modify `src/plugin-sdk/index.ts` to add new exports for injection detection (changing the SDK surface without updating the SPEC)

With the Coherence hooks active, all three of these are caught at write time.

## The Plugin Structure

Based on the SPEC-PLUGIN-SDK contract, existing extension patterns, and the proposal document, the Injectionator plugin follows OpenClaw conventions:

```
extensions/n8r/
  package.json          # @openclaw/n8r, runtime deps only, no workspace:*
  index.ts              # Extension entry point
  src/
    detector.ts         # Injection detection (library or service mode)
    hooks.ts            # Hook implementations
    config.ts           # Config schema + validation
    config.test.ts      # Config tests
    hooks.test.ts       # Hook behavior tests
```

Note the `package.json` pattern: `openclaw` goes in `devDependencies` with `workspace:*` (fine for local dev), not in `dependencies` (which would break `npm install` for users). The Coherence boundary hook enforces exactly this distinction.

## What We Learned

Running Coherence before writing plugin code gave us three things:

**A verified understanding of the SDK surface.** The SPEC-PLUGIN-SDK document, cross-referenced against actual exports, told us exactly which types and helpers are available. The drift detector surfaced three undocumented exports — `SsrfPolicy` is directly relevant to the Injectionator since the proposal requires SSRF-safe fetch for the n8r service endpoint.

**Active enforcement of project conventions.** The `CLAUDE.md` says "keep plugin-only deps in the extension `package.json`; do not add them to the root `package.json`." The hook makes this a hard gate rather than a suggestion. When Claude tries to write a relative import into `src/`, the edit is blocked before it lands.

**A shared vocabulary with the maintainers.** The SPEC documents and the proposal use the same terminology: hook contracts, detection legs, coordination between observe and block hooks. When we open the GitHub Discussion proposing this plugin, the SPEC documents give maintainers a concrete reference point for what we understood about their architecture.

## Next Steps

The Injectionator plugin is still in the proposal stage. Per OpenClaw's contribution guidelines, we'll:

1. Open a GitHub Discussion linking the proposal spec
2. Gather feedback on the hook selection and config surface
3. Build the plugin with the Coherence guardrails active
4. Run `/coherence:check-drift` before submitting to verify we haven't drifted from the SDK contract
5. Disclose the AI-assisted development in the PR (per `CONTRIBUTING.md`)

The Coherence setup took one session. The hooks, agents, and SPECs it generated will run for every subsequent Claude session in this repo — not just for the Injectionator plugin, but for any future contribution.

---

- [Coherence](https://coherence.viewyonder.com) — Claude Code plugin for encoding architectural constraints
- [Injectionator](https://injectionator.com) — prompt injection detection toolkit
- [OpenClaw](https://openclaw.ai) — multi-channel AI gateway
