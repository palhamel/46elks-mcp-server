import { config } from './config.js';

export interface ElksMessage {
  id: string;
  to: string;
  from: string;
  message: string;
  created: string;
  direction: 'inbound' | 'outbound';
  status: 'created' | 'sent' | 'delivered' | 'failed';
  cost?: number;
}

export interface SendSmsResponse {
  id: string;
  to: string;
  from: string;
  message: string;
  created: string;
  status: string;
  cost?: number;
  estimated_cost?: number;
  parts?: number;
}

export interface AccountInfo {
  id: string;
  displayname: string;
  mobilenumber: string;
  email: string;
  currency: string;
  balance: number;
}

interface ElksApiMessage {
  id: string;
  to: string;
  from: string;
  message: string;
  created: string;
  direction: 'incoming' | 'outgoing';
  status: 'created' | 'sent' | 'delivered' | 'failed';
  cost?: number;
}

export class ElksClient {
  private readonly baseUrl = 'https://api.46elks.com/a1';
  private readonly auth: string;
  private readonly phoneNumber: string;
  private readonly dryRun: boolean;

  constructor(userConfig?: {
    elksUsername: string;
    elksPassword: string;
    elksPhoneNumber: string;
    dryRun: boolean;
  }) {
    if (userConfig) {
      // Use provided user configuration
      const credentials = `${userConfig.elksUsername}:${userConfig.elksPassword}`;
      this.auth = `Basic ${Buffer.from(credentials).toString('base64')}`;
      this.phoneNumber = userConfig.elksPhoneNumber;
      this.dryRun = userConfig.dryRun;
    } else {
      // Use global configuration (for backward compatibility)
      const credentials = `${config.elksUsername}:${config.elksPassword}`;
      this.auth = `Basic ${Buffer.from(credentials).toString('base64')}`;
      this.phoneNumber = config.elksPhoneNumber;
      this.dryRun = config.dryRun;
    }
  }

  /**
   * Test connection to 46elks API by fetching account info
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/Me`, {
        method: 'GET',
        headers: {
          Authorization: this.auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `46elks API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to connect to 46elks:', error);
      throw new Error(
        `46elks connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get account information including balance from 46elks API
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/Me`, {
        method: 'GET',
        headers: {
          Authorization: this.auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get account info: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw new Error(
        `46elks account info failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Send SMS via 46elks API
   */
  async sendSms(
    to: string,
    message: string,
    from?: string,
    dryRun?: boolean,
    flashsms?: string
  ): Promise<SendSmsResponse> {
    const formData = new URLSearchParams({
      to,
      message,
      from: from || this.phoneNumber,
    });

    // Add dry run parameter if enabled
    const isDryRun = dryRun !== undefined ? dryRun : this.dryRun;
    if (isDryRun) {
      formData.append('dryrun', 'yes');
    }

    // Add flash SMS parameter if specified
    if (flashsms === 'yes') {
      formData.append('flashsms', 'yes');
    }

    const response = await fetch(`${this.baseUrl}/sms`, {
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send SMS: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  }

  /**
   * Get SMS messages from 46elks
   */
  async getMessages(limit = 10, direction?: 'inbound' | 'outbound'): Promise<ElksMessage[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    // Convert our direction terms to 46elks API terms
    if (direction) {
      const apiDirection = direction === 'outbound' ? 'outgoing' : 'incoming';
      params.append('direction', apiDirection);
    }

    const response = await fetch(`${this.baseUrl}/sms?${params}`, {
      method: 'GET',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get messages: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    // Convert API response direction terms to our interface
    const messages = (data.data || []).map((msg: ElksApiMessage) => ({
      ...msg,
      direction: msg.direction === 'outgoing' ? 'outbound' : 'inbound',
    })) as ElksMessage[];

    return messages;
  }

  /**
   * Get specific SMS message by ID
   */
  async getMessageById(messageId: string): Promise<ElksMessage> {
    const response = await fetch(`${this.baseUrl}/sms/${messageId}`, {
      method: 'GET',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get message: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const message = await response.json();

    // Convert API response direction terms to our interface
    return {
      ...message,
      direction: message.direction === 'outgoing' ? 'outbound' : 'inbound',
    };
  }
}
