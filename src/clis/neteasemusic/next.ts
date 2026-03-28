import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const nextCommand = cli({
  site: 'neteasemusic',
  name: 'next',
  description: 'Skip to the next song',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Status'],
  func: async (page: IPage) => {
    const clicked = await page.evaluate(`
      (function() {
        const btn = document.querySelector('.m-playbar .btnfwd, .m-playbar [class*="next"], .m-player .btn-next, [data-action="next"]');
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);

    if (!clicked) {
      // Fallback: Ctrl+Right is common next-track shortcut
      await page.pressKey('Control+ArrowRight');
    }

    await page.wait(1);
    return [{ Status: 'Skipped to next song' }];
  },
});
