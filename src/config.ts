/**
 * Configuration for the 46elks MCP Server
 *
 * Required environment variables:
 * - ELKS_API_USERNAME: Your 46elks API username
 * - ELKS_API_PASSWORD: Your 46elks API password
 * - ELKS_PHONE_NUMBER: Your 46elks phone number (with country code, e.g., +46...)
 *
 * Optional environment variables:
 * - DRY_RUN: Set to "true" to enable dry run mode (no real SMS sent)
 * - RATE_LIMIT_SMS_PER_MINUTE: Max SMS sends per minute (default: 10)
 * - RATE_LIMIT_QUERIES_PER_MINUTE: Max query tool calls per minute (default: 60)
 * - DAILY_SMS_LIMIT: Max real SMS sends per 24h (default: 50, 0 disables)
 * - SHOW_FULL_PHONE_NUMBERS: Set to "true" to return unmasked numbers to the model
 *
 * DRY_RUN=true is enforced by the server: tool calls cannot switch it off.
 */
interface Config {
  elksUsername: string;
  elksPassword: string;
  elksPhoneNumber: string;
  dryRun: boolean;
}

export const config: Config = {
  elksUsername: process.env.ELKS_API_USERNAME || '',
  elksPassword: process.env.ELKS_API_PASSWORD || '',
  elksPhoneNumber: process.env.ELKS_PHONE_NUMBER || '',
  dryRun: process.env.DRY_RUN === 'true' || process.env.NODE_ENV === 'development',
};

export const validateConfig = (): void => {
  const requiredFields: Array<
    keyof Pick<Config, 'elksUsername' | 'elksPassword' | 'elksPhoneNumber'>
  > = ['elksUsername', 'elksPassword', 'elksPhoneNumber'];

  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    const envVarNames = missingFields.map(field => {
      // Convert camelCase to UPPER_SNAKE_CASE
      return field.replace(/([A-Z])/g, '_$1').toUpperCase();
    });

    throw new Error(
      `Missing required environment variables: ${envVarNames.join(', ')}\n` +
        'Please check your MCP client configuration (Claude Desktop config.json or VS Code mcp.json).'
    );
  }

  // Validate phone number format
  if (!config.elksPhoneNumber.startsWith('+')) {
    throw new Error('ELKS_PHONE_NUMBER must include country code (e.g., +46XXXXXXXXX)');
  }
};
