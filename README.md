# 46elks MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)

MCP server for 46elks SMS API - Send SMS messages through Swedish telecommunications infrastructure.

Enable Claude Desktop, VS Code Copilot, and other MCP-compatible tools to send SMS messages through Sweden's leading SMS provider with native 46elks integration and built-in anti-spoofing protection.

> ⚠️ **Disclaimer**: This is an unofficial community project and is not affiliated with or endorsed by 46elks AB.

## Getting Started

**Prerequisites**: You'll need [Node.js 20+](https://nodejs.org/) (LTS recommended) and one of these MCP clients: Claude Desktop, VS Code with Copilot, or Cursor.

### Step 1: Get 46elks Credentials

Before installing the MCP server, you'll need 46elks credentials:

#### 1.1 Create Account & Add Funds
1. Sign up at [46elks.com](https://www.46elks.com/)
2. Complete verification process
3. **Add funds to your account wallet** - SMS sending requires account balance
4. Go to the 46elks dashboard

> 💰 **Important**: You need money in your 46elks wallet to send real SMS messages. Each SMS has a cost (typically ~0.50-1.00 SEK per message depending on destination).

#### 1.2 Get API Credentials (NOT your account login)
1. In your 46elks dashboard, go to the **Account** tab
2. Look for the **API** section
3. Copy your **API username** (starts with `u`)
4. Copy your **API password** (starts with `p`)

> ⚠️ **Important**: Use your **API credentials** (found under Account → API), NOT your 46elks account login credentials. The API credentials are specifically for integrations like this MCP server.

#### 1.3 Get Phone Number
1. In your dashboard, go to **Phone Numbers**
2. Purchase or note your existing phone number
3. Use the full international format (e.g., `+46701234567`)

### Step 2: Install MCP Server

```bash
# Clone the repository
git clone https://github.com/palhamel/46elks-mcp-server.git
cd 46elks-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 3: Configure Your MCP Client

Choose your preferred MCP client:

#### Option A: Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "46elks": {
      "command": "node",
      "args": ["/path/to/46elks-mcp-server/dist/index.js"],
      "env": {
        "ELKS_API_USERNAME": "your_46elks_api_username",
        "ELKS_API_PASSWORD": "your_46elks_api_password",
        "ELKS_PHONE_NUMBER": "your_46elks_phone_number",
        "DRY_RUN": "true"
      }
    }
  }
}
```

**Important**: Replace `/path/to/46elks-mcp-server` with the actual path where you cloned the repository.

#### Option B: VS Code Copilot

Add this to your VS Code MCP configuration file:

**macOS**: `~/Library/Application Support/Code/User/mcp.json`  
**Windows**: `%APPDATA%/Code/User/mcp.json`

```json
{
  "mcpServers": {
    "46elks": {
      "command": "node",
      "args": ["/path/to/46elks-mcp-server/dist/index.js"],
      "env": {
        "ELKS_API_USERNAME": "your_46elks_api_username",
        "ELKS_API_PASSWORD": "your_46elks_api_password",
        "ELKS_PHONE_NUMBER": "your_46elks_phone_number",
        "DRY_RUN": "true"
      }
    }
  }
}
```

For detailed VS Code setup instructions, see: [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)

## Available Tools

> **Note**: This MCP server supports **sending SMS and checking message history**. You can send SMS and check for incoming replies using the `get_sms_messages` tool. Real-time SMS receiving (webhooks) is not implemented - use message history checking instead.

### `send_sms`
Send SMS messages with validation and cost estimation.

**Parameters:**
- `to` (required): Recipient phone number in international format
- `message` (required): SMS message text
- `from` (optional): Custom sender ID or phone number (see security notes below)
- `dryRun` (optional): Override environment DRY_RUN setting

**FROM Parameter Security:**
- **Default**: Uses your configured `ELKS_PHONE_NUMBER` (recommended for replies)
- **Custom Sender ID**: Max 11 alphanumeric characters, must start with letter
- **Phone Number**: Any valid international number (⚠️ ensure you have permission)
- **Validation**: Blocks impersonation attempts (BANK, POLICE, etc.)
- **Best Practice**: Use your own business name or verified phone number

**Examples:**
```
Send SMS to +46701234567 with message "Hello from Claude!"
```
```
Send SMS to +46701234567 from "MyApp" with message "Your order is ready!"
```

> 🔒 **Dry Run Safety**: By default, `DRY_RUN=true` simulates SMS sending without actual delivery or charges. Set to `false` only when ready to send real messages.

### `get_sms_messages`
Retrieve SMS message history with filtering options.

**Parameters:**
- `direction` (optional): "inbound", "outbound", or "both" (default: "both")
- `limit` (optional): Number of messages to retrieve (1-100, default: 10)

**Examples:**
```
Get my last 20 SMS messages
```
```
Show me only incoming SMS messages from the last hour
```

> 💡 **Checking Responses**: Use this tool to check if someone has replied to your SMS! While not instant like a chat, you can easily see incoming messages to your 46elks phone number. Perfect for checking customer responses or confirmations.

### `check_sms_status`
Check delivery status and details of sent messages.

**Parameters:**
- `messageId` (required): The message ID returned from send_sms

**Example:**
```
Check status of SMS message id abc123
```

### `estimate_sms_cost`
Get cost estimates without sending SMS.

**Parameters:**
- `to` (required): Recipient phone number
- `message` (required): SMS message text

### `check_account_balance`
Verify 46elks account balance and information.

**Example:**
```
Check my 46elks account balance
```

### `get_delivery_statistics`
Analyze SMS delivery success rates and statistics.

## Configuration Options

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ELKS_API_USERNAME` | Yes | Your 46elks API username | `u1234567890abcdef` |
| `ELKS_API_PASSWORD` | Yes | Your 46elks API password | `p1234567890abcdef` |
| `ELKS_PHONE_NUMBER` | Yes | Your 46elks phone number | `+46701234567` |
| `DRY_RUN` | No | Enable dry run mode (default: true) | `true` or `false` |

### Dry Run Mode (Cost Protection)

- **Enabled** (`DRY_RUN=true`): 
  - SMS messages are simulated with realistic cost estimates
  - No actual messages sent or charges incurred
  - Perfect for testing and development
  - **Default setting for safety**

- **Disabled** (`DRY_RUN=false`): 
  - SMS messages are actually sent through 46elks
  - Real charges apply to your account wallet
  - Only use when ready for production

**⚠️ Cost Protection**: We default to `DRY_RUN=true` to prevent accidental SMS sending and unexpected charges. This protects you from:
- Accidentally sending test messages to real numbers
- Incurring costs during development and testing  
- Sending messages with wrong content or recipients

**Recommended**: Always test thoroughly with `DRY_RUN=true` before switching to `false` for production use.

## SMS Costs & Limits

### Message Costs
- **Typical Cost**: ~0.50-1.00 SEK per SMS (varies by destination)
- **Multi-part Messages**: Charged per SMS part (160 chars = 1 part, 320 chars = 2 parts)
- **International**: Higher rates for non-Swedish numbers
- **Real-time Estimates**: Use `estimate_sms_cost` tool for exact pricing

### Message Limits
- **Character Limits**: 
  - 160 characters (standard GSM characters)
  - 70 characters (with emojis/special characters)
- **Rate Limits**: **100 SMS per minute per account** (enforced by 46elks API)
- **Multi-part**: Long messages automatically split and reassembled

### Rate Limiting Behavior
- **Enforcement**: Rate limits are enforced by 46elks at the API level, not by our MCP server
- **What Happens**: If you exceed 100 SMS per minute, 46elks will return rate limit errors
- **Bulk Operations**: For large batches (CSV files, etc.), you'll need to pace your requests
- **Recommendation**: For bulk sending, send SMS in batches of 90-95 per minute with 1-minute pauses
- **Error Handling**: Rate limit errors are returned clearly with instructions to retry after waiting


## Usage Examples

### Basic SMS Sending
```
Claude, send an SMS to +46701234567 saying "Meeting starts in 30 minutes"
```

### Check Message History
```
Show me my last 10 SMS messages
```

### Cost Estimation
```
How much would it cost to send "Long message..." to +46701234567?
```

### Account Management
```
What's my current 46elks account balance?
```

### Bulk SMS Operations

**⚠️ Important**: For large-scale SMS sending (100+ messages), we strongly recommend using 46elks' dedicated bulk SMS service instead of this MCP server.

**Recommended for Bulk SMS:**
- **46elks JustSend**: [justsend.46elks.com](https://justsend.46elks.com/)
- **Features**: CSV upload, scheduling, delivery reports, bulk pricing
- **Benefits**: No rate limits, optimized for large volumes, professional bulk tools

**If Using This MCP Server for Small Batches (<100 SMS):**
```
I have 50 customer phone numbers. Help me send promotional SMS within rate limits.
```
```
Estimate the cost to send "Event reminder" to 30 customers, and plan the timing.
```

**Small Batch Strategy** (Under 100 SMS):
- **Batch Size**: Maximum 90 SMS per minute to stay under limits
- **Time Required**: ~1 minute per 90 messages + brief pauses
- **Cost Planning**: Use `estimate_sms_cost` for accurate pricing
- **Safety First**: Always test with `DRY_RUN=true` before sending
- **Monitoring**: Check account balance before starting

**Why Use JustSend for Large Volumes:**
- **No Rate Limits**: Send thousands of SMS efficiently  
- **CSV Support**: Upload contact lists directly
- **Professional Tools**: Scheduling, templates, delivery tracking
- **Bulk Pricing**: Better rates for high volumes
- **Reliability**: Purpose-built for bulk operations

## Testing

✅ **Successfully tested with:**
- Claude Desktop (macOS/Windows)
- VS Code Copilot (macOS/Windows)

⏳ **Expected to work with:**
- Cursor (not yet verified)
- Other MCP-compatible tools

## Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/palhamel/46elks-mcp-server.git
cd 46elks-mcp-server

# Install dependencies
npm install

# Start development mode (auto-rebuild)
npm run dev

# Build for production
npm run build

# Test the server
npm start
```

### Project Structure

```
46elks-mcp-server/
├── src/
│   ├── index.ts          # Main MCP server
│   ├── config.ts         # Configuration management
│   ├── elks-client.ts    # 46elks API client
│   ├── validation.ts     # Input validation
│   └── utils.ts          # Utility functions
├── dist/                 # Compiled JavaScript
├── package.json
└── README.md
```

## Security

### API & Credential Security
- API credentials are passed through MCP client configuration (not stored in code)
- Dry run mode prevents accidental SMS sending during development
- Input validation prevents malicious phone numbers and messages
- No sensitive data is logged or stored

### Enhanced Security Features

**46elks Flexibility**: 46elks provides excellent flexibility in sender ID options, allowing custom sender names and phone numbers for various business needs.

**Our Additional Security Layer**: To help users follow best practices and avoid common pitfalls, we've added responsible validation features:

- ✅ **Smart Defaults**: Uses your verified `ELKS_PHONE_NUMBER` as default sender for reliable delivery
- ✅ **Best Practice Guidance**: Helps avoid sender IDs that might be filtered (BANK, POLICE, etc.)
- ✅ **Format Validation**: Ensures sender IDs meet 46elks requirements (max 11 chars, must start with letter)
- ✅ **Professional Recommendations**: Encourages use of legitimate business names or owned numbers
- ✅ **Permission Awareness**: Alerts when using phone numbers as sender IDs

**Benefits**: These features help ensure:
- Better SMS delivery rates by following carrier best practices
- Professional appearance and brand consistency
- Compliance with SMS regulations and carrier guidelines
- Reduced risk of messages being filtered or blocked

This approach enhances 46elks' powerful API with additional guidance for optimal results.

## Troubleshooting

### Common Issues

**Error: "Missing required environment variables"**
- Check your MCP client configuration file
- Ensure all required environment variables are set
- Verify file paths are absolute paths

**Error: "Invalid phone number format"**  
- Use international format: `+46701234567`
- Don't use spaces or dashes in phone numbers

**Messages not sending (DRY_RUN=false)**
- Verify 46elks account has sufficient balance
- Check phone number is valid and not blocked
- Ensure 46elks account is in good standing

**Rate Limit Errors (429 responses)**
- You've exceeded 100 SMS per minute - wait 1 minute before retry
- For bulk operations: pace requests to 90-95 SMS per minute
- Use cost estimation tools to plan large batches before sending
- Consider implementing delays between messages for CSV bulk operations

**MCP Server Best Practices** (Small Batches Only)
- **Recommended Limit**: Use this MCP server for <100 SMS at a time
- **Large Operations**: Use [justsend.46elks.com](https://justsend.46elks.com/) for bulk SMS instead
- **Rate Limits**: Stay under 90 SMS per minute if using MCP server
- **Testing**: Always test with `DRY_RUN=true` before any batch sending

**Build errors**
- Ensure Node.js 20+ LTS is installed (Node.js 18 is End of Life)
- Run `npm install` to install dependencies
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Getting Help

**For 46elks API, account, pricing, and service questions:**
- Visit: [46elks.com/support](https://46elks.com/support)
- Official 46elks documentation: [46elks.com/docs](https://www.46elks.com/docs)

**For bulk SMS sending or CSV upload:**
- Use 46elks' dedicated service: [justsend.46elks.com](https://justsend.46elks.com/)

**For MCP server issues:**
1. Check the [Issues](https://github.com/palhamel/46elks-mcp-server/issues) page for this project
2. Check MCP documentation for your client (Claude Desktop, VS Code, etc.)

## Contributing

Bug reports and pull requests are welcome on GitHub. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [code of conduct](CODE_OF_CONDUCT.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Disclaimer**: This is an unofficial community project and is not affiliated with or endorsed by 46elks AB. 46elks is a registered trademark of 46elks AB.

**🇸🇪 Made for the Swedish developer community** with ❤️ for AI-powered SMS automation.