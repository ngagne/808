# Reliability Checklist

Comprehensive SRE checklist for code review and implementation verification. Use during SRE reviews, planning, and execution.

---

## Retries and Timeouts

### Timeouts

- [ ] All HTTP client calls have timeouts configured (default: 5-30 seconds)
- [ ] Database queries have query timeouts (prevents long-running queries)
- [ ] Connection timeouts set for all external services
- [ ] Socket timeouts configured (prevents hanging connections)
- [ ] Timeout values appropriate for use case (user-facing vs background)
- [ ] Timeout chains prevented (cascading timeouts in call chains)
- [ ] AbortController or cancellation tokens used for fetch/XMLHttpRequest

### Retry Policies

- [ ] Retries implemented for transient failures (5xx, network errors, timeouts)
- [ ] Exponential backoff between retries (1s, 2s, 4s, 8s...)
- [ ] Jitter added to prevent thundering herd
- [ ] Maximum retry limit configured (prevent infinite loops)
- [ ] Retry budget tracked (prevent retry storms)
- [ ] Idempotency ensured for retried operations
- [ ] Non-retryable errors identified (4xx, validation errors)
- [ ] Retry delays don't exceed user-facing SLA

### Timeout and Retry Configuration

| Service/Component | Timeout | Max Retries | Backoff | Jitter | Status |
|------------------|---------|-------------|---------|--------|--------|
| HTTP clients | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |
| Database | ✓/✗ | N/A | N/A | N/A | |
| Redis/Cache | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |
| Message Queue | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |
| External APIs | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | |

---

## Circuit Breakers

### Circuit Breaker Implementation

- [ ] Circuit breaker pattern implemented for external dependencies
- [ ] Failure threshold configured (trip point)
- [ ] Success threshold configured (recovery point)
- [ ] Timeout for calls through circuit breaker
- [ ] Fallback response defined for open circuit
- [ ] Circuit state monitored and alerted
- [ ] Half-open state tested (gradual recovery)
- [ ] Multiple circuit breakers for different dependencies

### Circuit Breaker Configuration

| Dependency | Failure Threshold | Recovery Timeout | Fallback | Monitored | Status |
|-----------|------------------|------------------|-----------|-----------|--------|
| External API 1 | 50% | 30s | Cached data | ✓/✗ | |
| External API 2 | 50% | 30s | Default response | ✓/✗ | |
| Database | 80% | 60s | Read replica | ✓/✗ | |
| Cache | 30% | 10s | Direct DB | ✓/✗ | |

---

## Failover Mechanisms

### Database Failover

- [ ] Read replicas configured (if applicable)
- [ ] Automatic failover enabled (if using managed service)
- [ ] Connection string includes all replica members
- [ ] Read preference configured (primary, secondary, nearest)
- [ ] Write concern configured for durability needs
- [ ] Failover tested in staging
- [ ] Replication lag monitored

### Service Failover

- [ ] Multiple instances behind load balancer
- [ ] Health checks configured and working
- [ ] Unhealthy instances automatically removed
- [ ] Cross-zone/region redundancy (if required by SLO)
- [ ] DNS failover configured (if applicable)
- [ ] State shared or replicable across instances

### Load Balancing

- [ ] Load balancer configured (L4 or L7 as appropriate)
- [ ] Health check endpoint exists and returns meaningful status
- [ ] Health check interval appropriate (not too aggressive, not too slow)
- [ ] Connection draining enabled (graceful shutdown)
- [ ] Sticky sessions avoided (or justified)
- [ ] Load balancing algorithm appropriate (round-robin, least-connections, etc.)

---

## Graceful Degradation

### Feature Flags and Kill Switches

- [ ] Feature flags for non-critical functionality
- [ ] Global kill switch for emergency shutdown
- [ ] Per-feature kill switches
- [ ] Kill switches tested and verified working
- [ ] Kill switch state persisted (survives restart)
- [ ] Kill switch changes logged and audited

