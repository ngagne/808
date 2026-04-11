# Adversarial Review Guide

Comprehensive guide for adversarial code review. This guide provides patterns, questioning frameworks, and critique techniques for challenging implementation decisions constructively.

---

## What is Adversarial Review?

Adversarial review is **not** criticism for its own sake. It's a structured approach to stress-testing design decisions by:

1. **Questioning assumptions** - What must be true for this to work?
2. **Challenging patterns** - Is this pattern appropriate here?
3. **Identifying blind spots** - What second-order effects are missed?
4. **Exploring alternatives** - What other approaches exist?
5. **Assessing trade-offs** - Are the trade-offs understood and intentional?

The goal: Find the strongest version of the solution by challenging every weak point.

---

## Adversarial Questioning Frameworks

### 1. First Principles Thinking

**Strip away all assumptions and rebuild from scratch.**

Questions:
- What problem are we actually solving?
- What is the simplest possible thing that could work?
- What constraints are real vs. self-imposed?
- If we started today with no existing code, would we build it this way?

Example:
```typescript
// Current: Complex event sourcing system
class EventSourcedAggregate {
  private events: DomainEvent[] = [];
  private version: number = 0;
  
  apply(event: DomainEvent) {
    this.events.push(event);
    this.when(event);
    this.version++;
  }
  
  // 200 lines of event handling, snapshotting, versioning...
}

// First principles: What do we actually need?
class Order {
  id: string;
  status: string;
  items: OrderItem[];
  
  addItem(item: OrderItem) {
    this.items.push(item);
    // That's it. We just need to track order state.
  }
}

// Add complexity ONLY when proven necessary:
// - Need audit trail? Add event logging
// - Need concurrency control? Add optimistic locking
// - Need replay? Store events
```

### 2. Inversion Thinking

**What if we did the exact opposite?**

Questions:
- Pull vs. push?
- Synchronous vs. asynchronous?
- Centralized vs. distributed?
- Eager vs. lazy?
- Monolith vs. microservice?
- SQL vs. NoSQL?
- Client-side vs. server-side?

Example:
```typescript
// Current: Push-based notification system
class NotificationService {
  async sendNotification(userId: string, message: string) {
    const user = await this.userRepo.findById(userId);
    await this.emailProvider.send(user.email, message);
    await this.smsProvider.send(user.phone, message);
    await this.pushProvider.send(user.deviceToken, message);
  }
}

// Inversion: What if users pull notifications?
class NotificationService {
  async createNotification(userId: string, message: string) {
    await this.notificationRepo.create({
      userId,
      message,
      status: 'pending',
      createdAt: new Date()
    });
  }
  
  // Users fetch their notifications when they check
  async getPendingNotifications(userId: string) {
    return this.notificationRepo.findPending(userId);
  }
}

// Benefits: No failure when email/SMS is down
// Benefits: User controls when to receive
// Trade-off: Delayed delivery
```

### 3. Scale Extremes

**What happens at 10x, 100x, 1000x scale?**

Questions:
- What breaks first?
- What becomes a bottleneck?
- What assumptions become invalid?
- What manual processes become impossible?

Example:
```typescript
// Current: In-memory cache
const cache = new Map<string, any>();

function getData(id: string): any {
  if (cache.has(id)) return cache.get(id);
  const data = fetchData(id);
  cache.set(id, data);  // Never evicts - memory grows forever
  return data;
}

// At 1000x scale: Memory exhaustion
// At 10000x scale: Cache hit rate drops (too much data)
// At 100000x scale: Single process can't handle load

// Scale-aware solution:
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  
  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V) {
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 4. Failure Mode Analysis

**How does this fail? What happens when it does?**

Questions:
- What dependencies could fail?
- What happens under network partition?
- What happens with bad input?
- What happens under concurrent access?
- What's the blast radius?

Example:
```typescript
// Current: Sequential external calls
async function processPayment(order: Order) {
  const payment = await paymentGateway.charge(order.total);  // What if gateway times out?
  await inventoryService.reserve(order.items);               // What if inventory is down?
  await emailService.sendConfirmation(order);                // What if email service fails?
  await analyticsService.track(order);                       // What if analytics is slow?
  
  return { success: true };
}

