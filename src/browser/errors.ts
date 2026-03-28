/**
 * Browser connection error helpers.
 *
 * Simplified — no more token/extension/CDP classification.
 * The daemon architecture has a single failure mode: daemon not reachable or extension not connected.
 */

export type ConnectFailureKind = 'daemon-not-running' | 'extension-not-connected' | 'command-failed' | 'unknown';

export function formatBrowserConnectError(kind: ConnectFailureKind, detail?: string): Error {
  switch (kind) {
    case 'daemon-not-running':
      return new Error(
        'Cannot connect to opencli daemon.\n\n' +
        'The daemon should start automatically. If it doesn\'t, try:\n' +
        '  node dist/daemon.js\n' +
        'Make sure port 19825 is available.' +
        (detail ? `\n\n${detail}` : ''),
      );
    case 'extension-not-connected':
      return new Error(
        'opencli Browser Bridge extension is not connected.\n\n' +
        'Please install the extension:\n' +
        '  1. Download from GitHub Releases\n' +
        '  2. Open chrome://extensions/ → Enable Developer Mode\n' +
        '  3. Click "Load unpacked" → select the extension folder\n' +
        '  4. Make sure Chrome is running' +
        (detail ? `\n\n${detail}` : ''),
      );
    case 'command-failed':
      return new Error(`Browser command failed: ${detail ?? 'unknown error'}`);
    default:
      return new Error(detail ?? 'Failed to connect to browser');
  }
}
