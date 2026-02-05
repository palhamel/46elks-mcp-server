# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**For security vulnerabilities, please use GitHub's private vulnerability reporting:**

1. Go to the [Security tab](https://github.com/palhamel/46elks-mcp-server/security) of this repository
2. Click "Report a vulnerability"
3. Provide details about the vulnerability

Alternatively, you can email security concerns to the repository maintainer (check the commit history for contact information).

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Updates**: We will provide updates on the status of your report
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days
- **Credit**: We will credit reporters in the release notes (unless you prefer to remain anonymous)

## OWASP MCP Top 10 Compliance

This MCP server has been hardened following the [OWASP MCP Security Top 10](https://owasp.org/www-project-mcp-security/) guidelines:

| OWASP ID | Risk | Mitigation Status |
|----------|------|-------------------|
| MCP01 | Tool Poisoning | Mitigated - Credential validation on startup |
| MCP02 | Excessive Agency | Mitigated - Limited to SMS operations only |
| MCP03 | Insecure Output Handling | Mitigated - Input validation prevents injection |
| MCP04 | Tool Permission Boundaries | Mitigated - Local-only operation, no network exposure |
| MCP05 | Prompt Injection via Tools | Mitigated - Input sanitization, URL detection, rate limiting |
| MCP06 | Insecure Tool Input | Mitigated - Comprehensive validation (phone, message, sender ID, message ID) |
| MCP07 | Third-Party Tool Risks | Mitigated - Credential verification, rate limiting |
| MCP08 | Inadequate Logging | Mitigated - Structured JSON audit logging |
| MCP09 | Lack of Security Documentation | Mitigated - This document |
| MCP10 | Insecure Tool Communication | Mitigated - Stdio transport only (no HTTP exposure) |

### MCP01/MCP07: Credential Validation

The server validates 46elks API credentials on startup before accepting any tool calls:

```
✓ Configuration validated
✓ 46elks credentials verified
✓ MCP SMS Server running on stdio
```

If credentials are invalid, the server will not start:

```
✗ 46elks credential verification failed: 401 Unauthorized
```

### MCP05/MCP07: Rate Limiting

The server implements rate limiting to prevent abuse:

| Tool Category | Default Limit | Environment Variable |
|--------------|---------------|---------------------|
| SMS Sending (`send_sms`) | 10 per minute | `RATE_LIMIT_SMS_PER_MINUTE` |
| Query Tools (all others) | 60 per minute | `RATE_LIMIT_QUERIES_PER_MINUTE` |

When rate limits are exceeded:

```
Error (RATE_LIMIT_EXCEEDED): Rate limit exceeded for SMS sending. Please wait 45 seconds before trying again.
```

### MCP05/MCP06: Input Sanitization

All tool inputs are validated and sanitized:

- **Phone numbers**: International format required (+46...), placeholder numbers blocked
- **Messages**: Control characters stripped, URL detection warnings, length limits
- **Sender IDs**: Impersonation attempts blocked (BANK, POLICE, etc.)
- **Message IDs**: Alphanumeric only, prevents injection attacks

### MCP08: Audit Logging

All tool invocations are logged to stderr in JSON format:

```json
{
  "audit": {
    "timestamp": "2025-02-05T12:34:56.789Z",
    "tool": "send_sms",
    "params": {
      "to": "+467****123",
      "message_length": 42,
      "dry_run": false
    },
    "success": true,
    "dryRun": false,
    "durationMs": 234
  }
}
```

**Privacy protections in audit logs:**
- Phone numbers are masked (+467****123)
- Message content is replaced with length only
- Only metadata (direction, limit, message_id) is logged in full

## Security Best Practices for Users

When using this MCP server:

1. **Keep credentials secure**: Never commit API credentials to version control
2. **Use environment variables**: Store `ELKS_API_USERNAME` and `ELKS_API_PASSWORD` securely
3. **Enable dry run mode**: Always test with `DRY_RUN=true` before sending real SMS
4. **Keep dependencies updated**: Run `npm audit` regularly and update when needed
5. **Use latest version**: Always use the latest release for security patches
6. **Monitor audit logs**: Review stderr output for suspicious activity
7. **Set rate limits**: Adjust `RATE_LIMIT_SMS_PER_MINUTE` for your use case

### Environment Variable Configuration

```bash
# Required credentials
ELKS_API_USERNAME=your-api-username
ELKS_API_PASSWORD=your-api-password
ELKS_PHONE_NUMBER=+46XXXXXXXXX

# Safety settings
DRY_RUN=true  # Set to false for production

# Optional rate limiting
RATE_LIMIT_SMS_PER_MINUTE=10
RATE_LIMIT_QUERIES_PER_MINUTE=60
```

## Scope

This security policy covers:

- The 46elks MCP server code in this repository
- Security of the MCP protocol implementation
- Input validation and sanitization
- Audit logging and rate limiting

This policy does **not** cover:

- 46elks API security (report to [46elks support](https://46elks.com/support))
- MCP client security (Claude Desktop, VS Code, etc.)
- Your own API credentials or account security

## Security Features Summary

This MCP server includes the following security features:

- **Credential validation**: API credentials verified before server starts
- **Rate limiting**: Prevents rapid SMS sending (abuse protection)
- **Structured audit logging**: JSON logs for security monitoring
- **Input validation**: Phone numbers, messages, sender IDs validated
- **Control character stripping**: Removes potentially harmful characters
- **URL detection**: Warns about links in SMS content
- **Anti-spoofing**: Blocks impersonation attempts (BANK, POLICE, etc.)
- **Message ID validation**: Prevents injection through malformed IDs
- **Dry run mode**: Prevents accidental SMS sending during development
- **No credential storage**: Credentials passed via environment variables only
- **Local-only operation**: No HTTP endpoints, stdio transport only
- **Dependency scanning**: Automated Dependabot alerts and updates
- **Code scanning**: CodeQL analysis for vulnerability detection

## Disclaimer

This is an unofficial community project and is not affiliated with 46elks AB. For 46elks API security concerns, please contact [46elks support](https://46elks.com/support) directly.
