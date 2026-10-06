# CallVault — Personal Call Recording Manager

A local-first, privacy-focused desktop application built with Electron, React, Vite, and SQLite for managing large collections of local call recordings (`.m4a`).

## Architecture

```text
                    CallVault
                        |
             +----------+----------+
             |                     |
        React Renderer        Electron Main
             |                     |
             |               +-----+------+
             |               |            |
             |            Scanner      SQLite
             |               |
             |          File System
             |
          IPC / Preload
```

- **Electron Main Process**: Embedded SQLite database (`better-sqlite3`), recursive scanner, metadata extractor (`music-metadata`), file watcher (`chokidar`), and IPC handlers.
- **Preload & IPC**: Secure bridge using Electron's `contextBridge` with `contextIsolation: true` and `nodeIntegration: false`.
- **React Renderer**: Vite + Tailwind CSS + React Router + Lucide React.
- **Audio Streaming**: Native `media://` custom streaming protocol with HTTP Range request support for instant audio seeking.

## Fundamental Data Principle

The `.m4a` files on disk are the **source of truth**. SQLite stores only metadata and indexing information:
- Recording date & time
- Contact name or phone number
- Audio duration & file size
- Favorites, tags, notes, and playback resume position

If the SQLite database is cleared or removed, the original audio files remain completely untouched on disk.

## Filename Convention

The scanner parses recordings following the naming convention:
```text
Call Recording {Name or Phone Number}_YYMMDD_HHMMSS.m4a
```
Examples:
- `Call Recording Rahul_261006_094218.m4a` &rarr; Rahul, recorded at 2026-10-06 09:42:18
- `Call Recording +919876543210_261004_140752.m4a` &rarr; +919876543210, recorded at 2026-10-04 14:07:52

Malformed filenames are gracefully indexed with fallback timestamps without crashing.

## Key Features

- **Incremental Scanning**: Skips unchanged files based on size and mtime.
- **Missing File Tracking**: Files moved or unlinked outside the app are marked `⚠ Unavailable` rather than purged.
- **Live File Watcher**: Automatically indexes new or edited recordings as they appear in the configured directory.
- **Timeline & Calendar View**: Browse recording frequency and daily histories by calendar month.
- **Contact Analytics**: Aggregate total calls and cumulative talk time per person.
- **Dedicated Player & Mini Player**: Speed controls (0.5x - 2x), -15s/+30s skip, playback resume position persistence, and in-player notes/tags.
- **Keyboard Shortcuts**: Space (play/pause), Left/Right (-5s/+5s), Shift+Left/Right (-15s/+30s), Up/Down (volume), F (favorite), M (mute). Suppressed during text input.
- **Zero Telemetry & 100% Offline**: No network requests, no analytics, no external servers.

## Running Locally

```bash
# Install dependencies
npm install

# Start Vite dev server and Electron app
npm run dev

# Or build production assets
npm run build
npm start
```