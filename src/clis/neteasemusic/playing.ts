import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const playingCommand = cli({
  site: 'neteasemusic',
  name: 'playing',
  description: 'Get the currently playing song info',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Title', 'Artist', 'Album', 'Duration', 'Progress'],
  func: async (page: IPage) => {
    const info = await page.evaluate(`
      (function() {
        // NeteaseMusic player bar is at the bottom
        const selectors = {
          title: '.m-playbar .j-song .name, .m-playbar .song .name, [class*="playing"] .name, .m-player .name',
          artist: '.m-playbar .j-song .by, .m-playbar .song .by, [class*="playing"] .artist, .m-player .by',
          album: '.m-playbar .j-song .album, [class*="playing"] .album',
          time: '.m-playbar .j-dur, .m-playbar .time, .m-player .time',
          progress: '.m-playbar .barbg .rng, .m-playbar [role="progressbar"], .m-player [class*="progress"]',
        };
        
        function getText(sel) {
          for (const s of sel.split(',')) {
            const el = document.querySelector(s.trim());
            if (el) return (el.textContent || el.innerText || '').trim();
          }
          return '';
        }
        
        const title = getText(selectors.title);
        const artist = getText(selectors.artist);
        const album = getText(selectors.album);
        const time = getText(selectors.time);
        
        // Try to get playback progress from the progress bar width
        let progress = '';
        const bar = document.querySelector('.m-playbar .barbg .rng, [class*="progress"] [class*="played"]');
        if (bar) {
          const style = bar.getAttribute('style') || '';
          const match = style.match(/width:\\s*(\\d+\\.?\\d*)%/);
          if (match) progress = match[1] + '%';
        }
        
        if (!title) {
          // Fallback: try document title which often contains "songName - NeteaseMusic"
          const docTitle = document.title;
          if (docTitle && !docTitle.includes('NeteaseMusic')) {
            return { Title: docTitle, Artist: '', Album: '', Duration: '', Progress: '' };
          }
          return { Title: 'No song playing', Artist: '—', Album: '—', Duration: '—', Progress: '—' };
        }
        
        return { Title: title, Artist: artist, Album: album, Duration: time, Progress: progress };
      })()
    `);

    return [info];
  },
});
