# AGENTS.md

This repo has local knowledge that must be read before touching the WeChat chatbot export flow.

## First Read

1. `docs/wechat-chatbot-export-source-of-truth.md`
2. `docs/local-knowledge-and-upstream-sync.md`

## Hard Rules For `src/clis/wechat-chatbot/export.ts`

- Default stable chain is:
  - `questionList` page
  - Vue component BFS from `#app.__vue__`
  - call `batchDownload()`
  - intercept `/btsapi/v2/skill/export` and `/btsapi/v2/async/fetch`
- Do not default to FAQ export driver (`exportFAQEntries/getFAQExportProgress`) unless fresh real-page evidence proves it is the new stable chain.
- Do not use UI clicks, coordinates, `dispatchEvent`, or synthetic mouse events as the primary solution.
- “Got a download URL” is not enough. Real acceptance requires downloading the CSV and verifying it is non-empty.

## Verification

Before claiming success for this area, run:

```bash
npm test -- src/clis/wechat-chatbot/export.test.ts
npm run build
```

If doing a real browser verification, also confirm the exported CSV has data rows, not just a header row.