// Failure cascade: Payment gateway timeout
// → Payment unknown
// → Inventory not reserved (or reserved without payment)
// → No confirmation sent
// → Analytics incomplete
// → Inconsistent state

// Resilient design:
async function processPayment(order: Order) {
  // 1. Create payment record first (source of truth)
  const payment = await db.payments.create({
    orderId: order.id,
    amount: order.total,
    status: 'pending'
  });
  
  // 2. Process with retry and timeout
  try {
    const result = await paymentGateway.charage(order.total, {
      timeout: 5000,
      retries: 3
    });
    await db.payments.update(payment.id, { status: 'completed' });
  } catch (error) {
    await db.payments.update(payment.id, { 
      status: 'failed', 
      error: error.message 
    });
    throw error;  // Fail fast
  }
  
  // 3. Emit event for downstream processing
  eventEmitter.emit('payment.completed', { payment, order });
  
  // Inventory, email, analytics listen to event independently
  // Each can fail without breaking payment
  // Each can retry independently
}
```

### 5. Maintainability Projection

**Can a new team member understand and modify this?**

Questions:
- How long to onboard a new developer?
- Is the code self-documenting?
- Are error messages actionable?
- Would you feel confident modifying this at 3am?
- What knowledge is tribal vs. documented?

Example:
```typescript
// Current: Magic numbers and implicit behavior
function calculate(a: number, b: number, c: boolean): number {
  if (c) {
    return a * 0.15 + b * 1.2;  // What are these numbers?
  }
  return a + b;
}

// New developer questions:
// - What is a? What is b? What is c?
// - Where does 0.15 come from? Tax rate? Commission?
// - Why 1.2? Markup? Fee?
// - What does this function actually calculate?

// Maintainable version:
interface PricingInputs {
  basePrice: number;
  quantity: number;
  applyPremium: boolean;
}

function calculateTotalPrice({ basePrice, quantity, applyPremium }: PricingInputs): number {
  const PREMIUM_RATE = 0.15;    // Premium customer discount
  const BULK_MARKUP = 1.2;      // 20% markup for bulk orders
  
  if (applyPremium) {
    const discountedBase = basePrice * PREMIUM_RATE;
    const markedUpQuantity = quantity * BULK_MARKUP;
    return discountedBase + markedUpQuantity;
  }
  
  return basePrice + quantity;
}
```

---

## Pattern Recognition Guide

### Over-Engineering Signals

- Factory patterns for objects created in one place
- Abstract classes with single implementation
- Interfaces with one implementation
- Generic solutions for specific problems
- Configuration for what could be code
- Plugin architecture for fixed extension points
- Strategy pattern for if/else logic
- Middleware for single-purpose transformation

**Question:** Is this pattern preparing for future needs that may never materialize?

### Under-Engineering Signals

- No error handling for external calls
- Hardcoded values that should be configurable
- Single implementation when alternatives clearly needed
- No validation of external input
- Missing transaction boundaries
- No logging for important operations
- No metrics for measurable behavior
- Single point of failure in critical path

**Question:** Is this the simplest thing that could work, or the simplest thing that could fail?

### Pattern Misapplication Signals

- Pattern adds indirection without value
- Pattern makes testing harder
- Pattern requires documentation to understand
- Pattern is inconsistent with rest of codebase
- Pattern solves problem that doesn't exist
- Pattern creates coupling it was meant to reduce
- Pattern violates SOLID principles it claims to support

**Question:** Does this pattern add more complexity than it removes?

---

## Common Cognitive Biases in Design

### Sunk Cost Fallacy

**Continuing with a design because of investment already made.**

Signals:
- "We've already built it this way"
- Refusing to reconsider despite clear issues
- Adding complexity to justify past decisions

Challenge:
"If we inherited this codebase today, would we choose this approach?"

### Confirmation Bias

**Seeking evidence that supports the chosen approach.**

Signals:
- Only discussing benefits of chosen approach
- Dismissing alternatives without consideration
- Ignoring warning signs that don't fit the model

Challenge:
"What evidence would convince us this is the wrong approach?"

### Cargo Cult Programming

**Using patterns because they're popular, not because they fit.**

Signals:
- Microservices for monolith-scale problems
- Event sourcing for simple CRUD
- GraphQL for single-client APIs
- Kubernetes for single-server deployments
- Blockchain for centralized data

Challenge:
"Does this pattern solve OUR problem, or is it industry hype?"

### Premature Optimization

**Optimizing before measuring or knowing bottlenecks.**

Signals:
- Complex caching without profiling
- Database sharding for small datasets
- Async processing for fast operations
- Connection pooling for few connections
- Load balancing for single instance

Challenge:
"What data do we have that this is a bottleneck?"

---

## Trade-off Analysis Framework

When evaluating design decisions, analyze trade-offs explicitly:

### 1. Identify the Trade-off

What is being gained vs. what is being given up?

Example:
```
Decision: Use event sourcing for order management

