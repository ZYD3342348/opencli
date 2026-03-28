# WeChat Chatbot Export Source Of Truth

> 最后更新：2026-03-28
> 适用仓库：`/Users/zengyuntan/python/opencli`
> 适用范围：`src/clis/wechat-chatbot/export.ts`

## 先看结论

- 当前稳定链路是 `questionList` 页面上的 Vue 内部导出链路，不是 UI 点击链路。
- 当前默认方案是：
  - 进入 `questionList`
  - 从 `#app.__vue__` 开始做 BFS
  - 找到同时具备 `batchDownload()` 和 `downLoadFile()` 的组件
  - 直接调用 `vm.batchDownload()`
  - 用拦截器观察：
    - `POST /btsapi/v2/skill/export`
    - `POST /btsapi/v2/async/fetch`
- 禁止把坐标点击、`dispatchEvent`、`MouseEvent`、`el.click()` 作为主方案。
- 禁止默认切回 FAQ 导出驱动。
- “拿到 download URL” 不等于真的成功，必须下载 CSV 并确认非空。

## 为什么现在以这条链路为准

这次的真实验证已经证明：

1. 页面是 Vue SPA，可以从 `#app.__vue__` 找到内部组件实例。
2. 裸调 `fetch('/btsapi/v2/skill/export')` 会触发 `invalid sign`，说明签名不适合在外部手拼。
3. UI 点击链路不稳定：
   - 页面会拒绝 `isTrusted=false` 的事件。
   - 坐标点击能伪造真点击，但太脆，CLI 里不该依赖。
4. Vue 内部方法链路既绕开 UI 点击问题，也能复用页面自己的签名和请求上下文。

## 为什么 FAQ 不再作为默认方案

FAQ 导出链路以前不是完全没跑通过，而是“不够稳定，不够可验收”。

这次我们已经确认两个现实问题：

- 在真实页面里，FAQ 相关组件并不总是存在，不能保证每次都找得到。
- 之前有过 FAQ 导出只拿到表头、没有真实数据行的情况。

所以 FAQ 路径现在的定位是：

- 可以作为临时探索线索
- 不可以作为默认稳定方案
- 除非后续拿到新的真实页面证据，证明 FAQ 已经变成官方稳定链路

## 本次真实验证证据

真实执行命令：

```bash
OPENCLI_BROWSER_COMMAND_TIMEOUT=120 opencli wechat-chatbot export --timeout 90
```

真实导出结果：

- `Status=done`
- `Task_id=90e7e588086346afb63a6d993805b83a`
- `Download_url=https://mmsprxiaoweicos-1258344707.cos.ap-shanghai.tencentcos.cn/chatbot/1-export_skills_897604_1774675548.csv`
- CLI 表里的 `Row_count=0`

后续人工复核发现：

- 这个 CSV 实际是非空的
- 文件总行数：`1113`
- 数据行数：`1112`
- 首行数据以 `2025教辅 | 2401 | ... | https://pan.baidu.com/...` 开头

结论：

- 不能只相信 CLI 表里的 `row_count`
- 必须把“下载 CSV 并确认非空”作为最终验收标准

## 代码约束

修改这个区域时，优先守住下面这些边界：

- 保持 `Strategy.INTERCEPT`
- 保留：
  - `resolveQuestionListUrl`
  - `deepFindFirstString`
  - `deepFindFirstNumber`
  - `parseAsyncFetchState`
  - 拦截器安装与解析逻辑
- 页面内逻辑优先：
  - Vue BFS 找组件
  - 调用组件内部导出方法
  - 轮询拦截到的 `/async/fetch`
- 不再回到：
  - UI 点击菜单
  - 坐标点击
  - synthetic event 驱动

## 验收标准

修改后至少过这三关：

1. 单测通过

```bash
npm test -- src/clis/wechat-chatbot/export.test.ts
```

2. 编译通过

```bash
npm run build
```

3. 如果做真实浏览器验收，必须同时满足：

- 能拿到导出 URL
- 能成功下载 CSV
- CSV 不只是表头，必须有真实数据行

## 后续如果又出现“FAQ 似乎也能跑”的情况，怎么判断

不要直接把 FAQ 改回默认方案，先按下面顺序判断：

1. FAQ 组件在真实页面里是否稳定存在
2. FAQ 导出的 CSV 是否持续非空
3. 是否比 `batchDownload()` 更稳定，而不是“偶尔也能通”
4. 是否已经有两轮以上真实验收，而不是一次碰巧成功

只有这些都成立，才可以考虑更新这份真相源。
