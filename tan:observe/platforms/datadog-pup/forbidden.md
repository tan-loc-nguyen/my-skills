# Datadog pup CLI — Forbidden Commands

**NEVER execute any command listed below.** These are write/create/update/delete operations that modify Datadog state. If the user requests a write operation, explain that this skill is **read-only** and they must perform the action manually in the Datadog UI or via the CLI themselves.

**NEVER use the `--yes` global flag** — it auto-approves destructive operations without confirmation.

| Domain | Blocked Commands |
|---|---|
| `alias` | `alias set`, `alias delete`, `alias import` |
| `api-keys` | `api-keys create`, `api-keys delete` |
| `app-keys` | `app-keys create`, `app-keys delete`, `app-keys update` |
| `cases` | `cases archive`, `cases assign`, `cases create`, `cases unarchive`, `cases update-priority`, `cases update-status`, `cases update-title`, `cases jira create-issue`, `cases servicenow create-ticket`, `cases projects create`, `cases projects delete`, `cases projects update`, `cases projects notification-rules create`, `cases projects notification-rules delete`, `cases projects notification-rules update` |
| `cicd` | `cicd dora patch-deployment`, `cicd flaky-tests update` |
| `cloud` | `cloud oci tenancies create`, `cloud oci tenancies delete`, `cloud oci tenancies update` |
| `dashboards` | `dashboards create`, `dashboards delete`, `dashboards update` |
| `downtime` | `downtime cancel`, `downtime create` |
| `fleet` | `fleet deployments cancel`, `fleet schedules create`, `fleet schedules delete`, `fleet schedules trigger`, `fleet schedules update` |
| `hamr` | `hamr connections create` |
| `incidents` | `incidents attachments delete`, `incidents handles create`, `incidents handles delete`, `incidents handles update`, `incidents postmortem-templates create`, `incidents postmortem-templates delete`, `incidents postmortem-templates update`, `incidents settings update` |
| `integrations` | `integrations jira accounts delete`, `integrations jira templates create`, `integrations jira templates delete`, `integrations jira templates update`, `integrations servicenow templates create`, `integrations servicenow templates delete`, `integrations servicenow templates update` |
| `investigations` | `investigations trigger` |
| `logs` | `logs archives delete`, `logs metrics delete` |
| `metrics` | `metrics metadata update`, `metrics submit` |
| `monitors` | `monitors create`, `monitors delete`, `monitors update` |
| `notebooks` | `notebooks create`, `notebooks delete`, `notebooks update` |
| `on-call` | `on-call teams create`, `on-call teams delete`, `on-call teams update`, `on-call teams memberships add`, `on-call teams memberships remove`, `on-call teams memberships update` |
| `product-analytics` | `product-analytics events send` |
| `rum` | `rum apps create`, `rum apps delete`, `rum apps update`, `rum metrics create`, `rum metrics delete`, `rum metrics update`, `rum retention-filters create`, `rum retention-filters delete`, `rum retention-filters update` |
| `security` | `security content-packs activate`, `security content-packs deactivate` |
| `slos` | `slos create`, `slos delete`, `slos update` |
| `status-pages` | `status-pages components create`, `status-pages components delete`, `status-pages components update`, `status-pages degradations create`, `status-pages degradations delete`, `status-pages degradations update`, `status-pages pages create`, `status-pages pages delete`, `status-pages pages update` |
| `synthetics` | `synthetics suites create`, `synthetics suites delete`, `synthetics suites update` |
| `tags` | `tags add`, `tags delete`, `tags update` |
