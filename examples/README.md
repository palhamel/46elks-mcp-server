# 46elks MCP Server - Example Configurations

This directory contains example configuration files for different MCP clients.

## Claude Desktop

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

**Example:** See [claude-desktop-config.json](./claude-desktop-config.json)

## VS Code Copilot

**Location:**
- macOS: `~/Library/Application Support/Code/User/mcp.json`
- Windows: `%APPDATA%/Code/User/mcp.json`

**Example:** See [vscode-mcp-config.json](./vscode-mcp-config.json)

## Configuration Notes

### Required Environment Variables

- `ELKS_API_USERNAME`: Your 46elks API username (starts with `u`)
- `ELKS_API_PASSWORD`: Your 46elks API password (starts with `p`)
- `ELKS_PHONE_NUMBER`: Your 46elks phone number in international format (e.g., `+46701234567`)

### Optional Environment Variables

- `DRY_RUN`: Set to `"true"` for testing without sending real SMS (recommended for development)
- `PORT`: Server port (default: 3001)
- `WEBHOOK_URL`: Optional webhook URL for SMS callbacks

### Important Notes

1. **Use Absolute Paths**: Always use absolute paths in the `args` field
2. **Get API Credentials**: Find your API credentials in the 46elks dashboard under Account → API
3. **Test First**: Always test with `DRY_RUN=true` before sending real messages
4. **Account Balance**: Ensure your 46elks account has sufficient balance for SMS sending

### Finding Your Credentials

1. Log in to [46elks.com](https://www.46elks.com/)
2. Go to **Account** tab
3. Find the **API** section
4. Copy your **API username** and **API password**
5. Note your phone number from **Phone Numbers** section

### Security Best Practices

- Keep your API credentials secure
- Never commit credentials to version control
- Use dry run mode for development and testing
- Regularly rotate API credentials if exposed
