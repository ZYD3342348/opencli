# NeteaseMusic Desktop Adapter (网易云音乐)

Control **NeteaseMusic** (网易云音乐) from the terminal via Chrome DevTools Protocol (CDP). The app uses Chromium Embedded Framework (CEF).

## Prerequisites

Launch with remote debugging port:
```bash
/Applications/NeteaseMusic.app/Contents/MacOS/NeteaseMusic --remote-debugging-port=9234
```

## Setup

```bash
export OPENCLI_CDP_ENDPOINT="http://127.0.0.1:9234"
```

## Commands

| Command | Description |
|---------|-------------|
| `neteasemusic status` | Check CDP connection |
| `neteasemusic playing` | Current song info (title, artist, album) |
| `neteasemusic play` | Play / Pause toggle |
| `neteasemusic next` | Skip to next song |
| `neteasemusic prev` | Go to previous song |
| `neteasemusic search "query"` | Search songs, artists |
| `neteasemusic playlist` | Show current playback queue |
| `neteasemusic like` | Like / unlike current song |
| `neteasemusic lyrics` | Get lyrics of current song |
| `neteasemusic volume [0-100]` | Get or set volume |
