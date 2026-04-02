# Resilience Patterns

Implementation patterns for reliability and resilience. Use these patterns during execution to ensure systems are production-ready.

---

## Timeout Patterns

### HTTP Client Timeout (Fetch API)

```typescript
// ✅ Timeout with AbortController
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage
const response = await fetchWithTimeout('https://api.example.com/data', {}, 5000);
```

### HTTP Client Timeout (Axios)

```typescript
import axios from 'axios';

// ✅ Timeout configured
const client = axios.create({
  timeout: 5000, // 5 second timeout
  baseURL: 'https://api.example.com',
});

// Per-request timeout override
const response = await client.get('/data', {
  timeout: 3000, // 3 seconds for this request
});
```

### Database Query Timeout

```typescript
// ✅ PostgreSQL with query timeout
import { Pool } from 'pg';

const pool = new Pool({
  connectionTimeoutMillis: 5000,
  query_timeout: 10000, // 10 seconds
  idleTimeoutMillis: 30000,
});

// Per-query timeout
const result = await pool.query(
  'SELECT * FROM large_table WHERE condition = $1',
  [value],
  { query_timeout: 5000 } // Override for this query
);

// ✅ MongoDB with maxTimeMS
const results = await collection
  .find({ status: 'active' })
  .maxTimeMS(5000) // 5 second timeout
  .toArray();
```

### Timeout Chain Prevention

```typescript
// ❌ UNSAFE - Timeout chain (each call waits for previous)
async function processUserData(userId: string) {
  const user = await fetchWithTimeout(`/api/users/${userId}`, {}, 5000);
  const orders = await fetchWithTimeout(`/api/orders/${userId}`, {}, 5000);
  const preferences = await fetchWithTimeout(`/api/preferences/${userId}`, {}, 5000);
  // Total: 15 seconds worst case - exceeds user-facing SLA
  
  return { user, orders, preferences };
}

// ✅ SAFE - Parallel execution with overall timeout
async function processUserData(userId: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second total
  
  try {
    const [user, orders, preferences] = await Promise.all([
      fetchWithTimeout(`/api/users/${userId}`, { signal: controller.signal }, 5000),
      fetchWithTimeout(`/api/orders/${userId}`, { signal: controller.signal }, 5000),
      fetchWithTimeout(`/api/preferences/${userId}`, { signal: controller.signal }, 5000),
    ]);
    
    return { user, orders, preferences };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## Retry Patterns

### Exponential Backoff with Jitter

```typescript
// ✅ Retry with exponential backoff and jitter
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  baseDelay: number = 1000 // 1 second
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, 5000);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) break;
      
      // Don't retry on non-transient errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.pow(2, attempt) * baseDelay;
      const jitter = Math.random() * 1000; // 0-1 second jitter
      const delay = exponentialDelay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

function isNonRetryableError(error: any): boolean {
  // Don't retry on client errors (4xx)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return true;
  }
  // Don't retry on validation errors
  if (error.code === 'VALIDATION_ERROR') {
    return true;
  }
  return false;
}
```

### Retry Budget

```typescript
// ✅ Retry budget to prevent cascade failure
class RetryBudget {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  
  constructor(maxTokens: number = 100, refillRate: number = 10) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate; // tokens per second
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }
  
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
  
  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

const globalRetryBudget = new RetryBudget(100, 10);

async function fetchWithBudget(url: string) {
  if (!globalRetryBudget.tryAcquire()) {
    throw new Error('Retry budget exhausted - shedding load');
  }
  
  return fetchWithRetry(url);
}
```

### Idempotent Retries

```typescript
// ✅ Idempotency key for retries
async function createOrderWithIdempotency(
  orderData: OrderData,
  idempotencyKey: string
): Promise<Order> {
  // Include idempotency key in request
  const response = await fetchWithRetry('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(orderData),
  });
  
  return response.json();
}

