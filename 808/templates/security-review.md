# Security Review Template

Template for `.planning/phases/XX-name/{phase_num}-SECURITY-REVIEW.md` — security expert review results.

---

## File Template

```markdown
---
phase: XX-name
reviewed: YYYY-MM-DDTHH:MM:SSZ
status: passed | findings_found | human_needed
score: N/M security checks passed
---

# Phase {X}: {Name} Security Review

**Phase Goal:** {goal from ROADMAP.md}
**Reviewed:** {timestamp}
**Status:** {passed | findings_found | human_needed}

## Executive Summary

{2-3 paragraphs providing:}
- Overall security posture assessment
- Critical/high findings count
- OWASP Top 10 compliance level
- Readiness for production deployment
- Key security strengths and concerns

**Security Score:** {N}/{M} checks passed ({percentage}%)

## OWASP Top 10 Compliance

| Category | Status | Findings | Details |
|----------|--------|----------|---------|
| A01: Broken Access Control | ✓/⚠️/🛑 | count | details |
| A02: Cryptographic Failures | ✓/⚠️/🛑 | count | details |
| A03: Injection | ✓/⚠️/🛑 | count | details |
| A04: Insecure Design | ✓/⚠️/🛑 | count | details |
| A05: Security Misconfiguration | ✓/⚠️/🛑 | count | details |
| A06: Vulnerable Components | ✓/⚠️/🛑 | count | details |
| A07: Authentication Failures | ✓/⚠️/🛑 | count | details |
| A08: Data Integrity | ✓/⚠️/🛑 | count | details |
| A09: Logging Failures | ✓/⚠️/🛑 | count | details |
| A10: SSRF | ✓/⚠️/🛑 | count | details |

**Compliance:** {N}/10 categories fully compliant

## Critical Findings

{If no critical findings:}
**No critical findings identified.**

{If critical findings exist:}

### SEC-001: {Finding Title}

**Severity:** CRITICAL
**Category:** {injection | auth | xss | secrets | access_control | etc.}
**Location:** `path/to/file.ts:line`
**CWE:** CWE-XXX
**OWASP:** A0X:YYYY

**Description:**
{Detailed explanation of the vulnerability}

**Exploit Scenario:**
{How an attacker could exploit this vulnerability — specific steps}

**Evidence:**
```language
// Code snippet showing the vulnerability
```

**Remediation:**
```language
// Secure implementation example
```

**References:**
- [CWE-XXX](https://cwe.mitre.org/data/definitions/XXX.html)
- [OWASP A0X:YYYY](https://owasp.org/www-project-top-ten/)

---

### SEC-002: {Finding Title}

{Repeat for each critical finding}

## High Severity Findings

{If no high findings:}
**No high severity findings identified.**

{If high findings exist:}

### SEC-XXX: {Finding Title}

**Severity:** HIGH
**Category:** {category}
**Location:** `path/to/file.ts:line`
**CWE:** CWE-XXX
**OWASP:** A0X:YYYY

**Description:**
{Detailed explanation}

**Remediation:**
{Specific fix instructions with code example}

---

## Medium Severity Findings

{List medium severity findings with same format, or summary if many}

## Low Severity Findings & Hardening Suggestions

{List low severity findings and informational hardening suggestions}

## Dependency Vulnerabilities

{If no vulnerabilities:}
**No known dependency vulnerabilities detected.**

{If vulnerabilities found:}

| Package | Vulnerability | Severity | CVE | Fix Version | Status |
|---------|--------------|----------|-----|-------------|--------|
| lodash | Prototype Pollution | HIGH | CVE-2021-23337 | 4.17.21 | Unpatched |
| express | Open Redirect | MEDIUM | CVE-2024-XXXXX | 4.19.0 | Unpatched |

**Remediation:** Run `npm audit fix` or update packages manually.

## Security Requirements Coverage

{If security requirements exist in REQUIREMENTS.md:}

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| SEC-001 | Passwords hashed with bcrypt | ✓ SATISFIED | bcrypt.hash() in auth.ts:42 |
| SEC-002 | JWT tokens expire in 15min | ✓ SATISFIED | expiresIn: '15m' in token.ts:12 |
| SEC-003 | Rate limiting on auth endpoints | ⚠️ PARTIAL | Implemented but 100 req/min (should be 5) |
| SEC-004 | Input validation on all forms | ✗ BLOCKED | Missing on registration form |

**Coverage:** {N}/{M} requirements satisfied

## Human Security Review Required

{If no human review needed:}
**No security expert review required.**

{If human review needed:}

### 1. {Review Name}

**Review:** {What to test/review}
**Expected:** {Secure behavior or configuration}
**Why human:** {Why automated check is insufficient}

### 2. {Review Name}

**Review:** {What to test/review}
**Expected:** {Secure behavior or configuration}
**Why human:** {Why automated check is insufficient}

## Remediation Priority

### Immediate (CRITICAL — Fix within 24 hours)

1. **SEC-001:** {title} — {one-line description}
2. **SEC-002:** {title} — {one-line description}

### Short-term (HIGH — Fix within 1 week)

1. **SEC-XXX:** {title} — {one-line description}
2. **SEC-XXX:** {title} — {one-line description}

### Medium-term (MEDIUM — Fix within sprint)

{List medium findings}

### Long-term (LOW — Address in refinement)

{List low findings}

## Security Testing Recommendations

{If applicable, recommend additional security testing:}

- [ ] Penetration testing by security professional
- [ ] Dependency audit with `npm audit` or Snyk
- [ ] Static analysis with ESLint security plugin
- [ ] Dynamic analysis with OWASP ZAP or Burp Suite
- [ ] Code review by security specialist

---

## Review Metadata

**Review approach:** Security-focused code analysis + OWASP Top 10 compliance
**Security scope:** {from requirements | derived from deliverables}
**Files reviewed:** {N}
**Automated checks:** {N} passed, {M} failed
**Human reviews required:** {N}
**Total review time:** {duration}

---
*Reviewed: {timestamp}*
*Reviewer: Claude (808-security-reviewer)*
```

