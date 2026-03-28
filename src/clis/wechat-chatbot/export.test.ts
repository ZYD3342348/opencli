import { describe, expect, it, vi } from 'vitest';

describe('wechat-chatbot/export', () => {
  it('navigates to questionList and exports through batchDownload without UI clicks', async () => {
    vi.resetModules();

    const registryModule = await import('../../registry.js');
    registryModule.getRegistry().delete('wechat-chatbot/export');
    await import('./export.js');

    const command = registryModule.getRegistry().get('wechat-chatbot/export');
    expect(command?.strategy).toBe(registryModule.Strategy.INTERCEPT);

    const evaluate = vi.fn().mockImplementation(async (js: string) => {
      const source = String(js);
      if (source.includes('location.href')) {
        return 'https://chatbot.weixin.qq.com/@demo-bot/platform/home';
      }
      if (source.includes('OPENCLI_LEGACY_EXPORT_CAPTURE')) {
        return {
          ok: true,
          records: [
            {
              url: '/btsapi/v2/skill/export',
              method: 'POST',
              text: JSON.stringify({
                code: 0,
                data: {
                  task_id: 'task_demo_001',
                },
              }),
            },
            {
              url: '/btsapi/v2/async/fetch',
              method: 'POST',
              text: JSON.stringify({
                code: 0,
                data: {
                  state: 2,
                  progress: 100,
                  url: 'https://download.example/1-export_skills_demo.csv',
                  row_count: 1112,
                },
              }),
            },
          ],
          state: {
            downLoadDialog: false,
            errorMsg: '',
            errorUrl: '',
            success: true,
            loading: false,
            allLoading: false,
          },
        };
      }
      return { ok: true };
    });
    const goto = vi.fn();
    const wait = vi.fn();

    const page = {
      goto,
      evaluate,
      wait,
    };

    const result = await command!.func!(page as any, { timeout: 5 });

    expect(goto).toHaveBeenCalledWith('https://chatbot.weixin.qq.com/@demo-bot/platform/dialogConfig/questionList');

    const injectedScripts = evaluate.mock.calls.slice(1).map(([js]) => String(js)).join('\n');
    expect(injectedScripts).toContain('OPENCLI_LEGACY_EXPORT_CAPTURE');
    expect(injectedScripts).toContain('batchDownload');
    expect(injectedScripts).toContain('/btsapi/v2/skill/export');
    expect(injectedScripts).toContain('/btsapi/v2/async/fetch');
    expect(injectedScripts).not.toContain('exportFAQEntries');
    expect(injectedScripts).not.toContain('getFAQExportProgress');
    expect(injectedScripts).not.toContain('pointerdown');
    expect(injectedScripts).not.toContain('mousedown');
    expect(injectedScripts).not.toContain('pointerup');
    expect(injectedScripts).not.toContain('mouseup');
    expect(injectedScripts).not.toContain('clickAt');
    expect(injectedScripts).not.toContain('dispatchEvent');

    expect(result).toEqual([
      {
        status: 'done',
        task_id: 'task_demo_001',
        download_url: 'https://download.example/1-export_skills_demo.csv',
        row_count: 1112,
      },
    ]);
  });
});