// Server-side idempotency
app.post('/api/orders', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Check if request already processed
  const cached = await redis.get(`idempotency:${idempotencyKey}`);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Process order
  const order = await createOrder(req.body);
  
  // Cache result for 24 hours
  await redis.setex(
    `idempotency:${idempotencyKey}`,
    86400,
    JSON.stringify(order)
  );
  
  res.json(order);
});
```

---

## Circuit Breaker Patterns

### Basic Circuit Breaker

```typescript
import { CircuitBreaker } from 'opossum';

// ✅ Circuit breaker for external API
const externalApiBreaker = new CircuitBreaker(
  async (data: any) => {
    const response = await fetch('https://api.external.com', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  {
    timeout: 3000, // 3 second timeout
    errorThresholdPercentage: 50, // Trip at 50% failure rate
    resetTimeout: 30000, // Try again after 30 seconds
    volumeThreshold: 10, // Minimum requests before considering trip
    rollingCountTimeout: 10000, // 10 second rolling window
  }
);

// Fallback when circuit is open
externalApiBreaker.fallback((data: any) => {
  logger.warn('Circuit open, using fallback', { data });
  return { cached: true, data: null, fromFallback: true };
});

// Monitor circuit state
externalApiBreaker.on('open', () => {
  metrics.counter('circuit_breaker.open').inc();
  logger.warn('Circuit breaker opened');
});

externalApiBreaker.on('halfOpen', () => {
  logger.info('Circuit breaker half-open - testing');
});

externalApiBreaker.on('close', () => {
  metrics.counter('circuit_breaker.closed').inc();
  logger.info('Circuit breaker closed - recovered');
});

// Usage
async function callExternalApi(data: any) {
  return externalApiBreaker.fire(data);
}
```

### Manual Circuit Breaker

```typescript
// ✅ Manual circuit breaker implementation
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class ManualCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  
  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 3,
    private resetTimeout: number = 30000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime! > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
      }
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}
```

### Cascading Circuit Breakers

```typescript
// ✅ Multiple circuit breakers for different operations
const circuits = {
  database: new CircuitBreaker(db.query, { timeout: 5000 }),
  cache: new CircuitBreaker(cache.get, { timeout: 1000 }),
  externalApi: new CircuitBreaker(externalCall, { timeout: 3000 }),
};

async function getUserData(userId: string) {
  try {
    // Try cache first
    const cached = await circuits.cache.fire(userId);
    if (cached) return cached;
  } catch (error) {
    logger.warn('Cache miss or error', { error });
  }
  
  // Fall back to database
  const user = await circuits.database.fire(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  
  // Enrich with external data (with circuit breaker)
  let externalData = null;
  try {
    externalData = await circuits.externalApi.fire(userId);
  } catch (error) {
    logger.warn('External data unavailable', { error });
    // Continue without external data - graceful degradation
  }
  
  return { ...user, externalData };
}
```

---

## Failover Patterns

### Database Failover with Replicas

```typescript
// ✅ MongoDB replica set with failover
import { MongoClient } from 'mongodb';

const client = new MongoClient(
  'mongodb://primary:27017,replica1:27017,replica2:27017/mydb',
  {
    replicaSet: 'rs0',
    readPreference: 'secondaryPreferred', // Read from replicas
    writeConcern: { w: 'majority' }, // Wait for majority acknowledgment
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
);

// Automatic failover - driver handles primary election
async function getUser(userId: string) {
  const db = client.db();
  return db.collection('users').findOne({ id: userId });
}
```

### Read/Write Splitting

```typescript
// ✅ Separate read and write connections
class DatabaseWithFailover {
  private writePool: Pool;
  private readPools: Pool[];
  private currentReadIndex = 0;
  
  constructor(writeConfig: any, readConfigs: any[]) {
    this.writePool = new Pool(writeConfig);
    this.readPools = readConfigs.map(config => new Pool(config));
  }
  
  async write(query: string, values: any[]) {
    // Always write to primary
    return this.writePool.query(query, values);
  }
  
  async read(query: string, values: any[]) {
    // Round-robin across read replicas
    const pool = this.readPools[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readPools.length;
    
    try {
      return await pool.query(query, values);
    } catch (error) {
      // Failover to next replica
      logger.warn('Read replica failed, trying next', { error });
      return this.read(query, values); // Retry with next
    }
  }
  
  async readFromPrimary(query: string, values: any[]) {
    // For read-your-writes consistency
    return this.writePool.query(query, values);
  }
}
```

### Service Discovery with Health Checks

```typescript
// ✅ Dynamic service discovery with health checking
import { createAgentClient } from 'consul';

const consul = createAgentClient();

class ServiceDiscovery {
  private serviceName: string;
  private healthyInstances: Map<string, any> = new Map();
  private healthCheckInterval: NodeJS.Timeout;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.startHealthChecks();
  }
  
  private async startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      await this.refreshInstances();
    }, 10000); // Check every 10 seconds
  }
  
  private async refreshInstances() {
    try {
      const services = await consul.health.service({
        service: this.serviceName,
        passing: true, // Only healthy instances
      });
      
      this.healthyInstances.clear();
      services.forEach((service: any) => {
        const address = `${service.Service.Address}:${service.Service.Port}`;
        this.healthyInstances.set(address, service);
      });
      
      logger.info(`Found ${this.healthyInstances.size} healthy instances`);
    } catch (error) {
      logger.error('Service discovery failed', { error });
    }
  }
  
  async getHealthyInstance(): Promise<string | null> {
    const addresses = Array.from(this.healthyInstances.keys());
    if (addresses.length === 0) return null;
    
    // Random healthy instance
    const randomIndex = Math.floor(Math.random() * addresses.length);
    return addresses[randomIndex];
  }
}

