/**
 * opencli wechat-chatbot export
 *
 * 导出微信对话平台（chatbot.weixin.qq.com）的知识问答问答表。
 *
 * 2026-03 的页面内确认结果：
 * 1. `questionList` 页面是 Vue SPA。
 * 2. 裸 `fetch('/btsapi/v2/skill/export')` 会返回 `invalid sign`，说明不能自己拼请求。
 * 3. 当前稳定可用链路不是 UI 点击，而是页面内部 Vue 组件的 `batchDownload()`。
 * 4. 真实导出链路会发出：
 *    - `POST /btsapi/v2/skill/export`
 *    - `POST /btsapi/v2/async/fetch`
 *
 * 命令策略保持 `Strategy.INTERCEPT`，但实现彻底移除 UI 点击、坐标和 dispatchEvent。
 */
import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

const QUESTION_LIST_PATH = '/platform/dialogConfig/questionList';

type ExportRow = {
  status: string;
  task_id: string;
  download_url: string;
  row_count: number;
};

type InterceptRecord = {
  url?: string;
  method?: string;
  text?: string;
  status?: number;
  body?: string;
};

type LegacyCaptureState = {
  ok: boolean;
  records: InterceptRecord[];
  timeout?: boolean;
  error?: string;
  state?: {
    downLoadDialog?: boolean;
    errorMsg?: string;
    errorUrl?: string;
    success?: boolean;
    loading?: boolean;
    allLoading?: boolean;
  };
};

type ParsedAsyncFetchState = {
  taskId: string;
  downloadUrl: string;
  rowCount: number;
  progress: number;
  state: number;
  statusText: string;
};

/**
 * 从当前页面 URL 中解析机器人 slug，并拼出 questionList 目标地址。
 * 这里不做静默兜底到首页，避免丢失上下文后误导用户。
 */
async function resolveQuestionListUrl(page: IPage): Promise<string> {
  const currentUrl = String(await page.evaluate('location.href') || '').trim();
  if (!currentUrl) {
    throw new Error('当前页面 URL 为空，无法进入 questionList');
  }

  const parsed = new URL(currentUrl);
  const segments = parsed.pathname.split('/').filter(Boolean);
  const slugSegment = segments.find((segment) => segment.startsWith('@')) ?? segments[0] ?? '';
  const slug = slugSegment.replace(/^@/, '');

  if (!slug) {
    throw new Error(`无法从当前地址解析机器人 slug：${currentUrl}`);
  }

  return `https://chatbot.weixin.qq.com/@${slug}${QUESTION_LIST_PATH}`;
}

function deepFindFirstString(input: unknown, keys: string[]): string {
  const wanted = new Set(keys);
  const seen = new Set<unknown>();

  const visit = (value: unknown, depth: number): string => {
    if (!value || depth > 6 || seen.has(value)) {
      return '';
    }
    if (typeof value !== 'object') {
      return '';
    }
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item, depth + 1);
        if (found) {
          return found;
        }
      }
      return '';
    }

    const record = value as Record<string, unknown>;
    for (const [key, inner] of Object.entries(record)) {
      if (wanted.has(key)) {
        const text = String(inner || '').trim();
        if (text) {
          return text;
        }
      }
    }
    for (const inner of Object.values(record)) {
      const found = visit(inner, depth + 1);
      if (found) {
        return found;
      }
    }
    return '';
  };

  return visit(input, 0);
}

function deepFindFirstNumber(input: unknown, keys: string[]): number {
  const wanted = new Set(keys);
  const seen = new Set<unknown>();

  const visit = (value: unknown, depth: number): number => {
    if (!value || depth > 6 || seen.has(value)) {
      return 0;
    }
    if (typeof value !== 'object') {
      return 0;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item, depth + 1);
        if (found > 0) {
          return found;
        }
      }
      return 0;
    }

    const record = value as Record<string, unknown>;
    for (const [key, inner] of Object.entries(record)) {
      if (wanted.has(key)) {
        const num = Number(inner ?? 0);
        if (Number.isFinite(num) && num > 0) {
          return num;
        }
      }
    }
    for (const inner of Object.values(record)) {
      const found = visit(inner, depth + 1);
      if (found > 0) {
        return found;
      }
    }
    return 0;
  };

  return visit(input, 0);
}

