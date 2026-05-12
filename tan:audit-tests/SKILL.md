---
name: tan:audit-tests
description: Use to audit test quality and coverage for any backend codebase. Detects coverage gaps, over-mocked tests, low-signal assertions, and missing edge cases. Auto-detects the project's test framework and conventions. Produces a prioritized report and optionally fixes the top findings via PR. Triggers on "audit tests", "test quality", "test gaps", or when scheduled as a routine.
argument-hint: [path/to/scope] [--report-only | --fix]
disable-model-invocation: true
---

# Audit Tests

Audit test quality and coverage for a backend codebase. Detect gaps, anti-patterns, and low-value tests. Optionally fix the top findings and create a PR.

## Step 0: Detect Project Conventions

Before auditing, scan the project to learn its testing patterns. Do NOT assume any framework or convention.

**Detect:**
- **Test framework:** Check package.json (jest, vitest, mocha, ava), config files (jest.config.*, vitest.config.*, .mocharc.*), and lock files
- **Test file pattern:** Search for `.test.ts`, `.spec.ts`, `.test.js`, `__tests__/` directories — identify which pattern this project uses
- **Test location:** Co-located with source, or separate `test/`/`tests/`/`__tests__` directory?
- **Test runner command:** Check `scripts` in package.json (test, test:unit, test:integration, etc.)
- **Mock patterns:** grep for `jest.mock`, `vi.mock`, `sinon`, `nock`, `msw` — identify which libraries are used
- **Test utilities:** Look for `test/`, `src/test/`, `__fixtures__/`, factory files, helper files
- **Assertion style:** `expect().toBe()` (Jest/Vitest), `assert()` (Node/Chai), `should` (Chai)

Store these as the **project profile** — reference it in all later phases.

## Step 1: Determine Scope

Read scope from `$ARGUMENTS` or conversation context.

**If a path is given** (e.g., `src/api/v2/`): audit only that directory.
**If no path given**: ask the user what area to audit, or default to the project's main source directory.

For each source file in scope (excluding test files), find its corresponding test using the detected file pattern and location convention.

Classify each:

| Status | Meaning |
|--------|---------|
| **Missing** | No test file exists |
| **Shallow** | Test exists but covers <50% of exported functions or only happy paths |
| **Covered** | Test exists with meaningful behavioral assertions |

Output a coverage table:
```
| File | Status | Test File | Exported Fns | Tested |
|------|--------|-----------|-------------|--------|
```

## Step 2: Quality Analysis

For each **existing** test file, use two-layer detection: grep/scan for signals first, then read the code to confirm or reject.

### Anti-Pattern 1: Over-Mocking
**Scan for:** Mock call count (`jest.mock`, `vi.mock`, `sinon.stub`, etc.) relative to imports.
**Confirm:** >70% of imports mocked; function under test is itself spied on; assertions check mock call counts instead of return values or side effects.
**Guard:** Integration tests with real DB/HTTP are intentionally wired — do NOT flag.
**Action:** REWRITE

### Anti-Pattern 2: Mirror Testing
**Scan for:** Test logic that restates production code branching or calculations.
**Confirm:** Test has the same if/else structure as source; test computes expected values using the same formula.
**Action:** REWRITE — assert "given X, expect Y" not restate logic.

### Anti-Pattern 3: Happy Path Only
**Scan for:** Test names — all positive ("should return...", "should create..."); no error assertions (`toThrow`, status 4xx/5xx); no null/undefined/empty inputs.
**Confirm:** No error paths, no edge cases, no boundary values tested.
**Action:** STRENGTHEN — add error and edge case tests.

### Anti-Pattern 4: Trivial Assertions
**Scan for:** `toBeDefined()`, `toBeTruthy()`, `toMatchSnapshot()`, `assert(result)` as only assertions.
**Confirm:** No specific value checks; snapshot is the sole oracle; assertions can never fail.
**Action:** STRENGTHEN — replace with specific behavioral assertions.

### Anti-Pattern 5: Framework Plumbing
**Scan for:** `beforeEach` / `beforeAll` / setup blocks that dwarf actual test blocks.
**Confirm:** >60% of test LOC is setup/teardown/mock configuration; actual assertions are minimal.
**Action:** REWRITE — extract shared setup to helpers or test at a different level.

### Scoring

For each finding: **Business Impact (1-5) × Failure Probability (1-5)**

| Score | Action |
|-------|--------|
| ≥15 | **KEEP** — valuable as-is |
| 10-14 | **REWRITE** — has value but needs improvement |
| <10 | **DELETE** or **MERGE** — adds noise, not signal |

### Priority

Adapt these to the project's domain — identify what's critical by reading routes, middleware, and service names:

| Level | Criteria | Examples |
|-------|----------|---------|
| **P0** | Auth, permissions, data integrity, mutations, payments | Auth middleware, DB write operations, payment handlers |
| **P1** | Core business logic endpoints | CRUD operations, main feature controllers, search |
| **P2** | Supporting logic | Schema validation, formatting utilities, cookie handling |

## Step 3: Report

```markdown
# Test Audit Report
Project: [name] | Date: [YYYY-MM-DD] | Scope: [path]

## Coverage Summary
- [X/Y] source files have tests ([Z]%)
- [A] Missing | [B] Shallow | [C] Covered

## Top Findings (ranked by score)

### P0 — Critical
1. **[STATUS]** `path/to/file.ts`
   - [Description of gap or anti-pattern]
   - Impact: N | Probability: N | Score: N
   - Action: ADD_TEST / REWRITE / STRENGTHEN | Effort: S/M/L

### P1 — Important
...

### P2 — Nice to Have
...

## Anti-Pattern Summary
| Anti-Pattern | Count | Affected Files |
|-------------|-------|----------------|

## Recommended Actions (Top 5)
1. [Highest score action]
```

If `--report-only`, stop here.

## Step 4: Fix (when `--fix` or scheduled run)

Pick the **top 3-5 highest-score improvements** (P0 first, then P1).

For each finding, write tests that **match the project profile** detected in Step 0:

**ADD_TEST** — Write a new test file following the project's conventions:
- Use the project's test framework, assertion style, and file pattern
- Use existing test utilities, factories, fixtures, and helpers found in Step 0
- Use the project's mock patterns for external dependencies
- Test behavior: given input X, expect response Y — not implementation details

**REWRITE** — Rewrite preserving behavioral intent:
- Replace mock-heavy tests with integration-level tests where possible
- Replace mirror logic with input→output assertions

**STRENGTHEN** — Add to existing test file:
- Error paths (invalid input, unauthorized, not found)
- Edge cases (empty arrays, null fields, boundary values)
- State transitions (before/after mutations)

**Constraints:**
- Never delete tests without replacement
- Each test asserts behavior, not implementation
- Don't add tests just for coverage numbers — every test must catch a real bug class
- Run the project's test command on each changed file to verify it passes
- Keep CI fast — prefer unit tests when integration isn't needed

## Step 5: PR

After fixes:
1. Create branch: `chore/test-audit-YYYY-MM-DD`
2. Stage only test files and any test helper additions
3. Commit: `test: audit and improve test coverage`
4. Create PR (use the project's PR template if one exists)
5. PR title: `chore: testing audit <date>`
6. PR description includes the audit report summary

## Mental Checks (before finalizing)

Before submitting, verify each new/rewritten test:
1. "Delete the implementation. Would this test serve as a spec someone could reimplement from?"
2. "Introduce a subtle bug in the source. Would this test catch it?"
3. "Read just the test name. Does it describe a behavior, not an implementation detail?"

If any answer is no, the test needs work.
