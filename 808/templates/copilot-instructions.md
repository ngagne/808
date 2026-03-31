# Instructions for 808

- Use the 808 skill when the user asks for 808 or uses a `808-*` command.
- Treat `/808-...` or `808-...` as command invocations and load the matching file from `.github/skills/808-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply 808 workflows unless the user explicitly asks for them.
- After completing any `808-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
