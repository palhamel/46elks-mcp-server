import { SendSmsResponse, ElksMessage, AccountInfo } from './elks-client.js';

/**
 * Format SMS response for MCP tool output
 */
export const formatSmsResponse = (response: SendSmsResponse, isDryRun: boolean): string => {
  const mode = isDryRun ? '🧪 DRY RUN' : '📱 SENT';
  const cost = response.estimated_cost ? 
    `Estimated cost: ${response.estimated_cost / 10000} SEK` : 
    response.cost ? `Cost: ${response.cost / 10000} SEK` : 'Cost: N/A';

  let output = `${mode} SMS Status: ${response.status}\n`;
  output += `To: ${response.to}\n`;
  output += `From: ${response.from}\n`;
  output += `Message: ${response.message}\n`;
  output += `${cost}\n`;
  
  if (response.parts) {
    output += `Message parts: ${response.parts}\n`;
  }
  
  if (response.id) {
    output += `Message ID: ${response.id}\n`;
  }
  
  if (isDryRun) {
    output += '\n⚠️  This was a test - no actual SMS was sent';
  }

  return output;
};

/**
 * Format SMS message history for MCP tool output
 */
export const formatSmsHistory = (messages: ElksMessage[], limit: number): string => {
  if (messages.length === 0) {
    return '📭 No SMS messages found';
  }

  let output = `📱 SMS Message History (${messages.length} of ${limit} requested)\n\n`;

  messages.forEach((msg, index) => {
    const direction = msg.direction === 'outbound' ? '📤 Sent' : '📥 Received';
    const cost = msg.cost ? ` (${msg.cost / 10000} SEK)` : '';
    const date = new Date(msg.created).toLocaleString();
    
    output += `${index + 1}. ${direction}${cost}\n`;
    output += `   To: ${msg.to}\n`;
    output += `   From: ${msg.from}\n`;
    output += `   Status: ${msg.status}\n`;
    output += `   Created: ${date}\n`;
    output += `   Message: ${msg.message}\n`;
    if (msg.id) {
      output += `   ID: ${msg.id}\n`;
    }
    output += '\n';
  });

  return output.trim();
};

/**
 * Format account balance information for MCP tool output
 */
export const formatAccountBalance = (accountInfo: AccountInfo): string => {
  const balanceInCurrency = accountInfo.balance / 10000;
  const formattedBalance = `${balanceInCurrency.toFixed(2)} ${accountInfo.currency}`;
  
  let output = `💰 Account Balance Information\n\n`;
  output += `Balance: ${formattedBalance}\n`;
  output += `Account: ${accountInfo.displayname}\n`;
  output += `Mobile: ${accountInfo.mobilenumber}\n`;
  output += `Email: ${accountInfo.email}\n`;
  output += `Currency: ${accountInfo.currency}\n`;
  output += `Account ID: ${accountInfo.id}\n\n`;
  
  // Add balance status indication
  if (balanceInCurrency < 10) {
    output += `⚠️  Low balance warning: Consider adding funds to your account\n`;
    output += `💡 Note: Adding funds must be done through the 46elks web interface at https://dashboard.46elks.com/`;
  } else {
    output += `✅ Balance sufficient for SMS sending`;
  }
  
  return output;
};

/**
 * Calculate and format delivery statistics from messages
 */
export const formatDeliveryStatistics = (messages: ElksMessage[]): string => {
  if (messages.length === 0) {
    return '📊 No messages found to analyze';
  }

  // Filter only outbound messages (we can't analyze delivery for inbound)
  const outboundMessages = messages.filter(msg => msg.direction === 'outbound');
  
  if (outboundMessages.length === 0) {
    return '📊 No outbound messages found to analyze delivery statistics';
  }

  // Count messages by status
  const statusCounts = outboundMessages.reduce((counts, msg) => {
    counts[msg.status] = (counts[msg.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  // Calculate costs
  const totalCost = outboundMessages
    .filter(msg => msg.cost)
    .reduce((sum, msg) => sum + (msg.cost || 0), 0) / 10000;

  const averageCost = totalCost / Math.max(outboundMessages.filter(msg => msg.cost).length, 1);

  // Calculate success rate
  const deliveredCount = statusCounts.delivered || 0;
  const sentCount = statusCounts.sent || 0;
  const successfulMessages = deliveredCount + sentCount;
  const successRate = Math.round((successfulMessages / outboundMessages.length) * 100);

  // Build statistics output
  let output = `📊 SMS Delivery Statistics\n\n`;
  output += `📈 Summary (Last ${outboundMessages.length} outbound messages)\n`;
  output += `Success Rate: ${successRate}% (${successfulMessages}/${outboundMessages.length})\n`;
  output += `Total Cost: ${totalCost.toFixed(2)} SEK\n`;
  output += `Average Cost: ${averageCost.toFixed(2)} SEK per SMS\n\n`;

  output += `📋 Message Status Breakdown:\n`;
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = Math.round((count / outboundMessages.length) * 100);
    const statusEmoji = getStatusEmoji(status);
    output += `${statusEmoji} ${status}: ${count} (${percentage}%)\n`;
  });

  output += `\n📅 Analysis Period: ${new Date(outboundMessages[outboundMessages.length - 1].created).toLocaleDateString()} - ${new Date(outboundMessages[0].created).toLocaleDateString()}`;

  // Add recommendations
  if (successRate < 90) {
    output += `\n\n⚠️  Low success rate detected. Consider:\n`;
    output += `• Verifying phone number formats\n`;
    output += `• Checking message content for blocked words\n`;
    output += `• Ensuring recipient numbers are active`;
  } else {
    output += `\n\n✅ Good delivery performance!`;
  }

  return output;
};

/**
 * Get emoji for message status
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'delivered': return '✅';
    case 'sent': return '📤';
    case 'failed': return '❌';
    case 'created': return '🕐';
    default: return '❓';
  }
}