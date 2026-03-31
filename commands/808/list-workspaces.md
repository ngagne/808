---
name: 808:list-workspaces
description: List active 808 workspaces and their status
allowed-tools:
  - Bash
  - Read
---
<objective>
Scan `~/808-workspaces/` for workspace directories containing `WORKSPACE.md` manifests. Display a summary table with name, path, repo count, strategy, and 808 project status.
</objective>

<execution_context>
@~/.claude/808/workflows/list-workspaces.md
@~/.claude/808/references/ui-brand.md
</execution_context>

<process>
Execute the list-workspaces workflow from @~/.claude/808/workflows/list-workspaces.md end-to-end.
</process>
