# SRE Review Template

Template for `.planning/phases/XX-name/{phase_num}-SRE-REVIEW.md` — SRE reliability review results.

---

## File Template

```markdown
---
phase: XX-name
reviewed: YYYY-MM-DDTHH:MM:SSZ
status: passed | findings_found | human_needed
score: N/M reliability checks passed
---

# Phase {X}: {Name} SRE Review

**Phase Goal:** {goal from ROADMAP.md}
**Reviewed:** {timestamp}
**Status:** {status}

## Executive Summary

{2-3 paragraphs providing:}
- Overall reliability posture assessment
- Critical/high findings count
- Four pillars compliance level
- Production readiness assessment
- Key reliability strengths and concerns

**Reliability Score:** {N}/{M} checks passed ({percentage}%)

## Reliability Pillars Assessment

| Pillar | Status | Findings | Details |
|--------|--------|----------|---------|
| SLIs/SLOs | ✓/⚠️/🛑 | count | details |
| Observability | ✓/⚠️/🛑 | count | details |
| Resilience | ✓/⚠️/🛑 | count | details |
| Operations | ✓/⚠️/🛑 | count | details |

**Pillars:** {N}/4 fully compliant

## Critical Findings

{If no critical findings:}
**No critical findings identified.**

{If critical findings exist:}

### SRE-001: {Finding Title}

**Severity:** CRITICAL
**Category:** {retry | timeout | circuit_breaker | failover | observability | etc.}
**Location:** `path/to/file.ts:line`
**Reliability Pillar:** {SLI/SLO | Observability | Resilience | Operations}

**Description:**
{Detailed explanation of the reliability gap}

**Failure Scenario:**
{How this could cause a production incident — specific sequence of events}

**Evidence:**
```language
// Code snippet showing the reliability gap
```

**Remediation:**
```language
// Reliable implementation example
```

**References:**
- {Link to resilience patterns, SRE best practices}

---

### SRE-002: {Finding Title}

{Repeat for each critical finding}

## High Severity Findings

{If no high findings:}
**No high severity findings identified.**

{If high findings exist:}

### SRE-XXX: {Finding Title}

**Severity:** HIGH
**Category:** {category}
**Location:** `path/to/file.ts:line`
**Reliability Pillar:** {pillar}

**Description:**
{Detailed explanation}

**Remediation:**
{Specific fix instructions with code example}

---

## Medium Severity Findings

{List medium severity findings with same format, or summary if many}

## Low Severity Findings & Hardening Suggestions

{List low severity findings and informational hardening suggestions}

## Architecture Reliability

### Single Points of Failure

| Component | SPOF Risk | Mitigation | Status |
|-----------|-----------|------------|--------|
| Database | HIGH | Read replica configured | ✓ Mitigated |
| Cache | MEDIUM | Fallback to DB | ✓ Mitigated |
| External API | CRITICAL | No fallback | 🛑 Not mitigated |

### Dependency Analysis

| Dependency | Criticality | Fallback | Status |
|------------|-------------|----------|--------|
| PostgreSQL | CRITICAL | Read replica | ✓ |
| Redis | HIGH | Direct DB query | ✓ |
| Stripe API | CRITICAL | None | 🛑 |
| SendGrid | MEDIUM | Queue for retry | ✓ |

## SLO/SLA Compliance

{If SLO requirements exist:}

| SLO | Target | Measured | Alerting | Status |
|-----|--------|----------|----------|--------|
| Availability | 99.9% | 99.95% | Configured | ✓ SATISFIED |
| Latency (p95) | < 500ms | 320ms | Configured | ✓ SATISFIED |
| Error Rate | < 0.1% | 0.05% | Not configured | ⚠️ PARTIAL |

**Coverage:** {N}/{M} SLOs fully implemented

## Human SRE Review Required

{If no human review needed:}
**No SRE expert review required.**

{If human review needed:}

### 1. {Review Name}

**Review:** {What to test/review}
**Expected:** {Reliable behavior or configuration}
**Why human:** {Why automated check is insufficient}

### 2. {Review Name}

**Review:** {What to test/review}
**Expected:** {Reliable behavior or configuration}
**Why human:** {Why automated check is insufficient}

## Remediation Priority

### Before Production (CRITICAL — Fix before deployment)

1. **SRE-001:** {title} — {one-line description}
2. **SRE-002:** {title} — {one-line description}

### Within Sprint (HIGH — Fix within 1-2 weeks)

1. **SRE-XXX:** {title} — {one-line description}
2. **SRE-XXX:** {title} — {one-line description}

### Next Quarter (MEDIUM — Resilience hardening)

{List medium findings}

### Backlog (LOW — Continuous improvement)

{List low findings}

## Production Readiness Checklist

- [ ] No CRITICAL findings outstanding
- [ ] All HIGH findings addressed or accepted risk
- [ ] Monitoring and alerting configured
- [ ] Runbooks created for failure scenarios
- [ ] On-call rotation defined
- [ ] Rollback procedure tested

---

## Review Metadata

**Review approach:** SRE-focused code analysis + Four Pillars assessment
**SRE scope:** {from requirements | derived from deliverables}
**Files reviewed:** {N}
**Automated checks:** {N} passed, {M} failed
**Human reviews required:** {N}
**Total review time:** {duration}

---
*Reviewed: {timestamp}*
*Reviewer: Claude (808-sre-reviewer)*
```

