# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :white_check_mark: |
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

## OWASP MCP Top 10 Assessment

Assessed against the [OWASP MCP Top 10:2025](https://owasp.org/www-project-mcp-top-10/) (the list is
in beta and may change). "Mitigated" means a control exists in code; "Residual risk" is stated
openly. Nothing here is a guarantee: this is a small community project, reviewed by its maintainer.

| OWASP ID | Risk | Status |
|----------|------|--------|
| MCP01 | Token Mismanagement & Secret Exposure | Mitigated: credentials only from environment variables, never logged or written to disk |
| MCP02 | Privilege Escalation via Scope Creep | Mitigated: `DRY_RUN=true` is a hard floor, daily send cap, per-minute rate limit. Residual: no confirmation step in the server |
| MCP03 | Tool Poisoning | Mitigated: static tool definitions, no dynamic tool loading |
| MCP04 | Software Supply Chain & Dependency Tampering | Partly mitigated: one runtime dependency, lockfile, SHA-pinned Actions, digest-pinned Docker base, blocking high-severity `npm audit` in CI, Dependabot, CodeQL |
| MCP05 | Command Injection & Execution | Mitigated: no shell or process execution; runtime argument validation; form-encoded request bodies |
| MCP06 | Prompt Injection via Contextual Payloads | **Partly mitigated, residual risk remains** (see below) |
| MCP07 | Insufficient Authentication & Authorization | Acceptable for local stdio: trust boundary is your MCP client; 46elks credentials verified at startup |
| MCP08 | Lack of Audit and Telemetry | Mitigated: structured JSON audit log to stderr with masked numbers. Residual: no persistence or tamper protection |
| MCP09 | Shadow MCP Servers | Out of code scope. Install only from the official repository linked in the README |
| MCP10 | Context Injection & Over-Sharing | Mitigated by minimisation: numbers masked by default, account email/mobile/ID not returned, long bodies truncated |

### MCP06: prompt injection through inbound SMS (residual risk)

Anyone can text your 46elks number. Message bodies returned by `get_sms_messages` and
`check_sms_status` are therefore **untrusted input** that reaches the model, and the same model can
call `send_sms`. The server cannot fully prevent a model from being misled. Controls in place:

- Inbound bodies are labelled as untrusted, stripped of control characters and truncated (320 chars).
- Tool descriptions tell the model not to follow instructions found in message content.
- `DRY_RUN=true` cannot be switched off by a tool call, and real sends are capped per minute and
  per day (`DAILY_SMS_LIMIT`, default 50).

What you should do: **require human approval for `send_sms` in your MCP client**, keep `DRY_RUN=true`
unless you are deliberately sending, and keep the daily cap low. URL detection in outgoing messages
is a phishing warning only; it does not address inbound injection.

### MCP02: dry run is enforced by the server

If the server is started with `DRY_RUN=true`, a tool call with `dry_run: false` is ignored, the
response says so, and an `audit_warning` event (`dry_run_override_blocked`) is logged. A tool call
can only ever turn dry run **on**. To send real SMS, start the server with `DRY_RUN=false`.

### MCP05: input handling

Tool arguments are type-checked at runtime (not only by TypeScript). The values sent to 46elks are
the validated forms: phone numbers with whitespace/punctuation removed, messages with control
characters stripped. Message IDs are validated and URL-encoded.

- **Phone numbers**: international format required (+46...), placeholder numbers blocked
- **Messages**: control characters stripped, length limits, URL detection warning
- **Sender IDs**: common impersonation words blocked (BANK, POLICE, etc.)
- **Message IDs**: alphanumeric only
- **Network**: 15 second timeout on every 46elks request

### MCP01/MCP07: credential validation on startup

```
✓ Configuration validated
✓ 46elks credentials verified
✓ MCP SMS Server running on stdio
```

If credentials are invalid, the server does not start.

### MCP02: rate limits

| Control | Default | Environment variable |
|---------|---------|---------------------|
| `send_sms` per minute | 10 | `RATE_LIMIT_SMS_PER_MINUTE` |
| Other tools per minute | 60 | `RATE_LIMIT_QUERIES_PER_MINUTE` |
| Real SMS per 24 hours | 50 (`0` disables) | `DAILY_SMS_LIMIT` |

Invalid values (for example `abc`) fall back to the default instead of disabling the limit.

### MCP10: data minimisation

- Phone numbers returned to the model are masked (`+467****567`). Set `SHOW_FULL_PHONE_NUMBERS=true` to
  return them in full.
- `check_account_balance` returns balance, currency and account name only.
- Message bodies are truncated and labelled untrusted.

### MCP08: audit logging

All tool invocations are logged to stderr in JSON format:

```json
{
  "audit": {
    "timestamp": "2025-02-05T12:34:56.789Z",
    "tool": "send_sms",
    "params": {
      "to": "+467****567",
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
- Phone numbers are masked, including numbers that appear inside upstream error messages
- Message content is replaced with its length
- `dryRun` records the effective mode, after the server-enforced floor

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
DRY_RUN=true  # Enforced by the server; set to false only to send real SMS

# Optional limits
RATE_LIMIT_SMS_PER_MINUTE=10
RATE_LIMIT_QUERIES_PER_MINUTE=60
DAILY_SMS_LIMIT=50            # 0 disables the daily cap

# Optional privacy setting
SHOW_FULL_PHONE_NUMBERS=false # true returns unmasked numbers to the model
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
- **Server-enforced dry run**: `DRY_RUN=true` cannot be switched off by a tool call
- **Daily send cap**: Limits real SMS per 24 hours (`DAILY_SMS_LIMIT`)
- **Untrusted-content handling**: Inbound SMS labelled, truncated and masked before reaching the model
- **Data minimisation**: Account email, mobile number and ID are not returned to the model
- **Runtime argument validation**: Tool arguments are type-checked, not only cast
- **No credential storage**: Credentials passed via environment variables only
- **Local-only operation**: No HTTP endpoints, stdio transport only
- **Dependency scanning**: Automated Dependabot alerts and updates
- **Code scanning**: CodeQL analysis for vulnerability detection

## Disclaimer

This is an unofficial community project and is not affiliated with 46elks AB. For 46elks API security concerns, please contact [46elks support](https://46elks.com/support) directly.
