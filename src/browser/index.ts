/**
 * Browser module — public API re-exports.
 *
 * This barrel replaces the former monolithic browser.ts.
 * External code should import from './browser/index.js' (or './browser.js' via Node resolution).
 */

export { Page } from './page.js';
export { PlaywrightMCP } from './mcp.js';
export { isDaemonRunning } from './daemon-client.js';

// Backward compatibility: getTokenFingerprint is no longer needed but kept as no-op export
export function getTokenFingerprint(_token: string | undefined): string | null {
  return null;
}

import { extractTabEntries, diffTabIndexes, appendLimited } from './tabs.js';
import { withTimeoutMs } from '../runtime.js';

export const __test__ = {
  extractTabEntries,
  diffTabIndexes,
  appendLimited,
  withTimeoutMs,
};
