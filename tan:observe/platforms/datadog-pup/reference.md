# Datadog pup CLI Reference

Full reference for pup CLI. For forbidden commands, see [forbidden.md](forbidden.md). For query patterns, see [query-cookbook.md](query-cookbook.md).

## Environment Setup

```bash
export DD_SITE=<your-site>   # e.g. ap2.datadoghq.com, datadoghq.com, datadoghq.eu
```

**Always set `DD_SITE` before any `pup` command.** Without it, pup defaults to `datadoghq.com` (US1).

### Authentication

| Method | Setup | Scope |
|---|---|---|
| **OAuth** (preferred) | `DD_SITE=<site> pup auth login` | APM, traces, monitors, metrics, SLOs, dashboards, service-catalog, infrastructure, RUM, CI/CD, security |
| **API + APP keys** | `export DD_API_KEY=... DD_APP_KEY=...` | Logs, error-tracking, and all OAuth-compatible commands |

**Pre-flight check:**

```bash
DD_SITE=<site> pup auth status
```

If expired: `DD_SITE=<site> pup auth login`. Do NOT continue with stale tokens.

### Auth Limitations

| Command | OAuth | API+APP Key | Notes |
|---|---|---|---|
| `logs search/query/list` | Limited | Required | v1/v2 log search needs API key |
| `logs aggregate` | Limited | Required | Aggregation needs API key |
| `error-tracking issues` | No | Required | Only works with API+APP key |
| All other commands | Yes | Yes | OAuth preferred for convenience |

## Self-Discovery Protocol

### Always check `--help` before guessing

```bash
DD_SITE=<site> pup <domain> --help
DD_SITE=<site> pup <domain> <subcommand> --help
```

The JSON response contains the full command tree, flags, defaults, query syntax, best practices, and anti-patterns.

### Version check

Skill built against pup **v0.23.0**. Before first use:

```bash
pup --version 2>/dev/null || echo "pup not installed"
```

## Global Flags

Only these three flags are accepted by **every** command:

| Flag | Default | Purpose |
|---|---|---|
| `--output` | `json` | Output format: `json`, `table`, `yaml` |
| `--agent` | `false` | Agent mode |
| `--yes` | `false` | **NEVER USE** — skips confirmation on destructive ops |

### Time Formats (for commands that accept `--from` / `--to`)

| Format | Examples |
|---|---|
| Relative shorthand | `5s`, `30m`, `1h`, `4h`, `1d`, `7d`, `1w`, `30d` |
| Relative words | `5min`, `2hours`, `3days`, `"5 minutes"` |
| Absolute RFC3339 | `2026-01-01T00:00:00Z` |
| Unix timestamp (ms) | `1704067200000` |
| Range | `--from=7d --to=1d` (7 days ago to 1 day ago) |

## Command Domains (40+)

| Domain | Command | Key read-only subcommands |
|---|---|---|
| APM | `pup apm` | `services list/stats/operations/resources`, `dependencies list`, `entities list`, `flow-map` |
| Traces | `pup traces` | `search`, `aggregate` |
| Logs | `pup logs` | `search`, `list`, `query`, `aggregate`, `archives list`, `metrics list`, `restriction-queries list` |
| Monitors | `pup monitors` | `list`, `search`, `get` |
| Metrics | `pup metrics` | `query`, `search`, `list`, `metadata get`, `tags list` |
| SLOs | `pup slos` | `list`, `get`, `status` |
| Dashboards | `pup dashboards` | `list`, `get` |
| Error Tracking | `pup error-tracking` | `issues search`, `issues get` |
| CI/CD | `pup cicd` | `pipelines list/get`, `tests search/list/aggregate`, `events search/aggregate`, `flaky-tests search` |
| RUM | `pup rum` | `apps list`, `events`, `sessions list/search`, `heatmaps query`, `playlists list/get`, `metrics list/get` |
| Security | `pup security` | `signals list`, `findings search`, `rules list/get/bulk-export`, `risk-scores list`, `content-packs list` |
| Infrastructure | `pup infrastructure` | `hosts list/get` |
| Service Catalog | `pup service-catalog` | `list`, `get` |
| Events | `pup events` | `list`, `search`, `get` |
| Audit Logs | `pup audit-logs` | `list`, `search` |
| Incidents | `pup incidents` | `list`, `get`, `attachments list`, `handles list`, `postmortem-templates list/get`, `settings get` |
| Cases | `pup cases` | `search`, `get`, `move`, `jira link/unlink`, `projects list/get`, `projects notification-rules list` |
| Downtime | `pup downtime` | `list`, `get` |
| On-Call | `pup on-call` | `teams list/get`, `teams memberships list` |
| Investigations | `pup investigations` | `list`, `get` |
| Synthetics | `pup synthetics` | `tests list/get/search`, `suites list/get`, `locations list` |
| Network | `pup network` | `list`, `devices list`, `flows list` |
| Static Analysis | `pup static-analysis` | `ast list/get`, `sca list/get`, `coverage list/get`, `custom-rulesets list/get` |
| Code Coverage | `pup code-coverage` | `branch-summary`, `commit-summary` |
| Obs Pipelines | `pup obs-pipelines` | `list`, `get` |
| Cloud | `pup cloud` | `aws list`, `azure list`, `gcp list`, `oci products list`, `oci tenancies list/get` |
| Integrations | `pup integrations` | `jira accounts/templates list`, `pagerduty list`, `servicenow instances/assignment-groups/business-services/templates/users list`, `slack list`, `webhooks list` |
| Fleet | `pup fleet` | `agents list/get/versions`, `deployments list/get/configure/upgrade`, `schedules list/get` |
| Notebooks | `pup notebooks` | `list`, `get` |
| Scorecards | `pup scorecards` | `list`, `get` |
| Status Pages | `pup status-pages` | `pages list/get`, `components list/get`, `degradations list/get`, `third-party list` |
| Tags | `pup tags` | `list`, `get` |
| Data Governance | `pup data-governance` | `scanner rules list` |
| Organizations | `pup organizations` | `list`, `get` |
| Users | `pup users` | `list`, `get`, `roles list` |
| Cost | `pup cost` | `projected`, `by-org`, `attribution` |
| Usage | `pup usage` | `summary`, `hourly` |
| Misc | `pup misc` | `status`, `ip-ranges` |
| Utility | `pup` | `version`, `test`, `completions`, `agent guide/schema`, `alias list`, `api-keys list/get`, `app-keys list/get`, `hamr connections get` |

