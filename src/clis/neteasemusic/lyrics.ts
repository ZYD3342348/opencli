import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const lyricsCommand = cli({
  site: 'neteasemusic',
  name: 'lyrics',
  description: 'Get the lyrics of the currently playing song',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Line'],
  func: async (page: IPage) => {
    // Try to open lyrics panel if not visible
    await page.evaluate(`
      (function() {
        const btn = document.querySelector('.m-playbar .icn-lyric, [class*="lyric-btn"], [data-action="lyric"]');
        if (btn) btn.click();
      })()
    `);

    await page.wait(1);

    const lyrics = await page.evaluate(`
      (function() {
        // Look for lyrics container
        const selectors = [
          '.m-lyric p, .m-lyric [class*="line"]',
          '[class*="lyric-content"] p',
          '.listlyric li',
          '[class*="lyric"] [class*="line"]',
          '.j-lyric p',
        ];
        
        for (const sel of selectors) {
          const nodes = document.querySelectorAll(sel);
          if (nodes.length > 0) {
            return Array.from(nodes).map(n => (n.textContent || '').trim()).filter(l => l.length > 0);
          }
        }
        
        // Fallback: try the body text for any lyrics-like content
        return [];
      })()
    `);

    if (lyrics.length === 0) {
      return [{ Line: 'No lyrics found. Try opening the lyrics panel first.' }];
    }

    return lyrics.map((line: string) => ({ Line: line }));
  },
});
