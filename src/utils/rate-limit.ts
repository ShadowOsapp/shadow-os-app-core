/**
 * Rate Limiting Utilities
 *
 * Simple rate limiting implementation for API endpoints
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request history for this identifier
    let requestTimes = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    requestTimes = requestTimes.filter((time) => time > windowStart);

    // Check if limit exceeded
    const allowed = requestTimes.length < this.config.maxRequests;

    if (allowed) {
      // Add current request
      requestTimes.push(now);
      this.requests.set(identifier, requestTimes);
    }

    const remaining = Math.max(0, this.config.maxRequests - requestTimes.length);
    const resetTime = requestTimes.length > 0
      ? requestTimes[0] + this.config.windowMs
      : now + this.config.windowMs;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Get current count for identifier
   */
  getCount(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requestTimes = this.requests.get(identifier) || [];
    return requestTimes.filter((time) => time > windowStart).length;
  }
}

/**
 * Create a rate limiter with common configurations
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number
): RateLimiter {
  return new RateLimiter({ windowMs, maxRequests });
}

/**
 * Common rate limit presets
 */
export const RateLimitPresets = {
  /**
   * Strict: 10 requests per minute
   */
  strict: () => createRateLimiter(10, 60 * 1000),

  /**
   * Moderate: 100 requests per minute
   */
  moderate: () => createRateLimiter(100, 60 * 1000),

  /**
   * Relaxed: 1000 requests per minute
   */
  relaxed: () => createRateLimiter(1000, 60 * 1000),

  /**
   * Per second: 10 requests per second
   */
  perSecond: (requests: number = 10) => createRateLimiter(requests, 1000),

  /**
   * Per hour: 1000 requests per hour
   */
  perHour: (requests: number = 1000) =>
    createRateLimiter(requests, 60 * 60 * 1000),
};