### Degraded Mode Operation

- [ ] System defines degraded modes (what functionality is optional)
- [ ] Cache fallback when primary data source unavailable
- [ ] Read-only mode supported (if writes fail)
- [ ] Queue requests when downstream unavailable (with limits)
- [ ] User feedback for degraded functionality
- [ ] Automatic recovery when dependencies restored

### Capacity Degradation

- [ ] Rate limiting before overload
- [ ] Request shedding under extreme load (shed lowest priority first)
- [ ] Queue backpressure propagation
- [ ] Memory limits enforced (no OOM)
- [ ] CPU throttling handled gracefully

---

## Observability — Logging

### Log Structure

- [ ] Structured logging (JSON format)
- [ ] Consistent field names across services
- [ ] Log levels used appropriately (DEBUG, INFO, WARN, ERROR)
- [ ] No sensitive data in logs (PII, passwords, tokens)
- [ ] Log sampling for high-volume debug logs
- [ ] Correlation IDs included (trace ID, request ID)
- [ ] Timestamp in ISO 8601 format with timezone

### Log Content

- [ ] Request entry/exit logged (with duration)
- [ ] Errors logged with stack traces
- [ ] Retry attempts logged
- [ ] Circuit breaker state changes logged
- [ ] Configuration changes logged
- [ ] Authentication/authorization events logged

### Log Infrastructure

- [ ] Logs shipped to central system (ELK, Splunk, etc.)
- [ ] Log retention policy defined
- [ ] Log search and alerting configured
- [ ] Log volume monitored (sudden spikes indicate issues)

---

## Observability — Metrics

### Four Golden Signals

- [ ] **Latency:** Time to process requests (histogram with buckets)
- [ ] **Traffic:** Requests per second, concurrent connections
- [ ] **Errors:** Error rate, error percentage
- [ ] **Saturation:** CPU, memory, disk, network utilization

### SLI Metrics

- [ ] Availability SLI (successful requests / total requests)
- [ ] Latency SLI (p50, p90, p95, p99 percentiles)
- [ ] Quality SLI (correct responses / total responses)
- [ ] Freshness SLI (data age, replication lag)

### Metric Infrastructure

- [ ] Metrics exported to monitoring system (Prometheus, Datadog, etc.)
- [ ] Metric names follow conventions (service.metric.name)
- [ ] Metric labels/tags consistent and limited cardinality
- [ ] Metric collection interval appropriate (10s-60s)
- [ ] Metric retention policy defined

---

## Observability — Tracing

### Distributed Tracing

- [ ] Trace context propagated across service boundaries
- [ ] Trace ID included in logs
- [ ] Span names follow conventions (method, operation)
- [ ] Span tags include relevant metadata (status, error)
- [ ] Sampling configured (100% for errors, lower for success)
- [ ] Trace visualization available (Jaeger, Zipkin, X-Ray)

### Trace Coverage

- [ ] Entry points create trace spans
- [ ] All external calls traced (HTTP, DB, cache, queue)
- [ ] Async operations traced (background jobs, events)
- [ ] Error spans include exception details

---

## Observability — Alerting

### Alert Configuration

- [ ] Alerts tied to SLOs (error budget burn rate)
- [ ] Multi-window alerting (1h, 6h, 24h burn rates)
- [ ] Alert thresholds based on user impact
- [ ] Alert fatigue prevented (actionable alerts only)
- [ ] Alert routing configured (right team, right time)
- [ ] Alert runbooks linked

### Alert Categories

| Category | Examples | Priority | Status |
|----------|----------|----------|--------|
| Critical | Service down, data loss | Page | ✓/✗ |
| Warning | High error rate, latency | Ticket | ✓/✗ |
| Info | Deployments, config changes | Log | ✓/✗ |

---

## Error Handling

### Error Classification

- [ ] Transient errors identified (retryable)
- [ ] Permanent errors identified (non-retryable)
- [ ] Error types/hierarchy defined
- [ ] Errors include context (what, where, why)

