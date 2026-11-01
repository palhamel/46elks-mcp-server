import { describe, it, expect } from 'vitest';
import {
  requireString,
  optionalString,
  optionalBoolean,
  optionalClampedInteger,
  optionalEnum,
} from '../args.js';
import { ValidationError } from '../errors.js';

describe('tool argument parsing (OWASP MCP05/MCP06)', () => {
  it('requireString rejects missing, empty and non-string values', () => {
    expect(() => requireString({}, 'to')).toThrow(ValidationError);
    expect(() => requireString({ to: '' }, 'to')).toThrow(ValidationError);
    expect(() => requireString({ to: 42 }, 'to')).toThrow(ValidationError);
    expect(() => requireString({ to: { a: 1 } }, 'to')).toThrow(ValidationError);
    expect(requireString({ to: '+46' }, 'to')).toBe('+46');
  });

  it('requireString rejects oversized input', () => {
    expect(() => requireString({ m: 'x'.repeat(5000) }, 'm')).toThrow(/too long/);
  });

  it('optionalString allows absence but not wrong types', () => {
    expect(optionalString({}, 'from')).toBeUndefined();
    expect(optionalString({ from: 'Shop' }, 'from')).toBe('Shop');
    expect(() => optionalString({ from: 5 }, 'from')).toThrow(ValidationError);
  });

  it('optionalBoolean only accepts real booleans', () => {
    expect(optionalBoolean({}, 'dry_run')).toBeUndefined();
    expect(optionalBoolean({ dry_run: false }, 'dry_run')).toBe(false);
    expect(() => optionalBoolean({ dry_run: 'false' }, 'dry_run')).toThrow(ValidationError);
  });

  it('optionalClampedInteger clamps and rejects NaN or strings', () => {
    expect(optionalClampedInteger({}, 'limit', 1, 100, 10)).toBe(10);
    expect(optionalClampedInteger({ limit: 500 }, 'limit', 1, 100, 10)).toBe(100);
    expect(optionalClampedInteger({ limit: -3 }, 'limit', 1, 100, 10)).toBe(1);
    expect(optionalClampedInteger({ limit: 7.9 }, 'limit', 1, 100, 10)).toBe(7);
    expect(() => optionalClampedInteger({ limit: 'abc' }, 'limit', 1, 100, 10)).toThrow(
      ValidationError
    );
    expect(() => optionalClampedInteger({ limit: NaN }, 'limit', 1, 100, 10)).toThrow(
      ValidationError
    );
  });

  it('optionalEnum rejects values outside the allowed set', () => {
    const allowed = ['inbound', 'outbound', 'both'] as const;
    expect(optionalEnum({}, 'direction', allowed)).toBeUndefined();
    expect(optionalEnum({ direction: 'both' }, 'direction', allowed)).toBe('both');
    expect(() => optionalEnum({ direction: 'sideways' }, 'direction', allowed)).toThrow(
      ValidationError
    );
  });
});