Gains:
- Complete audit trail
- Ability to replay state
- Temporal queries (state at time X)
- Natural event-driven architecture

Costs:
- Complexity of event versioning
- Need for snapshots (performance)
- Eventual consistency challenges
- Steeper learning curve for team
- Harder to debug
```

### 2. Evaluate Informed vs. Uninformed Trade-offs

**Informed:** Decision maker aware of both sides, chose deliberately
**Uninformed:** Decision maker unaware of what's being sacrificed

Challenge:
"Do we understand what we're giving up for these benefits?"

### 3. Consider Reversibility

**Reversible:** Can change approach without major rework
**Irreversible:** Changing approach requires significant refactoring

Challenge:
"How hard is it to change this decision later?"

### 4. Assess Option Value

**High option value:** Decision keeps future options open
**Low option value:** Decision closes off alternatives

Challenge:
"Does this decision limit our future flexibility?"

---

## Second-Order Effect Checklist

For each design decision, check for cascading effects:

### Technical Effects

- [ ] How does this affect deployment complexity?
- [ ] How does this affect testing strategy?
- [ ] How does this affect monitoring/alerting?
- [ ] How does this affect debugging/troubleshooting?
- [ ] How does this affect performance characteristics?
- [ ] How does this affect security posture?
- [ ] How does this affect data consistency?
- [ ] How does this affect backup/recovery?

### Team Effects

- [ ] How does this affect onboarding new developers?
- [ ] How does this affect code review process?
- [ ] How does this affect debugging time?
- [ ] How does this affect ability to modify code?
- [ ] How does this affect team knowledge requirements?
- [ ] How does this affect hiring (need specialized skills)?

### Business Effects

- [ ] How does this affect time-to-market?
- [ ] How does this affect operational costs?
- [ ] How does this affect reliability/availability?
- [ ] How does this affect vendor lock-in?
- [ ] How does this affect compliance requirements?
- [ ] How does this affect customer experience?

---

## Adversarial Review Heuristics

### Code Complexity Heuristics

| Metric | Warning | Critical |
|--------|---------|----------|
| Function length | >30 lines | >100 lines |
| Nesting depth | >3 levels | >5 levels |
| Parameters | >4 params | >7 params |
| Dependencies per file | >10 imports | >20 imports |
| Class methods | >10 methods | >20 methods |
| Return statements | >5 returns | >10 returns |
| Conditional branches | >10 branches | >20 branches |

### Design Decision Heuristics

| Signal | Question |
|--------|----------|
| "Just in case" | Are we building for real or hypothetical needs? |
| "Best practice" | Is this best practice for OUR context? |
| "Industry standard" | Does standard fit our problem? |
| "Proven pattern" | Proven for our use case or generally? |
| "Scalable" | Do we need scale now or later? |
| "Flexible" | Flexible for what changes? |
| "Performant" | Performance measured or assumed? |
| "Clean" | Clean or just familiar? |

### Alternative Approach Heuristics

| If you see... | Consider... |
|---------------|-------------|
| Abstract class | Could interface + composition work? |
| Inheritance | Could composition work? |
| Singleton | Could dependency injection work? |
| Global state | Could local state work? |
| Synchronous call | Could async event work? |
| Direct dependency | Could inversion of control work? |
| Custom solution | Could standard solution work? |
| Standard solution | Could simple custom solution work? |

---

## Red Flags That Warrant Deep Challenge

### Critical Red Flags

1. **No error handling for external calls** - External services WILL fail
2. **Hardcoded credentials or secrets** - Security fundamental, not feature
3. **No logging for critical operations** - Cannot troubleshoot production issues
4. **Magic numbers without context** - Tribal knowledge, not maintainable code
5. **No tests for business logic** - Changes become fearless
6. **Single point of failure in critical path** - System fails when component fails
7. **No timeout configuration** - Infinite wait = system hang
8. **No input validation** - Trusting external data = vulnerability
9. **Inconsistent patterns** - Cognitive load for no benefit
10. **Undocumented complex logic** - Only one person understands it

### High Red Flags

1. **Overly generic abstractions** - May be preparing for non-existent needs
2. **Duplicate logic without DRY consideration** - Maintenance burden
3. **Missing transaction boundaries** - Data consistency risk
4. **No metrics for measurable behavior** - Flying blind in production
5. **Inconsistent error handling** - Some paths handle errors, others don't
6. **Deep inheritance chains** - Hard to understand, harder to modify
7. **Large interfaces** - Implementors must implement everything
8. **No documentation for public APIs** - Users must read source
9. **Tight coupling** - Changes ripple through system
10. **Hidden dependencies** - Hard to understand system boundaries

### Medium Red Flags

1. **Naming inconsistencies** - Same concept, different names
2. **Missing type information** - Unclear what data flows where
3. **Inconsistent formatting** - Distracts from understanding logic
4. **Comments explaining "what"** - Code should explain what, comments why
5. **No code examples in complex areas** - Hard to understand intent
6. **Unused imports/variables** - Dead code signals inattention
7. **Inconsistent return types** - Caller must handle multiple shapes
8. **No null/undefined handling** - Potential runtime errors
9. **Missing edge case handling** - Works for happy path only
10. **Inconsistent async patterns** - Some promises, some callbacks

---

## Reporting Guidelines

### Severity Definitions

**CRITICAL:** Fundamental design flaw that will cause significant issues
- System will fail under normal conditions
- Data loss or corruption risk
- Security vulnerability
- Essentially unmaintainable
- Requires major refactor to fix

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
- Nice-to-have improvement

**INFO:** Observation or minor suggestion
- Style preference
- Minor optimization opportunity
- Documentation improvement
- Future consideration

### Challenge Structure

Each challenge should include:

1. **Title:** Brief description of the challenge
2. **Severity:** CRITICAL/HIGH/MEDIUM/LOW/INFO
3. **Category:** Design/Pattern/Complexity/Assumption/Alternative/Maintainability
4. **Location:** File and line number (if applicable)
5. **Current Approach:** What was implemented
6. **Challenge:** Why this is being questioned
7. **Alternative:** Different approach to consider
8. **Trade-offs:** Honest assessment of both approaches
9. **Recommendation:** Specific guidance

### Constructive Challenge Rules

1. **Challenge the design, not the developer** - Focus on code, not choices
2. **Provide alternatives, not just criticism** - Every challenge needs viable alternative
3. **Acknowledge valid reasoning** - If current approach is better, say so
4. **Be specific, not general** - Point to exact code, not vague feelings
5. **Explain the "why"** - Don't just say "this is wrong", explain why
6. **Consider context** - May be constraints you're unaware of
7. **Suggest incrementally** - Don't demand complete rewrite
8. **Flag uncertainty** - If unsure, present as question not statement

---

## Success Criteria

- [ ] All major design decisions challenged constructively
- [ ] Alternative approaches considered and evaluated
- [ ] Hidden assumptions identified and validated
- [ ] Second-order effects analyzed
- [ ] Trade-offs explicitly documented
- [ ] Pattern applications reviewed for appropriateness
- [ ] Complexity assessed against problem requirements
- [ ] Maintainability evaluated honestly
- [ ] Challenges structured with full context
- [ ] Recommendations actionable and specific
- [ ] Previous challenges (if re-review) verified as resolved
- [ ] Report returned to orchestrator (not committed)
