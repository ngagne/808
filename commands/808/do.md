---
name: 808:do
description: Route freeform text to the right 808 command automatically
argument-hint: "<description of what you want to do>"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---
<objective>
Analyze freeform natural language input and dispatch to the most appropriate 808 command.

Acts as a smart dispatcher — never does the work itself. Matches intent to the best 808 command using routing rules, confirms the match, then hands off.

Use when you know what you want but don't know which `/808:*` command to run.
</objective>

<execution_context>
@~/.claude/808/workflows/do.md
@~/.claude/808/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the do workflow from @~/.claude/808/workflows/do.md end-to-end.
Route user intent to the best 808 command and invoke it.
</process>
