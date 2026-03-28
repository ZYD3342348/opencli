import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const prevCommand = cli({
  site: 'neteasemusic',
  name: 'prev',
  description: 'Go back to the previous song',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Status'],
  func: async (page: IPage) => {
    const clicked = await page.evaluate(`
      (function() {
        const btn = document.querySelector('.m-playbar .btnbak, .m-playbar [class*="prev"], .m-player .btn-prev, [data-action="prev"]');
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);

    if (!clicked) {
      await page.pressKey('Control+ArrowLeft');
    }

    await page.wait(1);
    return [{ Status: 'Went to previous song' }];
  },
});
