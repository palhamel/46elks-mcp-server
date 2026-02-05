/**
 * Custom error types for the MCP SMS server
 */

export class SmsError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'SmsError';
  }
}

export class ValidationError extends SmsError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ElksApiError extends SmsError {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message, 'ELKS_API_ERROR');
    this.name = 'ElksApiError';
  }
}

export class ConfigurationError extends SmsError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

/**
 * Format error response for MCP tools
 */
export const formatErrorResponse = (error: unknown): { type: 'text'; text: string } => {
  let errorMessage: string;
  let errorCode: string | undefined;

  if (error instanceof SmsError) {
    errorMessage = error.message;
    errorCode = error.code;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    // Handle RateLimitError specially
    if (error.name === 'RateLimitError') {
      errorCode = 'RATE_LIMIT_EXCEEDED';
    }
  } else {
    errorMessage = 'An unknown error occurred';
  }

  const formattedMessage = errorCode
    ? `Error (${errorCode}): ${errorMessage}`
    : `Error: ${errorMessage}`;

  return {
    type: 'text',
    text: formattedMessage,
  };
};

/**
 * Handle and format validation errors
 */
export const handleValidationError = (
  field: string,
  validation: { isValid: boolean; error?: string }
): void => {
  if (!validation.isValid && validation.error) {
    throw new ValidationError(`Invalid ${field}: ${validation.error}`);
  }
};

/**
 * Wrap async operations with error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof SmsError) {
      throw error; // Re-throw our custom errors
    }

    // Convert other errors to SmsError
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new SmsError(`${context}: ${message}`);
  }
};
