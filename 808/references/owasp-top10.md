# OWASP Top 10 (2021)

Open Web Application Security Project (OWASP) Top 10 most critical security risks. Use for security reviews, planning, and compliance verification.

---

## A01:2021 - Broken Access Control

**What it is:** Users can access resources or functionality they shouldn't have permission for.

### Common Vulnerabilities

- Bypassing access control checks by modifying URL parameters
- Allowing primary key enumeration (accessing other users' records by ID)
- CORS misconfiguration allowing unauthorized API access
- Missing authorization checks for admin functions
- Caching of authenticated pages
- Disabled or missing access control checks

### Attack Examples

```
# IDOR (Insecure Direct Object Reference)
GET /api/users/123/orders  # User 456 accesses User 123's orders

# Parameter Tampering
GET /api/admin/users?role=user  # Attacker changes to role=admin

# Force Browsing
GET /admin/dashboard  # No authentication required
GET /.git/config  # Sensitive files exposed
```

### Prevention

```typescript
// ✅ Enforce ownership check
async function getOrder(userId: string, orderId: string) {
  return db.order.findOne({
    where: {
      id: orderId,
      userId: userId, // Ownership enforced
    }
  });
}

// ✅ Role-based middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// ✅ Deny by default
const accessControl = {
  '/api/admin/*': ['admin'],
  '/api/users/*': ['user', 'admin'],
  '*': ['user', 'admin'], // Default policy
};
```

### Testing

- [ ] Attempt to access other users' resources by ID manipulation
- [ ] Try to access admin endpoints without admin role
- [ ] Check CORS headers (Access-Control-Allow-Origin: *)
- [ ] Test cached pages for sensitive data
- [ ] Verify directory listing is disabled

**CWEs:** CWE-22, CWE-284, CWE-285, CWE-639

---

## A02:2021 - Cryptographic Failures

**What it is:** Sensitive data exposed due to weak or missing cryptography.

### Common Vulnerabilities

- Transmitting data in cleartext (HTTP, FTP, unencrypted DB connections)
- Weak encryption algorithms (MD5, SHA1, DES, RC4)
- Hardcoded encryption keys or keys in source code
- Missing certificate validation
- Using deprecated TLS versions (TLS 1.0, 1.1)
- Storing passwords without proper hashing

### Attack Examples

```
# Passive eavesdropping on HTTP
Wireshark capture → plaintext credentials

# Weak hash cracking
MD5("password123") = 482c811da5d5b4bc6d497ffa98491e38
→ Cracked instantly with rainbow tables

# Downgrade attack
TLS 1.2 → TLS 1.0 → POODLE attack → Decrypted traffic
```

### Prevention

```typescript
// ✅ Strong password hashing
import argon2 from 'argon2';
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
});

// ✅ HTTPS enforcement
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// ✅ Secure TLS configuration (nginx)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers on;

// ✅ Encryption at rest
import crypto from 'crypto';
const algorithm = 'aes-256-gcm';
const cipher = crypto.createCipheriv(algorithm, key, iv);
```

### Testing

- [ ] Check all traffic uses HTTPS (SSL Labs test)
- [ ] Verify TLS 1.2+ enforced
- [ ] Scan for weak ciphers
- [ ] Check password storage (should be bcrypt/argon2)
- [ ] Look for hardcoded keys in source code
- [ ] Verify certificate validation enabled

**CWEs:** CWE-259, CWE-327, CWE-330, CWE-331

---

## A03:2021 - Injection

**What it is:** Untrusted data sent to interpreter as part of command/query.

### Common Vulnerabilities

- SQL injection (SQLi)
- NoSQL injection (MongoDB, etc.)
- Command injection (OS commands)
- LDAP injection
- ORM injection
- Cross-site scripting (XSS) - also fits here

### Attack Examples

```sql
-- SQL Injection
POST /login
username: admin'--
password: anything

-- Results in: SELECT * FROM users WHERE username='admin'--' AND password='...'

-- Blind SQLi
GET /api/users?id=1 OR 1=1--

-- Command Injection
GET /api/file?name=test; rm -rf /

-- NoSQL Injection
POST /api/login
{
  "username": { "$ne": null },
  "password": { "$ne": null }
}
```

### Prevention

```typescript
// ✅ Parameterized queries (PostgreSQL)
const user = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ ORM with proper usage
const user = await User.findOne({ where: { email } });

// ✅ Input validation
import { z } from 'zod';
const schema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
});

// ✅ Command whitelisting
const allowedCommands = ['ls', 'cat'];
if (!allowedCommands.includes(command)) {
  throw new Error('Command not allowed');
}
const result = execFile(command, sanitizedArgs);

// ✅ XSS prevention (React)
<div>{userInput}</div> // Auto-escaped
// NOT: <div dangerouslySetInnerHTML={{__html: userInput}} />
```

### Testing

- [ ] Test all input fields with SQLi payloads
- [ ] Try NoSQL operators in JSON fields
- [ ] Test command execution with shell metacharacters
- [ ] Check for XSS with `<script>alert(1)</script>`
- [ ] Use SQLMap for automated testing

**CWEs:** CWE-74, CWE-77, CWE-78, CWE-89, CWE-94

---

## A04:2021 - Insecure Design

**What it is:** Flaws in architecture, design, or threat modeling.

### Common Vulnerabilities

- Missing or ineffective threat modeling
- No security patterns or reference architectures
- Business logic flaws
- Lack of security in SDLC
- Insufficient segregation of duties

### Attack Examples

```
# Business Logic Bypass
1. Add item to cart ($100)
2. Intercept request, change price to $0.01
3. Complete purchase for $0.01

# Credential Stuffing
No rate limiting → Automated login attempts
→ 1000 passwords/second per account

# Broken Workflow
Skip step 2 of 3-step verification
→ Direct access to final step
```

### Prevention

```typescript
// ✅ Server-side price validation
async function calculateTotal(cart: CartItem[]) {
  let total = 0;
  for (const item of cart) {
    const product = await db.product.find(item.id);
    total += product.price * item.quantity; // Trust DB, not client
  }
  return total;
}

// ✅ Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
});

// ✅ Workflow state enforcement
const workflowStates = {
  'checkout': ['cart', 'shipping', 'payment'],
  'shipping': ['payment'],
  'payment': ['complete'],
};

function validateTransition(current: string, next: string) {
  if (!workflowStates[current]?.includes(next)) {
    throw new Error('Invalid workflow transition');
  }
}
```

### Testing

- [ ] Create threat model for application
- [ ] Review business logic for bypasses
- [ ] Test workflow state transitions
- [ ] Check for credential stuffing protection
- [ ] Verify separation of duties

**CWEs:** CWE-1004, CWE-1008, CWE-1009

---

## A05:2021 - Security Misconfiguration

**What it is:** Missing or improperly configured security controls.

### Common Vulnerabilities

- Missing security headers (CSP, HSTS, X-Frame-Options)
- Verbose error messages with stack traces
- Unnecessary services or features enabled
- Default accounts with unchanged passwords
- Directory listing enabled
- Cloud storage permissions misconfigured

### Attack Examples

```
# Missing security headers
GET / → No CSP header → XSS possible
GET / → No HSTS → Downgrade to HTTP

# Information disclosure
POST /api/data
Error: SQLSTATE[42000]: Syntax error...
→ Reveals SQL structure, database type

# Default credentials
Admin panel: admin/admin
Database: postgres/postgres
```

### Prevention

```typescript
// ✅ Security headers (Helmet)
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// ✅ Custom error pages
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).render('error', {
    message: 'An error occurred',
  });
});

// ✅ Disable unnecessary features
app.disable('x-powered-by');
app.disable('etag'); // Or use weak etags

// ✅ Cloud storage permissions
aws s3api put-bucket-acl \
  --bucket my-bucket \
  --acl private
```

### Testing

- [ ] Scan for security headers (securityheaders.com)
- [ ] Trigger errors, check information disclosure
- [ ] Check for default accounts
- [ ] Scan for open ports/services
- [ ] Review cloud storage permissions
- [ ] Check directory listing disabled

**CWEs:** CWE-16, CWE-200, CWE-204, CWE-205, CWE-206

---

## A06:2021 - Vulnerable and Outdated Components

**What it is:** Using components with known vulnerabilities.

### Common Vulnerabilities

- Unpatched dependencies
- Using unsupported frameworks/libraries
- Not checking for security advisories
- Installing from untrusted sources
- Unused dependencies (attack surface)

### Attack Examples

```
# Log4Shell (CVE-2021-44228)
Unpatched Log4j → Remote code execution
via JNDI lookup in log message

# Prototype Pollution
lodash < 4.17.21
_.merge({}, JSON.parse(userInput), {})
→ __proto__ pollution → RCE possible

# Dependency Confusion
Attacker publishes package with same name as internal package
→ npm install pulls malicious package
```

### Prevention

```bash
# ✅ Regular vulnerability scanning
npm audit
npm audit fix

# For production
npx audit-ci --moderate

# ✅ Pin dependency versions
{
  "dependencies": {
    "express": "4.18.2",  // Exact version
    "lodash": "^4.17.21"  // Minimum safe version
  }
}

# ✅ Verify package integrity
npm ci  // Uses package-lock.json

# ✅ Remove unused dependencies
npm uninstall unused-package
npx depcheck  // Find unused dependencies
```

### Testing

- [ ] Run `npm audit` / `pip-audit` / `cargo-audit`
- [ ] Check for outdated packages
- [ ] Review dependency tree for unmaintained packages
- [ ] Verify packages from official sources
- [ ] Set up automated dependency scanning (Dependabot, Snyk)

**CWEs:** CWE-1391, CWE-1395

---

## A07:2021 - Identification and Authentication Failures

**What it is:** Weak authentication, session management, or credential handling.

### Common Vulnerabilities

- Plaintext or weak password hashing
- Session fixation
- Missing brute force protection
- Weak password policies
- Session tokens in URLs
- Missing MFA
- Hardcoded credentials

### Attack Examples

```
# Credential Stuffing
Automated login attempts with leaked credentials
→ No rate limiting → Success

# Session Fixation
1. Attacker gets session ID from login page
2. Victim logs in with attacker's session
3. Attacker now authenticated as victim

# Password Cracking
MD5 hash → Rainbow table → Instant crack
```

### Prevention

```typescript
// ✅ Strong password hashing
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);

// ✅ Session regeneration
app.post('/login', (req, res) => {
  req.session.regenerate((err) => {
    req.session.userId = user.id;
  });
});

// ✅ Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// ✅ Secure session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  },
  resave: false,
  saveUninitialized: false,
}));

// ✅ MFA implementation
import speakeasy from 'speakeasy';
const secret = speakeasy.generateSecret();
// Store secret, require TOTP for login
```

### Testing

- [ ] Test password hashing (should be bcrypt/argon2)
- [ ] Attempt brute force attacks
- [ ] Check session fixation
- [ ] Test session timeout
- [ ] Verify tokens not in URLs
- [ ] Check for MFA implementation

**CWEs:** CWE-287, CWE-288, CWE-289, CWE-384, CWE-521, CWE-613, CWE-620

---

## A08:2021 - Software and Data Integrity Failures

**What it is:** Code and infrastructure that does not protect against integrity violations.

### Common Vulnerabilities

- Insecure deserialization
- Unvalidated updates to critical data
- CI/CD pipeline without integrity checks
- Unverified software updates
- Trusting data from external sources

### Attack Examples

```
# Insecure Deserialization
POST /api/data
{
  "__proto__": {
    "isAdmin": true
  }
}
→ Prototype pollution → Privilege escalation

# Supply Chain Attack
Compromise npm package → Malicious update
→ All users install malware

# Data Tampering
Intercept API response, modify price
→ No integrity check → Accepted
```

### Prevention

```typescript
// ✅ Input validation with schema
import { z } from 'zod';
const UserSchema = z.object({
  id: z.number(),
  role: z.enum(['user', 'admin']).default('user'),
});
const user = UserSchema.parse(input);

// ✅ Digital signatures for updates
import crypto from 'crypto';
const signature = crypto.sign('SHA256', data, privateKey);
// Verify signature before applying update

// ✅ Integrity checks
const hash = crypto.createHash('sha256');
hash.update(fileContent);
const fileHash = hash.digest('hex');
if (fileHash !== expectedHash) {
  throw new Error('Integrity check failed');
}

// ✅ Secure deserialization
// Never deserialize user input with eval, Function, etc.
// Use safe parsers like JSON.parse with validation
const data = JSON.parse(input, (key, value) => {
  if (key === '__proto__') return undefined;
  return value;
});
```

### Testing

- [ ] Test deserialization with malicious payloads
- [ ] Check for prototype pollution
- [ ] Verify software update signatures
- [ ] Test CI/CD pipeline security
- [ ] Check data integrity validation

**CWEs:** CWE-345, CWE-347, CWE-353, CWE-426, CWE-502, CWE-784

---

## A09:2021 - Security Logging and Monitoring Failures

**What it is:** Insufficient logging, detection, and response for security events.

### Common Vulnerabilities

- Audit events not logged (login, access control failures)
- Logs stored locally only
- No alerting on security events
- Sensitive data in logs
- Logs not protected from tampering
- Missing context in log entries

### Attack Examples

```
# Undetected Brute Force
1000 login attempts → No alerts → Attacker succeeds

# Log Tampering
Attacker gains file access
→ Deletes logs → No evidence

# Information Disclosure
console.log('Password:', password);
→ Password in log files
```

### Prevention

```typescript
// ✅ Comprehensive security logging
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.File({ filename: 'audit.log', level: 'audit' }),
  ],
});

// Log security events
function logSecurityEvent(event: string, details: any, user?: User) {
  securityLogger.info('security_event', {
    event,
    details,
    userId: user?.id,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent,
  });
}

// Events to log:
// - Authentication (success/failure)
// - Authorization failures
// - Input validation failures
// - API rate limit hits
// - File uploads/downloads
// - Admin actions

// ✅ Redact sensitive data
function redactSensitiveData(log: any) {
  const sensitive = ['password', 'token', 'secret', 'apiKey'];
  sensitive.forEach(key => {
    if (log[key]) log[key] = '[REDACTED]';
  });
  return log;
}

// ✅ Centralized logging
// Send logs to SIEM (Splunk, ELK, Datadog)
// Set up alerts for:
// - Multiple failed logins
// - Privilege escalation attempts
// - Unusual access patterns
```

### Testing

- [ ] Verify all security events logged
- [ ] Check logs don't contain sensitive data
- [ ] Test log integrity (tamper detection)
- [ ] Verify alerting works
- [ ] Check log retention policy
- [ ] Test centralized logging

**CWEs:** CWE-223, CWE-778

---

## A10:2021 - Server-Side Request Forgery (SSRF)

**What it is:** Web application fetches remote resources without validating URLs.

### Common Vulnerabilities

- Fetching user-supplied URLs
- Accessing internal services
- Cloud metadata endpoint access
- Bypassing firewalls
- Port scanning internal network

### Attack Examples

```
# Cloud Metadata Theft
GET /api/fetch?url=http://169.254.169.254/latest/meta-data/
→ AWS credentials exposed

# Internal Service Access
GET /api/proxy?url=http://localhost:6379/
→ Redis access without auth

# Port Scanning
GET /api/fetch?url=http://internal-server:22
→ Check response time for port detection
```

### Prevention

```typescript
// ✅ URL validation with allowlist
import { URL } from 'url';
import ipaddr from 'ipaddr.js';

const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];
const BLOCKED_RANGES = [
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '127.0.0.0/8',
  '169.254.0.0/16', // Cloud metadata
];

function isSafeUrl(urlString: string): boolean {
  const url = new URL(urlString);
  
  // Check allowlist
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    return false;
  }
  
  // Check IP ranges
  try {
    const ip = ipaddr.parse(url.hostname);
    const range = ip.range();
    if (range === 'private' || range === 'loopback' || range === 'linkLocal') {
      return false;
    }
  } catch {
    // Not an IP, continue
  }
  
  // Enforce HTTPS
  if (url.protocol !== 'https:') {
    return false;
  }
  
  return true;
}

// ✅ Usage
app.get('/api/fetch', async (req, res) => {
  const { url } = req.query;
  
  if (!isSafeUrl(url as string)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  const response = await fetch(url, {
    timeout: 5000,
    follow: 0, // Don't follow redirects
  });
  
  res.json(await response.json());
});

// ✅ Block redirects
const response = await fetch(url, {
  redirect: 'manual', // Don't follow redirects
});

if (response.status === 301 || response.status === 302) {
  throw new Error('Redirects not allowed');
}
```

### Testing

- [ ] Try to access cloud metadata (169.254.169.254)
- [ ] Attempt to reach localhost/127.0.0.1
- [ ] Test private IP ranges (10.x.x.x, 192.168.x.x)
- [ ] Try DNS rebinding attacks
- [ ] Test with redirects to internal IPs
- [ ] Check for URL parsing bypasses

**CWEs:** CWE-918

---

## Quick Reference

| Category | Prevention Priority | Testing Focus |
|----------|-------------------|---------------|
| A01 Access Control | Enforce ownership, RBAC | IDOR, privilege escalation |
| A02 Crypto | HTTPS, strong hashing | Cleartext, weak crypto |
| A03 Injection | Parameterized queries | SQLi, XSS, command injection |
| A04 Design | Threat modeling, patterns | Business logic bypasses |
| A05 Misconfiguration | Security headers, error handling | Info disclosure, defaults |
| A06 Components | Patch management, scanning | Known CVEs |
| A07 Auth | Strong hashing, rate limiting | Brute force, session fixation |
| A08 Integrity | Validation, signatures | Deserialization, tampering |
| A09 Logging | Security event logging | Missing alerts, sensitive data |
| A10 SSRF | URL validation, allowlists | Internal access, metadata |

---

_See also:_
- _`security-checklist.md` — Comprehensive security checklist_
- _`secure-coding-patterns.md` — Implementation patterns_

**References:**
- OWASP Top 10:2021 - https://owasp.org/www-project-top-ten/
- CWE Mitigations - https://cwe.mitre.org/
- OWASP Cheat Sheets - https://cheatsheetseries.owasp.org/
