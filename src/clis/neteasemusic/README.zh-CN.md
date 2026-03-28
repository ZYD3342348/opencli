# 网易云音乐桌面端适配器

通过 Chrome DevTools Protocol (CDP) 在终端中控制 **网易云音乐**。该应用基于 Chromium Embedded Framework (CEF)。

## 前置条件

通过远程调试端口启动：
```bash
/Applications/NeteaseMusic.app/Contents/MacOS/NeteaseMusic --remote-debugging-port=9234
```

## 配置

```bash
export OPENCLI_CDP_ENDPOINT="http://127.0.0.1:9234"
```

## 命令

| 命令 | 说明 |
|------|------|
| `neteasemusic status` | 检查 CDP 连接 |
| `neteasemusic playing` | 当前播放歌曲信息 |
| `neteasemusic play` | 播放 / 暂停切换 |
| `neteasemusic next` | 下一首 |
| `neteasemusic prev` | 上一首 |
| `neteasemusic search "关键词"` | 搜索歌曲 |
| `neteasemusic playlist` | 显示当前播放列表 |
| `neteasemusic like` | 喜欢 / 取消喜欢 |
| `neteasemusic lyrics` | 获取当前歌词 |
| `neteasemusic volume [0-100]` | 获取或设置音量 |
