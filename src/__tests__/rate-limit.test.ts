import { describe, it, expect, beforeEach } from 'vitest';
import {
  smsRateLimiter,
  queryRateLimiter,
  checkRateLimit,
  RateLimitError,
  resetAllRateLimiters,
  getRateLimiterForTool,
} from '../rate-limit.js';

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetAllRateLimiters();
  });

  describe('smsRateLimiter', () => {
    it('should allow requests within limit', () => {
      const result = smsRateLimiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should track remaining requests', () => {
      const result1 = smsRateLimiter.check();
      const result2 = smsRateLimiter.check();

      expect(result2.remaining).toBeLessThan(result1.remaining);
    });

    it('should block requests after limit exceeded', () => {
      // Default SMS limit is 10 per minute
      for (let i = 0; i < 10; i++) {
        const result = smsRateLimiter.check();
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const blocked = smsRateLimiter.check();
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });
  });

  describe('queryRateLimiter', () => {
    it('should have higher limits than SMS', () => {
      // Query limit is 60 per minute (default)
      for (let i = 0; i < 60; i++) {
        const result = queryRateLimiter.check();
        expect(result.allowed).toBe(true);
      }

      // 61st request should be blocked
      const blocked = queryRateLimiter.check();
      expect(blocked.allowed).toBe(false);
    });
  });

  describe('getRateLimiterForTool', () => {
    it('should return smsRateLimiter for send_sms', () => {
      const limiter = getRateLimiterForTool('send_sms');
      expect(limiter).toBe(smsRateLimiter);
    });

    it('should return queryRateLimiter for other tools', () => {
      expect(getRateLimiterForTool('get_sms_messages')).toBe(queryRateLimiter);
      expect(getRateLimiterForTool('check_sms_status')).toBe(queryRateLimiter);
      expect(getRateLimiterForTool('check_account_balance')).toBe(queryRateLimiter);
      expect(getRateLimiterForTool('estimate_sms_cost')).toBe(queryRateLimiter);
      expect(getRateLimiterForTool('get_delivery_statistics')).toBe(queryRateLimiter);
    });
  });

  describe('checkRateLimit', () => {
    it('should not throw when within limits', () => {
      expect(() => checkRateLimit('send_sms')).not.toThrow();
    });

    it('should throw RateLimitError when limit exceeded', () => {
      // Exhaust SMS limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('send_sms');
      }

      expect(() => checkRateLimit('send_sms')).toThrow(RateLimitError);
    });

    it('should include retry information in error', () => {
      // Exhaust SMS limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('send_sms');
      }

      try {
        checkRateLimit('send_sms');
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        const rateLimitError = error as RateLimitError;
        expect(rateLimitError.retryAfterSec).toBeGreaterThan(0);
        expect(rateLimitError.message).toContain('Rate limit exceeded');
        expect(rateLimitError.message).toContain('SMS sending');
      }
    });

    it('should show query type for non-SMS tools', () => {
      // Exhaust query limit
      for (let i = 0; i < 60; i++) {
        checkRateLimit('get_sms_messages');
      }

      try {
        checkRateLimit('check_account_balance');
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).message).toContain('query');
      }
    });
  });

  describe('resetAllRateLimiters', () => {
    it('should reset all limiters', () => {
      // Use up some requests
      for (let i = 0; i < 5; i++) {
        smsRateLimiter.check();
        queryRateLimiter.check();
      }

      resetAllRateLimiters();

      // Should be back to full limit
      const smsState = smsRateLimiter.getState();
      const queryState = queryRateLimiter.getState();

      expect(smsState.count).toBe(0);
      expect(queryState.count).toBe(0);
    });
  });

  describe('RateLimitError', () => {
    it('should have correct name', () => {
      const error = new RateLimitError('Test error', 30);
      expect(error.name).toBe('RateLimitError');
    });

    it('should store retryAfterSec', () => {
      const error = new RateLimitError('Test error', 45);
      expect(error.retryAfterSec).toBe(45);
    });

    it('should be an instance of Error', () => {
      const error = new RateLimitError('Test error', 30);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
