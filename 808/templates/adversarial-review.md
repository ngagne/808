# Adversarial Review Template

Template for `.planning/phases/XX-name/{phase_num}-ADVERSARIAL-REVIEW.md` — adversarial code review results.

---

## File Template

```markdown
---
phase: XX-name
reviewed: YYYY-MM-DDTHH:MM:SSZ
status: passed | challenges_found | human_needed
score: N/M design decisions sound
is_re_review: false | true
previous_review_date: YYYY-MM-DD (if re-review)
previous_challenges_addressed: N/M (if re-review)
---

# Phase {X}: {Name} Adversarial Review

**Phase Goal:** {goal from ROADMAP.md}
**Reviewed:** {timestamp}
**Status:** {passed | challenges_found | human_needed}

## Executive Summary

{2-3 paragraphs providing:}
- Overall design quality assessment
- Critical/high challenges count
- Decision soundness evaluation
- Maintainability assessment
- Key strengths and fundamental concerns
- Confidence in implementation approach

{If re-review: Previous review found {N} challenges. {M} verified as resolved. {K} new challenges identified in updated code.}

**Decision Soundness Score:** {N}/{M} decisions analyzed ({percentage}% sound)

## Design Decision Challenges

| Decision | Status | Challenge | Alternative |
|----------|--------|-----------|-------------|
| {decision} | ✓/⚠️/🛑 | {concern} | {alternative} |

**Decisions:** {N} sound / {M} total ({percentage}%)

## Critical Challenges

{If no critical challenges:}
**No critical challenges identified.** Design decisions are well-justified and alternatives considered.

{If critical challenges exist:}

### ADV-001: {Challenge Title}

**Severity:** CRITICAL
**Category:** {design | pattern | complexity | assumption | alternative | maintainability | second_order}
**Location:** `path/to/file.ts:line`

**Current Approach:**
{What was implemented — code snippet or description}

**Challenge:**
{Why this is fundamentally questionable — detailed explanation}

**Alternative:**
{Different approach to consider — with code example}

**Trade-offs:**
- Current approach: {pros and cons}
- Alternative: {pros and cons}

**Recommendation:**
{Specific guidance on which to choose and why}

**References:**
- {Link to relevant patterns, best practices, or examples}

---

### ADV-002: {Challenge Title}

{Repeat for each critical challenge}

## High Severity Challenges

{If no high challenges:}
**No high severity challenges identified.**

{If high challenges exist:}

### ADV-XXX: {Challenge Title}

**Severity:** HIGH
**Category:** {design | pattern | complexity | assumption | alternative | maintainability | second_order}
**Location:** `path/to/file.ts:line`

**Current Approach:**
{What was implemented}

**Challenge:**
{Why this is questionable}

**Alternative:**
{Different approach}

**Trade-offs:**
{Honest assessment of both approaches}

---

## Medium Severity Challenges

{All MEDIUM severity challenges}

## Low Severity Challenges & Hardening Suggestions

{LOW and INFO challenges — suggestions for improvement}

## Pattern Application Review

| Pattern | Location | Appropriateness | Concern |
|---------|----------|-----------------|---------|
| Repository | src/data/user-repo.ts | ✓ APPROPRIATE | — |
| Strategy | src/payments/processor.ts | ⚠️ QUESTIONABLE | Overkill for single payment provider |
| Event Sourcing | src/orders/order-store.ts | 🛑 MISAPPLIED | Simple CRUD doesn't need event sourcing |

**Patterns:** {N} appropriate / {M} total ({percentage}%)

## Complexity Analysis

| Component | Lines | Complexity | Assessment |
|-----------|-------|------------|------------|
| OrderService.processOrder() | 45 | Moderate | ✓ APPROPRIATE |
| PaymentRouter | 120 | Complex | ⚠️ OVER-ENGINEERED |
| DataCache | 200 | Complex | 🛑 ESSENTIALLY COMPLEX |

**Overall Complexity:** {simple | appropriate | over-engineered | essentially complex}

## Hidden Assumptions Excavated

| Assumption | Location | Validated | Risk if Violated |
|-----------|----------|-----------|-----------------|
| "Payment gateway always responds <5s" | src/payments/gateway.ts:45 | ⚠️ Not validated | System hangs on slow response |
| "User email is unique" | src/users/user-service.ts:23 | ✓ DB constraint | Duplicate accounts, login issues |
| "Orders never exceed 1000 items" | src/orders/order.ts:12 | ⚠️ Not validated | Memory exhaustion, slow processing |
| "Network latency is negligible" | src/external/api-client.ts:78 | ⚠️ Not validated | Poor UX, timeout cascades |

**Assumptions:** {N} validated / {M} total ({percentage}%)

## Alternative Approaches Considered

| Decision | Implemented | Alternative | Verdict |
|----------|-------------|-------------|---------|
| Order storage | Event sourcing | Traditional CRUD | CRUD is better — simpler, sufficient |
| Notification delivery | Synchronous push | Async event emission | Async is better — more resilient |
| Cache strategy | LRU with custom impl | Redis | Redis is better — battle-tested |
| API style | REST | tRPC | Both viable — tRPC offers better type safety |

**Alternatives:** {N} decisions well-considered / {M} total

## Second-Order Effects

| Effect | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Event store grows unbounded | HIGH | MEDIUM | Implement event snapshots/ttl |
| Cache invalidation race condition | MEDIUM | HIGH | Add versioning or optimistic locking |
| Single payment gateway becomes bottleneck | LOW | HIGH | Add circuit breaker, consider failover |
| Tight coupling between order and inventory | HIGH | MEDIUM | Decouple via events |
| Complex onboarding for new developers | HIGH | MEDIUM | Add architecture documentation |

## Maintainability Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Code readability | ✓ GOOD | Clear naming, consistent style |
| Test coverage | ⚠️ PARTIAL | Missing edge case tests |
| Error handling | ⚠️ INCONSISTENT | Some paths handle errors, others don't |
| Documentation | ⚠️ MINIMAL | Complex areas lack comments |
| Debuggability | ⚠️ CHALLENGING | Missing correlation IDs in logs |
| Modifiability | ⚠️ MODERATE | Some tight coupling |

**Overall Maintainability:** {GOOD | MODERATE | CHALLENGING | POOR}

## Human Expert Review Required

{Items needing expert review}

### {Review Name}

**Challenge:** {What fundamental assumption/pattern is being questioned}
**Alternative:** {Different approach to consider}
**Why human:** {Why automated review insufficient — requires domain expertise, business context, etc.}

## Remediation Priority

1. **CRITICAL (N challenges):** Reconsider fundamental approach before proceeding
   - {Brief list of critical challenges}

2. **HIGH (N challenges):** Strongly consider alternatives within current sprint
   - {Brief list of high challenges}

3. **MEDIUM (N challenges):** Evaluate alternatives in next iteration — current approach viable
   - {Brief list of medium challenges}

4. **LOW (N challenges):** Continuous improvement suggestions
5. **INFO (N challenges):** Minor enhancements for consideration

---

_Reviewed: {timestamp}_
_Reviewer: Claude (808-adversarial-reviewer)_
{If re-review: _Previous review: {date}, {M}/{N} challenges verified as resolved_}
```

