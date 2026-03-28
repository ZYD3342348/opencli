import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const playlistCommand = cli({
  site: 'neteasemusic',
  name: 'playlist',
  description: 'Show the current playback queue / playlist',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Index', 'Title', 'Artist'],
  func: async (page: IPage) => {
    // Open the playlist panel (usually a button at the bottom bar)
    await page.evaluate(`
      (function() {
        const btn = document.querySelector('.m-playbar .icn-list, .m-playbar [class*="playlist"], [data-action="playlist"], .m-playbar .btnlist');
        if (btn) btn.click();
      })()
    `);

    await page.wait(1);

    const items = await page.evaluate(`
      (function() {
        const results = [];
        // Playlist panel items
        const rows = document.querySelectorAll('.m-playlist li, [class*="playlist-panel"] li, .listlyric li, .j-playlist li');
        
        rows.forEach((row, i) => {
          const nameEl = row.querySelector('.name, [class*="name"], a, span:first-child');
          const artistEl = row.querySelector('.by, [class*="artist"], .ar');
          
          const title = nameEl ? (nameEl.getAttribute('title') || nameEl.textContent || '').trim() : (row.textContent || '').trim();
          const artist = artistEl ? (artistEl.textContent || '').trim() : '';
          
          if (title && title.length > 0) {
            results.push({ Index: i + 1, Title: title.substring(0, 80), Artist: artist });
          }
        });
        
        return results;
      })()
    `);

    if (items.length === 0) {
      return [{ Index: 0, Title: 'Playlist is empty or panel not open', Artist: '—' }];
    }
    return items;
  },
});
