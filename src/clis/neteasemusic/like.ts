import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const likeCommand = cli({
  site: 'neteasemusic',
  name: 'like',
  description: 'Like/unlike the currently playing song',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Status'],
  func: async (page: IPage) => {
    const result = await page.evaluate(`
      (function() {
        // The like/heart button in the player bar
        const btn = document.querySelector('.m-playbar .icn-love, .m-playbar [class*="like"], .m-player [class*="love"], [data-action="like"]');
        if (!btn) return 'Like button not found';
        
        const wasLiked = btn.classList.contains('loved') || btn.classList.contains('active') || btn.getAttribute('data-liked') === 'true';
        btn.click();
        return wasLiked ? 'Unliked' : 'Liked';
      })()
    `);

    return [{ Status: result }];
  },
});
