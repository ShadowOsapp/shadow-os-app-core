# Security Best Practices

This document outlines security best practices for ShadowOS Core.

## Overview

ShadowOS Core implements multiple layers of security to protect against common attacks and vulnerabilities.

## Security Features

### 1. Constant-Time Operations

All cryptographic comparisons use constant-time operations to prevent timing attacks:

```typescript
import { constantTimeEqual } from "@shadowos/core";

// Safe comparison that doesn't leak timing information
const isValid = constantTimeEqual(secret1, secret2);
```

**Why it matters**: Timing attacks can reveal information about secret values by measuring how long operations take.

### 2. Secure Key Derivation

Use HKDF or PBKDF2 for secure key derivation:

```typescript
import { deriveKeyHKDF, deriveKeyPBKDF2, generateSalt } from "@shadowos/core";

// HKDF (recommended for most cases)
const salt = generateSalt();
const key = deriveKeyHKDF(masterKey, salt, "context-info", 32);

// PBKDF2 (for password-based derivation)
const key = deriveKeyPBKDF2(password, salt, 100000, 32);
```

**Why it matters**: Proper key derivation ensures keys have sufficient entropy and are resistant to brute-force attacks.

### 3. Input Sanitization

Always sanitize user input to prevent injection attacks:

```typescript
import {
  sanitizeString,
  sanitizeHexString,
  sanitizeInteger,
  sanitizeBigInt,
} from "@shadowos/core";

// Sanitize string input
const clean = sanitizeString(userInput, 1000);

// Sanitize hex string
const hex = sanitizeHexString(userHexInput);

// Sanitize integers
const num = sanitizeInteger(userNumber, 0, 1000000);
```

**Why it matters**: Unsanitized input can lead to injection attacks, buffer overflows, and other vulnerabilities.

### 4. Secure Random Generation

Use secure random functions for all cryptographic operations:

```typescript
import {
  secureRandomBytes,
  secureRandomBigInt,
  secureRandomHex,
  secureRandomUUID,
} from "@shadowos/core";

// Generate secure random bytes
const bytes = secureRandomBytes(32);

// Generate secure random bigint
const random = secureRandomBigInt(0n, 1000000n);

// Generate secure random hex string
const hex = secureRandomHex(64);

// Generate UUID v4
const uuid = secureRandomUUID();
```

**Why it matters**: Weak randomness can compromise cryptographic security.

### 5. Audit Logging

Log security-relevant events for monitoring and forensics:

```typescript
import { auditHelpers } from "@shadowos/core";

// Log payment events
await auditHelpers.logPayment(amount, { invoiceId, merchantId });

// Log security violations
await auditHelpers.logSecurityViolation("Invalid proof attempt", {
  userId,
  ipAddress,
});

// Log rate limit violations
await auditHelpers.logRateLimitExceeded(userId, { endpoint, count });
```

**Why it matters**: Audit logs help detect attacks, investigate incidents, and maintain compliance.

### 6. Security Headers

API responses include security headers to prevent common web vulnerabilities:

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Strict-Transport-Security` - Enforces HTTPS
- `Content-Security-Policy` - Restricts resource loading

## Common Security Pitfalls

### ❌ Don't: Use non-constant-time comparisons

```typescript
// BAD: Timing attack vulnerable
if (secret === userInput) {
  // ...
}
```

### ✅ Do: Use constant-time comparisons

```typescript
// GOOD: Constant-time comparison
import { constantTimeEqual } from "@shadowos/core";
if (constantTimeEqual(secret, userInput)) {
  // ...
}
```

### ❌ Don't: Use weak randomness

```typescript
// BAD: Predictable
const random = Math.random();
```

### ✅ Do: Use secure random

```typescript
// GOOD: Cryptographically secure
import { secureRandomBytes } from "@shadowos/core";
const random = secureRandomBytes(32);
```

### ❌ Don't: Trust user input

```typescript
// BAD: No validation
const amount = BigInt(req.body.amount);
```

### ✅ Do: Sanitize and validate

```typescript
// GOOD: Validated input
import { sanitizeBigInt } from "@shadowos/core";
const amount = sanitizeBigInt(req.body.amount, 1n, 1000000000n);
```

## Security Checklist

When implementing new features:

- [ ] Use constant-time operations for sensitive comparisons
- [ ] Sanitize all user input
- [ ] Use secure random generation
- [ ] Implement proper key derivation
- [ ] Add audit logging for security events
- [ ] Validate all inputs with appropriate bounds
- [ ] Use security headers in API responses
- [ ] Implement rate limiting
- [ ] Handle errors securely (don't leak sensitive info)
- [ ] Keep dependencies up to date

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email security@shadowos.io with details
3. Include steps to reproduce
4. Allow time for the team to address the issue before disclosure

We take security seriously and will respond promptly to all reports.

## Security Updates

Security updates are released as needed. Always keep your dependencies up to date:

```bash
bun update @shadowos/core
```

Check the [CHANGELOG.md](../CHANGELOG.md) for security-related updates.

