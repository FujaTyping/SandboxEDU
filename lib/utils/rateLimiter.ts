/**
 * Client-side Rate Limiter
 * จำกัดจำนวน requests ต่อช่วงเวลา
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();
  private defaultConfig: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  };

  /**
   * Check if request is allowed
   */
  isAllowed(key: string, config?: Partial<RateLimitConfig>): boolean {
    const { maxRequests, windowMs } = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now >= record.resetTime) {
      // New window
      this.records.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string, config?: Partial<RateLimitConfig>): number {
    const { maxRequests } = { ...this.defaultConfig, ...config };
    const record = this.records.get(key);

    if (!record || Date.now() >= record.resetTime) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - record.count);
  }

  /**
   * Get time until reset (in ms)
   */
  getResetTime(key: string): number {
    const record = this.records.get(key);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.records.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit decorator for async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  config?: Partial<RateLimitConfig>
): T {
  return (async (...args: any[]) => {
    if (!rateLimiter.isAllowed(key, config)) {
      const resetTime = rateLimiter.getResetTime(key);
      const seconds = Math.ceil(resetTime / 1000);
      throw new Error(
        `Rate limit exceeded. Please wait ${seconds} seconds before trying again.`
      );
    }

    return fn(...args);
  }) as T;
}
