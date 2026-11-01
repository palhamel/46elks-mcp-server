/**
 * Runtime validation of tool arguments (OWASP MCP05, MCP06).
 * MCP clients can send any JSON, so TypeScript casts alone are not enough.
 */
import { ValidationError } from './errors.js';

type Args = Record<string, unknown>;

const MAX_STRING_LENGTH = 2000;

export const requireString = (args: Args, key: string, maxLength = MAX_STRING_LENGTH): string => {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ValidationError(`Invalid ${key}: a non-empty string is required`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`Invalid ${key}: too long (max ${maxLength} characters)`);
  }
  return value;
};

export const optionalString = (
  args: Args,
  key: string,
  maxLength = MAX_STRING_LENGTH
): string | undefined => {
  const value = args[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ValidationError(`Invalid ${key}: must be a string`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`Invalid ${key}: too long (max ${maxLength} characters)`);
  }
  return value;
};

export const optionalBoolean = (args: Args, key: string): boolean | undefined => {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new ValidationError(`Invalid ${key}: must be true or false`);
  }
  return value;
};

/** Integer argument, clamped into [min, max]; non-numeric input is rejected. */
export const optionalClampedInteger = (
  args: Args,
  key: string,
  min: number,
  max: number,
  fallback: number
): number => {
  const value = args[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`Invalid ${key}: must be a number`);
  }
  return Math.min(Math.max(Math.trunc(value), min), max);
};

export const optionalEnum = <T extends string>(
  args: Args,
  key: string,
  allowed: readonly T[]
): T | undefined => {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ValidationError(`Invalid ${key}: must be one of ${allowed.join(', ')}`);
  }
  return value as T;
};
