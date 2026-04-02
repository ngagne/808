# SLA/SLO Guidelines

Guidelines for defining, measuring, and managing Service Level Agreements (SLAs) and Service Level Objectives (SLOs). Use for SRE reviews and reliability planning.

---

## Definitions

| Term | Definition | Example |
|------|------------|---------|
| **SLI** (Service Level Indicator) | What you measure | Request latency, error rate, availability |
| **SLO** (Service Level Objective) | Target value for the SLI | 99.9% availability, p99 latency < 500ms |
| **SLA** (Service Level Agreement) | Contract with consequences if missed | 99.9% availability or customer gets credit |
| **Error Budget** | Allowed failure before SLO miss | 0.1% = 43 minutes downtime/month |

---

## Four Golden Signals

### 1. Latency

**What:** Time to process a request

**SLI Examples:**
- HTTP request duration (milliseconds)
- Database query duration
- End-to-end user action time

**Measurement:**
```typescript
// Histogram with appropriate buckets
const latencyHistogram = new Histogram({
  name: 'http_request_duration_seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// Record latency
latencyHistogram.observe({ method: 'GET', route: '/api/users' }, duration);
```

**SLO Examples:**
| Service Type | Latency SLO | Percentile |
|-------------|-------------|------------|
| User-facing API | < 200ms | p95 |
| User-facing API | < 500ms | p99 |
| Internal service | < 100ms | p99 |
| Batch processing | < 1 hour | 100% |

### 2. Traffic

**What:** Demand on your system

**SLI Examples:**
- Requests per second (RPS)
- Concurrent connections
- Data throughput (MB/s)

**Measurement:**
```typescript
// Request rate counter
const requestCounter = new Counter({
  name: 'http_requests_total',
  labelNames: ['method', 'route'],
});

// Calculate RPS from rate
const rps = rate(requestCounter);
```

**SLO Examples:**
| Service Type | Traffic SLO |
|-------------|-------------|
| API | Handle 1000 RPS sustained |
| API | Handle 10x peak without degradation |
| WebSocket | Support 10,000 concurrent connections |

### 3. Errors

**What:** Rate of failed requests

**SLI Examples:**
- HTTP 5xx rate
- Error response percentage
- Failed dependency rate

**Measurement:**
```typescript
// Error rate calculation
const errorRate = sum(rate(http_errors_total{status=~"5.."})) 
                / sum(rate(http_requests_total));

// Alert when error rate exceeds threshold
// Error budget burn: error_rate > (1 - SLO_target)
```

**SLO Examples:**
| Service Type | Error SLO |
|-------------|-----------|
| User-facing API | < 0.1% errors (99.9% success) |
| Internal service | < 1% errors (99% success) |
| Critical path | < 0.01% errors (99.99% success) |

### 4. Saturation

**What:** How full your resources are

**SLI Examples:**
- CPU utilization
- Memory utilization
- Disk utilization
- Connection pool utilization
- Queue depth

**Measurement:**
```typescript
// Resource utilization gauges
const cpuGauge = new Gauge({
  name: 'process_cpu_utilization',
  help: 'CPU utilization (0-1)',
});

const memoryGauge = new Gauge({
  name: 'process_memory_utilization',
  help: 'Memory utilization (0-1)',
});

const queueDepth = new Gauge({
  name: 'queue_depth',
  labelNames: ['queue_name'],
});

// Alert when approaching limits
// saturation > 0.8 for 5 minutes
```

**SLO Examples:**
| Resource | Saturation SLO |
|----------|----------------|
| CPU | < 70% average, < 90% peak |
| Memory | < 80% average, < 95% peak |
| Disk | < 70% capacity |
| Connections | < 80% of pool size |

---

## SLO Target Guidelines

### Availability Tiers

| Tier | Availability | Error Budget | Downtime/Month | Use Case |
|------|-------------|--------------|----------------|----------|
| Standard | 99% | 1% | 7.3 hours | Internal tools, dev environments |
| Business | 99.9% | 0.1% | 43 minutes | Customer-facing apps |
| Critical | 99.95% | 0.05% | 22 minutes | E-commerce, payments |
| Mission-Critical | 99.99% | 0.01% | 4.3 minutes | Financial trading, healthcare |
| Ultra-High | 99.999% | 0.001% | 26 seconds | Telecom, emergency services |

### Latency Tiers

| Tier | p95 Latency | p99 Latency | Use Case |
|------|-------------|-------------|----------|
| Real-time | < 50ms | < 100ms | Gaming, video conferencing |
| Interactive | < 200ms | < 500ms | Web apps, mobile apps |
| Standard | < 500ms | < 1s | APIs, internal services |
| Background | < 5s | < 10s | Batch jobs, async processing |

