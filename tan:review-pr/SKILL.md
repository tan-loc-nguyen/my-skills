---
name: tan:review-pr
description: Use when reviewing a pull request for a backend service. Gathers PR context, triages which review dimensions apply, dispatches parallel reviewer agents with contextual code reading, and synthesizes a unified verdict. Triggers on "review PR", "review this PR", "check this PR", or when given a PR URL/number.
argument-hint: [PR URL or number, or omit to review current branch]
disable-model-invocation: true
---

# Review PR

Systematic backend PR review that dispatches parallel reviewer agents per dimension, with triage to skip irrelevant dimensions and synthesis to produce a unified verdict.

## Critical Rules

- **Review the change in context, not the diff in isolation.** Every agent must read surrounding code, trace callers/callees, and check existing tests before assessing.
- **Skip dimensions that don't apply.** Don't waste time reviewing performance on a README change.
- **Shared severity rubric.** All agents use the same definitions so "Critical" means the same thing across dimensions.
- **One unified verdict.** The user gets one report, not 7 independent ones.

## Phase 0: Gather Context

Determine the review target from `$ARGUMENTS`:

**If a PR URL or number is provided:**
```bash
gh pr view <PR#> --json title,body,labels,comments,reviews,files
gh pr diff <PR#>
gh api repos/{owner}/{repo}/pulls/<PR#>/comments
```

**If no argument is provided, review the current branch:**
```bash
# Detect the main/default branch
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')

# Get the diff against the default branch
git diff $DEFAULT_BRANCH...HEAD
git log --oneline $DEFAULT_BRANCH..HEAD

# Check if a PR already exists for this branch
gh pr view --json title,body,labels,comments,reviews,files 2>/dev/null
```
Use the branch diff as the review target. If a PR exists for the branch, pull its description and comments for additional context. If no PR exists, review the raw branch diff.

Then ask the user:

> **Are there any specific docs, architecture patterns, or conventions this PR must strictly follow?**
> (e.g., a mapping architecture doc, an ADR, a CONTEXT.md, a coding standard)
>
> If none, I'll proceed with standard review.

Store the user's answer — pass it to every reviewer agent as mandatory reference.

## Phase 1: Triage

Analyze the diff to determine which dimensions apply. Present the result to the user before dispatching:

```
Dimensions for this PR:
  ✅ Logic & Edge Cases — business logic changes in src/api/v2/controllers/
  ✅ Architecture & Refactoring — file extraction, shared code moved
  ✅ Code Quality — 12 files changed
  ✅ Test Coverage — logic changes but no new tests
  ⬚ Performance & Reliability — no DB queries, loops, caching, or concurrency changes
  ⬚ Observability & Ops — no log/metric/dashboard changes
  ⬚ Integration Contracts — no external API or consumer-facing changes

Proceeding with 4 active dimensions. OK?
```

### Triage Signals

| Signal in the diff | Activate |
|--------------------|----------|
| Controller, service, handler, middleware logic changes | Logic & Edge Cases |
| File moves, extractions, renames, shared code, pattern changes | Architecture & Refactoring |
| Any code change | Code Quality |
| DB queries, loops, caching, concurrency, timeouts, connection mgmt | Performance & Reliability |
| Log statements, metrics, dashboard JSON, monitor configs, domain/action strings | Observability & Ops |
| External API calls, schema changes, tool definitions, consumer-facing contracts, SSE events | Integration Contracts |
| Test file changes, OR logic changes without corresponding test changes | Test Coverage |

If the user specified docs/patterns in Phase 0, **Architecture & Refactoring** is always activated.

## Phase 2: Context Expansion & Dispatch

For each active dimension, dispatch a reviewer agent **in parallel**. Every agent receives:

1. The PR diff and metadata from Phase 0
2. Any user-specified docs/patterns to follow
3. The shared severity rubric (below)
4. The context expansion instructions (below)
5. Its specific dimension checklist

### Context Expansion (ALL agents must do this)

> You are reviewing a PR, not a diff. The diff shows WHAT changed. Your job is to understand WHETHER the change is correct, which requires understanding the surrounding code.
>
> For every changed function or module:
> 1. **Read the full file** — not just the diff hunks. Understand what the change sits inside.
> 2. **Trace callers** — `grep -r "functionName" src/` — understand how the changed code is used in production.
> 3. **Trace callees** — read the functions/services the changed code calls. Understand what it delegates to.
> 4. **Check adjacent code** — if a function was modified, read other functions in the same file/module that share state or are called in sequence.
> 5. **Read related tests** — even if tests weren't changed, check existing tests for the modified code to understand intended behavior and invariants.
> 6. **Check imports/consumers** — if a function signature, return type, or contract changed, find who depends on it.
>
> Only then assess whether the change is correct, safe, and complete.

### Shared Severity Rubric

All agents must use these definitions:

