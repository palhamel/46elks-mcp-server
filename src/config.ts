interface Config {
  elksUsername: string;
  elksPassword: string;
  elksPhoneNumber: string;
  webhookUrl?: string;
  port: number;
  dryRun: boolean;
}

export const config: Config = {
  elksUsername: process.env.ELKS_API_USERNAME || '',
  elksPassword: process.env.ELKS_API_PASSWORD || '',
  elksPhoneNumber: process.env.ELKS_PHONE_NUMBER || '',
  webhookUrl: process.env.WEBHOOK_URL,
  port: parseInt(process.env.PORT || '3001', 10),
  dryRun: process.env.DRY_RUN === 'true' || process.env.NODE_ENV === 'development'
};

export const validateConfig = (): void => {
  const requiredFields: Array<keyof Pick<Config, 'elksUsername' | 'elksPassword' | 'elksPhoneNumber'>> = [
    'elksUsername',
    'elksPassword',
    'elksPhoneNumber'
  ];

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

  // Validate port is a valid number
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }
};