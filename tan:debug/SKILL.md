---
name: tan:debug
description: Use when debugging a bug or investigating unexpected behavior in frontend or backend code, before attempting any fix. Triggers on "debug", "debug mode", "help me debug", "find this bug", or when the user reports a bug requiring runtime investigation.
argument-hint: [bug description]
disable-model-invocation: true
allowed-tools: Bash(node *), Bash(kill *), Bash(lsof *), Bash(nohup *), Bash(curl *), Bash(grep *)
---

# Debug Mode

You are in **Debug Mode**. Follow a strict hypothesis-driven workflow requiring **runtime evidence** before any fix.

## Critical Rules

- **NEVER fix without log evidence.** Collect runtime data first, no matter how obvious the fix seems.
- **Every log maps to a hypothesis.** No exploratory logging without purpose.
- **3-8 log statements per round.** Minimal, targeted instrumentation.
- **Never log secrets.** No tokens, passwords, API keys, or PII.
- **Logs stay until fix is verified.** Do not remove instrumentation early.
- **Never ask the user to copy-paste output.** Read `.claude/debug.log` directly.

## Log Infrastructure

A tiny HTTP server on `127.0.0.1:7777` bridges browser code to a log file. Server-side code writes directly. You read the file — the user never touches it.

```
Browser JS  -->  fetch() POST  -->  127.0.0.1:7777  -->  .claude/debug.log  -->  AI reads
Server JS   -->  fs.appendFileSync  --------------------------->  .claude/debug.log  -->  AI reads
```

Log format is NDJSON (one JSON object per line) for compact, unambiguous AI consumption.

## Workflow

Follow these steps in strict order. Do not skip steps.

### Step 0: Start Log Server

1. `lsof -i :7777` — check if port in use
2. If occupied: `kill $(lsof -t -i :7777)`
3. Delete `.claude/debug.log` if it exists (clean slate)
4. Start server:
   ```bash
   nohup node $HOME/.claude/skills/tan:debug/scripts/debug-server.js > /tmp/debug-server.log 2>&1 &
   ```
   IMPORTANT: Do NOT use `run_in_background` — it kills the server when the task ends. Use `nohup ... &` in a regular Bash call.
5. Verify:
   ```bash
   sleep 1 && curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:7777 -H 'Content-Type: application/json' -d '{"test":"alive"}'
   ```
   Expected: `200`. A `404` on GET is fine (server only handles POST).

Keep the server running for the entire debug session. You stop it in Step 7.

### Step 1: Understand the Bug

Read bug description from `$ARGUMENTS` or conversation. If unclear, ask:
- Expected vs actual behavior?
- Reproduction steps?
- When did it start?

### Step 2: Generate Hypotheses

**3-5 precise, testable hypotheses** about the root cause. Each must be specific, falsifiable, and cover a different angle:

```
Hypothesis A: [Specific, falsifiable statement]
Hypothesis B: [Different root cause]
Hypothesis C: [Edge case / timing / data flow angle]
```

### Step 3: Instrument Code

Place a `_dbg` helper at the top of each file being debugged (inside region markers), then add 3-8 targeted log calls.

#### Browser-Side Helper (React, client hooks, browser code)

```typescript
// #region debug-mode
const _dbg = (loc, msg, data, hyp, run = 'initial') => void fetch('http://127.0.0.1:7777',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:loc,message:msg,data,timestamp:Date.now(),runId:run,hypothesisId:hyp})}).catch(()=>{});
// #endregion
```

#### Server-Side Helper (Node.js, API routes, SSR)

```typescript
// #region debug-mode
const _dbg = (loc, msg, data, hyp, run = 'initial') => require('fs').appendFileSync('.claude/debug.log',JSON.stringify({location:loc,message:msg,data,timestamp:Date.now(),runId:run,hypothesisId:hyp})+'\n');
// #endregion
```

#### Log Calls

Each call is a single line wrapped in region markers:

```typescript
// #region debug-mode
_dbg('file.tsx:42', 'What we are checking', {relevantVar1, relevantVar2}, 'A');
// #endregion
```

