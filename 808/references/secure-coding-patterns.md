# Secure Coding Patterns

Implementation patterns for common security requirements. Use these patterns during execution to ensure secure implementations.

---

## Authentication Patterns

### Password Hashing

**Node.js (bcrypt):**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Node.js (argon2):**
```typescript
import argon2 from 'argon2';

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
```

**Python (bcrypt):**
```python
import bcrypt

def hash_password(password: str) -> bytes:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt)

def verify_password(password: str, hash: bytes) -> bool:
    return bcrypt.checkpw(password.encode(), hash)
```

### JWT Token Management

**Secure JWT Creation:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function generateTokenPair(userId: string, roles: string[]): TokenPair {
  const accessToken = jwt.sign(
    { 
      sub: userId, 
      roles,
      type: 'access'
    },
    JWT_SECRET,
    { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256' // Or RS256 with asymmetric keys
    }
  );

  const refreshToken = jwt.sign(
    { 
      sub: userId, 
      type: 'refresh',
      jti: crypto.randomUUID() // Unique ID for rotation
    },
    JWT_SECRET,
    { 
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256'
    }
  );

  return { accessToken, refreshToken };
}
```

**JWT Verification:**
```typescript
function verifyToken(token: string, type: 'access' | 'refresh') {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      complete: true
    });

    // Verify token type
    if (payload.payload.type !== type) {
      throw new Error('Invalid token type');
    }

    return payload.payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}
```

**Refresh Token Rotation:**
```typescript
async function refreshAccessToken(refreshToken: string, storedHash: string) {
  // Verify refresh token
  const payload = verifyToken(refreshToken, 'refresh');
  
  // Verify token matches stored hash (prevent reuse)
  const isValid = await bcrypt.compare(refreshToken, storedHash);
  if (!isValid) {
    // Potential token theft - invalidate all sessions
    await invalidateAllUserSessions(payload.sub);
    throw new Error('Token reuse detected');
  }

  // Generate new token pair
  const newTokens = generateTokenPair(payload.sub, payload.roles);
  
  // Store new refresh token hash
  await storeRefreshTokenHash(payload.sub, newTokens.refreshToken);
  
  return newTokens;
}
```

### Session Management

**Secure Session Configuration (Express):**
```typescript
import session from 'express-session';
import connectRedis from 'connect-redis';

const RedisStore = connectRedis(session);

app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    path: '/',
  },
  name: 'sessionId', // Don't use default 'connect.sid'
}));

// Regenerate session on login (prevent fixation)
app.post('/login', (req, res) => {
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = user.id;
    req.session.save();
  });
});
```

## Authorization Patterns

### Role-Based Access Control (RBAC)

```typescript
// Middleware factory
function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage
app.delete('/api/users/:id', 
  requireAuth, 
  requireRole('admin'), 
  deleteUserHandler
);
```

### Resource Ownership Verification

```typescript
async function getUserResource(userId: string, resourceId: string, model: Model) {
  const resource = await model.findOne({
    where: {
      id: resourceId,
      userId: userId, // Ownership check built into query
    },
  });

  if (!resource) {
    // Return 404 (not 403) to avoid revealing existence
    throw new NotFoundError('Resource not found');
  }

  return resource;
}
```

### Permission-Based Access Control

```typescript
interface Permission {
  resource: string;
  actions: string[];
}

function hasPermission(user: User, resource: string, action: string): boolean {
  const permission = user.permissions.find(p => p.resource === resource);
  return permission?.actions.includes(action) ?? false;
}

// Decorator pattern (TypeScript)
function RequirePermission(resource: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const req = args.find(arg => arg instanceof Request);
      if (!req || !hasPermission(req.user, resource, action)) {
        throw new ForbiddenError();
      }
      return originalMethod.apply(this, args);
    };
  };
}
```

## Input Validation Patterns

### Whitelist Validation

```typescript
import { z } from 'zod';

// Define schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

// Validate and parse
function validateCreateUser(input: unknown) {
  try {
    return CreateUserSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}
```

### SQL Parameterization

**Node.js (PostgreSQL):**
```typescript
// UNSAFE - DO NOT USE
const query = `SELECT * FROM users WHERE email = '${email}'`;

// SAFE - Parameterized query
const query = {
  text: 'SELECT * FROM users WHERE email = $1',
  values: [email],
};

// With connection pool
const result = await pool.query(query);
```

**Node.js (Prisma ORM):**
```typescript
// SAFE - Prisma parameterizes automatically
const user = await prisma.user.findUnique({
  where: { email: email },
});

// SAFE - Raw query with parameters
const users = await prisma.$queryRaw`
  SELECT * FROM users 
  WHERE email = ${email}
  AND active = true
`;

// UNSAFE - String interpolation
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Python (SQLAlchemy):**
```python
# SAFE - Parameterized
from sqlalchemy import text

stmt = text("SELECT * FROM users WHERE email = :email")
result = connection.execute(stmt, {"email": email})

# SAFE - ORM
user = session.query(User).filter(User.email == email).first()

# UNSAFE - String formatting
query = f"SELECT * FROM users WHERE email = '{email}'"
```

### XSS Prevention

**React (Auto-escaping):**
```tsx
// SAFE - React auto-escapes
function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1> {/* Auto-escaped */}
      <p>{user.bio}</p>
    </div>
  );
}

// UNSAFE - dangerouslySetInnerHTML
function UnsafeComponent({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// SAFE - Sanitize before rendering
import DOMPurify from 'dompurify';

function SafeHtmlComponent({ content }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**Node.js (Server-side escaping):**
```typescript
import escapeHtml from 'escape-html';

// Escape user content before rendering in templates
function renderUserContent(userInput: string): string {
  return escapeHtml(userInput);
}

// Template usage
const html = `<div>${escapeHtml(userInput)}</div>`;
```

## File Upload Security

### Secure File Upload Handler

```typescript
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];

