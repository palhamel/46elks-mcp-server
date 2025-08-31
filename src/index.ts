#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';
import { validateConfig, config } from './config.js';
import { ElksClient } from './elks-client.js';
import { formatErrorResponse, ConfigurationError, handleValidationError } from './errors.js';
import { validatePhoneNumber, validateSmsMessage, validateSenderId } from './validation.js';
import { formatSmsResponse, formatSmsHistory, formatAccountBalance, formatDeliveryStatistics } from './utils.js';

const server = new Server(
  {
    name: '46elks-mcp',
    version: '0.1.0',
    description: '46elks MCP Server - Send and receive SMS through Swedish telecommunications infrastructure'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'send_sms',
        description: 'Send SMS message via 46elks',
        inputSchema: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient phone number with country code - MUST be a real phone number, not a placeholder (e.g., +46XXXXXXXXX for Swedish numbers)'
            },
            message: {
              type: 'string',
              description: 'SMS message content (max 160 characters for single SMS)'
            },
            from: {
              type: 'string',
              description: 'Sender phone number or name (optional, uses default if not specified)'
            },
            flashsms: {
              type: 'string',
              description: 'Set to "yes" for flash SMS that displays immediately and is not stored (optional)'
            },
            dry_run: {
              type: 'boolean',
              description: 'Test mode - verify request without sending actual SMS (optional, defaults to environment setting)'
            }
          },
          required: ['to', 'message']
        }
      },
      {
        name: 'get_sms_messages',
        description: 'Retrieve SMS message history from 46elks',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of messages to retrieve (default: 10, max: 100)',
              minimum: 1,
              maximum: 100
            },
            direction: {
              type: 'string',
              enum: ['inbound', 'outbound', 'both'],
              description: 'Filter messages by direction (default: both)'
            }
          },
          required: []
        }
      },
      {
        name: 'check_sms_status',
        description: 'Check delivery status and details of a sent SMS',
        inputSchema: {
          type: 'object',
          properties: {
            message_id: {
              type: 'string',
              description: '46elks message ID returned when SMS was sent'
            }
          },
          required: ['message_id']
        }
      },
      {
        name: 'check_account_balance',
        description: 'Check 46elks account balance and account information to verify funds availability for SMS sending',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'estimate_sms_cost',
        description: 'Estimate cost and message segments for SMS without sending it',
        inputSchema: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient phone number with country code (e.g., +46XXXXXXXXX for Swedish numbers)'
            },
            message: {
              type: 'string',
              description: 'SMS message content to estimate cost for'
            },
            from: {
              type: 'string',
              description: 'Sender phone number or name (optional, uses default if not specified)'
            }
          },
          required: ['to', 'message']
        }
      },
      {
        name: 'get_delivery_statistics',
        description: 'Get SMS delivery statistics and success rates from recent messages',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of recent messages to analyze for statistics (default: 50, max: 100)',
              minimum: 10,
              maximum: 100
            }
          },
          required: []
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'send_sms':
        const { to, message, from, flashsms, dry_run } = args as {
          to: string;
          message: string;
          from?: string;
          flashsms?: string;
          dry_run?: boolean;
        };

        const isDryRunMode = dry_run !== undefined ? dry_run : config.dryRun;

        // Validate inputs
        handleValidationError('phone number', validatePhoneNumber(to));
        const messageValidation = validateSmsMessage(message);
        handleValidationError('message', messageValidation);
        if (from) {
          handleValidationError('sender ID', validateSenderId(from));
        }

        // Send SMS via 46elks
        const elksClient = new ElksClient();
        const response = await elksClient.sendSms(to, message, from, dry_run, flashsms);
        
        // Format response with validation warnings
        let responseText = formatSmsResponse(response, isDryRunMode);
        
        // Add validation warning if present
        if (messageValidation.warning) {
          responseText += `\n\n${messageValidation.warning}`;
        }
        
        
        return {
          content: [
            {
              type: 'text',
              text: responseText
            }
          ]
        };

      case 'get_sms_messages':
        const { limit = 10, direction } = args as {
          limit?: number;
          direction?: 'inbound' | 'outbound' | 'both';
        };

        // Validate limit
        const messageLimit = Math.min(Math.max(limit, 1), 100);
        
        // Get messages via 46elks
        const elksClientForMessages = new ElksClient();
        const messages = await elksClientForMessages.getMessages(
          messageLimit,
          direction === 'both' ? undefined : direction
        );
        
        return {
          content: [
            {
              type: 'text',
              text: formatSmsHistory(messages, messageLimit)
            }
          ]
        };

      case 'check_sms_status':
        const { message_id } = args as {
          message_id: string;
        };

        if (!message_id || typeof message_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'message_id is required and must be a string');
        }

        // Get message status via 46elks
        const elksClientForStatus = new ElksClient();
        const messageDetails = await elksClientForStatus.getMessageById(message_id);
        
        const cost = messageDetails.cost ? `${messageDetails.cost / 10000} SEK` : 'N/A';
        const date = new Date(messageDetails.created).toLocaleString();
        const messageDirection = messageDetails.direction === 'outbound' ? '📤 Sent' : '📥 Received';
        
        let statusText = `📱 SMS Status Check\n\n`;
        statusText += `${messageDirection} Message\n`;
        statusText += `ID: ${messageDetails.id}\n`;
        statusText += `Status: ${messageDetails.status}\n`;
        statusText += `To: ${messageDetails.to}\n`;
        statusText += `From: ${messageDetails.from}\n`;
        statusText += `Created: ${date}\n`;
        statusText += `Cost: ${cost}\n`;
        statusText += `Message: ${messageDetails.message}`;
        
        return {
          content: [
            {
              type: 'text',
              text: statusText
            }
          ]
        };

      case 'check_account_balance':
        // Get account information via 46elks
        const elksClientForAccount = new ElksClient();
        const accountInfo = await elksClientForAccount.getAccountInfo();
        
        return {
          content: [
            {
              type: 'text',
              text: formatAccountBalance(accountInfo)
            }
          ]
        };

      case 'estimate_sms_cost':
        const { to: estimateTo, message: estimateMessage, from: estimateFrom } = args as {
          to: string;
          message: string;
          from?: string;
        };

        // Validate inputs
        handleValidationError('phone number', validatePhoneNumber(estimateTo));
        const estimateMessageValidation = validateSmsMessage(estimateMessage);
        handleValidationError('message', estimateMessageValidation);
        if (estimateFrom) {
          handleValidationError('sender ID', validateSenderId(estimateFrom));
        }

        // Use dry run to get cost estimate
        const elksClientForEstimate = new ElksClient();
        const estimateResponse = await elksClientForEstimate.sendSms(estimateTo, estimateMessage, estimateFrom, true);
        
        const estimatedCost = estimateResponse.estimated_cost ? estimateResponse.estimated_cost / 10000 : 0;
        const messageLength = estimateMessage.length;
        const segments = estimateResponse.parts || (messageLength <= 160 ? 1 : Math.ceil(messageLength / 153));
        
        let costEstimateText = `💰 SMS Cost Estimate\n\n`;
        costEstimateText += `To: ${estimateTo}\n`;
        costEstimateText += `From: ${estimateResponse.from}\n`;
        costEstimateText += `Message length: ${messageLength} characters\n`;
        costEstimateText += `Message segments: ${segments}\n`;
        costEstimateText += `Estimated cost: ${estimatedCost.toFixed(2)} SEK\n\n`;
        
        if (segments > 1) {
          costEstimateText += `⚠️  Multi-part SMS: This message will be sent as ${segments} parts\n`;
          costEstimateText += `💡 Tip: Consider shortening to ≤160 characters for single SMS\n\n`;
        }
        
        costEstimateText += `📝 Message preview:\n"${estimateMessage}"\n\n`;
        
        // Add validation warning if present
        if (estimateMessageValidation.warning) {
          costEstimateText += `${estimateMessageValidation.warning}\n\n`;
        }
        
        costEstimateText += `🧪 This was an estimate only - no SMS was sent`;
        
        return {
          content: [
            {
              type: 'text',
              text: costEstimateText
            }
          ]
        };

      case 'get_delivery_statistics':
        const { limit: statsLimit = 50 } = args as {
          limit?: number;
        };

        // Validate and constrain limit
        const analysisLimit = Math.min(Math.max(statsLimit, 10), 100);
        
        // Get messages for analysis - only outbound messages matter for delivery stats
        const elksClientForStats = new ElksClient();
        const messagesForStats = await elksClientForStats.getMessages(analysisLimit);
        
        return {
          content: [
            {
              type: 'text',
              text: formatDeliveryStatistics(messagesForStats)
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [formatErrorResponse(error)]
    };
  }
});

// Start server
async function main() {
  try {
    // Validate configuration first
    validateConfig();
    console.error('✓ Configuration validated');
    
    // Show dry run status
    if (config.dryRun) {
      console.error('⚠️  DRY RUN mode enabled - SMS messages will NOT be sent');
    } else {
      console.error('📱 Production mode - SMS messages WILL be sent');
    }

    // Test 46elks connection (non-blocking)
    const elksClient = new ElksClient();
    try {
      await elksClient.testConnection();
      console.error('✓ 46elks connection successful');
    } catch (error) {
      console.error('⚠️  46elks connection test failed - server will start anyway');
      console.error('   This is normal if using test credentials or during development');
      console.error('   Real API calls will be validated when tools are used');
    }

    // Start MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✓ MCP SMS Server running on stdio');

  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('Configuration Error:', error.message);
      console.error('\nPlease check your MCP client configuration (Claude Desktop config.json or VS Code mcp.json).');
    } else {
      console.error('Server failed to start:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});