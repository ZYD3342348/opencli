import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const playCommand = cli({
  site: 'neteasemusic',
  name: 'play',
  description: 'Toggle play/pause for the current song',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Status'],
  func: async (page: IPage) => {
    // Click the play/pause button or use Space key
    const clicked = await page.evaluate(`
      (function() {
        const btn = document.querySelector('.m-playbar .btnp, .m-playbar [class*="play"], .m-player .btn-play, [data-action="play"]');
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);

    if (!clicked) {
      // Fallback: use Space key which is the universal play/pause shortcut
      await page.pressKey('Space');
    }

    return [{ Status: 'Play/Pause toggled' }];
  },
});
