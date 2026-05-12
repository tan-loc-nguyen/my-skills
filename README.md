# my-skills

Personal [Claude Code skills](https://docs.anthropic.com/en/docs/claude-code/skills) for software engineering workflows.

## Skills

| Skill | Description |
|-------|-------------|
| `tan:audit-tests` | Audit test quality and coverage for any backend codebase. Detects coverage gaps, over-mocking, low-signal tests, drifted tests, and missing edge cases. Produces a prioritized report and optionally fixes top findings via PR. |
| `tan:debug` | Hypothesis-driven debugging with runtime log evidence. Spins up a local log server so both browser and server code write structured logs to a file the AI reads directly. Never fix without evidence. |
| `tan:grill-me` | Stress-test a plan against the codebase's actual domain model. Challenges vague terminology, forces precise naming, cross-references claims against code, and surfaces contradictions. |
| `tan:inspect` | Observe runtime data flow through a system for learning, testing, or verification. Instruments entry/transform/branch/exit points and produces a narrated data flow from actual runtime values. |
| `tan:learn` | Structured codebase learning with three modes: `--quick` (orient fast), standard (solid understanding with quizzes), and `--deep` (full mastery with Socratic challenges). |
| `tan:observe` | Query observability platforms (logs, traces, metrics, monitors, incidents) to investigate errors, performance issues, or system behavior. |
| `tan:review-plan` | Interactive code review across architecture, code quality, tests, and performance sections. |

## Installation

Symlink each skill into your Claude Code skills directory:

```bash
for skill in /path/to/my-skills/tan:*/; do
  ln -s "$skill" ~/.claude/skills/$(basename "$skill")
done
```

## Usage

Invoke any skill in Claude Code:

```
/tan:debug [bug description]
/tan:inspect [area/flow to inspect]
/tan:learn [area] [--quick | --deep]
/tan:grill-me [plan or design to challenge]
/tan:audit-tests [path/to/scope] [--report-only | --fix]
```
