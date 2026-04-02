# Security Checklist

Comprehensive security checklist for code review and implementation verification. Use during security reviews, planning, and execution.

---

## Authentication & Session Management

### Password Handling

- [ ] Passwords hashed with bcrypt, argon2, or scrypt (NOT MD5, SHA1, or plaintext)
- [ ] Minimum password strength enforced (length, complexity)
- [ ] Password reset tokens are single-use and time-limited
- [ ] Password hashes never logged or exposed in error messages
- [ ] Account enumeration prevented (generic error messages)

### Token Management

- [ ] JWT tokens signed with strong algorithm (RS256, ES256 — NOT HS256 or none)
- [ ] Token expiration enforced (access tokens: minutes, refresh tokens: days)
- [ ] Refresh token rotation implemented (old token invalidated on use)
- [ ] Tokens stored securely (httpOnly cookies, NOT localStorage for sensitive apps)
- [ ] Token payload contains minimal PII

### Session Security

- [ ] Session IDs regenerated on login (prevent session fixation)
- [ ] Session timeout configured (absolute and idle)
- [ ] Concurrent session limits enforced (if required)
- [ ] Session invalidation on password change
- [ ] Secure session storage (Redis with authentication, encrypted cookies)

## Authorization & Access Control

### Authentication Checks

- [ ] All protected endpoints require authentication
- [ ] Authentication middleware applied consistently
- [ ] Public endpoints explicitly marked
- [ ] Auth checks before business logic

### Authorization Checks

- [ ] Resource ownership verified (user can only access their resources)
- [ ] Role-based access control (RBAC) implemented
- [ ] Admin functions protected by role checks
- [ ] IDOR prevention (users can't access other users' resources by ID manipulation)
- [ ] Function-level access control (not just route-level)

### Trust Boundaries

- [ ] User input never trusted
- [ ] Third-party API responses validated
- [ ] Internal APIs authenticate like external APIs
- [ ] Microservices verify each other's identity

## Input Validation & Injection Prevention

### SQL Injection

- [ ] Parameterized queries used (NO string concatenation)
- [ ] ORM query builder used safely (no raw SQL without parameters)
- [ ] Database user has minimal privileges (no DROP, limited tables)
- [ ] Input validated before query (type, length, format)
- [ ] Error messages don't expose SQL structure

### NoSQL Injection

- [ ] Query operators validated ($where, $ne, $regex blocked or sanitized)
- [ ] User input not passed directly to query objects
- [ ] Schema validation enforced at database level

### Command Injection

- [ ] No shell execution with user input (exec, spawn, eval)
- [ ] If shell execution required: input whitelisted, escaped, validated
- [ ] Template strings not used with shell commands
- [ ] Child processes run with minimal privileges

### XSS (Cross-Site Scripting)

- [ ] Output encoding on all user content (HTML entity encoding)
- [ ] Framework auto-escaping enabled (React, Vue, Angular default)
- [ ] dangerouslySetInnerHTML avoided or strictly sanitized
- [ ] User content in URLs encoded
- [ ] User content in JavaScript strings escaped
- [ ] Content-Type headers set correctly (X-Content-Type-Options: nosniff)

### Path Traversal

- [ ] File paths validated against allowlist
- [ ] path.basename() used to strip directory components
- [ ] Symlinks followed cautiously
- [ ] File upload directories outside webroot
- [ ] Null byte injection prevented

## Data Protection & Cryptography

### Encryption at Rest

- [ ] Sensitive data encrypted in database (PII, financial, health)
- [ ] Encryption keys stored separately from data (KMS, Vault)
- [ ] Key rotation policy implemented
- [ ] Strong algorithms (AES-256-GCM, ChaCha20)
- [ ] IVs/nonces never reused with same key

### Encryption in Transit

- [ ] HTTPS enforced (HSTS enabled)
- [ ] TLS 1.2+ required (TLS 1.3 preferred)
- [ ] Certificate validation enabled (no self-signed in production)
- [ ] Internal services use TLS (service mesh, mTLS)

### Sensitive Data Handling

