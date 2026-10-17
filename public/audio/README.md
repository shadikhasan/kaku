# Kana pronunciation recordings

These recordings by **Hakatanoshio117117** were released into the public domain
(PD-self) on Wikimedia Commons. The author permits use for any purpose without
conditions where public-domain dedication is not possible.

Source collection: https://commons.wikimedia.org/wiki/Category:Audio_files_of_hiragana_(set_by_Hakatanoshio117117)

`kana/sources.json` records the source page, MP3 transcode URL, license, author,
size, and SHA-256 checksum for every file. Each source repeats the pronunciation
three times. The published `*-single.mp3` keeps the first complete pronunciation,
with short silence margins, consistent voice volume, and tiny edge fades to
prevent clicks. Processing settings and the original checksum are also recorded
in the manifest.

Refresh with `node scripts/fetch-audio.mjs`. This requires FFmpeg with libmp3lame
on your PATH (or set `FFMPEG_PATH` to its executable). FFmpeg is used only when
refreshing assets; app builds and playback use the checked-in MP3s directly.

One recording per reading is shared by hiragana and katakana. Files are loaded
only on playback and cached by the production service worker after the first
successful request. Audio does not require an installed Japanese TTS voice.