---

## Usage Notes

### When to Use Adversarial Review

- After complex feature implementation
- When multiple architectural approaches were viable
- Before merging significant changes
- When team disagrees on approach
- Before production deployment of critical systems
- When onboarding new developers (understand trade-offs)

### Status Determination

**passed:** No CRITICAL challenges, design decisions well-justified, alternatives considered honestly

**challenges_found:** One or more CRITICAL, HIGH, or MEDIUM challenges identified that warrant consideration

**human_needed:** Automated challenges pass but expert review recommended for major architectural decisions

### Severity Guidelines

**CRITICAL:** Fundamental design flaw that will cause significant issues
- System will fail under normal conditions
- Essentially unmaintainable
- Requires major refactor to fix
- Data loss or corruption risk

**HIGH:** Significant design issue that likely causes problems
- System fragile under change
- Performance issues at moderate scale
- Difficult to test or debug
- Requires significant rework to fix

**MEDIUM:** Questionable design choice that may cause issues
- More complex than necessary
- Alternative would be clearly better
- May cause issues under certain conditions
- Can be improved incrementally

**LOW:** Hardening suggestion
- Could be cleaner or more maintainable
- Minor inconsistency
- Would improve developer experience

**INFO:** Observation or minor suggestion
- Style preference
- Minor optimization opportunity
- Documentation improvement

### Integration with Other Reviews

Adversarial review complements other review types:

- **VERIFICATION.md:** Functionality — does it work?
- **SECURITY-REVIEW.md:** Security — is it safe?
- **SRE-REVIEW.md:** Reliability — is it resilient?
- **ADVERSARIAL-REVIEW.md:** Design — is it well-considered?

Cross-reference findings:
- Security vulnerabilities may stem from poor design decisions
- Reliability issues may be symptoms of fundamental architectural flaws
- Verification gaps may indicate over-engineering or under-specification
