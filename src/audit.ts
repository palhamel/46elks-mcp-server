/**
 * Structured audit logging for MCP tool invocations (MCP08)
 *
 * Provides JSON-formatted audit logs to stderr for security monitoring.
 * Sensitive data (phone numbers, message content) is masked or omitted.
 */

export interface AuditEntry {
  timestamp: string;
  tool: string;
  params: Record<string, unknown>;
  success: boolean;
  error?: string;
  dryRun: boolean;
  durationMs?: number;
}

/**
 * Mask phone numbers for audit logging
 * +46701234567 -> +467****567
 */
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return '****';
  const prefix = phone.slice(0, 4);
  const suffix = phone.slice(-3);
  return `${prefix}****${suffix}`;
}

/**
 * Sanitize parameters for audit logging
 * Removes message content, masks phone numbers
 */
function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    // Remove message content entirely - sensitive user data
    if (key === 'message') {
      sanitized['message_length'] = typeof value === 'string' ? value.length : 0;
      continue;
    }

    // Mask phone numbers
    if (key === 'to' || key === 'from') {
      sanitized[key] = typeof value === 'string' ? maskPhoneNumber(value) : '****';
      continue;
    }

    // Keep other parameters as-is
    // Safe params: direction, limit, dry_run, flashsms, message_id
    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Log an audit entry to stderr as JSON
 */
export function auditLog(
  entry: Omit<AuditEntry, 'timestamp' | 'params'> & { params: Record<string, unknown> }
): void {
  const auditEntry: AuditEntry = {
    timestamp: new Date().toISOString(),
    tool: entry.tool,
    params: sanitizeParams(entry.params),
    success: entry.success,
    dryRun: entry.dryRun,
  };

  if (entry.error) {
    auditEntry.error = entry.error;
  }

  if (entry.durationMs !== undefined) {
    auditEntry.durationMs = entry.durationMs;
  }

  // Output as JSON to stderr for structured logging
  console.error(JSON.stringify({ audit: auditEntry }));
}

/**
 * Create an audit logger for a specific tool invocation
 * Returns start() to begin timing and end() to log completion
 */
export function createAuditContext(tool: string, params: Record<string, unknown>, dryRun: boolean) {
  const startTime = Date.now();

  return {
    success: () => {
      auditLog({
        tool,
        params,
        success: true,
        dryRun,
        durationMs: Date.now() - startTime,
      });
    },
    failure: (error: string) => {
      auditLog({
        tool,
        params,
        success: false,
        error,
        dryRun,
        durationMs: Date.now() - startTime,
      });
    },
  };
}
