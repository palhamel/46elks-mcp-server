/**
 * Rate limiting for MCP tool invocations (MCP05, MCP07)
 *
 * Prevents abuse through rapid tool calls using sliding window algorithm.
 * Configurable via environment variables.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Simple sliding window rate limiter
 */
class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed under rate limits
   */
  check(): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    if (this.requests.length >= this.config.maxRequests) {
      // Find when the oldest request will expire
      const oldestInWindow = Math.min(...this.requests);
      const retryAfterMs = oldestInWindow + this.config.windowMs - now;

      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
      };
    }

    // Record this request
    this.requests.push(now);

    return {
      allowed: true,
      remaining: this.config.maxRequests - this.requests.length,
    };
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Get current state for debugging
   */
  getState(): { count: number; config: RateLimitConfig } {
    return {
      count: this.requests.length,
      config: this.config,
    };
  }
}

// Default rate limit configurations
const SMS_RATE_LIMIT: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_SMS_PER_MINUTE || '10', 10),
  windowMs: 60 * 1000, // 1 minute
};

const QUERY_RATE_LIMIT: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_QUERIES_PER_MINUTE || '60', 10),
  windowMs: 60 * 1000, // 1 minute
};

// Create rate limiters for different tool categories
export const smsRateLimiter = new RateLimiter(SMS_RATE_LIMIT);
export const queryRateLimiter = new RateLimiter(QUERY_RATE_LIMIT);

/**
 * Get the appropriate rate limiter for a tool
 */
export function getRateLimiterForTool(toolName: string): RateLimiter {
  // SMS sending tools use stricter limits
  if (toolName === 'send_sms') {
    return smsRateLimiter;
  }

  // All other tools use query limits
  return queryRateLimiter;
}

/**
 * Check rate limit for a tool and throw if exceeded
 */
export function checkRateLimit(toolName: string): void {
  const limiter = getRateLimiterForTool(toolName);
  const result = limiter.check();

  if (!result.allowed) {
    const retryAfterSec = result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : 60;
    const limitType = toolName === 'send_sms' ? 'SMS sending' : 'query';

    throw new RateLimitError(
      `Rate limit exceeded for ${limitType}. ` +
      `Please wait ${retryAfterSec} seconds before trying again.`,
      retryAfterSec
    );
  }
}

/**
 * Custom error class for rate limit violations
 */
export class RateLimitError extends Error {
  public readonly retryAfterSec: number;

  constructor(message: string, retryAfterSec: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

/**
 * Reset all rate limiters (useful for testing)
 */
export function resetAllRateLimiters(): void {
  smsRateLimiter.reset();
  queryRateLimiter.reset();
}