---

## Guidelines

**Status values:**
- `passed` — No CRITICAL or HIGH findings, all reliability pillars compliant
- `findings_found` — One or more CRITICAL, HIGH, or MEDIUM findings identified
- `human_needed` — Automated checks pass but SRE expert review recommended

**Severity levels:**
- **CRITICAL:** Production incident risk — fix before deployment
- **HIGH:** Likely to cause incidents — fix within sprint
- **MEDIUM:** Resilience gap — address in next quarter
- **LOW:** Hardening suggestion — continuous improvement backlog
- **INFO:** Observability or documentation improvement

**Evidence requirements:**
- Always include file path and line number
- Show unreliable code snippet
- Show reliable implementation example
- Reference reliability pillar affected

**Pillar assessment:**
- Assess all 4 pillars even if no findings
- Use ✓ for fully compliant, ⚠️ for partial, 🛑 for non-compliant
- Link findings to specific pillars

**Remediation guidance:**
- Provide actionable fix instructions
- Include reliable code examples
- Reference SRE best practices
- Prioritize by severity and incident risk

---

## Example

```markdown
---
phase: 03-payment-integration
reviewed: 2025-01-15T17:30:00Z
status: findings_found
score: 14/20 reliability checks passed
---

# Phase 3: Payment Integration SRE Review

**Phase Goal:** Integrate Stripe payment processing for user subscriptions
**Reviewed:** 2025-01-15T17:30:00Z
**Status:** findings_found

## Executive Summary

The payment integration implements core functionality correctly but has **2 critical reliability gaps** that must be addressed before production deployment. The Stripe API integration lacks timeout configuration and retry logic, creating cascade failure risk. Observability is incomplete — metrics exist but no alerting configured.

**Reliability Score:** 14/20 checks passed (70%)

**Key concerns:**
- No timeout on Stripe API calls (CRITICAL)
- No retry logic for transient failures (CRITICAL)
- Missing circuit breaker for Stripe dependency (HIGH)
- No SLO alerting configured (HIGH)
- Payment metrics tracked but no dashboards (MEDIUM)

## Reliability Pillars Assessment

| Pillar | Status | Findings | Details |
|--------|--------|----------|---------|
| SLIs/SLOs | ⚠️ | 2 | Metrics defined, no alerting |
| Observability | ⚠️ | 1 | Logging present, no dashboards |
| Resilience | 🛑 | 3 | No timeouts, retries, or circuit breakers |
| Operations | ⚠️ | 1 | Runbooks needed |

**Pillars:** 0/4 fully compliant

## Critical Findings

### SRE-001: No Timeout on Stripe API Calls

**Severity:** CRITICAL
**Category:** timeout
**Location:** `src/services/payment/stripe.ts:24`
**Reliability Pillar:** Resilience

**Description:**
Stripe API calls have no timeout configured. If Stripe experiences latency or the network hangs, requests will wait indefinitely, exhausting connection pools and causing cascade failure.

**Failure Scenario:**
1. Stripe experiences elevated latency (e.g., 30+ seconds)
2. Payment requests accumulate, waiting for response
3. Connection pool exhausted (all 10 connections in use)
4. All subsequent payment requests queue, waiting for available connection
5. System becomes unresponsive to all payment requests
6. User-facing checkout hangs, eventually timing out at browser level (2+ minutes)

**Evidence:**
```typescript
// ❌ VULNERABLE - Line 24
async function chargeCustomer(customerId: string, amount: number) {
  // No timeout - waits indefinitely
  const charge = await stripe.charges.create({
    customer: customerId,
    amount: amount,
    currency: 'usd',
  });
  return charge;
}
```

**Remediation:**
```typescript
// ✅ SECURE - Timeout configured
import { AbortController } from 'node-abort-controller';