// Usage
const discovery = new ServiceDiscovery('payment-service');

async function callPaymentService(data: any) {
  const instance = await discovery.getHealthyInstance();
  if (!instance) {
    throw new Error('No healthy payment service instances');
  }
  
  return fetch(`http://${instance}/process`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

---

## Graceful Degradation Patterns

### Feature Flag Pattern

```typescript
// ✅ Feature flag with kill switch
class FeatureFlags {
  private flags: Map<string, boolean> = new Map();
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
    this.loadFlags();
  }
  
  private async loadFlags() {
    // Load from Redis (set by admin dashboard)
    const flags = await this.redis.hgetall('feature_flags');
    Object.entries(flags).forEach(([key, value]) => {
      this.flags.set(key, value === 'true');
    });
  }
  
  isEnabled(flagName: string): boolean {
    return this.flags.get(flagName) ?? false;
  }
  
  async setFlag(flagName: string, enabled: boolean) {
    await this.redis.hset('feature_flags', flagName, enabled.toString());
    this.flags.set(flagName, enabled);
    logger.info(`Feature flag updated: ${flagName} = ${enabled}`);
  }
}

const featureFlags = new FeatureFlags(redis);

// Usage
async function getRecommendations(userId: string) {
  if (!featureFlags.isEnabled('ml_recommendations')) {
    // Graceful degradation - return popular items
    logger.info('ML recommendations disabled, using fallback');
    return getPopularItems();
  }
  
  try {
    return await mlService.getRecommendations(userId);
  } catch (error) {
    logger.warn('ML service failed, using fallback', { error });
    return getPopularItems(); // Graceful degradation
  }
}
```

### Cache Fallback Pattern

```typescript
// ✅ Cache with fallback to database
async function getUserWithFallback(userId: string): Promise<User> {
  // Try cache first
  try {
    const cached = await cache.get(`user:${userId}`);
    if (cached) {
      metrics.counter('cache.hit').inc();
      return JSON.parse(cached);
    }
    metrics.counter('cache.miss').inc();
  } catch (error) {
    logger.warn('Cache unavailable, falling back to database', { error });
    metrics.counter('cache.error').inc();
  }
  
  // Fall back to database
  try {
    const user = await db.users.findOne({ id: userId });
    
    // Try to populate cache (non-blocking)
    cache.set(`user:${userId}`, JSON.stringify(user), { ttl: 300 })
      .catch(err => logger.warn('Cache set failed', { err }));
    
    return user;
  } catch (dbError) {
    logger.error('Database query failed', { error: dbError });
    throw new Error('Unable to retrieve user data');
  }
}
```

### Read-Only Mode

```typescript
// ✅ Read-only mode during write failures
class ReadOnlyMode {
  private enabled = false;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  
  enable() {
    this.enabled = true;
    this.notifyListeners();
    logger.warn('System entered read-only mode');
  }
  
  disable() {
    this.enabled = false;
    this.notifyListeners();
    logger.info('System exited read-only mode');
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.enabled));
  }
  
  onChange(listener: (enabled: boolean) => void) {
    this.listeners.add(listener);
  }
}

const readOnlyMode = new ReadOnlyMode();

// Usage
async function createOrder(orderData: OrderData): Promise<Order> {
  if (readOnlyMode.isEnabled()) {
    throw new Error('System is in read-only mode');
  }
  
  try {
    return await db.orders.create(orderData);
  } catch (error) {
    if (isWriteFailure(error)) {
      readOnlyMode.enable();
      // Notify operations team
      await alerting.send('System entered read-only mode due to write failure');
    }
    throw error;
  }
}

async function getOrder(orderId: string): Promise<Order> {
  // Reads still work in read-only mode
  return db.orders.findOne({ id: orderId });
}
```

---

## Observability Patterns

### Structured Logging

```typescript
// ✅ Structured logging with correlation IDs
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'ISO8601' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
  ],
});

// Add correlation ID to all logs
function withCorrelationId(correlationId: string) {
  return logger.child({ correlationId });
}

// Usage
async function processOrder(orderId: string) {
  const correlationId = generateCorrelationId();
  const log = withCorrelationId(correlationId);
  
  log.info('Processing order', { orderId, userId: '123' });
  
  try {
    const result = await createOrder({ id: orderId });
    log.info('Order processed', { orderId, result });
    return result;
  } catch (error) {
    log.error('Order processing failed', { orderId, error });
    throw error;
  }
}
```

### Metrics Instrumentation

```typescript
// ✅ Prometheus metrics for Four Golden Signals
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Latency histogram
const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Request counter
const requestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Error counter
const errorCount = new Counter({
  name: 'http_errors_total',
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// In-flight requests gauge
const inFlightRequests = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Current in-flight requests',
  labelNames: ['method'],
  registers: [register],
});

// Middleware to record metrics
function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  inFlightRequests.inc({ method: req.method });
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    const status = res.statusCode;
    
    requestDuration.observe({ method: req.method, route, status }, duration);
    requestCount.inc({ method: req.method, route, status });
    inFlightRequests.dec({ method: req.method });
    
    if (status >= 400) {
      errorCount.inc({ method: req.method, route, status });
    }
  });
  
  next();
}
```

### Distributed Tracing

```typescript
// ✅ OpenTelemetry distributed tracing
import { NodeTracerProvider } from '@opentelemetry/node';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({ serviceName: 'my-service' });

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

const tracer = provider.getTracer('my-service');

// Usage with context propagation
async function processOrder(orderId: string) {
  const span = tracer.startSpan('processOrder');
  span.setAttribute('order.id', orderId);
  
  try {
    // Create order span
    await tracer.startActiveSpan('createOrder', async (createSpan) => {
      await db.orders.create({ id: orderId });
      createSpan.end();
    });
    
    // Call external service with context propagation
    const headers: Record<string, string> = {};
    propagation.inject(context.active(), headers);
    
    await fetch('https://api.external.com/process', {
      method: 'POST',
      headers: { ...headers },
    });
    
    span.setStatus({ code: 0 }); // OK
    return { success: true };
  } catch (error) {
    span.setStatus({ code: 2, message: error.message }); // ERROR
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

---

_See also:_
- _`reliability-checklist.md` — Comprehensive reliability checklist_
- _`sla-slo-guidelines.md` — SLO definition and measurement_
