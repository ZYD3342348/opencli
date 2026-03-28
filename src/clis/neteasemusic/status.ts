import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

export const statusCommand = cli({
  site: 'neteasemusic',
  name: 'status',
  description: 'Check CDP connection to NeteaseMusic Desktop',
  domain: 'localhost',
  strategy: Strategy.UI,
  browser: true,
  args: [],
  columns: ['Status', 'Url', 'Title'],
  func: async (page: IPage) => {
    const url = await page.evaluate('window.location.href');
    const title = await page.evaluate('document.title');
    return [{ Status: 'Connected', Url: url, Title: title }];
  },
});
