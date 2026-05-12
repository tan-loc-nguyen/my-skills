# pup CLI Learnings Log

Continuously updated knowledge base. When a `pup` command fails and you discover the correct syntax via `--help`, or when a command behaves unexpectedly, add a new entry here.

**Format:** Date, category, concise learning (2-4 lines max). Most recent first within each category.

---

## Query Patterns That Worked

### 2026-04-07: `logs search` output is a wrapped object, not a bare array
`pup logs search --output json` returns `{"status":"success","data":[...],"metadata":{...}}`.
Access entries via `.data[]` (not `.[0]`).

### 2026-03-05: Aggregate before search saves time
Instead of fetching 1000 logs, first run `pup logs aggregate --compute=count --group-by=@message`
to identify the top error, then search for that specific message. 10x faster.

## Commands With Unexpected Behavior

### 2026-03-05: `apm services stats` does NOT accept `--limit`
Only `--env`, `--from`, `--to`, `--primary-tag` are valid flags. Same applies to `apm services list`.

### 2026-03-05: `error-tracking issues search` requires track/persona context
Returns 400: "either track or persona is required". May need specific service filter in query.

### 2026-03-05: `--from`/`--to`/`--limit` are NOT global flags
Command-specific. Not every command accepts them. Always check `pup <command> --help`.

### 2026-03-05: `logs search` (v1 API) caps at 1000 results
Use pagination or `pup logs aggregate --compute=count` for counting patterns.

### 2026-03-05: `metrics query` requires aggregation prefix
Must use `avg:metric{filter}`, not `metric{filter}`. Always prefix with `avg:`, `sum:`, `max:`, `min:`, or `count:`.

## Auth Edge Cases

### 2026-03-05: `error-tracking` only works with API+APP key
OAuth returns `403 Forbidden`. Must set `DD_API_KEY` and `DD_APP_KEY`.

### 2026-03-05: `logs` commands need API+APP key for reliable results
OAuth is unreliable for `logs search`, `logs query`, `logs list`, and `logs aggregate`.

## Performance Observations

### 2026-03-05: `--from=30d` on logs aggregate is slow (45+ seconds)
Prefer `--from=7d` in batches, or use Datadog UI for monthly aggregations.

## Anti-Patterns Confirmed

### 2026-03-05: APM durations are nanoseconds, NOT seconds or milliseconds
APM stats/resources use nanoseconds: 1s = 1000000000. Trace search supports shorthand (`@duration:>5s`).

### 2026-03-05: DD_SITE must always be set
Without it, pup defaults to `datadoghq.com` (US1). Empty results that look like wrong queries.

## Domain-Specific Notes

### 2026-03-05: `apm services stats` only shows services with traffic
Services with zero traffic don't appear. Widen `--from` or use `service-catalog list` for all registered services.