---

## Guidelines

**Status values:**
- `passed` — No CRITICAL or HIGH findings, all security requirements satisfied
- `findings_found` — One or more CRITICAL, HIGH, or MEDIUM findings identified
- `human_needed` — Automated checks pass but security expert review recommended

**Severity levels:**
- **CRITICAL:** Actively exploitable, immediate remediation required
- **HIGH:** Likely exploitable, fix within 1 week
- **MEDIUM:** Requires specific conditions, fix within sprint
- **LOW:** Hardening suggestion, address in refinement
- **INFO:** Security improvement, consider for future

**Evidence requirements:**
- Always include file path and line number
- Show vulnerable code snippet
- Show secure implementation example
- Reference CWE and OWASP category

**OWASP compliance:**
- Assess all 10 categories even if no findings
- Use ✓ for fully compliant, ⚠️ for partial, 🛑 for non-compliant
- Link findings to specific OWASP categories

**Remediation guidance:**
- Provide actionable fix instructions
- Include secure code examples
- Reference official documentation
- Prioritize by severity and exploitability

---

## Example

```markdown
---
phase: 03-auth
reviewed: 2025-01-15T16:45:00Z
status: findings_found
score: 18/22 security checks passed
---

# Phase 3: Authentication System Security Review

**Phase Goal:** User registration and login with JWT authentication
**Reviewed:** 2025-01-15T16:45:00Z
**Status:** findings_found

## Executive Summary

The authentication system implements basic security controls but has **2 critical vulnerabilities** that must be addressed before production deployment. Password hashing uses bcrypt correctly, and JWT tokens are properly signed. However, SQL injection in the login endpoint and hardcoded JWT secrets create severe security risks.

**Security Score:** 18/22 checks passed (82%)

**Key concerns:**
- SQL injection vulnerability in user authentication (CRITICAL)
- Hardcoded JWT secret in source code (CRITICAL)
- Missing rate limiting on auth endpoints (HIGH)
- Verbose error messages exposing user existence (MEDIUM)

## OWASP Top 10 Compliance

| Category | Status | Findings | Details |
|----------|--------|----------|---------|
| A01: Broken Access Control | ✓ | 0 | Authorization checks in place |
| A02: Cryptographic Failures | ⚠️ | 1 | Hardcoded JWT secret |
| A03: Injection | 🛑 | 1 | SQL injection in login |
| A04: Insecure Design | ✓ | 0 | Standard auth patterns used |
| A05: Security Misconfiguration | ⚠️ | 1 | Verbose error messages |
| A06: Vulnerable Components | ✓ | 0 | Dependencies up to date |
| A07: Authentication Failures | ⚠️ | 1 | No rate limiting |
| A08: Data Integrity | ✓ | 0 | Input validation present |
| A09: Logging Failures | ⚠️ | 1 | Passwords logged in debug |
| A10: SSRF | ✓ | 0 | No external URL fetching |

**Compliance:** 5/10 categories fully compliant

## Critical Findings

### SEC-001: SQL Injection in Login Endpoint

**Severity:** CRITICAL
**Category:** injection
**Location:** `src/api/auth/login.ts:23`
**CWE:** CWE-89
**OWASP:** A03:2021-Injection

**Description:**
User input is concatenated directly into SQL query string, allowing attackers to bypass authentication or extract database contents.

**Exploit Scenario:**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin'--",
  "password": "anything"
}

Results in SQL:
SELECT * FROM users WHERE email = 'admin'--' AND password = '...'

The -- comments out password check, logging in as admin.
```

