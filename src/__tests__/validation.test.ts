import { describe, it, expect } from 'vitest';
import {
  validatePhoneNumber,
  validateSmsMessage,
  validateSenderId,
  validateMessageLimit,
  validateDirection,
  validateMessageId,
} from '../validation.js';

describe('validatePhoneNumber', () => {
  it('should accept valid international phone numbers', () => {
    expect(validatePhoneNumber('+46701234568').isValid).toBe(true);
    expect(validatePhoneNumber('+15551234567').isValid).toBe(true);
    expect(validatePhoneNumber('+447911123456').isValid).toBe(true);
  });

  it('should reject numbers without country code', () => {
    const result = validatePhoneNumber('0701234567');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('country code');
  });

  it('should reject empty phone numbers', () => {
    const result = validatePhoneNumber('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Phone number is required');
  });

  it('should reject placeholder/test numbers', () => {
    const result = validatePhoneNumber('+46701234567');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('test/placeholder');
  });

  it('should reject phone numbers with invalid characters', () => {
    const result = validatePhoneNumber('+46abc123456');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('only contain digits');
  });

  it('should validate Swedish phone number length', () => {
    const validSwedish = validatePhoneNumber('+46701234568');
    expect(validSwedish.isValid).toBe(true);

    const invalidSwedish = validatePhoneNumber('+4670123');
    expect(invalidSwedish.isValid).toBe(false);
  });
});

describe('validateSmsMessage', () => {
  it('should accept valid SMS messages', () => {
    const result = validateSmsMessage('Hello, this is a test message');
    expect(result.isValid).toBe(true);
    expect(result.info).toContain('1 SMS segment');
  });

  it('should reject empty messages', () => {
    const result = validateSmsMessage('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Message content is required');
  });

  it('should detect GSM encoding for standard characters', () => {
    const result = validateSmsMessage('Standard GSM text 123');
    expect(result.isValid).toBe(true);
    expect(result.info).toContain('GSM encoding');
  });

  it('should detect Unicode encoding for emojis', () => {
    const result = validateSmsMessage('Hello 👋');
    expect(result.isValid).toBe(true);
    expect(result.info).toContain('Unicode encoding');
  });

  it('should warn about multi-part messages', () => {
    const longMessage = 'a'.repeat(500); // Long enough for 3+ segments
    const result = validateSmsMessage(longMessage);
    expect(result.isValid).toBe(true);
    expect(result.warning).toBeDefined();
  });

  it('should reject extremely long messages', () => {
    const tooLongMessage = 'a'.repeat(2000);
    const result = validateSmsMessage(tooLongMessage);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too long');
  });
});

describe('validateSenderId', () => {
  it('should accept valid alphanumeric sender IDs', () => {
    const result = validateSenderId('MyApp');
    expect(result.isValid).toBe(true);
  });

  it('should accept valid phone numbers as sender ID', () => {
    const result = validateSenderId('+46701234568');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('permission');
  });

  it('should reject sender IDs longer than 11 characters', () => {
    const result = validateSenderId('ThisIsWayTooLong');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('11 characters');
  });

  it('should reject sender IDs not starting with a letter', () => {
    const result = validateSenderId('123App');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('start with a letter');
  });

  it('should reject impersonation attempts', () => {
    const result = validateSenderId('BANK');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('impersonate');
  });

  it('should accept empty sender ID (optional field)', () => {
    const result = validateSenderId('');
    expect(result.isValid).toBe(true);
  });
});

describe('validateMessageLimit', () => {
  it('should accept valid limits', () => {
    expect(validateMessageLimit(10).isValid).toBe(true);
    expect(validateMessageLimit(50).isValid).toBe(true);
    expect(validateMessageLimit(100).isValid).toBe(true);
  });

  it('should reject non-integer limits', () => {
    const result = validateMessageLimit(10.5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('integer');
  });

  it('should reject limits below 1', () => {
    const result = validateMessageLimit(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least 1');
  });

  it('should reject limits above 100', () => {
    const result = validateMessageLimit(101);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed 100');
  });
});

describe('validateDirection', () => {
  it('should accept valid directions', () => {
    expect(validateDirection('inbound').isValid).toBe(true);
    expect(validateDirection('outbound').isValid).toBe(true);
    expect(validateDirection('both').isValid).toBe(true);
  });

  it('should reject invalid directions', () => {
    const result = validateDirection('invalid');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must be one of');
  });
});

describe('validateMessageId', () => {
  it('should accept valid alphanumeric message IDs', () => {
    expect(validateMessageId('s0123456789abcdef').isValid).toBe(true);
    expect(validateMessageId('abc123').isValid).toBe(true);
    expect(validateMessageId('MSG-12345').isValid).toBe(true);
    expect(validateMessageId('test_message_id').isValid).toBe(true);
  });

  it('should reject empty message IDs', () => {
    const result = validateMessageId('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject null/undefined message IDs', () => {
    const result = validateMessageId(null as unknown as string);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject message IDs with special characters', () => {
    const result = validateMessageId('msg/../../../etc/passwd');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('invalid characters');
  });

  it('should reject message IDs with spaces', () => {
    const result = validateMessageId('msg 123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('invalid characters');
  });

  it('should reject excessively long message IDs', () => {
    const longId = 'a'.repeat(65);
    const result = validateMessageId(longId);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('should accept message IDs with hyphens and underscores', () => {
    expect(validateMessageId('msg-123_test').isValid).toBe(true);
  });
});

describe('URL detection in messages', () => {
  it('should warn about http URLs', () => {
    const result = validateSmsMessage('Check http://example.com for more');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('URL');
  });

  it('should warn about https URLs', () => {
    const result = validateSmsMessage('Visit https://example.com today');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('URL');
  });

  it('should warn about www links', () => {
    const result = validateSmsMessage('Go to www.example.com');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('URL');
  });

  it('should warn about common TLDs', () => {
    const result = validateSmsMessage('Check example.com/page');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('URL');
  });

  it('should warn about URL shorteners', () => {
    const result = validateSmsMessage('Click bit.ly/abc123');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('URL');
  });

  it('should not warn about messages without URLs', () => {
    const result = validateSmsMessage('Hello, your appointment is at 3pm');
    expect(result.isValid).toBe(true);
    // Should have no warning or only multi-part warning
    if (result.warning) {
      expect(result.warning).not.toContain('URL');
    }
  });
});

describe('control character stripping', () => {
  it('should strip null characters', () => {
    const result = validateSmsMessage('Hello\x00World');
    expect(result.isValid).toBe(true);
    // Message is valid after stripping
  });

  it('should preserve newlines', () => {
    const result = validateSmsMessage('Hello\nWorld');
    expect(result.isValid).toBe(true);
  });

  it('should preserve tabs', () => {
    const result = validateSmsMessage('Hello\tWorld');
    expect(result.isValid).toBe(true);
  });
});
