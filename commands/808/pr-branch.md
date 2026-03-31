---
name: 808:pr-branch
description: Create a clean PR branch by filtering out .planning/ commits — ready for code review
argument-hint: "[target branch, default: main]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
Create a clean branch suitable for pull requests by filtering out .planning/ commits
from the current branch. Reviewers see only code changes, not 808 planning artifacts.

This solves the problem of PR diffs being cluttered with PLAN.md, SUMMARY.md, STATE.md
changes that are irrelevant to code review.
</objective>

<execution_context>
@~/.claude/808/workflows/pr-branch.md
</execution_context>

<process>
Execute the pr-branch workflow from @~/.claude/808/workflows/pr-branch.md end-to-end.
</process>
