<purpose>
List all 808 workspaces found in ~/808-workspaces/ with their status.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup

```bash
INIT=$(node "$HOME/.claude/808/bin/808-tools.cjs" init list-workspaces)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `workspace_base`, `workspaces`, `workspace_count`.

## 2. Display

**If `workspace_count` is 0:**

```
No workspaces found in ~/808-workspaces/

Create one with:
  /808:new-workspace --name my-workspace --repos repo1,repo2
```

Done.

**If workspaces exist:**

Display a table:

```
808 Workspaces (~/808-workspaces/)

| Name | Repos | Strategy | 808 Project |
|------|-------|----------|-------------|
| feature-a | 3 | worktree | Yes |
| feature-b | 2 | clone | No |

Manage:
  cd ~/808-workspaces/<name>     # Enter a workspace
  /808:remove-workspace <name>   # Remove a workspace
```

For each workspace, show:
- **Name** — directory name
- **Repos** — count from init data
- **Strategy** — from WORKSPACE.md
- **808 Project** — whether `.planning/PROJECT.md` exists (Yes/No)

</process>
