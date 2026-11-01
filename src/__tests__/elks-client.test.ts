import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Credentials are fake test values; no network call is made (fetch is mocked).
const loadClient = async (dryRun: boolean) => {
  vi.resetModules();
  process.env.ELKS_API_USERNAME = 'test-user';
  process.env.ELKS_API_PASSWORD = 'test-pass';
  process.env.ELKS_PHONE_NUMBER = '+46700000009';
  process.env.DRY_RUN = dryRun ? 'true' : 'false';
  const { ElksClient } = await import('../elks-client.js');
  return new ElksClient();
};

describe('ElksClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 's1' }) });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DRY_RUN;
  });

  it('never leaves dry run when the server enforces DRY_RUN=true (OWASP MCP02)', async () => {
    const client = await loadClient(true);
    await client.sendSms('+46701234567', 'hello', undefined, false);
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('dryrun')).toBe('yes');
  });

  it('sends for real only when the server allows it and the call does not ask for dry run', async () => {
    const client = await loadClient(false);
    await client.sendSms('+46701234567', 'hello', undefined, false);
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('dryrun')).toBeNull();
  });

  it('URL-encodes the message id and sets a timeout', async () => {
    const client = await loadClient(false);
    await client.getMessageById('abc/../me');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/sms/abc%2F..%2Fme');
    expect(init.signal).toBeDefined();
  });
});