---

## Error Budget Policy

### Error Budget Calculation

```
Error Budget = 1 - SLO Target

Example: 99.9% SLO
Error Budget = 1 - 0.999 = 0.001 = 0.1%

Monthly Error Budget (minutes):
= Error Budget × Minutes in Month
= 0.001 × 43,200 minutes
= 43.2 minutes
```

### Error Budget Burn Rate

**Burn Rate Formula:**
```
Burn Rate = (1 - Actual Availability) / Error Budget

Example:
- SLO: 99.9% (error budget: 0.1%)
- Actual: 99.5% availability in 1 hour
- Error rate: 0.5%
- Burn Rate: 0.5% / 0.1% = 5x
```

**Alerting on Burn Rate:**

| Burn Rate | Window | Action |
|-----------|--------|--------|
| 2x | 30 days | Log warning, monitor closely |
| 5x | 7 days | Page on-call, investigate |
| 10x | 1 hour | Immediate page, stop deployments |
| 20x | 5 minutes | Critical page, all hands |

### Alert Configuration

```yaml
# Prometheus alerting rules
groups:
  - name: SLO alerts
    rules:
      # Critical: 2% error rate (14x burn rate for 99.9% SLO)
      - alert: SLOCriticalBurnRate
        expr: |
          (
            1 - (
              sum(rate(successful_requests[1h])) 
              / sum(rate(total_requests[1h]))
            )
          ) / 0.001 > 14
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "SLO burn rate critical ({{ $value }}x)"
          
      # Warning: 1% error rate (7x burn rate)
      - alert: SLOHighBurnRate
        expr: |
          (
            1 - (
              sum(rate(successful_requests[6h])) 
              / sum(rate(total_requests[6h]))
            )
          ) / 0.001 > 7
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SLO burn rate elevated ({{ $value }}x)"
```

---

## Multi-Window Burn Rate Alerts

**Concept:** Alert on burn rate across multiple time windows to catch both sudden spikes and gradual degradation.

```yaml
# Multi-window burn rate alerts
alerts:
  # Fast burn - immediate response needed
  - name: SLOFastBurn
    condition: burn_rate(1h) > 14.4 AND burn_rate(5m) > 14.4
    severity: critical
    action: Page immediately
    
  # Slow burn - investigate soon
  - name: SLOSlowBurn
    condition: burn_rate(6h) > 6 AND burn_rate(30m) > 6
    severity: warning
    action: Create ticket, investigate within 24h
    
  # Long-term trend
  - name: SLOTrend
    condition: burn_rate(24h) > 3 AND burn_rate(2h) > 3
    severity: info
    action: Review in sprint planning
```

**Burn Rate Thresholds:**

| SLO | Fast Burn (Page) | Slow Burn (Ticket) |
|-----|------------------|-------------------|
| 99% | 14.4x | 6x |
| 99.9% | 14.4x | 6x |
| 99.95% | 14.4x | 6x |
| 99.99% | 14.4x | 6x |

---

## SLO Implementation

### SLI Collection

```typescript
// ✅ Complete SLI instrumentation
import { Registry, Counter, Histogram } from 'prom-client';

class SLICollector {
  private requestCount: Counter;
  private errorCount: Counter;
  private latencyHistogram: Histogram;
  
  constructor(register: Registry, serviceName: string) {
    this.requestCount = new Counter({
      name: `${serviceName}_requests_total`,
      help: 'Total requests',
      labelNames: ['method', 'route', 'status'],
      registers: [register],
    });
    
    this.errorCount = new Counter({
      name: `${serviceName}_errors_total`,
      help: 'Total errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [register],
    });
    
    this.latencyHistogram = new Histogram({
      name: `${serviceName}_request_duration_seconds`,
      help: 'Request latency',
      labelNames: ['method', 'route'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });
  }
  
  recordRequest(method: string, route: string, status: number, duration: number) {
    this.requestCount.inc({ method, route, status });
    this.latencyHistogram.observe({ method, route }, duration);
    
    if (status >= 500) {
      this.errorCount.inc({ method, route, error_type: 'server_error' });
    }
  }
  
  // Calculate availability SLI
  async getAvailability(window: string = '5m'): Promise<number> {
    const query = `
      sum(rate(${this.requestCount.name}{status=~"2..|3..|4.."}[${window}]))
      / 
      sum(rate(${this.requestCount.name}[${window}]))
    `;
    return executePrometheusQuery(query);
  }
  
  // Calculate latency SLI (p95)
  async getLatencyP95(window: string = '5m'): Promise<number> {
    const query = `
      histogram_quantile(0.95, 
        sum(rate(${this.latencyHistogram.name}_bucket[${window}])) 
        by (le)
      )
    `;
    return executePrometheusQuery(query);
  }
}
```

