import { describe, expect, it } from 'vitest';
import { renderBrowserDoctorReport } from './doctor.js';

describe('doctor report rendering', () => {
  const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

  it('renders OK-style report when daemon and extension connected', () => {
    const text = strip(renderBrowserDoctorReport({
      daemonRunning: true,
      extensionConnected: true,
      issues: [],
    }));

    expect(text).toContain('[OK] Daemon: running on port 19825');
    expect(text).toContain('[OK] Extension: connected');
    expect(text).toContain('Everything looks good!');
  });

  it('renders MISSING when daemon not running', () => {
    const text = strip(renderBrowserDoctorReport({
      daemonRunning: false,
      extensionConnected: false,
      issues: ['Daemon is not running.'],
    }));

    expect(text).toContain('[MISSING] Daemon: not running');
    expect(text).toContain('[MISSING] Extension: not connected');
    expect(text).toContain('Daemon is not running.');
  });

  it('renders extension not connected when daemon is running', () => {
    const text = strip(renderBrowserDoctorReport({
      daemonRunning: true,
      extensionConnected: false,
      issues: ['Daemon is running but the Chrome extension is not connected.'],
    }));

    expect(text).toContain('[OK] Daemon: running on port 19825');
    expect(text).toContain('[MISSING] Extension: not connected');
  });

  it('renders connectivity OK when live test succeeds', () => {
    const text = strip(renderBrowserDoctorReport({
      daemonRunning: true,
      extensionConnected: true,
      connectivity: { ok: true, durationMs: 1234 },
      issues: [],
    }));

    expect(text).toContain('[OK] Connectivity: connected in 1.2s');
  });

  it('renders connectivity SKIP when not tested', () => {
    const text = strip(renderBrowserDoctorReport({
      daemonRunning: true,
      extensionConnected: true,
      issues: [],
    }));

    expect(text).toContain('[SKIP] Connectivity: not tested (use --live)');
  });
});
