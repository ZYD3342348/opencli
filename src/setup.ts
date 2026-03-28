/**
 * setup.ts — Interactive browser setup for opencli
 *
 * Simplified for daemon-based architecture. No more token management.
 * Just verifies daemon + extension connectivity.
 */

import chalk from 'chalk';
import { checkDaemonStatus } from './browser/discover.js';
import { checkConnectivity } from './doctor.js';
import { PlaywrightMCP } from './browser/index.js';

export async function runSetup(opts: { cliVersion?: string; token?: string } = {}) {
  console.log();
  console.log(chalk.bold('  opencli setup') + chalk.dim(' — browser bridge configuration'));
  console.log();

  // Step 1: Check daemon
  console.log(chalk.dim('  Checking daemon status...'));
  const status = await checkDaemonStatus();

  if (status.running) {
    console.log(`  ${chalk.green('✓')} Daemon is running on port 19825`);
  } else {
    console.log(`  ${chalk.yellow('!')} Daemon is not running`);
    console.log(chalk.dim('    The daemon starts automatically when you run a browser command.'));
    console.log(chalk.dim('    Starting daemon now...'));

    // Try to spawn daemon
    const mcp = new PlaywrightMCP();
    try {
      await mcp.connect({ timeout: 5 });
      await mcp.close();
      console.log(`  ${chalk.green('✓')} Daemon started successfully`);
    } catch {
      console.log(`  ${chalk.yellow('!')} Could not start daemon automatically`);
    }
  }

  // Step 2: Check extension
  const statusAfter = await checkDaemonStatus();
  if (statusAfter.extensionConnected) {
    console.log(`  ${chalk.green('✓')} Chrome extension connected`);
  } else {
    console.log(`  ${chalk.red('✗')} Chrome extension not connected`);
    console.log();
    console.log(chalk.dim('  To install the opencli Browser Bridge extension:'));
    console.log(chalk.dim('    1. Download from GitHub Releases'));
    console.log(chalk.dim('    2. Open chrome://extensions/ → Enable Developer Mode'));
    console.log(chalk.dim('    3. Click "Load unpacked" → select the extension folder'));
    console.log(chalk.dim('    4. Make sure Chrome is running'));
    console.log();
    return;
  }

  // Step 3: Test connectivity
  console.log();
  console.log(chalk.dim('  Testing browser connectivity...'));
  const conn = await checkConnectivity({ timeout: 5 });
  if (conn.ok) {
    console.log(`  ${chalk.green('✓')} Browser connected in ${(conn.durationMs / 1000).toFixed(1)}s`);
    console.log();
    console.log(chalk.green.bold('  ✓ Setup complete! You can now use opencli browser commands.'));
  } else {
    console.log(`  ${chalk.yellow('!')} Connectivity test failed: ${conn.error ?? 'unknown'}`);
    console.log(chalk.dim(`    Run ${chalk.bold('opencli doctor --live')} to diagnose.`));
  }
  console.log();
}
