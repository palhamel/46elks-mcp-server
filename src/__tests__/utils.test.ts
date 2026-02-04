import { describe, it, expect } from 'vitest';
import {
  formatSmsResponse,
  formatSmsHistory,
  formatAccountBalance,
  formatDeliveryStatistics,
} from '../utils.js';
import type { SendSmsResponse, ElksMessage, AccountInfo } from '../elks-client.js';

describe('formatSmsResponse', () => {
  it('should format dry run SMS response', () => {
    const response: SendSmsResponse = {
      id: 'test123',
      to: '+46701234568',
      from: '+46701234569',
      message: 'Test message',
      created: '2024-01-01T12:00:00Z',
      status: 'created',
      estimated_cost: 5000,
      parts: 1,
    };

    const formatted = formatSmsResponse(response, true);
    expect(formatted).toContain('🧪 DRY RUN');
    expect(formatted).toContain('Test message');
    expect(formatted).toContain('0.5 SEK');
    expect(formatted).toContain('This was a test');
  });

  it('should format real SMS response', () => {
    const response: SendSmsResponse = {
      id: 'real123',
      to: '+46701234568',
      from: '+46701234569',
      message: 'Real message',
      created: '2024-01-01T12:00:00Z',
      status: 'sent',
      cost: 5000,
    };

    const formatted = formatSmsResponse(response, false);
    expect(formatted).toContain('📱 SENT');
    expect(formatted).toContain('Real message');
    expect(formatted).toContain('0.5 SEK');
    expect(formatted).not.toContain('This was a test');
  });
});

describe('formatSmsHistory', () => {
  it('should format empty message list', () => {
    const formatted = formatSmsHistory([], 10);
    expect(formatted).toContain('No SMS messages found');
  });

  it('should format message history with multiple messages', () => {
    const messages: ElksMessage[] = [
      {
        id: 'msg1',
        to: '+46701234568',
        from: '+46701234569',
        message: 'Outbound message',
        created: '2024-01-01T12:00:00Z',
        direction: 'outbound',
        status: 'delivered',
        cost: 5000,
      },
      {
        id: 'msg2',
        to: '+46701234569',
        from: '+46701234568',
        message: 'Inbound message',
        created: '2024-01-01T11:00:00Z',
        direction: 'inbound',
        status: 'delivered',
      },
    ];

    const formatted = formatSmsHistory(messages, 10);
    expect(formatted).toContain('SMS Message History');
    expect(formatted).toContain('📤 Sent');
    expect(formatted).toContain('📥 Received');
    expect(formatted).toContain('Outbound message');
    expect(formatted).toContain('Inbound message');
    expect(formatted).toContain('0.5 SEK');
  });
});

describe('formatAccountBalance', () => {
  it('should format account balance with sufficient funds', () => {
    const account: AccountInfo = {
      id: 'acc123',
      displayname: 'Test Account',
      mobilenumber: '+46701234568',
      email: 'test@example.com',
      currency: 'SEK',
      balance: 200000, // 20 SEK
    };

    const formatted = formatAccountBalance(account);
    expect(formatted).toContain('Account Balance Information');
    expect(formatted).toContain('20.00 SEK');
    expect(formatted).toContain('Test Account');
    expect(formatted).toContain('Balance sufficient');
  });

  it('should warn about low balance', () => {
    const account: AccountInfo = {
      id: 'acc123',
      displayname: 'Test Account',
      mobilenumber: '+46701234568',
      email: 'test@example.com',
      currency: 'SEK',
      balance: 50000, // 5 SEK
    };

    const formatted = formatAccountBalance(account);
    expect(formatted).toContain('5.00 SEK');
    expect(formatted).toContain('Low balance warning');
    expect(formatted).toContain('Consider adding funds');
  });
});

describe('formatDeliveryStatistics', () => {
  it('should format statistics for empty message list', () => {
    const formatted = formatDeliveryStatistics([]);
    expect(formatted).toContain('No messages found');
  });

  it('should format delivery statistics', () => {
    const messages: ElksMessage[] = [
      {
        id: 'msg1',
        to: '+46701234568',
        from: '+46701234569',
        message: 'Message 1',
        created: '2024-01-01T12:00:00Z',
        direction: 'outbound',
        status: 'delivered',
        cost: 5000,
      },
      {
        id: 'msg2',
        to: '+46701234568',
        from: '+46701234569',
        message: 'Message 2',
        created: '2024-01-01T11:00:00Z',
        direction: 'outbound',
        status: 'delivered',
        cost: 5000,
      },
      {
        id: 'msg3',
        to: '+46701234568',
        from: '+46701234569',
        message: 'Message 3',
        created: '2024-01-01T10:00:00Z',
        direction: 'outbound',
        status: 'failed',
        cost: 0,
      },
    ];

    const formatted = formatDeliveryStatistics(messages);
    expect(formatted).toContain('SMS Delivery Statistics');
    expect(formatted).toContain('Success Rate');
    expect(formatted).toContain('Total Cost');
    expect(formatted).toContain('Average Cost');
    expect(formatted).toContain('delivered');
  });

  it('should only analyze outbound messages', () => {
    const messages: ElksMessage[] = [
      {
        id: 'msg1',
        to: '+46701234568',
        from: '+46701234569',
        message: 'Outbound',
        created: '2024-01-01T12:00:00Z',
        direction: 'outbound',
        status: 'delivered',
        cost: 5000,
      },
      {
        id: 'msg2',
        to: '+46701234569',
        from: '+46701234568',
        message: 'Inbound',
        created: '2024-01-01T11:00:00Z',
        direction: 'inbound',
        status: 'delivered',
      },
    ];

    const formatted = formatDeliveryStatistics(messages);
    expect(formatted).toContain('1 outbound messages');
    expect(formatted).toContain('100%'); // 1 of 1 delivered
  });
});
