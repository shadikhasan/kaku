# PWA implementation and release checks

Kaku is a static, installable, offline-capable application. Installation support and browser UI vary by platform. Push notifications, accounts, sync, and store distribution are separate features.

## Build and hosting

Run `npm run build`, then deploy **all of `out/` atomically**. The build runs Next's static export followed by `scripts/build-pwa.mjs`. The latter hashes exported resources and the worker template, then writes a release-specific worker into `out/sw.js`. Never deploy the unprocessed `public/sw.js` directly.

The generated precache includes route HTML, Next RSC payloads, scripts, styles, local fonts, icons, the manifest, and the offline fallback. Audio is downloaded separately. A failed precache does not activate the release. Core resources come from the active release's cache, preventing HTML and chunks from different releases being mixed.

Serve production over HTTPS. `/sw.js` must be served as JavaScript with revalidation/no-store, `/manifest.webmanifest` as `application/manifest+json` with revalidation, HTML and RSC payloads with revalidation, and hashed `/_next/static/` resources with immutable caching. Avoid SPA rewrites returning HTML for missing assets. Keep the worker URL and scope at `/`. The local preview server and `vercel.json` cover their respective hosting environments; other hosts need equivalent rules. Vercel/Next handles hashed assets and generated HTML cache headers.

Run `npm run icons` to regenerate the checked-in PNGs from the existing SVG using headless Chrome or Playwright Chromium. Normal builds use the checked-in icons and do not require a browser.

## Offline behavior

Settings shows **Ready offline** only after the production worker has installed and taken control. At that point all current lesson/practice/review routes can be opened without having visited each one online. Practice query parameters remain in the URL. Unknown offline pages receive a bilingual fallback with a link to Kaku. Missing scripts and data never receive fallback HTML.

Recordings cache automatically after playback. Settings can download all 46 recordings, cancel/resume downloads, and remove downloaded audio. Successful files survive a failed or cancelled download. The worker returns proper partial responses for audio range requests. Only build-listed audio URLs are cached; unrelated requests do not grow a runtime cache. Audio is separate from release-specific core caches and survives normal app upgrades. Bump the shared `kaku-audio-v1` cache version in the worker and Settings if the recordings change.

Progress and preferences remain in IndexedDB; language remains in local storage. Clearing audio or updating app files never clears these stores. Browsers can evict site data: **Export progress** remains the durable user-controlled backup. Installation is not a guarantee of permanent storage.

## Installation and updates

Settings provides a native Install button only when the browser provides `beforeinstallprompt`. Dismissal is respected for the current session. Manual installation instructions remain available, including Share → Add to Home Screen for iOS and Add to Dock for Safari on Mac. Standalone windows hide installation controls. New copy is translated into English and Bangla.

On phones (up to 760px), the top More menu also provides Install Kaku. It opens the native prompt when available or opens the installation instructions in Settings. The five bottom tabs stay above the device safe area and disappear during writing practice; update notices and other floating controls sit above the tabs. Larger screens retain sidebar navigation.

The phone header shows the Kaku brand, practice streak, and More menu. The streak is hidden during phone writing practice. Larger screens keep their date and streak. Language selection is available only in Settings on all screen sizes.

A new worker waits until the user chooses **Update and reload**. This control is hidden during practice. Before activating, the waiting worker asks every open Kaku window whether reloading is safe; active practice, audio downloads, or an unresponsive tab block activation. Once approved, controlled windows reload on the controller change. If all windows close, the browser may naturally activate the waiting release on the next launch. Old core caches and the original `kana-studio-*` caches are cleaned at activation; previously played original audio is migrated when storage permits. No IndexedDB deletion or schema changes are part of the update.

## Automated checks

Run `npm run typecheck`, `npm test`, `npm run build`, then start `npm start` and run `npm run test:e2e` in another terminal. PWA tests cover:

- Manifest fields and actual PNG dimensions.
- Unvisited routes, client navigation, query-based practice, cold starts, and saved preferences offline.
- Offline fallback without returning HTML for missing scripts.
- All audio downloads, byte ranges, removal, failures, cancellation, and retry.
- Failed first installation and failed upgrade recovery.
- Updates blocked by another practice tab, then successful activation and old-cache cleanup.
- Existing writing, progress persistence, language switching, layouts, and real audio playback.

The isolated update-test server serves two worker versions and injects real HTTP failures. It does not overwrite build artifacts or mock browser lifecycle APIs.

## Manual release checklist

Browser emulation cannot certify OS installation. Before calling a release verified on a platform, record the browser/OS versions and check the following on real devices:

- Desktop Chrome and Edge: install via Settings/browser UI; check icon, standalone launch, keyboard navigation, and no horizontal overflow.
- Android Chrome: install, inspect launcher/maskable icon, relaunch in airplane mode, finish a lesson, restart, and confirm saved progress.
- iOS Safari: use Share → Add to Home Screen, launch from the icon, check icon, safe areas, portrait/landscape, keyboard, and offline restart. Check exported/imported backups in the installed app's own storage context.
- Safari on Mac: Add to Dock and launch; verify manual instructions match the browser version.
- Download all audio, disable networking, play recordings in both scripts, remove audio, reconnect, and download again.
- Open two windows, start writing in one, deploy a new build, and confirm the update waits. Leave practice, apply the update, and confirm both windows reload with progress and language preserved.
- Test offline readiness failure/retry, storage restrictions, English/Bangla copy, focus visibility, screen-reader status announcements, and touch/stylus input.

Real-device installation checks must be reported separately from automated Chromium checks.