### SLO Dashboard

```typescript
// ✅ Grafana dashboard configuration
const dashboard = {
  title: 'Service SLO Dashboard',
  panels: [
    {
      title: 'Availability SLO',
      targets: [
        {
          expr: `
            sum(rate(http_requests_total{status=~"2..|3..|4.."}[5m])) 
            / 
            sum(rate(http_requests_total[5m]))
          `,
          legendFormat: 'Availability',
        },
        {
          expr: '0.999', // 99.9% SLO target
          legendFormat: 'SLO Target (99.9%)',
        },
      ],
      thresholds: [
        { value: 0.999, color: 'green' },
        { value: 0.99, color: 'yellow' },
        { value: 0, color: 'red' },
      ],
    },
    {
      title: 'Latency SLO (p95)',
      targets: [
        {
          expr: `
            histogram_quantile(0.95,
              sum(rate(http_request_duration_seconds_bucket[5m]))
              by (le)
            )
          `,
          legendFormat: 'p95 Latency',
        },
        {
          expr: '0.5', // 500ms SLO target
          legendFormat: 'SLO Target (500ms)',
        },
      ],
    },
    {
      title: 'Error Budget Remaining',
      targets: [
        {
          expr: `
            1 - (
              (
                sum(rate(http_requests_total{status=~"5.."}[30d]))
                / 
                sum(rate(http_requests_total[30d]))
              ) 
              / 
              0.001  // Error budget for 99.9% SLO
            )
          `,
          legendFormat: 'Error Budget Remaining',
        },
      ],
    },
  ],
};
```

---

## SLO Review Checklist

### SLO Definition

- [ ] SLIs defined for all four golden signals
- [ ] SLO targets documented and approved
- [ ] Error budget calculated
- [ ] Measurement window defined (1h, 24h, 30d)
- [ ] SLO applies to correct scope (per endpoint, per service, per user)

### SLO Implementation

- [ ] Metrics collected for all SLIs
- [ ] Dashboards created and shared
- [ ] Alerts configured for burn rate
- [ ] Runbooks linked to alerts
- [ ] On-call rotation defined

### SLO Operations

- [ ] Error budget policy documented
- [ ] Deployment freeze triggers defined
- [ ] Incident response tied to SLO
- [ ] Regular SLO review meetings scheduled
- [ ] SLO history tracked and reported

---

## SLO Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| 100% SLO | Impossible to meet, no room for failure | Set realistic target (99.9%, 99.99%) |
| Too many SLOs | Alert fatigue, unclear priorities | Focus on 2-4 critical SLIs |
| SLOs not tied to user experience | Meeting SLO but users unhappy | Measure from user perspective |
| No error budget policy | SLO miss has no consequence | Define deployment freeze, review process |
| SLOs never reviewed | Outdated targets | Quarterly SLO review |

---

## SLO Examples by Service Type

### E-Commerce Platform

| SLI | SLO Target | Why |
|-----|------------|-----|
| Checkout success rate | 99.99% | Direct revenue impact |
| Product page load (p95) | < 2s | User experience |
| Search latency (p95) | < 500ms | User experience |
| Cart update success | 99.9% | User experience |

### Payment Processing

| SLI | SLO Target | Why |
|-----|------------|-----|
| Payment success rate | 99.99% | Financial impact |
| Payment latency (p99) | < 3s | User experience |
| Idempotency correctness | 100% | Prevent double-charging |
| Fraud detection accuracy | > 99% | Loss prevention |

### Internal API

| SLI | SLO Target | Why |
|-----|------------|-----|
| API availability | 99.9% | Internal users can retry |
| API latency (p99) | < 500ms | Downstream SLA |
| Error rate | < 0.5% | System health |

### Data Pipeline

| SLI | SLO Target | Why |
|-----|------------|-----|
| Data freshness | < 5 minutes old | Decision quality |
| Pipeline success rate | 99.5% | Downstream dependencies |
| Data accuracy | 99.99% | Business decisions |

---

_See also:_
- _`reliability-checklist.md` — Comprehensive reliability checklist_
- _`resilience-patterns.md` — Implementation patterns for reliability_

**References:**
- Google SRE Book: https://sre.google/sre-book/
- Implementing Service Level Objectives: https://sre.google/workbook/implementing-slos/
- Prometheus SLO Recording Rules: https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/
