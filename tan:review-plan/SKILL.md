---
name: tan:review-plan
description: Use when asked to review a plan, implementation, or change — guides interactive code review across architecture, code quality, tests, and performance sections
---

# Plan Review

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give an opinionated recommendation, and ask for input before assuming a direction.

## Engineering Preferences (use to guide recommendations)

- **Architecture docs are the source of truth** — before reviewing, scan for existing architecture docs, ADRs, CONTEXT.md, or extract architectural patterns from the codebase itself. Flag violations against them aggressively.
- **Well-tested code is non-negotiable**; err on the side of too many tests, not too few.
- Code should be "engineered enough" — not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
- Err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
- Bias toward explicit over clever.

---

## BEFORE YOU START

Ask if the user wants one of two options using `AskUserQuestion`:

### 1/ BIG CHANGE
Work through interactively, one section at a time
(Architecture → Code Quality → Tests → Performance)
with at most **4 top issues** in each section.

### 2/ SMALL CHANGE
Work through interactively **ONE question per review section**.

---

## Review Sections

### 1. Architecture Review

**Evaluate:**
- Overall system design and component boundaries.
- Dependency graph and coupling concerns.
- Data flow patterns and potential bottlenecks.
- Scaling characteristics and single points of failure.
- Security architecture (auth, data access, API boundaries).

### 2. Code Quality Review

**Evaluate:**
- Code organization and module structure.
- DRY violations.
- Error handling patterns and missing edge cases (call these out explicitly).
- Technical debt hotspots.
- Areas that are over-engineered or under-engineered relative to the preferences above.

### 3. Test Review

**Evaluate:**
- Test coverage gaps (unit, integration, e2e).
- Test quality and assertion strength.
- Missing edge case coverage — be thorough.
- Untested failure modes and error paths.

### 4. Performance Review

**Evaluate:**
- N+1 queries and database access patterns.
- Memory-usage concerns.
- Caching opportunities.
- Slow or high-complexity code paths.

---

## For Each Issue Found

For every specific issue (bug, smell, design concern, or risk):

- Describe the problem concretely, with **file and line references**.
- Present 2-3 options, including "do nothing" where that's reasonable.
- For each option, specify:
  - Implementation effort
  - Risk
  - Impact on other code
  - Maintenance burden
- Give your recommended option and why, mapped to the engineering preferences above.
- Then explicitly ask whether you agree or want to choose a different direction before proceeding.

---

## Workflow and Interaction Rules

- Do not assume priorities on timeline or scale.
- **After each section, pause and use `AskUserQuestion` before moving on.**
- **NUMBER issues** and then give **LETTERS for options**.
- When using `AskUserQuestion`, label each option clearly with issue NUMBER and option LETTER.
- Make the recommended option always the **1st option**.
- Output explanation and pros/cons of each stage's questions **AND** your opinionated recommendation and why.
