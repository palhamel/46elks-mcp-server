import { describe, it, expect, afterEach } from 'vitest';
import {
  maskPhoneNumber,
  maskPhoneNumbersInText,
  presentPhoneNumber,
  sanitizeUntrustedText,
  resolveDryRun,
} from '../safety.js';

describe('safety helpers', () => {
  afterEach(() => {
    delete process.env.SHOW_FULL_PHONE_NUMBERS;
  });

  describe('resolveDryRun (OWASP MCP02 hard floor)', () => {
    it('forces dry run when server DRY_RUN=true, even if the call asks for false', () => {
      expect(resolveDryRun(false, true)).toEqual({ effective: true, overrideBlocked: true });
    });

    it('keeps dry run when server DRY_RUN=true and call asks for true or nothing', () => {
      expect(resolveDryRun(true, true)).toEqual({ effective: true, overrideBlocked: false });
      expect(resolveDryRun(undefined, true)).toEqual({ effective: true, overrideBlocked: false });
    });

    it('lets a call turn dry run ON when the server allows real sends', () => {
      expect(resolveDryRun(true, false)).toEqual({ effective: true, overrideBlocked: false });
    });

    it('sends for real only when server and call both allow it', () => {
      expect(resolveDryRun(false, false)).toEqual({ effective: false, overrideBlocked: false });
      expect(resolveDryRun(undefined, false)).toEqual({ effective: false, overrideBlocked: false });
    });
  });

  describe('phone masking', () => {
    it('masks a number', () => {
      expect(maskPhoneNumber('+46701234567')).toBe('+467****567');
    });

    it('masks numbers inside free text such as upstream errors', () => {
      const masked = maskPhoneNumbersInText('Invalid to: +46701234567 rejected');
      expect(masked).toBe('Invalid to: +467****567 rejected');
    });

    it('masks by default and shows full numbers only when opted in', () => {
      expect(presentPhoneNumber('+46701234567')).toBe('+467****567');
      process.env.SHOW_FULL_PHONE_NUMBERS = 'true';
      expect(presentPhoneNumber('+46701234567')).toBe('+46701234567');
    });

    it('does not mask alphanumeric sender IDs', () => {
      expect(presentPhoneNumber('MyShop')).toBe('MyShop');
    });
  });

  describe('sanitizeUntrustedText (OWASP MCP06)', () => {
    it('strips control characters', () => {
      expect(sanitizeUntrustedText('he\x00llo\x1b[31m')).toBe('hello[31m');
    });

    it('truncates long bodies', () => {
      const out = sanitizeUntrustedText('a'.repeat(1000));
      expect(out.length).toBeLessThan(400);
      expect(out).toContain('[truncated]');
    });

    it('handles non-string input', () => {
      expect(sanitizeUntrustedText(undefined)).toBe('');
    });
  });
});
