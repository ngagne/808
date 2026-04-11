# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Adversarial Reviewer Agent** (`agents/808-adversarial-reviewer.md`) — Adversarial code review using GPT-5.3-Codex to challenge design decisions, question assumptions, and identify architectural blind spots
- **Adversarial Review Template** (`808/templates/adversarial-review.md`) — Structured adversarial review report template with design decision challenges, pattern analysis, complexity assessment, hidden assumptions, and second-order effects
- **Adversarial Review Guide** (`808/references/adversarial-review-guide.md`) — Comprehensive adversarial review patterns including questioning frameworks (first principles, inversion, scale extremes, failure modes), cognitive bias detection, trade-off analysis, and code examples
- **Phase Execution Flow Diagram** — Mermaid flowchart in README showing full phase execution flow from discuss through verification with optional review stages
- **Execute Phase Workflow** — Integrated adversarial reviewer step after SRE review, with status handling (passed/challenges_found/human_needed)
- **Model Profile** — Added `808-adversarial-reviewer` using GPT-5.3-Codex consistently across quality, balanced, and budget profiles

### Changed
- **README.md** — Replaced mermaid code block with rendered SVG image for NPM compatibility; generated PNG for broader viewer support
- **Architecture Documentation** — Updated agent count (19), verifier orchestration order, and file system layout to include adversarial review artifacts
- **Configuration** — Added `adversarial_reviewer` workflow toggle to config template (defaults enabled)

### Fixed
- **Adversarial Reviewer Model** — Corrected model assignment from Opus/Sonnet to GPT-5.3-Codex across all profiles
- **README Diagram Readability** — Changed mermaid diagram from light pastel backgrounds to dark backgrounds with white text for better contrast

## [1.1.1] - 2026-04-07

### Changed
- **Installation Commands** - Updated all README examples from `npx 808` to `npx agent-808` to match npm package name
- **Settings** - Added `git commit *` to allowed auto-approval commands
- **Security Reviewer Agent** (`agents/808-security-reviewer.md`) - Automated security review capabilities
- **SRE Reviewer Agent** (`agents/808-sre-reviewer.md`) - Site Reliability Engineering review functionality
- **Security Review Template** (`808/templates/security-review.md`) - Structured security review process template
- **SRE Review Template** (`808/templates/sre-review.md`) - SRE review process template
- **Reference Documentation**:
  - OWASP Top 10 guide (`808/references/owasp-top10.md`)
  - Security checklist (`808/references/security-checklist.md`)
  - Secure coding patterns (`808/references/secure-coding-patterns.md`)
  - Reliability checklist (`808/references/reliability-checklist.md`)
  - Resilience patterns (`808/references/resilience-patterns.md`)
  - SLA/SLO guidelines (`808/references/sla-slo-guidelines.md`)

### Changed
- **Plan Phase** - Now includes API designer in workflow for design-first development approach
- **Discuss Phase** - Added NFR (Non-Functional Requirements) and SRE topics to discussion scope
- **Execute Phase** - Integrated security reviewer and SRE reviewer into execution workflow
- **Model Profiles** - Updated model profile references in initialization and configuration

### Fixed
- Unit test compatibility and coverage

## [1.0.0] - 2026-03-31

### Added
- Initial commit
- Project setup
