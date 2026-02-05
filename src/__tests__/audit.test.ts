import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auditLog, createAuditContext } from '../audit.js';

describe('Audit Logging', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('auditLog', () => {
    it('should log audit entry as JSON to stderr', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '+46701234567', message: 'Test message' },
        success: true,
        dryRun: false,
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData).toHaveProperty('audit');
      expect(loggedData.audit.tool).toBe('send_sms');
      expect(loggedData.audit.success).toBe(true);
    });

    it('should mask phone numbers in audit logs', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '+46701234567', from: '+46709876543' },
        success: true,
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.params.to).toBe('+467****567');
      expect(loggedData.audit.params.from).toBe('+467****543');
    });

    it('should replace message content with length', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '+46701234567', message: 'This is a secret message' },
        success: true,
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.params.message).toBeUndefined();
      expect(loggedData.audit.params.message_length).toBe(24);
    });

    it('should include error message on failure', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '+46701234567' },
        success: false,
        error: 'Invalid phone number',
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.success).toBe(false);
      expect(loggedData.audit.error).toBe('Invalid phone number');
    });

    it('should include timestamp in ISO format', () => {
      auditLog({
        tool: 'check_account_balance',
        params: {},
        success: true,
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include dryRun status', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '+46701234567' },
        success: true,
        dryRun: true,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.dryRun).toBe(true);
    });

    it('should preserve safe parameters', () => {
      auditLog({
        tool: 'get_sms_messages',
        params: { limit: 10, direction: 'outbound' },
        success: true,
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.params.limit).toBe(10);
      expect(loggedData.audit.params.direction).toBe('outbound');
    });
  });

  describe('createAuditContext', () => {
    it('should track duration on success', async () => {
      const audit = createAuditContext('send_sms', { to: '+46701234567' }, false);

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 5));

      audit.success();

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.success).toBe(true);
      expect(loggedData.audit.durationMs).toBeGreaterThanOrEqual(0);
      expect(loggedData.audit.durationMs).toBeDefined();
    });

    it('should track duration on failure', async () => {
      const audit = createAuditContext('send_sms', { to: '+46701234567' }, false);

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 5));

      audit.failure('Network error');

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.success).toBe(false);
      expect(loggedData.audit.error).toBe('Network error');
      expect(loggedData.audit.durationMs).toBeGreaterThanOrEqual(0);
      expect(loggedData.audit.durationMs).toBeDefined();
    });
  });

  describe('phone number masking', () => {
    it('should mask very short phone numbers completely', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '+12345' },
        success: true,
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      // Very short numbers (< 8 chars) get completely masked
      expect(loggedData.audit.params.to).toBe('****');
    });

    it('should handle missing phone number', () => {
      auditLog({
        tool: 'send_sms',
        params: { to: '' },
        success: false,
        dryRun: false,
      });

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.audit.params.to).toBe('****');
    });
  });
});