#### Log Payload Schema

| Field | Type | Purpose |
|-------|------|---------|
| `location` | string | File path and line: `"CartButton.tsx:45"` |
| `message` | string | Human-readable description of what's logged |
| `data` | object | Runtime values — variables, state, return values |
| `timestamp` | number | `Date.now()` for ordering |
| `runId` | string | `"initial"` for first run, `"post-fix"` after fix |
| `hypothesisId` | string | Links to hypothesis: `"A"`, `"B"`, `"C"` |

#### Placement Strategy

- **Function entry/exit**: log parameters and return values
- **Before/after mutations**: state snapshots
- **Branch paths**: which if/else/switch branch executed
- **Suspected failure points**: values at the suspect line

#### Rules

- Each log: single continuous line, wrapped in `// #region debug-mode` / `// #endregion`
- Browser fetch: `void` prefix, `.catch(()=>{})` suffix (avoids floating-promise lint errors)
- First run: `runId` must be `"initial"`

After instrumenting, tell the user:
```
Instrumentation added. Please reproduce the bug now.

Reproduction steps:
1. [Step 1]
2. [Step 2]
3. [Step 3 — where the bug should appear]

Let me know when done — I'll read the logs.
```

### Step 4: Analyze Logs

When user confirms reproduction, read `.claude/debug.log` directly. Do NOT ask the user to paste anything.

Evaluate each hypothesis against log data:

```
Hypothesis A: [CONFIRMED / REJECTED / INCONCLUSIVE]
  Evidence: [Quote specific log entries and data values]

Hypothesis B: [CONFIRMED / REJECTED / INCONCLUSIVE]
  Evidence: [Quote specific log entries and data values]
```

- **CONFIRMED** → proceed to Step 5
- **REJECTED** → ruled out
- **INCONCLUSIVE** → need more instrumentation, back to Step 3 with refined hypotheses

All rejected/inconclusive → generate new hypotheses from what logs revealed, back to Step 2.

### Step 5: Fix with Confidence

Only apply a fix when you have a confirmed hypothesis backed by log proof:

```
Root Cause: [What the logs proved is wrong]
Evidence: [Cite specific log entries from .claude/debug.log]
Fix: [Description of the change]
```

Apply the fix. **Do NOT remove instrumentation yet.** Update all `runId` values from `"initial"` to `"post-fix"`.

### Step 6: Verify the Fix

1. Delete `.claude/debug.log` for a clean slate
2. Ask user to reproduce the original scenario again
3. Read `.claude/debug.log` and compare before/after:

```
Before fix (initial run): [cite entry showing the problem]
After fix (post-fix run): [cite entry showing correct behavior]
Verdict: [FIXED / NOT FIXED]
```

NOT FIXED → return to Step 2 with new hypotheses informed by post-fix data.

### Step 7: Clean Up

Only after the fix is verified:

1. Remove all `// #region debug-mode` ... `// #endregion` blocks from the codebase
2. Delete `.claude/debug.log`
3. Stop the log server: `kill $(lsof -t -i :7777)`
4. Verify no instrumentation remains: `grep -r "#region debug-mode" .`

Present a summary:
```
Bug: [One-line description]
Root Cause: [What was actually wrong]
Fix: [What was changed]
Evidence: [Key log entries that proved the root cause]
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No logs after reproduce | `lsof -i :7777` to check server; `curl -X POST http://127.0.0.1:7777 -H 'Content-Type: application/json' -d '{"test":true}'` to test; add canary log at file top |
| Too many logs | Reduce to 3-4 most targeted; add condition filter; focus on likeliest hypothesis |
| Browser logs missing | Check Network tab for failed requests to `127.0.0.1:7777`; check SSR vs client-side execution mismatch |
| Port 7777 conflict | `lsof -i :7777` to identify; kill previous debug server or change port in script |
| User wants to skip steps | Guessing leads to wrong fixes and wasted time; evidence-first avoids back-and-forth on incorrect fixes |
| Multiple bugs found | Fix reported bug first; note others separately; address after primary fix verified |