### Error Propagation

- [ ] Errors caught at appropriate boundaries
- [ ] Errors not swallowed (logged or re-thrown)
- [ ] User-facing errors sanitized (no internal details)
- [ ] Error responses include retry-after when appropriate

### Error Recovery

- [ ] Automatic recovery for transient failures
- [ ] Dead letter queues for poison messages
- [ ] Manual intervention path for unresolvable errors
- [ ] Error recovery metrics tracked

---

## Rate Limiting and Backpressure

### Rate Limiting

- [ ] Rate limits at API boundaries
- [ ] Per-user/per-key rate limiting
- [ ] Rate limit headers returned (X-RateLimit-*)
- [ ] Rate limit exceeded returns 429 with retry-after
- [ ] Rate limits documented for API consumers

### Backpressure

- [ ] Queue size limits configured
- [ ] Backpressure propagated upstream
- [ ] Slow consumers handled (don't buffer indefinitely)
- [ ] Flow control implemented (pull-based where possible)

---

## Resource Management

### Connection Pools

- [ ] Pool size configured (min, max)
- [ ] Connection timeout configured
- [ ] Idle connection cleanup
- [ ] Pool exhaustion handled (fail fast or queue)
- [ ] Pool metrics tracked (active, idle, waiting)

### Memory Management

- [ ] Memory limits configured
- [ ] Large object handling (streaming vs buffering)
- [ ] Memory leak prevention (cleanup handlers)
- [ ] GC pressure monitored

### Shutdown Handling

- [ ] Graceful shutdown implemented
- [ ] In-flight requests completed (with timeout)
- [ ] Connections drained
- [ ] Resources cleaned up (files, sockets, handles)
- [ ] Shutdown signal handled (SIGTERM, SIGINT)

---

## Single Points of Failure (SPOF)

### Infrastructure SPOFs

- [ ] No single database instance (replicas or clustering)
- [ ] No single cache instance (cluster or fallback)
- [ ] No single load balancer (HA pair or multiple)
- [ ] No single message broker (cluster or mirrors)
- [ ] Cross-zone redundancy (for high availability)

### Application SPOFs

- [ ] No singleton state (or state replicated)
- [ ] No single scheduler instance (leader election)
- [ ] No single worker (multiple consumers)
- [ ] Session state externalized (not in-memory)

---

## Dependency Management

### External Dependencies

- [ ] All external dependencies identified
- [ ] Critical dependencies have fallbacks
- [ ] Dependency health monitored
- [ ] Dependency SLAs reviewed
- [ ] Alternative providers identified (for critical deps)

### Internal Dependencies

- [ ] Service dependencies documented
- [ ] Dependency health checks exist
- [ ] Circular dependencies avoided
- [ ] Dependency versioning strategy defined

---

## Capacity Planning

### Current Capacity

- [ ] Current load documented (RPS, concurrent users)
- [ ] Resource utilization baseline established
- [ ] Bottlenecks identified
- [ ] Headroom calculated (current vs max capacity)

### Growth Planning

- [ ] Growth rate tracked
- [ ] Capacity forecast (3, 6, 12 months)
- [ ] Scaling strategy defined (horizontal, vertical)
- [ ] Scaling triggers defined (auto-scaling)

---

## Google's Four Pillars Assessment

| Pillar | Checklist Items | Status |
|--------|----------------|--------|
| SLIs/SLOs | Metrics defined, targets set, error budgets | ✓/⚠️/🛑 |
| Observability | Logging, metrics, tracing, alerting | ✓/⚠️/🛑 |
| Resilience | Retries, timeouts, circuit breakers, failover | ✓/⚠️/🛑 |
| Operations | Runbooks, deployment, rollback, on-call | ✓/⚠️/🛑 |

---

_See also:_
- _`resilience-patterns.md` — Implementation patterns for reliability_
- _`sla-slo-guidelines.md` — SLO definition and measurement_
