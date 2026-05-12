---
name: tan:observe
description: Use when querying an observability platform (logs, traces, metrics, monitors, incidents) to investigate errors, performance, deployments, or security. Triggers on "observe", "check logs", "check metrics", "investigate", "look up traces", or when the user needs to query an external monitoring platform. Read-only — never creates, updates, or deletes platform resources.
argument-hint: [investigation target or question]
disable-model-invocation: true
---

# Observe

You are in **Observe Mode**. Query an external observability platform to investigate issues, verify deployments, or understand system behavior. **Strictly read-only.**

## Critical Rules

- **NEVER execute write/create/update/delete commands.** This skill is read-only. If the user requests a write operation, explain they must do it manually.
- **NEVER use auto-confirm flags** (e.g., `--yes`) that bypass destructive operation prompts.
- **Always check `--help` before guessing flags.** CLI tools evolve — discover current syntax, don't assume.
- **Always specify time bounds.** No open-ended queries — explicit `--from` at minimum.
- **Start narrow, then widen.** `1h` first, then `4h`, `1d`, `7d`.
- **Aggregate before searching.** Find patterns first, then fetch specific examples.
- **Read the platform's `forbidden.md` before running any commands.**

## Platform Detection

At the start of a session, detect available platforms:

```bash
pup --version 2>/dev/null && echo "datadog-pup available"
# Add future platform checks here
```

Load the matching platform reference from `platforms/<name>/`. If no platform CLI is found, ask the user what they have.

## Investigation Workflows

These patterns are platform-agnostic. Map each step to your platform's specific commands using the reference files.

### 1. Error Investigation

**Goal:** Identify what's failing, how often, and why.

1. **Check monitors/alerts** — are there active alerts for this service?
2. **Aggregate errors** — group by error message/type to find the top offender
3. **Search for specifics** — fetch example log entries for the top error
4. **Correlate with traces** — find traces with error status codes in the same timeframe
5. **Check dependencies** — are downstream services also erroring?

### 2. Performance Investigation

**Goal:** Identify what's slow and where the bottleneck is.

1. **Check latency metrics** — p50, p95, p99 for the service
2. **Aggregate by endpoint** — which endpoint is slowest?
3. **Search slow traces** — fetch traces above the threshold
4. **Check resource metrics** — CPU, memory, connections
5. **Check dependencies** — is the bottleneck in a downstream service or database?

### 3. Deployment Verification

**Goal:** Confirm a deploy didn't break anything.

1. **Check CI/CD pipeline** — did the deploy succeed?
2. **Aggregate post-deploy errors** — compare error rate before/after
3. **Check latency** — any latency regression?
4. **Check SLOs** — are SLOs still healthy?
5. **Check monitors** — any new alerts since deploy?

### 4. Security Audit

**Goal:** Review security signals and findings.

1. **List critical security signals** — recent high-severity detections
2. **Search findings** — failed compliance checks
3. **Check audit logs** — suspicious user activity
4. **Review risk scores** — high-risk entities

### 5. Incident Review

**Goal:** Understand what happened during an incident.

1. **Get incident details** — timeline, severity, status
2. **Check related monitors** — what triggered the alert?
3. **Search logs in incident window** — errors during the timeframe
4. **Check traces** — failing requests during the incident
5. **Review related deployments** — was anything deployed before the incident?

## Progressive Query Strategy

Always follow this order:

1. **Aggregate first** — find patterns (counts, groupings)
2. **Search for specifics** — get detailed examples of the pattern
3. **Correlate across domains** — check traces, metrics, monitors for the same timeframe
4. **Widen if needed** — expand time range or check related services

## Best Practices

1. **Always specify time bounds** — defaults are unreliable across platforms
2. **Start narrow, then widen** — `1h` → `4h` → `1d` → `7d`
3. **Filter at source** — use query filters, not local post-processing
4. **Aggregate before searching** — find patterns, then fetch examples
5. **Use limits conservatively** — start with 10-20, not 1000
6. **Prefer JSON output** — for parsing; table only for display
7. **Check `--help` on failure** — syntax may have changed

## Anti-Patterns

1. **Don't omit time bounds** — you'll get unexpected results
2. **Don't start with `--limit=1000`** — start small, refine queries
3. **Don't list all resources unfiltered** — slow and wasteful in large orgs
4. **Don't fetch raw data to count it** — use aggregation
5. **Don't retry blindly** — `401` means re-authenticate, `403` means wrong auth method
6. **Don't assume flags are global** — `--from`, `--to`, `--limit` are command-specific
7. **Don't pipe large JSON through `jq`** — use API-level filters instead

## Auto-Heal on Failure

| Error Pattern | Action |
|---|---|
| `unknown command` or `unknown flag` | Run `<tool> <parent-command> --help` to discover current syntax |
| `401 Unauthorized` | Re-authenticate |
| `403 Forbidden` | May need different auth method (API key vs OAuth) |
| `400 Bad Request` | Check query syntax via `--help` |
| `429 Rate Limited` | Narrow time range, reduce limit, retry |

When you discover correct syntax via `--help`, update the platform's `learnings.md`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Empty results | Check site/region config, auth status, and time range |
| Slow queries | Narrow `--from`, reduce `--limit` |
| Tool not found | Check installation and PATH |
| Wrong data | Verify you're querying the correct environment/region |

## Platform References

Platform-specific CLI reference, forbidden commands, query cookbooks, and learnings are in:

```
platforms/<platform-name>/
  reference.md      — CLI commands, auth, environment setup
  forbidden.md      — Destructive commands that must never be run
  query-cookbook.md  — Domain-specific query patterns
  learnings.md      — Gotchas discovered in real usage
```

**Always read `forbidden.md` for the active platform before running commands.**
