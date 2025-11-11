/**
 * Security Headers Middleware
 *
 * Provides security headers for API responses
 */

export interface SecurityHeaders {
  "X-Content-Type-Options": string;
  "X-Frame-Options": string;
  "X-XSS-Protection": string;
  "Strict-Transport-Security"?: string;
  "Content-Security-Policy"?: string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
}

/**
 * Default security headers
 */
export const defaultSecurityHeaders: SecurityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

/**
 * Security headers for API endpoints
 */
export const apiSecurityHeaders: SecurityHeaders = {
  ...defaultSecurityHeaders,
  "Content-Security-Policy":
    "default-src 'self'; script-src 'none'; style-src 'none'; img-src 'none'; font-src 'none'; connect-src 'self';",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Create security headers object
 */
export function createSecurityHeaders(
  customHeaders?: Partial<SecurityHeaders>
): SecurityHeaders {
  return {
    ...defaultSecurityHeaders,
    ...customHeaders,
  };
}

/**
 * Apply security headers to response (Hono-compatible)
 */
export function applySecurityHeaders(headers: SecurityHeaders) {
  return (c: any, next: any) => {
    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        c.header(key, value);
      }
    }
    return next();
  };
}