| Severity | Definition | Examples |
|----------|-----------|---------|
| **Critical** | Bug, data loss, security vulnerability, broken functionality, silent behavioral change | Wrong return value, missing auth check, SQL injection, mutation without validation |
| **Important** | Will cause problems but not immediately dangerous | Missing error handling, poor error messages, test gaps on critical paths, unclear naming in public API |
| **Minor** | Improvement opportunity, no user-facing risk | Naming, minor duplication, optimization, style, comment cleanup |

### Applicability Gate (ALL agents)

Before diving into review, each agent must first check:

> Does my dimension genuinely apply to this PR? Scan the changed files and the diff. If there is nothing meaningful to review for my dimension, report:
>
> `**[Dimension]: N/A** — [one-line reason]`
>
> and stop. Do not manufacture findings to justify your existence.

### Dimension Checklists

#### 1. Logic & Edge Cases
- Are all input paths validated? What happens with null, undefined, empty, zero, negative?
- Do happy paths produce correct output? Trace the data through the change.
- Do sad paths fail gracefully with useful error signals?
- Boundary conditions: off-by-one, empty collections, max/min values, concurrent access
- Are there implicit assumptions about data shape that could break with real production data?

#### 2. Architecture & Refactoring
- Does the code follow the project's documented architecture patterns? (Check user-specified docs)
- File structure conventions — are new files in the right place?
- When extracting shared code, are there silent behavioral changes?
- Is old behavior preserved or intentionally improved with justification?
- Are abstraction boundaries clean? Does each module have one clear responsibility?
- Check if READMEs or architecture docs need updating to reflect changes.

#### 3. Code Quality
- Duplication — is code copied that should be shared?
- Null/undefined consistency — mixed patterns in the same flow?
- Naming — do names describe behavior? Are they consistent with the codebase?
- Unused parameters, dead code, leftover debug statements
- Readability — could a new team member understand this without extra context?

#### 4. Performance & Reliability
- Timeouts — are external calls bounded?
- Concurrency safety — shared mutable state, race conditions
- Connection/resource management — are resources cleaned up?
- Memory pressure — large objects in loops, unbounded collections
- N+1 queries, missing indexes, unnecessary data fetching

#### 5. Observability & Ops
- Are log statements added/updated for new code paths?
- Do domain/action strings match project logging conventions?
- Are metrics captured for new operations?
- Dashboard and monitor updates if the change introduces new failure modes
- Would an on-call engineer be able to diagnose a failure in this code from logs alone?

#### 6. Integration Contracts
- Does the schema meet external API requirements?
- Are tool/function descriptions clear enough to prevent misuse?
- Is output size within acceptable bounds for consumers?
- Consumer awareness — does the frontend/caller know about this change?
- Backward compatibility — does this break existing consumers?
- Dependency versions — are new dependencies pinned and justified?

#### 7. Test Coverage
- Are the identified edge cases from the Logic dimension tested?
- Are refactoring regressions covered?
- Do new tests assert behavior, not implementation?
- What gaps remain? List them explicitly.
- If logic changed but no tests changed — flag it.

### Agent Output Format

Each agent must produce:

```markdown
## [Dimension Name]

### Findings

#### Critical
- **[title]** — `file:line`
  What: [what's wrong]
  Why: [why it matters — what breaks in production]
  Context: [what the surrounding code revealed]
  Fix: [how to fix]

#### Important
- ...

#### Minor
- ...

### Strengths
- [What's well done in this dimension]

### N/A Sections
- [Any sub-checks that didn't apply and why]
```

## Phase 3: Synthesize

After all agents report, dispatch a **fresh synthesis agent** with NO prior context. Provide it with all dimension reports.

The synthesis agent must:

1. **Deduplicate** — if two agents flagged the same line/issue, keep the sharper finding and note which dimensions agreed
2. **Resolve conflicts** — if one agent says "add logging" and another says "too verbose," make a judgment call and explain
3. **Rank findings** — sort all findings by severity, then by business impact within severity
4. **Assess completeness** — are there areas of the diff that NO agent reviewed? Flag them.

### Final Report Format

```markdown
## PR Review: [PR title]
PR: [URL]

### Verdict: [Ready to Merge | Merge with Fixes | Needs Rework]

### Critical (must fix before merge)
1. [finding] — `file:line` — found by [dimension]
   [one-line description + fix]

### Important (should fix)
1. ...

### Minor (nice to have)
1. ...

### Skipped Dimensions
- [Dimension]: [why it was skipped]

### Strengths
- [What's well done — be specific, cite files]

### Reviewed Files
[list of all files in the diff and which dimensions reviewed them]
```

## Adapting to PR Size

| PR Size | Behavior |
|---------|----------|
| **Small** (1-3 files, <100 lines) | Skip triage confirmation, dispatch applicable dimensions directly |
| **Medium** (4-15 files, 100-500 lines) | Standard flow with triage confirmation |
| **Large** (>15 files or >500 lines) | Warn the user that review quality degrades with size. Suggest splitting if possible. Proceed if they confirm. |
