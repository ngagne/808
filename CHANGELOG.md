# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **API Designer Agent** (`agents/808-api-designer.md`) - Specialized agent for API design and contract definition
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