function parseAsyncFetchState(record: InterceptRecord): ParsedAsyncFetchState {
  let payload: unknown = {};
  try {
    payload = JSON.parse(String(record.text || '').trim() || '{}');
  } catch {
    payload = {};
  }

  const taskId = deepFindFirstString(payload, ['task_id', 'taskId', 'id']);
  const downloadUrl = deepFindFirstString(payload, ['url', 'download_url', 'downloadUrl', 'cosUrl']);
  const rowCount = deepFindFirstNumber(payload, ['row_count', 'rowCount', 'total', 'total_count']);
  const progress = deepFindFirstNumber(payload, ['progress']);
  const state = deepFindFirstNumber(payload, ['state', 'status']);
  const statusText = deepFindFirstString(payload, ['status', 'stateText', 'msg', 'message']);

  return {
    taskId,
    downloadUrl,
    rowCount,
    progress,
    state,
    statusText,
  };
}

/**
 * 页面内导出驱动定位逻辑。
 *
 * 只接受同时具备 `batchDownload` 和 `downLoadFile` 的组件，
 * 这和 Selenium 稳定版里验证通过的链路一致。
 */
function buildLegacyExportCaptureJs(timeoutSeconds: number): string {
  const timeoutMs = Math.max(5, timeoutSeconds) * 1000;
  return `
    async () => {
      // OPENCLI_LEGACY_EXPORT_CAPTURE
      // 当前稳定导出链路：POST /btsapi/v2/skill/export -> POST /btsapi/v2/async/fetch
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const parseText = (text) => {
        try {
          return JSON.parse(String(text || '').trim() || '{}');
        } catch (_err) {
          return {};
        }
      };

      const findLegacyExportDriver = () => {
        const root = document.querySelector('#app')?.__vue__;
        if (!root) {
          throw new Error('未找到 Vue 根实例，无法定位批量导出组件');
        }

        const seen = new Set();
        const queue = [root];

        while (queue.length > 0) {
          const vm = queue.shift();
          if (!vm || seen.has(vm)) continue;
          seen.add(vm);

          const methods = vm.$options?.methods || {};
          const hasBatchDownload = typeof vm.batchDownload === 'function'
            && typeof methods.batchDownload === 'function';
          const hasDownloadFile = typeof vm.downLoadFile === 'function'
            && typeof methods.downLoadFile === 'function';

          if (hasBatchDownload && hasDownloadFile) {
            return vm;
          }

          if (Array.isArray(vm.$children) && vm.$children.length > 0) {
            queue.push(...vm.$children);
          }
        }

        throw new Error('未找到批量导出组件');
      };

      const records = [];

      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this.__opencliExportRecord = {
          kind: 'xhr',
          method,
          url,
        };
        return origOpen.call(this, method, url, ...rest);
      };
      XMLHttpRequest.prototype.send = function(body) {
        if (this.__opencliExportRecord) {
          this.__opencliExportRecord.body = typeof body === 'string' ? body : '';
        }
        this.addEventListener('loadend', () => {
          try {
            records.push({
              ...(this.__opencliExportRecord || { kind: 'xhr', method: '', url: '' }),
              status: this.status,
              text: String(this.responseText || ''),
            });
          } catch (_err) {
          }
        }, { once: true });
        return origSend.call(this, body);
      };

      const origFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await origFetch(...args);
        try {
          const request = args[0];
          const url = typeof request === 'string'
            ? request
            : String(request?.url || '');
          const method = String(
            args[1]?.method
            || request?.method
            || 'GET'
          ).toUpperCase();
          const cloned = response.clone();
          const text = await cloned.text();
          records.push({
            kind: 'fetch',
            method,
            url,
            status: response.status,
            text,
          });
        } catch (_err) {
        }
        return response;
      };

      try {
        const driver = findLegacyExportDriver();
        await Promise.resolve(driver.batchDownload());

        const deadline = Date.now() + ${timeoutMs};
        while (Date.now() < deadline) {
          const finished = records.find((record) => {
            if (String(record.url || '').indexOf('/btsapi/v2/async/fetch') === -1) {
              return false;
            }
            const payload = parseText(record.text);
            const data = payload && typeof payload === 'object' ? (payload.data || {}) : {};
            return Boolean(String(data.url || '').trim());
          });

          if (finished) {
            return {
              ok: true,
              records,
              state: {
                downLoadDialog: Boolean(driver.downLoadDialog),
                errorMsg: String(driver.errorMsg || '').trim(),
                errorUrl: String(driver.errorUrl || '').trim(),
                success: Boolean(driver.success),
                loading: Boolean(driver.loading),
                allLoading: Boolean(driver.allLoading),
              },
            };
          }

          await wait(500);
        }

        return {
          ok: true,
          timeout: true,
          records,
          state: {
            downLoadDialog: Boolean(driver.downLoadDialog),
            errorMsg: String(driver.errorMsg || '').trim(),
            errorUrl: String(driver.errorUrl || '').trim(),
            success: Boolean(driver.success),
            loading: Boolean(driver.loading),
            allLoading: Boolean(driver.allLoading),
          },
        };
      } catch (err) {
        return {
          ok: false,
          error: String((err && err.message) || err || 'legacy export failed'),
          records,
        };
      } finally {
        XMLHttpRequest.prototype.open = origOpen;
        XMLHttpRequest.prototype.send = origSend;
        window.fetch = origFetch;
      }
    }
  `;
}

