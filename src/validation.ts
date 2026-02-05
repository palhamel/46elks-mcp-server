/**
 * Phone number validation utilities
 */
export const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; error?: string } => {
  // Remove all whitespace and special characters except +
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

  // Check if it's empty
  if (!cleanNumber) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Block placeholder/test numbers that AI assistants commonly use
  const blockedNumbers = ['+46701234567', '+46700000000', '+1234567890', '+46000000000'];

  if (blockedNumbers.includes(cleanNumber)) {
    return {
      isValid: false,
      error: 'Please provide a real phone number - test/placeholder numbers are not allowed',
    };
  }

  // Check if it starts with +
  if (!cleanNumber.startsWith('+')) {
    return { isValid: false, error: 'Phone number must include country code (e.g., +46XXXXXXXXX)' };
  }

  // Check length (international numbers are typically 7-15 digits + country code)
  if (cleanNumber.length < 8 || cleanNumber.length > 16) {
    return { isValid: false, error: 'Phone number length is invalid' };
  }

  // Check if it contains only digits after the +
  const digitsOnly = cleanNumber.slice(1);
  if (!/^\d+$/.test(digitsOnly)) {
    return { isValid: false, error: 'Phone number can only contain digits after country code' };
  }

  // Specific validation for Swedish numbers
  if (cleanNumber.startsWith('+46')) {
    const swedishNumber = cleanNumber.slice(3); // Remove +46
    if (swedishNumber.length !== 9 && swedishNumber.length !== 8) {
      return {
        isValid: false,
        error: 'Swedish phone numbers should be 8-9 digits after +46',
      };
    }
  }

  return { isValid: true };
};

/**
 * Strip control characters from message (MCP05, MCP06)
 * Removes ASCII control characters except newlines/tabs which are valid in SMS
 */
function stripControlCharacters(text: string): string {
  // Remove control chars (0x00-0x1F) except tab (0x09), newline (0x0A), carriage return (0x0D)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Detect URLs/links in message content (MCP05, MCP06)
 * Returns warning if URLs are found (potential phishing indicator)
 */
function detectUrls(text: string): string | undefined {
  // Pattern to detect common URL formats
  const urlPatterns = [
    /https?:\/\/[^\s]+/i,           // http:// or https://
    /www\.[^\s]+/i,                  // www.
    /[a-zA-Z0-9-]+\.(com|org|net|se|io|co|uk|app|dev|info|biz)[^\s]*/i,  // Common TLDs
    /bit\.ly\/[^\s]+/i,              // Common URL shorteners
    /tinyurl\.com\/[^\s]+/i,
    /t\.co\/[^\s]+/i,
  ];

  for (const pattern of urlPatterns) {
    if (pattern.test(text)) {
      return '⚠️ Message contains URL/link - ensure this is legitimate and not misleading';
    }
  }

  return undefined;
}

/**
 * SMS message content validation with proper encoding considerations
 */
export const validateSmsMessage = (
  message: string
): { isValid: boolean; error?: string; info?: string; warning?: string } => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message content is required' };
  }

  // Strip control characters before validation
  const trimmedMessage = stripControlCharacters(message.trim());

  // Check if message contains non-GSM characters (emojis, special unicode)
  const gsmChars = /^[A-Za-z0-9\s@£$¥èéùìòÇØøÅåÉæÆß\^{}\[~\]|€\n\r\f\\]*$/;
  const isGsmEncoding = gsmChars.test(trimmedMessage);

  let maxSingleLength: number;
  let maxMultipartLength: number;
  let segmentLength: number;

  if (isGsmEncoding) {
    // GSM 03.38 encoding (standard SMS)
    maxSingleLength = 160;
    segmentLength = 153;
    maxMultipartLength = 1530; // 10 segments max for safety
  } else {
    // UTF-16 encoding (contains emojis/unicode)
    maxSingleLength = 70;
    segmentLength = 67;
    maxMultipartLength = 670; // 10 segments max for safety
  }

  // Check reasonable maximum length (prevent accidental bulk/long messages)
  if (trimmedMessage.length > maxMultipartLength) {
    return {
      isValid: false,
      error: `Message too long (max ${maxMultipartLength} chars). This appears to be bulk content - use dedicated bulk SMS services instead.`,
    };
  }

  // Calculate segments and provide info
  let segments: number;
  let info = '';
  let warning = '';

  if (trimmedMessage.length <= maxSingleLength) {
    segments = 1;
    info = `1 SMS segment (${isGsmEncoding ? 'GSM' : 'Unicode'} encoding)`;
  } else {
    segments = Math.ceil(trimmedMessage.length / segmentLength);
    info = `${segments} SMS segments (${isGsmEncoding ? 'GSM' : 'Unicode'} encoding)`;

    // Add warnings for expensive multi-part messages
    if (segments >= 3) {
      warning = `⚠️ Multi-part SMS will cost ${segments}x normal price`;
    }
    if (!isGsmEncoding && segments >= 2) {
      warning = `⚠️ Unicode SMS is more expensive and uses ${segments} segments`;
    }
  }

  // Check for URLs in message content (MCP05, MCP06 - potential phishing indicator)
  const urlWarning = detectUrls(trimmedMessage);
  if (urlWarning) {
    warning = warning ? `${warning}\n${urlWarning}` : urlWarning;
  }

  return {
    isValid: true,
    info,
    warning: warning || undefined,
  };
};

