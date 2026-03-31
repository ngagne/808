---
name: 808:set-profile
description: Switch model profile for 808 agents (quality/balanced/budget/inherit)
argument-hint: <profile (quality|balanced|budget|inherit)>
model: haiku
allowed-tools:
  - Bash
---

Show the following output to the user verbatim, with no extra commentary:

!`node "$HOME/.claude/808/bin/808-tools.cjs" config-set-model-profile $ARGUMENTS --raw`