// Allowed extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store outside webroot
    cb(null, path.join(process.env.UPLOAD_DIR, 'secure'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req: Request, file: File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file type'));
  }
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid MIME type'));
  }
  
  cb(null, true);
};

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
});

// File serving (with validation)
app.get('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // Prevent traversal
  const filePath = path.join(process.env.UPLOAD_DIR, 'secure', filename);
  
  // Verify file exists and is within upload directory
  if (!filePath.startsWith(process.env.UPLOAD_DIR)) {
    return res.status(403).send('Invalid file path');
  }
  
  res.sendFile(filePath);
});
```

## Secrets Management

### Environment Variable Pattern

```typescript
// config/secrets.ts
import { z } from 'zod';

// Define required secrets
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_KEY: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
});

type Env = z.infer<typeof EnvSchema>;

// Validate at startup
let env: Env;

try {
  env = EnvSchema.parse(process.env);
} catch (error) {
  console.error('Missing required environment variables');
  process.exit(1);
}

export default env;
```

### Secret Rotation Pattern

```typescript
// Secret rotation with grace period
class RotatingSecret {
  private currentSecret: string;
  private previousSecret: string | null = null;
  private rotationTime: number;

  constructor(secret: string, rotationIntervalMs: number) {
    this.currentSecret = secret;
    this.rotationTime = rotationIntervalMs;
    
    // Schedule rotation
    setInterval(() => this.rotate(), rotationIntervalMs);
  }

  private rotate() {
    this.previousSecret = this.currentSecret;
    this.currentSecret = this.generateNewSecret();
    
    // Store new secret in secrets manager
    secretsManager.set('JWT_SECRET', this.currentSecret);
    
    // Clear previous after grace period
    setTimeout(() => {
      this.previousSecret = null;
    }, 60000); // 1 minute grace period
  }

  verify(token: string): boolean {
    // Try current secret first
    if (this.verifyWithSecret(token, this.currentSecret)) {
      return true;
    }
    
    // Try previous secret (grace period)
    if (this.previousSecret && this.verifyWithSecret(token, this.previousSecret)) {
      return true;
    }
    
    return false;
  }

  private verifyWithSecret(token: string, secret: string): boolean {
    try {
      jwt.verify(token, secret);
      return true;
    } catch {
      return false;
    }
  }

  private generateNewSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

## Error Handling Patterns

### Secure Error Handler

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error server-side
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  // Send generic error to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Unknown error - 500
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

### Database Error Sanitization

```typescript
import { Prisma } from '@prisma/client';

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Sanitize database errors
    const sanitizedError = {
      code: err.code,
      message: 'Database error occurred',
    };

    // Log full error internally
    logger.error('Prisma error:', {
      code: err.code,
      meta: err.meta,
      sql: err.message, // Safe to log internally
    });

    return res.status(400).json({ error: sanitizedError });
  }

  next(err);
});
```

## Rate Limiting Patterns

### Express Rate Limiter

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: { error: 'Too many login attempts' },
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

## CSRF Protection Patterns

### CSRF Token Implementation

```typescript
import csrf from 'csurf';

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Apply to forms
app.get('/form', csrfProtection, (req, res) => {
  res.send(`
    <form method="POST">
      <input type="hidden" name="_csrf" value="${req.csrfToken()}">
      <!-- form fields -->
    </form>
  `);
});

app.post('/submit', csrfProtection, (req, res) => {
  // CSRF token automatically validated
  res.send('Form submitted successfully');
});
```

### Double-Submit Cookie Pattern

```typescript
// For stateless APIs
app.use((req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies['csrf_token'];

  if (csrfToken !== csrfCookie) {
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }

  next();
});

// Generate token
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: false, // Client needs to read it
    secure: true,
    sameSite: 'strict',
  });
  res.json({ csrfToken: token });
});
```

---

_See also:_
- _`security-checklist.md` — Comprehensive security checklist_
- _`owasp-top10.md` — OWASP Top 10 vulnerabilities_
