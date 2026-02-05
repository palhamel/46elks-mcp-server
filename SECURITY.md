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

### Security Best Practices for Users

When using this MCP server:

1. **Keep credentials secure**: Never commit API credentials to version control
2. **Use environment variables**: Store `ELKS_API_USERNAME` and `ELKS_API_PASSWORD` securely
3. **Enable dry run mode**: Always test with `DRY_RUN=true` before sending real SMS
4. **Keep dependencies updated**: Run `npm audit` regularly and update when needed
5. **Use latest version**: Always use the latest release for security patches

### Scope

This security policy covers:

- The 46elks MCP server code in this repository
- Security of the MCP protocol implementation
- Input validation and sanitization

This policy does **not** cover:

- 46elks API security (report to [46elks support](https://46elks.com/support))
- MCP client security (Claude Desktop, VS Code, etc.)
- Your own API credentials or account security

## Security Features

This MCP server includes several security features:

- **Input validation**: Phone numbers and messages are validated before sending
- **Anti-spoofing**: Blocks impersonation attempts (BANK, POLICE, etc.)
- **Dry run mode**: Prevents accidental SMS sending during development
- **No credential storage**: Credentials are passed via environment variables only
- **Dependency scanning**: Automated Dependabot alerts and updates
- **Code scanning**: CodeQL analysis for vulnerability detection

## Disclaimer

This is an unofficial community project and is not affiliated with 46elks AB. For 46elks API security concerns, please contact [46elks support](https://46elks.com/support) directly.
