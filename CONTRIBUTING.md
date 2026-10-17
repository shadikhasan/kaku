# Contributing to Kaku

Bug reports, translation corrections, documentation, accessibility improvements, tests, and focused code changes are welcome. You do not need to contribute code to help.

## Before starting

Search [existing issues](https://github.com/shadikhasan/Kaku/issues) and [pull requests](https://github.com/shadikhasan/Kaku/pulls) for related work. Open an issue to discuss substantial features, new curriculum, dependencies, or architecture changes before implementing them. Small, focused fixes can be submitted directly.

Keep discussions respectful and explain the behavior or learning problem you want to improve. Reports and discussion in English or Bangla are welcome; code identifiers should follow the existing English naming conventions.

## Reporting bugs

Use the [bug report form](https://github.com/shadikhasan/Kaku/issues/new/choose) and include:

- Steps to reproduce, what you expected, and what actually happened.
- Whether you used the live app or a local build; include the commit if known.
- Device, operating system, browser/version, and interface language.
- The character, lesson, and practice stage for handwriting issues.
- A screenshot, short recording, or browser error when useful.

For audio issues, include the kana reading and whether tapping Play produces an error. For loading issues, note whether the page stays blank, shows “Opening your notebook…”, or reaches the dashboard, and whether another network behaves differently.

Do not attach a progress backup unless it is needed and you are comfortable sharing its practice history publicly.

## Local setup

Fork the repository on GitHub, then clone your fork. Replace `YOUR_USERNAME` below with your GitHub username:

```sh
git clone https://github.com/YOUR_USERNAME/Kaku.git
cd Kaku
git switch -c fix/describe-your-change
npm ci
npm run dev
```

Requires Node.js 20.9 or newer and npm. Open [http://127.0.0.1:3000](http://127.0.0.1:3000). No API keys or environment variables are needed. See the [README](README.md) for production preview and deployment details.

## Making changes

- Follow the surrounding TypeScript, React, and CSS conventions. Keep a pull request focused on one change.
- Add or update meaningful tests when changing behavior. Documentation-only changes do not need application tests.
- Put interface copy and Bangla translations in [`src/lib/i18n.ts`](src/lib/i18n.ts). Keep translation placeholders consistent between languages.
- Keep pronunciation aids in [`src/lib/readings.ts`](src/lib/readings.ts). Treat them as approximations, and explain pronunciation corrections with a reliable reference.
- Check interface changes in both English and Bangla and at desktop and mobile widths.
- Preserve local practice history, settings, and language selection. Explain any storage migration or backup-format change in the pull request.

### Character and audio data

Stroke data comes from KanjiVG; audio recordings come from Wikimedia Commons. Preserve the licenses, attribution, and provenance described in the [README](README.md#license-and-attribution).

Use `node scripts/fetch-kana.mjs` to refresh strokes. Explain individual stroke corrections and their source in your pull request.

Use `node scripts/fetch-audio.mjs` to refresh audio. It requires FFmpeg with libmp3lame on `PATH` or through `FFMPEG_PATH`. The script keeps one pronunciation, adjusts volume, and records processing details and checksums in `public/audio/kana/sources.json`. Do not replace recordings without documenting their source and reuse terms.

Refreshing data is not required for normal development. Do not commit generated output such as `node_modules/`, `.next/`, `out/`, `test-results/`, or `.sites-runtime/`.

## Checking your work

For code or data changes, run:

```sh
npm run typecheck
npm test
npm run build
```

For changes affecting the interface, practice, storage, language switching, audio, or service worker, also run the relevant browser tests against a production preview. In one terminal:

```sh
npm start
```

In another terminal:

```sh
npm run test:e2e
```

The preview must run on port 3020; Playwright does not start it automatically. If a browser is missing, run `npx playwright install chromium`. See [`playwright.config.ts`](playwright.config.ts) for desktop/mobile projects and Chrome detection.

In the pull request, list the checks you ran and any checks you could not run. Test output and failure traces are written to `test-results/`.

## Opening a pull request

Push your branch to your fork and open a pull request against this repository's default branch. Use the pull request template to describe the problem, resulting behavior, related issue, and validation. Include screenshots for visual changes, showing both languages when the layout is affected.

Keep unrelated refactors and formatting changes out of the pull request. A clear explanation and reproducible example make review easier.

## License

Original code and project documentation are covered by the [MIT License](LICENSE). KanjiVG-derived data remains CC BY-SA 3.0, and the credited recordings retain their public-domain status. Preserve those distinctions when contributing assets or adapting existing data.
