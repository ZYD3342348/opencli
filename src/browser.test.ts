import { afterEach, describe, it, expect, vi } from 'vitest';
import { PlaywrightMCP, __test__ } from './browser/index.js';

describe('browser helpers', () => {
  it('extracts tab entries from string snapshots', () => {
    const entries = __test__.extractTabEntries('Tab 0 https://example.com\nTab 1 Chrome Extension');

    expect(entries).toEqual([
      { index: 0, identity: 'https://example.com' },
      { index: 1, identity: 'Chrome Extension' },
    ]);
  });

  it('extracts tab entries from MCP markdown format', () => {
    const entries = __test__.extractTabEntries(
      '- 0: (current) [Playwright MCP extension](chrome-extension://abc/connect.html)\n- 1: [知乎 - 首页](https://www.zhihu.com/)'
    );

    expect(entries).toEqual([
      { index: 0, identity: '(current) [Playwright MCP extension](chrome-extension://abc/connect.html)' },
      { index: 1, identity: '[知乎 - 首页](https://www.zhihu.com/)' },
    ]);
  });

  it('closes only tabs that were opened during the session', () => {
    const tabsToClose = __test__.diffTabIndexes(
      ['https://example.com', 'Chrome Extension'],
      [
        { index: 0, identity: 'https://example.com' },
        { index: 1, identity: 'Chrome Extension' },
        { index: 2, identity: 'https://target.example/page' },
        { index: 3, identity: 'chrome-extension://bridge' },
      ],
    );

    expect(tabsToClose).toEqual([3, 2]);
  });

  it('keeps only the tail of stderr buffers', () => {
    expect(__test__.appendLimited('12345', '67890', 8)).toBe('34567890');
  });

  it('times out slow promises', async () => {
    await expect(__test__.withTimeoutMs(new Promise(() => {}), 10, 'timeout')).rejects.toThrow('timeout');
  });
});

describe('PlaywrightMCP state', () => {
  it('transitions to closed after close()', async () => {
    const mcp = new PlaywrightMCP();

    expect(mcp.state).toBe('idle');

    await mcp.close();

    expect(mcp.state).toBe('closed');
  });

  it('rejects connect() after the session has been closed', async () => {
    const mcp = new PlaywrightMCP();
    await mcp.close();

    await expect(mcp.connect()).rejects.toThrow('Session is closed');
  });

  it('rejects connect() while already connecting', async () => {
    const mcp = new PlaywrightMCP();
    (mcp as any)._state = 'connecting';

    await expect(mcp.connect()).rejects.toThrow('Already connecting');
  });

  it('rejects connect() while closing', async () => {
    const mcp = new PlaywrightMCP();
    (mcp as any)._state = 'closing';

    await expect(mcp.connect()).rejects.toThrow('Session is closing');
  });
});