- [ ] PII minimized (only collect what's needed)
- [ ] Sensitive data redacted from logs
- [ ] Credit card numbers never stored directly (use tokenization)
- [ ] Passwords never logged (even in debug)
- [ ] Debug endpoints disabled in production

## Secrets Management

### Secret Storage

- [ ] All secrets in environment variables or secret manager
- [ ] No secrets in code, config files, or version control
- [ ] .env files in .gitignore
- [ ] Secrets rotated regularly (90 days or less)
- [ ] Different secrets per environment

### API Keys & Tokens

- [ ] API keys have minimal scope/permissions
- [ ] Keys rotated on suspected compromise
- [ ] Rate limiting per API key
- [ ] Key usage logged and monitored
- [ ] Compromised keys can be revoked immediately

## Error Handling & Logging

### Error Messages

- [ ] Generic error messages to users
- [ ] Detailed errors logged server-side only
- [ ] Stack traces never sent to client
- [ ] Database errors caught and sanitized
- [ ] Custom error pages (no framework defaults)

### Security Logging

- [ ] Authentication attempts logged (success and failure)
- [ ] Authorization failures logged
- [ ] Input validation failures logged
- [ ] Security events alertable (SIEM integration)
- [ ] Logs protected from tampering (write-once, centralized)

### Log Content

- [ ] No passwords in logs
- [ ] No full credit card numbers
- [ ] No API keys or tokens
- [ ] PII minimized or redacted
- [ ] Session IDs hashed if logged

## Rate Limiting & DoS Prevention

### Rate Limiting

- [ ] Auth endpoints rate limited (brute force prevention)
- [ ] API endpoints rate limited (abuse prevention)
- [ ] Rate limits per user/IP/account
- [ ] Graceful degradation under load
- [ ] DDoS protection at edge (Cloudflare, AWS Shield)

### Resource Limits

- [ ] File upload size limits
- [ ] Request body size limits
- [ ] Query complexity limits (GraphQL depth, pagination)
- [ ] Database query timeouts
- [ ] Connection pool limits

## CSRF & Request Forgery

### CSRF Protection

- [ ] CSRF tokens on state-changing forms
- [ ] SameSite cookies enabled (Strict or Lax)
- [ ] Custom headers for AJAX requests (X-Requested-With)
- [ ] Origin/Referer headers validated
- [ ] Double-submit cookie pattern (if stateless)

### SSRF (Server-Side Request Forgery)

- [ ] User-supplied URLs validated against allowlist
- [ ] Internal IP ranges blocked (10.x.x.x, 192.168.x.x, 127.0.0.1)
- [ ] URL scheme validated (http/https only)
- [ ] Redirects followed and validated
- [ ] Cloud metadata endpoints blocked (169.254.169.254)

## File Upload Security

### Upload Validation

- [ ] File type validated by content (not just extension)
- [ ] File size limits enforced
- [ ] Malware scanning (ClamAV, VirusTotal API)
- [ ] Image reprocessing (strip metadata, re-encode)
- [ ] Dangerous file types blocked (.exe, .php, .sh)

### Upload Storage

- [ ] Uploaded files stored outside webroot
- [ ] Files served via CDN with content-type validation
- [ ] Executable permissions removed
- [ ] Unique filenames (prevent overwrites)
- [ ] User can only access their own uploads

## Dependency Security

### Package Management

- [ ] Dependencies from official sources only
- [ ] Package-lock.json or equivalent committed
- [ ] No unmaintained packages (last commit >1 year ago)
- [ ] Vulnerability scanning enabled (npm audit, Dependabot)
- [ ] Critical vulnerabilities patched within 24 hours

### Supply Chain

- [ ] Build process reproducible
- [ ] CI/CD pipeline secured (no hardcoded secrets)
- [ ] Third-party services vetted (SOC 2, security practices)
- [ ] Code signing for critical artifacts

## Security Headers

### HTTP Headers

- [ ] Strict-Transport-Security (HSTS)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY or SAMEORIGIN
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Content-Security-Policy (CSP)
- [ ] Referrer-Policy
- [ ] Permissions-Policy

## OWASP Top 10 Coverage

This checklist covers OWASP Top 10 2021:

| OWASP Category | Checklist Sections |
|---------------|-------------------|
| A01: Broken Access Control | Authorization & Access Control |
| A02: Cryptographic Failures | Data Protection & Cryptography |
| A03: Injection | Input Validation & Injection Prevention |
| A04: Insecure Design | All sections (design review) |
| A05: Security Misconfiguration | Security Headers, Error Handling |
| A06: Vulnerable Components | Dependency Security |
| A07: Authentication Failures | Authentication & Session Management |
| A08: Data Integrity | Data Protection, File Upload Security |
| A09: Logging Failures | Error Handling & Logging |
| A10: SSRF | CSRF & Request Forgery |

## Usage

**During Planning:**
- Reference relevant checklist items in PLAN.md must_haves
- Include security requirements in phase scope

**During Execution:**
- Implement checklist items as tasks
- Use secure coding patterns from `secure-coding-patterns.md`

**During Verification:**
- Security reviewer checks checklist compliance
- Flag missing items as findings

**During Review:**
- Human security expert validates critical items
- Compliance certification if required

---

_See also:_
- _`secure-coding-patterns.md` — Implementation examples_
- _`owasp-top10.md` — OWASP Top 10 detailed breakdown_