## Query Syntax Cheat Sheet

| Domain | Syntax | Example |
|---|---|---|
| APM/Traces | `service:<name> resource_name:<path> @duration:>5s` | `service:svc-order @http.status_code:500` |
| Logs | `service:<name> status:<level> @attr:val` | `service:svc-order status:error @http.url:/api/orders` |
| Metrics | `<agg>:<metric>{<filter>} by {<group>}` | `avg:trace.express.request.duration{service:svc-order} by {resource_name}` |
| Monitors | `--name` substring or `--query` full-text | `--name="svc-order" --tags="env:prod"` |
| Events | `sources:<src> status:<status> tags:<tag>` | `sources:deploy status:normal tags:env:prod` |
| RUM | `@type:error @view.url_path:<path> service:<app>` | `@type:error @session.type:user @view.url_path:/checkout` |
| Security | `@workflow.rule.type:<type> source:<src>` | `source:cloudtrail status:critical` |

### CRITICAL: Duration Units

| Domain | Unit | 1 second | 5 ms |
|---|---|---|---|
| APM (stats/resources) | **Nanoseconds** | `1000000000` | `5000000` |
| Traces (search shorthand) | Shorthand | `@duration:>1s` | `@duration:>5ms` |

### Log Query Operators

```text
AND / OR / NOT       — boolean operators
-status:info         — negation (dash prefix)
"exact phrase"       — exact match
host:i-*             — wildcard
@custom.field:value  — custom attribute (@ prefix)
service:web-* AND status:error    — combined filters
```

## Investigation Workflow Examples

### Error Investigation

```bash
pup monitors search --query="<service> error" --per-page=10
pup logs aggregate --query="service:<service> status:error" --compute=count --group-by=@message --from=1h
pup logs search --query="service:<service> status:error" --from=1h --limit=10
pup apm services stats --env=prod --from=1h
pup traces search --query="service:<service> @http.status_code:500" --from=1h --limit=5
```

### Performance Investigation

```bash
pup traces aggregate --query="service:<service> env:prod" --compute="percentile(@duration,99)" --group-by=resource_name
pup metrics query --query="avg:system.cpu.user{service:<service>,env:prod} by {host}" --from=1h
pup traces search --query="service:<service> @duration:>5s" --from=1h --limit=10
pup apm dependencies list --env=prod
```

### Deployment Verification

```bash
pup cicd pipelines list --pipeline-name="deploy-<service>" --from=1d
pup logs aggregate --query="service:<service> status:error" --compute=count --group-by=@message --from=30m
pup traces aggregate --query="service:<service> @http.status_code:>=500" --compute=count --from=2h
pup slos list
pup slos status <SLO_ID> --from=1d
```

### Security Audit

```bash
pup security signals list --query="status:critical" --from=24h
pup security findings search --query="status:failed" --limit=50
pup security risk-scores list --query="severity:critical"
pup audit-logs search --query="@evt.name:user.login" --from=1d --limit=100
```

### Incident Review

```bash
pup incidents list --limit=20
pup incidents get <INCIDENT_ID>
pup monitors search --query="<service-name>" --per-page=10
pup investigations list --monitor-id=<MONITOR_ID>
```

For detailed flag reference per command, run `pup <domain> <command> --help`.