async function chargeCustomer(customerId: string, amount: number, timeoutMs: number = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const charge = await stripe.charges.create(
      {
        customer: customerId,
        amount: amount,
        currency: 'usd',
      },
      {
        signal: controller.signal, // Pass to Stripe SDK if supported
        timeout: timeoutMs, // Or use SDK timeout option
      }
    );
    return charge;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**References:**
- `resilience-patterns.md` — Timeout Patterns
- Stripe SDK timeout documentation

---

### SRE-002: No Retry Logic for Transient Failures

**Severity:** CRITICAL
**Category:** retry
**Location:** `src/services/payment/stripe.ts:24`
**Reliability Pillar:** Resilience

**Description:**
Payment processing has no retry logic for transient failures (network errors, 5xx from Stripe). Single transient failure causes immediate payment failure, requiring manual retry by user.

**Failure Scenario:**
1. User attempts checkout
2. Temporary network glitch causes request to fail
3. No retry — immediate error shown to user
4. User may abandon purchase or retry manually
5. Lost revenue from transient failure

**Remediation:**
```typescript
// ✅ RESILIENT - Exponential backoff with jitter
async function chargeCustomerWithRetry(
  customerId: string, 
  amount: number,
  maxRetries: number = 3
): Promise<Stripe.Charge> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await chargeCustomer(customerId, amount, 8000);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) break;
      
      // Don't retry on non-transient errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s + jitter
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

function isNonRetryableError(error: any): boolean {
  // Don't retry on card declined, invalid amount, etc.
  if (error.type === 'StripeCardError') return true;
  if (error.type === 'StripeInvalidRequestError') return true;
  // Retry on network errors, 5xx, timeouts
  return false;
}
```

## High Severity Findings

### SRE-003: No Circuit Breaker for Stripe Dependency

**Severity:** HIGH
**Category:** circuit_breaker
**Location:** `src/services/payment/stripe.ts`
**Reliability Pillar:** Resilience

**Description:**
No circuit breaker pattern implemented. If Stripe experiences extended outage, system continues sending requests, exhausting resources and potentially queueing thousands of failed payments.

**Remediation:**
```typescript
import { CircuitBreaker } from 'opossum';

const stripeBreaker = new CircuitBreaker(chargeCustomerWithRetry, {
  timeout: 8000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10,
});

// Fallback: queue payment for later processing
stripeBreaker.fallback((customerId, amount) => {
  logger.warn('Circuit open, queuing payment', { customerId, amount });
  return queuePaymentForLater(customerId, amount);
});

async function processPayment(customerId: string, amount: number) {
  return stripeBreaker.fire(customerId, amount);
}
```

### SRE-004: No SLO Alerting Configured

**Severity:** HIGH
**Category:** observability
**Location:** `monitoring/alerts/`
**Reliability Pillar:** SLIs/SLOs

**Description:**
Payment success rate and latency metrics are collected but no alerts configured. SLO violations would go unnoticed until users report issues.

**Remediation:**
Configure Prometheus alerting rules:
```yaml
groups:
  - name: Payment SLO
    rules:
      - alert: PaymentHighErrorRate
        expr: |
          (
            sum(rate(payment_errors_total[5m])) 
            / 
            sum(rate(payment_requests_total[5m]))
          ) > 0.01  # 1% error rate
        for: 5m
        annotations:
          summary: "Payment error rate elevated ({{ $value }})"
```

## Medium Severity Findings

### SRE-005: No Payment Dashboards

**Severity:** MEDIUM
**Category:** observability
**Location:** `monitoring/dashboards/`
**Reliability Pillar:** Observability

**Description:**
Payment metrics exist but no Grafana dashboards created. Operations team lacks visibility into payment health.

**Remediation:**
Create Grafana dashboard with:
- Payment success rate over time
- Payment latency histogram (p50, p95, p99)
- Payment volume by method (card, ACH, etc.)
- Circuit breaker state
- Queue depth for deferred payments

## Low Severity Findings & Hardening Suggestions

1. **INFO:** Add correlation IDs to payment logs for tracing
2. **INFO:** Create runbook for payment failure scenarios
3. **INFO:** Implement idempotency keys for payment retries

## Architecture Reliability

### Single Points of Failure

| Component | SPOF Risk | Mitigation | Status |
|-----------|-----------|------------|--------|
| Stripe API | CRITICAL | Queue fallback | ⚠️ Partial |
| PostgreSQL | HIGH | Read replica | ✓ Mitigated |
| Redis | MEDIUM | Fallback to DB | ✓ Mitigated |

### Dependency Analysis

| Dependency | Criticality | Fallback | Status |
|------------|-------------|----------|--------|
| Stripe | CRITICAL | Queue for retry | ⚠️ Partial |
| PostgreSQL | CRITICAL | Read replica | ✓ |
| Redis | HIGH | Direct DB | ✓ |

## SLO/SLA Compliance

| SLO | Target | Measured | Alerting | Status |
|-----|--------|----------|----------|--------|
| Payment Success Rate | 99.9% | 99.95% | Not configured | ⚠️ PARTIAL |
| Payment Latency (p95) | < 2s | 1.2s | Not configured | ⚠️ PARTIAL |

**Coverage:** 0/2 SLOs fully implemented (alerting missing)

## Human SRE Review Required

### 1. Capacity Planning

**Review:** Estimate payment volume and size infrastructure accordingly
**Expected:** Handle 10x peak traffic with < 2s latency
**Why human:** Requires business context and growth projections

### 2. Incident Response Design

**Review:** Define on-call rotation and escalation path for payment failures
**Expected:** Page on-call within 5 minutes of SLO violation
**Why human:** Requires organizational decisions

## Remediation Priority

### Before Production (CRITICAL)

1. **SRE-001:** No timeout on Stripe calls — Add 8 second timeout
2. **SRE-002:** No retry logic — Implement exponential backoff

### Within Sprint (HIGH)

1. **SRE-003:** No circuit breaker — Add circuit breaker with queue fallback
2. **SRE-004:** No SLO alerting — Configure Prometheus alerts

### Next Quarter (MEDIUM)

1. **SRE-005:** No dashboards — Create Grafana payment dashboard

---

## Production Readiness Checklist

- [ ] No CRITICAL findings outstanding
- [ ] All HIGH findings addressed or accepted risk
- [ ] Monitoring and alerting configured
- [ ] Runbooks created for failure scenarios
- [ ] On-call rotation defined
- [ ] Rollback procedure tested

---

## Review Metadata

**Review approach:** SRE-focused code analysis + Four Pillars assessment
**SRE scope:** Derived from payment integration deliverables
**Files reviewed:** 12
**Automated checks:** 14 passed, 6 failed
**Human reviews required:** 2
**Total review time:** 8 min

---
*Reviewed: 2025-01-15T17:30:00Z*
*Reviewer: Claude (808-sre-reviewer)*
```