/**
 * Sender ID validation (from field) with responsible usage checks
 *
 * Validates the sender ID used in SMS messages. Sender IDs can be:
 * - Phone numbers: Must be valid international format (with +)
 * - Alphanumeric: Max 11 chars, must start with letter, letters/numbers only
 *
 * Blocks common impersonation attempts (BANK, POLICE, etc.) to prevent misuse.
 *
 * @param senderId - The sender ID to validate (phone number or alphanumeric name)
 * @returns Validation result with warnings for phone number usage
 */
export const validateSenderId = (
  senderId: string
): { isValid: boolean; error?: string; warning?: string } => {
  if (!senderId) {
    return { isValid: true }; // Sender ID is optional
  }

  const trimmed = senderId.trim();

  // Check if it's a phone number
  if (trimmed.startsWith('+')) {
    const phoneValidation = validatePhoneNumber(trimmed);
    if (!phoneValidation.isValid) {
      return phoneValidation;
    }
    // Add warning about using unverified phone numbers
    return {
      isValid: true,
      warning:
        'Using phone numbers as sender - ensure you can receive replies and have permission to use this number',
    };
  }

  // Check if it's an alphanumeric sender ID
  if (trimmed.length > 11) {
    return {
      isValid: false,
      error: 'Alphanumeric sender ID must be 11 characters or less',
    };
  }

  // Check if sender ID starts with a letter (46elks requirement)
  if (!/^[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Alphanumeric sender ID must start with a letter (46elks requirement)',
    };
  }

  // Check for valid characters in alphanumeric sender ID
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Sender ID can only contain letters and numbers (no spaces)',
    };
  }

  // Check for potentially problematic sender IDs
  const suspiciousSenders = [
    'BANK',
    'POLICE',
    'GOVERNMENT',
    'OFFICIAL',
    'URGENT',
    'WINNER',
    'PRIZE',
    'SECURITY',
    'VERIFY',
    'CONFIRM',
    'ALERT',
    'WARNING',
  ];

  if (suspiciousSenders.some(suspicious => trimmed.toUpperCase().includes(suspicious))) {
    return {
      isValid: false,
      error:
        'Sender ID appears to impersonate official entities - use your own business/service name',
    };
  }

  return { isValid: true };
};

/**
 * Validate message limit parameter
 */
export const validateMessageLimit = (limit: number): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(limit)) {
    return { isValid: false, error: 'Limit must be an integer' };
  }

  if (limit < 1) {
    return { isValid: false, error: 'Limit must be at least 1' };
  }

  if (limit > 100) {
    return { isValid: false, error: 'Limit cannot exceed 100' };
  }

  return { isValid: true };
};

/**
 * Validate direction parameter
 */
export const validateDirection = (direction: string): { isValid: boolean; error?: string } => {
  const validDirections = ['inbound', 'outbound', 'both'];

  if (!validDirections.includes(direction)) {
    return {
      isValid: false,
      error: `Direction must be one of: ${validDirections.join(', ')}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate 46elks message ID format (MCP05, MCP06)
 *
 * 46elks message IDs are alphanumeric strings.
 * This validation prevents injection attacks through malformed IDs.
 */
export const validateMessageId = (messageId: string): { isValid: boolean; error?: string } => {
  if (!messageId || typeof messageId !== 'string') {
    return { isValid: false, error: 'Message ID is required and must be a string' };
  }

  const trimmed = messageId.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message ID cannot be empty' };
  }

  // 46elks message IDs are alphanumeric (letters, numbers, potentially underscores/hyphens)
  // Typical format: s0123456789abcdef
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Message ID contains invalid characters (must be alphanumeric)',
    };
  }

  // Reasonable length check (46elks IDs are typically 16-32 chars)
  if (trimmed.length > 64) {
    return {
      isValid: false,
      error: 'Message ID is too long (max 64 characters)',
    };
  }

  return { isValid: true };
};
