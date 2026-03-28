import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const volumeCommand = cli({
  site: 'neteasemusic',
  name: 'volume',
  description: 'Get or set the volume level (0-100)',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [
    { name: 'level', required: false, positional: true, help: 'Volume level 0-100 (omit to read current)' },
  ],
  columns: ['Status', 'Volume'],
  func: async (page: IPage, kwargs: any) => {
    const level = kwargs.level as string | undefined;

    if (!level) {
      // Read current volume
      const vol = await page.evaluate(`
        (function() {
          const bar = document.querySelector('.m-playbar .vol .barbg .rng, [class*="volume"] [class*="progress"], [class*="volume"] [class*="played"]');
          if (bar) {
            const style = bar.getAttribute('style') || '';
            const match = style.match(/width:\\s*(\\d+\\.?\\d*)%/);
            if (match) return match[1];
          }
          
          const vol = document.querySelector('.m-playbar .j-vol, [class*="volume-value"]');
          if (vol) return vol.textContent.trim();
          
          return 'Unknown';
        })()
      `);

      return [{ Status: 'Current', Volume: vol + '%' }];
    }

    // Set volume by clicking on the volume bar at the right position
    const targetVol = Math.max(0, Math.min(100, parseInt(level, 10)));

    await page.evaluate(`
      (function(target) {
        const bar = document.querySelector('.m-playbar .vol .barbg, [class*="volume-bar"], [class*="volume"] [class*="track"]');
        if (!bar) return;
        
        const rect = bar.getBoundingClientRect();
        const x = rect.left + (rect.width * target / 100);
        const y = rect.top + rect.height / 2;
        
        bar.dispatchEvent(new MouseEvent('click', {
          clientX: x,
          clientY: y,
          bubbles: true,
        }));
      })(${targetVol})
    `);

    return [{ Status: 'Set', Volume: targetVol + '%' }];
  },
});
