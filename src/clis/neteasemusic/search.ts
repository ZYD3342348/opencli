import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const searchCommand = cli({
  site: 'neteasemusic',
  name: 'search',
  description: 'Search for songs, artists, albums, or playlists',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [{ name: 'query', required: true, positional: true, help: 'Search query' }],
  columns: ['Index', 'Title', 'Artist'],
  func: async (page: IPage, kwargs: any) => {
    const query = kwargs.query as string;

    // Focus and fill the search box
    await page.evaluate(`
      (function(q) {
        const input = document.querySelector('.m-search input, #srch, [class*="search"] input, input[type="search"]');
        if (!input) throw new Error('Search input not found');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, q);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })(${JSON.stringify(query)})
    `);

    await page.pressKey('Enter');
    await page.wait(2);

    // Scrape results
    const results = await page.evaluate(`
      (function() {
        const items = [];
        // Song list items in search results
        const rows = document.querySelectorAll('.srchsongst li, .m-table tbody tr, [class*="songlist"] [class*="item"], table tbody tr');
        
        rows.forEach((row, i) => {
          if (i >= 20) return;
          const nameEl = row.querySelector('.sn, .name a, [class*="songName"], td:nth-child(2) a, b[title]');
          const artistEl = row.querySelector('.ar, .artist, [class*="artist"], td:nth-child(4) a, td:nth-child(3) a');
          
          const title = nameEl ? (nameEl.getAttribute('title') || nameEl.textContent || '').trim() : '';
          const artist = artistEl ? (artistEl.getAttribute('title') || artistEl.textContent || '').trim() : '';
          
          if (title) items.push({ Index: i + 1, Title: title, Artist: artist });
        });
        
        return items;
      })()
    `);

    if (results.length === 0) {
      return [{ Index: 0, Title: `No results for "${query}"`, Artist: '—' }];
    }
    return results;
  },
});