async function runLegacyExportCapture(page: IPage, timeoutSeconds: number): Promise<LegacyCaptureState> {
  const payload = await page.evaluate(
    buildLegacyExportCaptureJs(timeoutSeconds),
  ) as LegacyCaptureState;

  if (!payload?.ok) {
    throw new Error(String(payload?.error || '页面内批量导出失败'));
  }

  return payload;
}

function pickFinalExportResult(records: InterceptRecord[]): ExportRow {
  let lastTaskId = '';
  let lastDownloadUrl = '';
  let lastRowCount = 0;

  for (const record of records) {
    const url = String(record.url || '');
    if (url.includes('/btsapi/v2/skill/export')) {
      const parsed = parseAsyncFetchState(record);
      if (parsed.taskId) {
        lastTaskId = parsed.taskId;
      }
    }
    if (url.includes('/btsapi/v2/async/fetch')) {
      const parsed = parseAsyncFetchState(record);
      if (parsed.taskId) {
        lastTaskId = parsed.taskId;
      }
      if (parsed.downloadUrl) {
        lastDownloadUrl = parsed.downloadUrl;
      }
      if (parsed.rowCount > 0) {
        lastRowCount = parsed.rowCount;
      }
    }
  }

  if (!lastDownloadUrl) {
    throw new Error('批量导出未拿到最终 download_url');
  }

  return {
    status: 'done',
    task_id: lastTaskId,
    download_url: lastDownloadUrl,
    row_count: lastRowCount,
  };
}

cli({
  site: 'wechat-chatbot',
  name: 'export',
  description: '导出微信对话平台知识问答技能表 CSV',
  domain: 'chatbot.weixin.qq.com',
  strategy: Strategy.INTERCEPT,
  browser: true,
  args: [
    { name: 'timeout', type: 'int', default: 60 },
  ],
  columns: ['status', 'task_id', 'download_url', 'row_count'],
  func: async (page, kwargs) => {
    const timeout = Number(kwargs.timeout ?? 60);

    const targetUrl = await resolveQuestionListUrl(page);
    await page.goto(targetUrl);
    await page.wait(3);

    const capture = await runLegacyExportCapture(page, timeout);
    return [pickFinalExportResult(capture.records || [])];
  },
});
