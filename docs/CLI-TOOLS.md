# 808 CLI Tools Reference

> Programmatic API reference for `808-tools.cjs`. Used by workflows and agents internally. For user-facing commands, see [Command Reference](COMMANDS.md).

---

## Overview

`808-tools.cjs` is a Node.js CLI utility that replaces repetitive inline bash patterns across 808's ~50 command, workflow, and agent files. It centralizes: config parsing, model resolution, phase lookup, git commits, summary verification, state management, and template operations.

**Location:** `808/bin/808-tools.cjs`
**Modules:** 15 domain modules in `808/bin/lib/`

**Usage:**
```bash
node 808-tools.cjs <command> [args] [--raw] [--cwd <path>]
```

**Global Flags:**
| Flag | Description |
|------|-------------|
| `--raw` | Machine-readable output (JSON or plain text, no formatting) |
| `--cwd <path>` | Override working directory (for sandboxed subagents) |

---

## State Commands

Manage `.planning/STATE.md` — the project's living memory.

```bash
# Load full project config + state as JSON
node 808-tools.cjs state load

# Output STATE.md frontmatter as JSON
node 808-tools.cjs state json

# Update a single field
node 808-tools.cjs state update <field> <value>

# Get STATE.md content or a specific section
node 808-tools.cjs state get [section]

# Batch update multiple fields
node 808-tools.cjs state patch --field1 val1 --field2 val2

# Increment plan counter
node 808-tools.cjs state advance-plan

# Record execution metrics
node 808-tools.cjs state record-metric --phase N --plan M --duration Xmin [--tasks N] [--files N]

# Recalculate progress bar
node 808-tools.cjs state update-progress

# Add a decision
node 808-tools.cjs state add-decision --summary "..." [--phase N] [--rationale "..."]
# Or from files:
node 808-tools.cjs state add-decision --summary-file path [--rationale-file path]

# Add/resolve blockers
node 808-tools.cjs state add-blocker --text "..."
node 808-tools.cjs state resolve-blocker --text "..."

# Record session continuity
node 808-tools.cjs state record-session --stopped-at "..." [--resume-file path]
```

### State Snapshot

Structured parse of the full STATE.md:

```bash
node 808-tools.cjs state-snapshot
```

Returns JSON with: current position, phase, plan, status, decisions, blockers, metrics, last activity.

---

## Phase Commands

Manage phases — directories, numbering, and roadmap sync.

```bash
# Find phase directory by number
node 808-tools.cjs find-phase <phase>

# Calculate next decimal phase number for insertions
node 808-tools.cjs phase next-decimal <phase>

# Append new phase to roadmap + create directory
node 808-tools.cjs phase add <description>

# Insert decimal phase after existing
node 808-tools.cjs phase insert <after> <description>

# Remove phase, renumber subsequent
node 808-tools.cjs phase remove <phase> [--force]

# Mark phase complete, update state + roadmap
node 808-tools.cjs phase complete <phase>

# Index plans with waves and status
node 808-tools.cjs phase-plan-index <phase>

# List phases with filtering
node 808-tools.cjs phases list [--type planned|executed|all] [--phase N] [--include-archived]
```

---

## Roadmap Commands

Parse and update `ROADMAP.md`.

```bash
# Extract phase section from ROADMAP.md
node 808-tools.cjs roadmap get-phase <phase>

# Full roadmap parse with disk status
node 808-tools.cjs roadmap analyze

# Update progress table row from disk
node 808-tools.cjs roadmap update-plan-progress <N>
```

---

## Config Commands

Read and write `.planning/config.json`.

```bash
# Initialize config.json with defaults
node 808-tools.cjs config-ensure-section

# Set a config value (dot notation)
node 808-tools.cjs config-set <key> <value>

# Get a config value
node 808-tools.cjs config-get <key>

# Set model profile
node 808-tools.cjs config-set-model-profile <profile>
```

---

## Model Resolution

```bash
# Get model for agent based on current profile
node 808-tools.cjs resolve-model <agent-name>
# Returns: opus | sonnet | haiku | inherit
```

Agent names: `808-planner`, `808-executor`, `808-phase-researcher`, `808-project-researcher`, `808-research-synthesizer`, `808-verifier`, `808-plan-checker`, `808-integration-checker`, `808-roadmapper`, `808-debugger`, `808-codebase-mapper`, `808-nyquist-auditor`

---

## Verification Commands

Validate plans, phases, references, and commits.

```bash
# Verify SUMMARY.md file
node 808-tools.cjs verify-summary <path> [--check-count N]

# Check PLAN.md structure + tasks
node 808-tools.cjs verify plan-structure <file>

# Check all plans have summaries
node 808-tools.cjs verify phase-completeness <phase>

# Check @-refs + paths resolve
node 808-tools.cjs verify references <file>

# Batch verify commit hashes
node 808-tools.cjs verify commits <hash1> [hash2] ...

# Check must_haves.artifacts
node 808-tools.cjs verify artifacts <plan-file>

# Check must_haves.key_links
node 808-tools.cjs verify key-links <plan-file>
```

---

## Validation Commands

Check project integrity.

```bash
# Check phase numbering, disk/roadmap sync
node 808-tools.cjs validate consistency

# Check .planning/ integrity, optionally repair
node 808-tools.cjs validate health [--repair]
```

---

## Template Commands

Template selection and filling.

