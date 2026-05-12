# pup Query Cookbook

Real-world query patterns organized by domain.

---

## APM Query Syntax

```
service:<name>                    — Filter by service
resource_name:<path>              — Filter by endpoint/resource
operation_name:<op>               — Filter by operation (e.g., express.request)
@duration:>5000000000             — Duration filter (NANOSECONDS!)
status:error                      — Error status only
@http.status_code:500             — HTTP status code
env:prod                          — Environment filter
```

### Duration Conversion Table

| Human | Nanoseconds | Trace Shorthand |
|---|---|---|
| 1 ms | `1000000` | `@duration:>1ms` |
| 10 ms | `10000000` | `@duration:>10ms` |
| 100 ms | `100000000` | `@duration:>100ms` |
| 500 ms | `500000000` | `@duration:>500ms` |
| 1 second | `1000000000` | `@duration:>1s` |
| 5 seconds | `5000000000` | `@duration:>5s` |
| 30 seconds | `30000000000` | `@duration:>30s` |
| 1 minute | `60000000000` | `@duration:>1m` |

---

## Log Query Syntax

### Operators

```
AND / OR / NOT          — Boolean (uppercase required)
-status:info            — Negation (dash prefix)
"exact phrase"          — Exact string match
host:i-*                — Wildcard (* matches any characters)
@custom.field:value     — Custom attribute (@ prefix for indexed attributes)
status:error            — Reserved attribute (no @ prefix)
```

### Reserved Attributes (no @ prefix)

```
status          — Log level: error, warn, info, debug
service         — Service name
host            — Hostname
source          — Log source
message         — Log message text
```

### Common Log Patterns

```bash
# Errors for a specific service
pup logs search --query="service:<svc> status:error" --from=1h

# Errors with specific message pattern
pup logs search --query="service:<svc> status:error \"connection refused\"" --from=1h

# Errors excluding health checks
pup logs search --query="service:<svc> status:error -@http.url_details.path:\"/health\"" --from=1h

# Errors by HTTP status code
pup logs search --query="service:<svc> @http.status_code:>=500" --from=1h

# Specific user journey
pup logs search --query="service:<svc> @userId:12345" --from=1d

# Combined filters
pup logs search --query="service:<svc> status:error NOT @http.url:\"/health*\" @http.method:POST" --from=2h
```

### Log Aggregation Patterns

```bash
# Error count by service (top offenders)
pup logs aggregate --query="status:error" --compute=count --group-by=service --from=1h --limit=20

# Error distribution by message
pup logs aggregate --query="service:<svc> status:error" --compute=count --group-by=@message --from=1h

# Error rate by HTTP status code
pup logs aggregate --query="service:<svc> @http.status_code:>=400" --compute=count --group-by=@http.status_code --from=1h

# Unique error hosts
pup logs aggregate --query="service:<svc> status:error" --compute=count --group-by=host --from=1h

# Errors by URL path
pup logs aggregate --query="service:<svc> status:error" --compute=count --group-by=@http.url_details.path --from=1h --limit=20
```

---

## Trace Query Syntax

Trace queries filter spans. Duration shorthand is supported in trace queries (unlike APM stats which use nanoseconds).

```
service:<name>                  — Service name
resource_name:<path>            — Resource/endpoint name
@duration:>5s                   — Duration shorthand (s, ms, us, ns)
@http.status_code:500           — HTTP status code
env:production                  — Environment
operation_name:<op>             — Operation type
@error.message:"timeout"        — Error message
@span.kind:server               — Span kind (server, client, internal)
```

### Common Trace Patterns

```bash
# Error traces for a service
pup traces search --query="service:<svc> @http.status_code:>=500 env:prod" --from=1h --limit=10

# Slow traces (> 5s)
pup traces search --query="service:<svc> @duration:>5s env:prod" --from=1h --limit=10

# Database slow queries
pup traces search --query="service:<svc>-postgres @duration:>1s" --from=1h --limit=10

# External HTTP call failures
pup traces search --query="service:<svc> @span.kind:client @http.status_code:>=500" --from=1h

# Traces by resource name (specific endpoint)
pup traces search --query="service:<svc> resource_name:\"POST /api/orders\"" --from=1h
```

### Trace Aggregation Patterns

```bash
# P99 latency by endpoint
pup traces aggregate --query="service:<svc> env:prod" --compute="percentile(@duration,99)" --group-by=resource_name

# Error count by service
pup traces aggregate --query="@http.status_code:>=500 env:prod" --compute=count --group-by=service

# Average duration by operation
pup traces aggregate --query="service:<svc>" --compute="avg(@duration)" --group-by=operation_name

# Request count by status code
pup traces aggregate --query="service:<svc> env:prod" --compute=count --group-by=@http.status_code
```

---

## Metrics Query Syntax

Metrics queries **always require an aggregation function**.

```
<aggregation>:<metric_name>{<filter>} by {<group>}
```

### Aggregation Functions

| Function | Use When |
|---|---|
| `avg` | Mean value (CPU, latency) |
| `sum` | Total (request count, bytes) |
| `min` | Minimum (lowest latency) |
| `max` | Maximum (peak CPU, max connections) |
| `count` | Number of data points |

### Common Metric Patterns

```bash
# CPU usage by host
pup metrics query --query="avg:system.cpu.user{env:prod,service:<svc>} by {host}" --from=1h

# Memory usage
pup metrics query --query="avg:system.mem.used{env:prod,service:<svc>} by {host}" --from=1h

# APM request duration (p95)
pup metrics query --query="avg:trace.express.request.duration{env:prod,service:<svc>}" --from=1h

# APM request count
pup metrics query --query="sum:trace.express.request.hits{env:prod,service:<svc>}" --from=1h

# APM error count
pup metrics query --query="sum:trace.express.request.errors{env:prod,service:<svc>}" --from=1h
```

### Discovering Metric Names

```bash
pup metrics search --query="metrics:trace.express"
pup metrics list --filter="trace.express.*"
pup metrics metadata get trace.express.request.duration
pup metrics tags list trace.express.request.duration
```

---

## Monitor, Event, RUM, Security, CI/CD Patterns

See [reference.md](reference.md) for command flags. Key patterns:

```bash
# Monitors: substring search
pup monitors list --name="<svc>" --limit=50
pup monitors search --query="<svc> 5xx errors" --per-page=30

# Events: deployments
pup events search --query="sources:deploy" --from=1d

# RUM: frontend errors
pup rum events --from=1h --limit=50
pup rum apps list

# Security: critical signals
pup security signals list --query="status:critical" --from=24h

# CI/CD: failed pipelines
pup cicd events search --query="@ci.status:error" --from=1d --limit=20
pup cicd flaky-tests search --query="service:<svc>" --limit=20 --include-history
```

---

## Progressive Query Strategy

1. **Aggregate first** — find patterns
   ```bash
   pup logs aggregate --query="service:<svc> status:error" --compute=count --group-by=@message --from=1h --limit=10
   ```

2. **Search for specifics** — get details
   ```bash
   pup logs search --query="service:<svc> status:error \"the specific error\"" --from=1h --limit=5
   ```

3. **Correlate across domains** — traces, metrics, monitors
   ```bash
   pup traces search --query="service:<svc> @http.status_code:500" --from=1h --limit=5
   pup metrics query --query="avg:system.cpu.user{service:<svc>,env:prod}" --from=1h
   pup monitors search --query="<svc>" --per-page=10
   ```

4. **Widen if needed** — expand time or check related services
   ```bash
   pup logs aggregate --query="service:<svc> status:error" --compute=count --group-by=@message --from=1d
   pup apm dependencies list --env=prod
   ```
