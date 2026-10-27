# Kaku · 書く

A Japanese handwriting practice app with English and Bangla support. Learn basic hiragana and katakana through guided strokes, tracing, and writing from memory.

**[Try the live app](https://kaku-jp.vercel.app/) · [Contribute](CONTRIBUTING.md) · [Report a bug](https://github.com/shadikhasan/Kaku/issues/new/choose)**

Kaku (書く) means “to write” in Japanese. No account, API key, or application backend is required. Your practice history stays in your browser.

## Features

- **92 basic kana across 20 lessons:** 46 hiragana and 46 katakana.
- **Three practice rounds:** follow an animated stroke guide, trace the character, then write from memory.
- **Stroke feedback:** approximate checks for stroke position, shape, direction, and length, with undo, clear, hints, and replay.
- **English and Bangla interface:** choose your interface language in Settings; your preference is saved on this device.
- **Readings and pronunciation:** Bengali pronunciation aids alongside romaji, with 46 recorded pronunciations shared between both scripts. One tap plays one pronunciation; no Japanese voice installation is needed.
- **Progress and review:** daily goals, streaks, practice history, scheduled review, and custom character selections.
- **Kana Challenge:** a 10- or 20-question recognition quiz with selected rows, mixed scripts, an optional 15-second timer, and English or Bangla answers. Start from Home or quiz an individual lesson. Retry mistakes or open them in handwriting practice. Quiz results and personal bests stay on this device, separate from handwriting mastery; progress backups currently contain handwriting history only.
- **Local storage and backups:** progress saved on the device, with JSON export, import, and reset controls.
- **Desktop and mobile input:** mouse, touch, and stylus support, writing grids, and reduced-motion settings.
- **Phone navigation:** five bottom tabs, a compact Settings/Help/Install menu, and more writing space during practice. Larger screens use the sidebar.
- **Installable PWA:** add Kaku to your home screen or desktop from Settings or your browser.
- **Offline practice:** all lessons, practice screens, and progress work offline after setup. Download all 46 pronunciations in Settings, or let recordings cache as you play them.

## Getting started

Install **Node.js 20.9 or newer** and npm, then run:

```sh
git clone https://github.com/shadikhasan/Kaku.git
cd Kaku
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Run commands from the repository root. No environment variables are required for local development.

For a production preview:

```sh
npm run build
npm start
```

Open [http://127.0.0.1:3020](http://127.0.0.1:3020). The preview server binds to the local loopback address and accepts a `PORT` environment variable. Browser tests expect the default port, 3020.

### Commands

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm ci`            | Install the dependencies pinned in the lockfile. |
| `npm run dev`       | Start the development server on port 3000.       |
| `npm run build`     | Build the static site into `out/`.               |
| `npm start`         | Serve an existing production build on port 3020. |
| `npm run typecheck` | Check TypeScript without emitting files.         |
| `npm test`          | Run the Vitest unit tests.                       |
| `npm run test:e2e`  | Run Playwright browser tests against port 3020.  |

## How practice works

Every character has three rounds:

1. **Stroke guide:** follow the highlighted animated path from its numbered starting point.
2. **Trace guide:** follow the complete faint outline in the same stroke order.
3. **From memory:** write from a reading prompt without a character reference.

Lift your finger, pen, or mouse after each stroke. Accepted strokes advance the guide, and completed rounds advance automatically. A recall completed with hints or rejected strokes is marked for more practice. Unassisted recalls return for review after increasing intervals. Custom reviews can include both scripts.

The stroke checker is a heuristic teaching aid that compares the known lesson target with ordered vector paths. It is not open-ended Japanese OCR and still needs calibration with real learners. Printed reference glyphs can look different from the vector handwriting guides.

### Language and readings

Use **Settings → Interface language → EN / বাংলা** to change the interface language. Menus, instructions, feedback, vocabulary meanings, dates, and counts are localized. Japanese characters and stroke order stay the same.

Bengali pronunciation aids and romaji appear together in both interface languages: `আ (a)`, `শি (shi)`, `কা (ka)`. Search the character library using Japanese, Bengali pronunciation, or romaji. Bengali spellings are approximate aids; Japanese audio is the pronunciation reference.

Translations live in [`src/lib/i18n.ts`](src/lib/i18n.ts), and pronunciation aids live in [`src/lib/readings.ts`](src/lib/readings.ts).

## Storage, backups, and offline use

Progress and preferences are stored locally using IndexedDB. The interface language is saved in local browser storage. Progress does not sync across devices and is lost if the site's browser data is cleared.

Use **Settings → Export progress** to save a JSON backup. Imports merge practice history and deduplicate entries by character and completion time. They do not restore settings or interface language. Backup files must be valid Kaku backups no larger than 10 MB.

Storage belongs to the browser profile and site origin, including its port. Development on port 3000, the production preview on port 3020, and the live site keep separate progress. Export and import a backup to transfer practice history between them.

In the production app, open Settings and wait for **Ready offline** before disconnecting. Kaku downloads the resources for all current screens, including ones you have not visited. Played pronunciations are saved automatically; use **Download all audio** for every recording, with cancellation, retry, and removal controls. Browser storage and offline availability remain subject to browser policies. Development mode does not register the service worker.

Settings provides installation controls where supported and manual instructions elsewhere. New releases show **Update and reload** outside practice; updates wait until practice and downloads finish in every open Kaku tab. Updating app files preserves your saved progress and language. See [PWA behavior and release checks](docs/PWA.md) for hosting requirements and the real-device checklist.

## Development and testing

Built with **Next.js App Router, React, TypeScript, Tailwind CSS, and Dexie**. The app exports static files for hosting.

Run the local checks:

```sh
npm run typecheck
npm test
npm run build
```

To run browser tests, start the production preview:

```sh
npm start
```

In another terminal:

```sh
npm run test:e2e
```

Playwright does not start the server automatically. Tests use Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` when available; otherwise they use Playwright's Chromium. If needed, install it with `npx playwright install chromium`.

Coverage includes desktop and mobile layouts, pointer-drawn practice, wrong-stroke rejection, progress persistence, search, settings, language switching, recorded pronunciation, and offline audio replay. Audio checks decode all 46 files and check for one short pronunciation at a consistent volume. Screenshots and failure traces are written to `test-results/`.

### Project structure

| Path                                                                           | Contents                                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [`src/app/`](src/app/)                                                         | Routes, root layout, and global styles.                                          |
| [`src/components/kaku-app.tsx`](src/components/kaku-app.tsx)                   | Dashboard, lessons, library, review, progress, and settings.                     |
| [`src/components/practice.tsx`](src/components/practice.tsx)                   | Three-stage practice sessions.                                                   |
| [`src/components/writing-pad.tsx`](src/components/writing-pad.tsx)             | Pointer input and stroke rendering.                                              |
| [`src/components/language-provider.tsx`](src/components/language-provider.tsx) | Interface language state and persistence.                                        |
| [`src/lib/`](src/lib/)                                                         | Stroke validation, storage, translations, readings, content, and audio playback. |
| [`src/data/kana.json`](src/data/kana.json)                                     | Character metadata and ordered reference strokes.                                |
| [`public/audio/`](public/audio/)                                               | Pronunciation MP3s, credits, and per-file provenance.                            |
| [`scripts/`](scripts/)                                                         | Static preview server and stroke/audio refresh scripts.                          |
| [`tests/`](tests/)                                                             | Unit tests and Playwright browser tests.                                         |

### Deployment

Run `npm run build` and deploy all of `out/` atomically. The build generates a versioned offline cache from the exported resources; do not deploy the unprocessed worker from `public/`. The live demo is hosted on Vercel. No application server is needed.

For other static hosts, serve the app at the domain root and configure directory indexes, such as `/lessons/index.html` for `/lessons/`. Use HTTPS for production service worker support.

## Contributing

Contributions are welcome, including bug reports, translation corrections, documentation, accessibility improvements, tests, and handwriting feedback.

Start with the [contribution guide](CONTRIBUTING.md). Search [existing issues](https://github.com/shadikhasan/Kaku/issues) before opening a new one, and discuss substantial features or curriculum changes before implementing them. Small fixes can go directly to a pull request.

Useful areas to help with:

- English and Bangla copy, pronunciation aids, and layout checks in both languages.
- Real-device testing with touch and stylus input.
- Stroke-checking accuracy, with the character, expected stroke, and a reproducible example.
- Keyboard accessibility and screen-reader behavior.
- Focused bug fixes and regression tests.

The current curriculum covers basic kana. Voiced kana, combinations, kanji, and free recognition are not implemented.

## License and attribution

Original application code and project documentation are licensed under the **[MIT License](LICENSE)**. Third-party assets retain their own terms:

| Material                                  | Source and terms                                                                                                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kana reference strokes and derived guides | [KanjiVG](https://kanjivg.tagaini.net/), © Ulrich Apel and contributors; [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). See the [included license](public/KANJIVG-LICENSE.txt).                     |
| Pronunciation recordings                  | Hakatanoshio117117 on Wikimedia Commons; public domain (PD-self), trimmed and volume-adjusted for Kaku. See the [audio documentation](public/audio/README.md) and [per-file sources](public/audio/kana/sources.json). |

The MIT license does not replace the terms for these third-party assets. Retain their attribution and source records when redistributing them.

To refresh stroke data, run `node scripts/fetch-kana.mjs` with network access. To refresh audio, run `node scripts/fetch-audio.mjs`; this also requires FFmpeg with libmp3lame on `PATH`, or an executable supplied through `FFMPEG_PATH`. Normal builds and playback use the checked-in data and MP3s and do not require FFmpeg.