```bash
# Select summary template based on granularity
node 808-tools.cjs template select <type>

# Fill template with variables
node 808-tools.cjs template fill <type> --phase N [--plan M] [--name "..."] [--type execute|tdd] [--wave N] [--fields '{json}']
```

Template types for `fill`: `summary`, `plan`, `verification`

---

## Frontmatter Commands

YAML frontmatter CRUD operations on any Markdown file.

```bash
# Extract frontmatter as JSON
node 808-tools.cjs frontmatter get <file> [--field key]

# Update single field
node 808-tools.cjs frontmatter set <file> --field key --value jsonVal

# Merge JSON into frontmatter
node 808-tools.cjs frontmatter merge <file> --data '{json}'

# Validate required fields
node 808-tools.cjs frontmatter validate <file> --schema plan|summary|verification
```

---

## Scaffold Commands

Create pre-structured files and directories.

```bash
# Create CONTEXT.md template
node 808-tools.cjs scaffold context --phase N

# Create UAT.md template
node 808-tools.cjs scaffold uat --phase N

# Create VERIFICATION.md template
node 808-tools.cjs scaffold verification --phase N

# Create phase directory
node 808-tools.cjs scaffold phase-dir --phase N --name "phase name"
```

---

## Init Commands (Compound Context Loading)

Load all context needed for a specific workflow in one call. Returns JSON with project info, config, state, and workflow-specific data.

```bash
node 808-tools.cjs init execute-phase <phase>
node 808-tools.cjs init plan-phase <phase>
node 808-tools.cjs init new-project
node 808-tools.cjs init new-milestone
node 808-tools.cjs init quick <description>
node 808-tools.cjs init resume
node 808-tools.cjs init verify-work <phase>
node 808-tools.cjs init phase-op <phase>
node 808-tools.cjs init todos [area]
node 808-tools.cjs init milestone-op
node 808-tools.cjs init map-codebase
node 808-tools.cjs init progress
```

**Large payload handling:** When output exceeds ~50KB, the CLI writes to a temp file and returns `@file:/tmp/808-init-XXXXX.json`. Workflows check for the `@file:` prefix and read from disk:

```bash
INIT=$(node 808-tools.cjs init execute-phase "1")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

---

## Milestone Commands

```bash
# Archive milestone
node 808-tools.cjs milestone complete <version> [--name <name>] [--archive-phases]

# Mark requirements as complete
node 808-tools.cjs requirements mark-complete <ids>
# Accepts: REQ-01,REQ-02 or REQ-01 REQ-02 or [REQ-01, REQ-02]
```

---

## Utility Commands

```bash
# Convert text to URL-safe slug
node 808-tools.cjs generate-slug "Some Text Here"
# → some-text-here

# Get timestamp
node 808-tools.cjs current-timestamp [full|date|filename]

# Count and list pending todos
node 808-tools.cjs list-todos [area]

# Check file/directory existence
node 808-tools.cjs verify-path-exists <path>

# Aggregate all SUMMARY.md data
node 808-tools.cjs history-digest

# Extract structured data from SUMMARY.md
node 808-tools.cjs summary-extract <path> [--fields field1,field2]

# Project statistics
node 808-tools.cjs stats [json|table]

# Progress rendering
node 808-tools.cjs progress [json|table|bar]

# Complete a todo
node 808-tools.cjs todo complete <filename>

# UAT audit — scan all phases for unresolved items
node 808-tools.cjs audit-uat

# Git commit with config checks
node 808-tools.cjs commit <message> [--files f1 f2] [--amend] [--no-verify]
```

> **`--no-verify`**: Skips pre-commit hooks. Used by parallel executor agents during wave-based execution to avoid build lock contention (e.g., cargo lock fights in Rust projects). The orchestrator runs hooks once after each wave completes. Do not use `--no-verify` during sequential execution — let hooks run normally.

# Web search (requires Brave API key)
node 808-tools.cjs websearch <query> [--limit N] [--freshness day|week|month]
```

---

## Module Architecture

| Module | File | Exports |
|--------|------|---------|
| Core | `lib/core.cjs` | `error()`, `output()`, `parseArgs()`, shared utilities |
| State | `lib/state.cjs` | All `state` subcommands, `state-snapshot` |
| Phase | `lib/phase.cjs` | Phase CRUD, `find-phase`, `phase-plan-index`, `phases list` |
| Roadmap | `lib/roadmap.cjs` | Roadmap parsing, phase extraction, progress updates |
| Config | `lib/config.cjs` | Config read/write, section initialization |
| Verify | `lib/verify.cjs` | All verification and validation commands |
| Template | `lib/template.cjs` | Template selection and variable filling |
| Frontmatter | `lib/frontmatter.cjs` | YAML frontmatter CRUD |
| Init | `lib/init.cjs` | Compound context loading for all workflows |
| Milestone | `lib/milestone.cjs` | Milestone archival, requirements marking |
| Commands | `lib/commands.cjs` | Misc: slug, timestamp, todos, scaffold, stats, websearch |
| Model Profiles | `lib/model-profiles.cjs` | Profile resolution table |
| UAT | `lib/uat.cjs` | Cross-phase UAT/verification audit |
| Profile Output | `lib/profile-output.cjs` | Developer profile formatting |
| Profile Pipeline | `lib/profile-pipeline.cjs` | Session analysis pipeline |
