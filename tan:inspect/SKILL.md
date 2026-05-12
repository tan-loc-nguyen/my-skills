---
name: tan:inspect
description: Use when wanting to observe runtime data flow through a system, feature, or area of code for learning, testing, or understanding purposes — not bug fixing. Triggers on "inspect", "inspect mode", "trace the data", "watch the flow", "show me what data flows through", or when the user wants to see actual runtime values moving through code.
argument-hint: [area/flow to inspect]
disable-model-invocation: true
allowed-tools: Bash(node *), Bash(kill *), Bash(lsof *), Bash(nohup *), Bash(curl *), Bash(grep *)
---

# Inspect Mode

You are in **Inspect Mode**. Your job is to instrument a target area of code so the user can observe **actual runtime data** flowing through it. This is not debugging — there's no bug. The goal is understanding, learning, or verifying data flow through real execution.

## Critical Rules

- **This is observation, not fixing.** You are not looking for bugs. You are mapping how data moves.
- **Instrument entry, exit, and transform points.** Capture where data enters, how it changes, and where it leaves.
- **Every log must have a clear purpose.** "What does the data look like at this point in the flow?"
- **Never log secrets.** No tokens, passwords, API keys, or PII.
- **Never ask the user to copy-paste output.** Read `.claude/inspect.log` directly.

## Log Infrastructure

Same mechanism as debug-mode but writes to a separate file. A tiny HTTP server on `127.0.0.1:7777` bridges browser code to `.claude/inspect.log`. Server-side code writes directly.

```
Browser JS  -->  fetch() POST  -->  127.0.0.1:7777  -->  .claude/inspect.log  -->  AI reads
Server JS   -->  fs.appendFileSync  ------------------------------>  .claude/inspect.log  -->  AI reads
```

**If port 7777 is already in use** (e.g., by debug-mode), kill it first — only one session at a time.

## Workflow

### Step 0: Start Log Server

1. `lsof -i :7777` — check if port in use
2. If occupied: `kill $(lsof -t -i :7777)`
3. Delete `.claude/inspect.log` if it exists (clean slate)
4. Start server with the inspect log path:
   ```bash
   INSPECT_LOG_FILE=.claude/inspect.log nohup node $HOME/.claude/skills/tan:inspect/scripts/inspect-server.js > /tmp/inspect-server.log 2>&1 &
   ```
   Do NOT use `run_in_background` — it kills the server when the task ends.
5. Verify:
   ```bash
   sleep 1 && curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:7777 -H 'Content-Type: application/json' -d '{"test":"alive"}'
   ```
   Expected: `200`.

### Step 1: Scope the Area

Read the target from `$ARGUMENTS` or conversation. Understand:
- **What area/flow**: an API endpoint, a service method, a data pipeline, a UI interaction
- **Why they're inspecting**: learning, testing, verifying behavior, watching a specific value

Explore the codebase to map the flow before instrumenting:
- Identify entry points (where data comes in)
- Identify transform points (where data changes shape)
- Identify exit points (where data leaves — DB writes, API responses, UI renders)
- Identify key branching points (where data takes different paths)

Present the flow map to the user:
```
Flow: [Name]
1. Entry:     [where data enters] → shape: [what it looks like]
2. Transform: [where it changes]  → shape: [new shape]
3. Branch:    [where it splits]   → condition: [what determines the path]
4. Exit:      [where it leaves]   → shape: [final shape]

I'll instrument these points. Sound right, or should I adjust?
```

### Step 2: Instrument

Place a `_inspect` helper at the top of each file being instrumented, then add log calls at each flow point.

#### Browser-Side Helper

```typescript
// #region inspect-mode
const _inspect = (loc, point, data, note) => void fetch('http://127.0.0.1:7777',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:loc,point,data,note,timestamp:Date.now()})}).catch(()=>{});
// #endregion
```

#### Server-Side Helper

```typescript
// #region inspect-mode
const _inspect = (loc, point, data, note) => require('fs').appendFileSync('.claude/inspect.log',JSON.stringify({location:loc,point,data,note,timestamp:Date.now()})+'\n');
// #endregion
```

#### Log Calls

```typescript
// #region inspect-mode
_inspect('BookingService.ts:45', 'entry', {params}, 'incoming request payload');
// #endregion
```

#### Log Payload Schema

| Field | Type | Purpose |
|-------|------|---------|
| `location` | string | File path and line: `"BookingService.ts:45"` |
| `point` | string | Flow position: `"entry"`, `"transform"`, `"branch"`, `"exit"` |
| `data` | object | The actual runtime data at this point |
| `note` | string | What this capture represents |
| `timestamp` | number | `Date.now()` for ordering |

#### Placement Strategy

- **Entry points**: function parameters, request bodies, event payloads
- **After transforms**: map/reduce results, parsed data, enriched objects
- **Branch points**: the condition value and which path was taken
- **Before exits**: return values, DB payloads, API responses, rendered props

After instrumenting, tell the user:
```
Instrumentation added at [N] points across the flow.

Trigger the flow by:
1. [Step to trigger]
2. [Step to trigger]

Let me know when done — I'll read the data.
```

### Step 3: Read and Narrate

When the user confirms they've triggered the flow, read `.claude/inspect.log` directly.

Produce a **narrated data flow** — not just raw log output, but a story of how the data moved:

```
## Data Flow: [Name]

### 1. Entry — `BookingService.ts:45`
Data arrives as:
[show the actual captured data]

### 2. Transform — `BookingService.ts:72`
After [what happened], data becomes:
[show the transformed data]
Changed: [highlight what's different from previous point]

### 3. Branch — `BookingService.ts:88`
Condition: [the actual value] → took [which path]

### 4. Exit — `BookingService.ts:105`
Final data:
[show the exit data]

### Summary
[2-3 sentences: data entered as X, was transformed by Y, exited as Z.
Key insight: ...]
```

### Step 4: Discuss

After presenting the narrated flow, engage the user:
- "Any of this surprising?"
- "Want to inspect a different path through this flow?"
- "Want to zoom into any of the transform steps?"

If the user wants to re-inspect with different data or a different code path, go back to Step 2 (adjust instrumentation) or ask them to re-trigger and repeat Step 3.

### Step 5: Clean Up

When the user is satisfied:
1. Remove all `// #region inspect-mode` ... `// #endregion` blocks
2. Delete `.claude/inspect.log`
3. Stop the log server: `kill $(lsof -t -i :7777)`
4. Verify: `grep -r "#region inspect-mode" .`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No logs after trigger | `lsof -i :7777` to check server; `curl -X POST http://127.0.0.1:7777 -H 'Content-Type: application/json' -d '{"test":true}'` to test; add canary log at file top |
| Too many logs | Reduce to key flow points; add condition filter |
| Browser logs missing | Check Network tab for failed requests to `127.0.0.1:7777`; check SSR vs client-side execution |
| Port 7777 conflict | `lsof -i :7777` to identify; kill existing process |
| Data too large to log | Log only the relevant subset: `_inspect('file:42', 'entry', {id: data.id, status: data.status}, 'key fields only')` |
