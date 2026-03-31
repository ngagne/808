---
name: 808:plan-milestone-gaps
description: Create phases to close all gaps identified by milestone audit
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
Create all phases necessary to close gaps identified by `/808:audit-milestone`.

Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase entries in ROADMAP.md, and offers to plan each phase.

One command creates all fix phases — no manual `/808:add-phase` per gap.
</objective>

<execution_context>
@~/.claude/808/workflows/plan-milestone-gaps.md
</execution_context>

<context>
**Audit results:**
Glob: .planning/v*-MILESTONE-AUDIT.md (use most recent)

Original intent and current planning state are loaded on demand inside the workflow.
</context>

<process>
Execute the plan-milestone-gaps workflow from @~/.claude/808/workflows/plan-milestone-gaps.md end-to-end.
Preserve all workflow gates (audit loading, prioritization, phase grouping, user confirmation, roadmap updates).
</process>