**Evidence:**
```typescript
// ❌ VULNERABLE - Line 23
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${hashedPassword}'`;
const result = await pool.query(query);
```

**Remediation:**
```typescript
// ✅ SECURE - Parameterized query
const query = {
  text: 'SELECT * FROM users WHERE email = $1 AND password = $2',
  values: [email, hashedPassword],
};
const result = await pool.query(query);
```

**References:**
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)

---

### SEC-002: Hardcoded JWT Secret

**Severity:** CRITICAL
**Category:** secrets
**Location:** `src/lib/jwt.ts:8`
**CWE:** CWE-798
**OWASP:** A07:2021-Authentication Failures

**Description:**
JWT signing secret is hardcoded in source code, making it impossible to rotate and potentially exposed in version control.

**Evidence:**
```typescript
// ❌ VULNERABLE - Line 8
const JWT_SECRET = "my-super-secret-key-12345";
```

**Remediation:**
```typescript
// ✅ SECURE - Environment variable
const JWT_SECRET = process.env.JWT_SECRET;

// Validate at startup
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable required');
}
```

**Environment setup:**
```bash
# .env (NOT committed to git)
JWT_SECRET=$(openssl rand -hex 32)

# .env.example (safe to commit)
JWT_SECRET=your-secret-key-here
```

**References:**
- [CWE-798: Hardcoded Credentials](https://cwe.mitre.org/data/definitions/798.html)

## High Severity Findings

### SEC-003: Missing Rate Limiting

**Severity:** HIGH
**Category:** rate_limiting
**Location:** `src/api/auth/login.ts`
**CWE:** CWE-307
**OWASP:** A07:2021-Authentication Failures

**Description:**
No rate limiting on login endpoint allows unlimited authentication attempts, enabling brute force attacks.

**Remediation:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many login attempts' },
  skipSuccessfulRequests: true,
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

## Medium Severity Findings

### SEC-004: Verbose Error Messages

**Severity:** MEDIUM
**Category:** error_handling
**Location:** `src/api/auth/login.ts:45`
**CWE:** CWE-209
**OWASP:** A05:2021-Security Misconfiguration

**Description:**
Error messages reveal whether email exists, enabling user enumeration attacks.

**Evidence:**
```typescript
if (!user) {
  return res.status(401).json({ error: 'Email not found' }); // Reveals existence
}
if (!validPassword) {
  return res.status(401).json({ error: 'Invalid password' });
}
```

**Remediation:**
```typescript
// Generic error for both cases
return res.status(401).json({ 
  error: 'Invalid email or password' 
});
```

## Low Severity Findings & Hardening Suggestions

1. **INFO:** Consider adding `Secure` and `HttpOnly` flags to JWT cookies
2. **INFO:** Implement JWT refresh token rotation for enhanced session security
3. **INFO:** Add Content-Security-Policy headers to prevent XSS

## Dependency Vulnerabilities

**No known dependency vulnerabilities detected.**

## Security Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| SEC-001 | Passwords hashed with bcrypt | ✓ SATISFIED | bcrypt.hash() in auth.ts:15 |
| SEC-002 | JWT tokens expire in 15min | ✓ SATISFIED | expiresIn: '15m' in jwt.ts:20 |
| SEC-003 | Rate limiting on auth endpoints | ✗ BLOCKED | Not implemented |
| SEC-004 | Generic error messages | ✗ BLOCKED | Specific errors returned |

**Coverage:** 2/4 requirements satisfied

## Human Security Review Required

### 1. Cryptographic Key Management

**Review:** Verify JWT secret generation and storage meets security standards
**Expected:** Secrets generated with CSPRNG, stored in secrets manager
**Why human:** Requires assessment of key management infrastructure

## Remediation Priority

### Immediate (CRITICAL — Fix within 24 hours)

1. **SEC-001:** SQL injection in login — Use parameterized queries
2. **SEC-002:** Hardcoded JWT secret — Move to environment variables

### Short-term (HIGH — Fix within 1 week)

1. **SEC-003:** Missing rate limiting — Add express-rate-limit

### Medium-term (MEDIUM — Fix within sprint)

1. **SEC-004:** Verbose errors — Use generic error messages

---

## Review Metadata

**Review approach:** Security-focused code analysis + OWASP Top 10 compliance
**Security scope:** Derived from authentication deliverables
**Files reviewed:** 8
**Automated checks:** 18 passed, 4 failed
**Human reviews required:** 1
**Total review time:** 5 min

---
*Reviewed: 2025-01-15T16:45:00Z*
*Reviewer: Claude (808-security-reviewer)*
```
