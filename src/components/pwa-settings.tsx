'use client';

import { useEffect, useRef, useState } from 'react';
import { characters } from '@/lib/content';
import { useI18n } from './language-provider';
import { usePwa } from './pwa-provider';

const AUDIO_CACHE = 'kaku-audio-v1';
const audioUrls = [...new Set(characters.map(character => `/audio/kana/${character.reading}-single.mp3`))];

export function PwaSettings() {
  const { t } = useI18n();
  const pwa = usePwa();
  const [count, setCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    let cancelled = false;
    if ('caches' in window) void caches.open(AUDIO_CACHE).then(async cache => {
      const results = await Promise.all(audioUrls.map(url => cache.match(url)));
      if (!cancelled) setCount(results.filter(Boolean).length);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; abort.current?.abort(); };
  }, []);

  const download = async () => {
    const controller = new AbortController(); abort.current = controller;
    setDownloading(true); pwa.busy.current = true; setError(false);
    try {
      const cache = await caches.open(AUDIO_CACHE);
      let completed = 0;
      for (const url of audioUrls) {
        if (controller.signal.aborted) break;
        if (!(await cache.match(url))) {
          const response = await fetch(url, { signal: controller.signal });
          if (response.status !== 200 || !response.headers.get('content-type')?.includes('audio/')) throw new Error('Audio unavailable');
          await cache.put(url, response);
        }
        setCount(++completed);
      }
    } catch { if (!controller.signal.aborted) setError(true); }
    finally { setDownloading(false); pwa.busy.current = false; abort.current = null; }
  };
  const remove = async () => {
    try { await caches.delete(AUDIO_CACHE); setCount(0); setError(false); }
    catch { setError(true); }
  };
  return <section className="settings-panel pwa-settings" aria-labelledby="pwa-heading">
    <h2 id="pwa-heading">{t('Kaku on your device')}</h2>
    <p className="settings-description" role="status">{t(process.env.NODE_ENV !== 'production' ? 'Offline access is available in the production app.' : !pwa.online ? (pwa.ready ? 'You are offline. Your notebook is ready.' : 'You are offline. Connect to prepare Kaku for offline use.')
      : pwa.failed ? 'Offline setup failed. You can still practise online.' : pwa.ready ? 'Ready offline: lessons, practice, and progress.' : 'Preparing offline access…')}</p>
    {pwa.failed && <button className="button-secondary" onClick={pwa.retry}>{t('Retry offline setup')}</button>}
    <div className="setting-row"><div><strong>{t(pwa.installed ? 'Kaku is installed' : 'Install Kaku')}</strong><p>{t('Open your notebook from your home screen or desktop.')}</p></div>
      {!pwa.installed && <div className="pwa-actions">{pwa.prompt && !pwa.dismissed
        ? <><button className="button-secondary" onClick={() => void pwa.install()}>{t('Install Kaku')}</button><button className="text-button" onClick={pwa.dismiss}>{t('Not now')}</button></>
        : <button className="button-secondary" onClick={() => setInstructions(value => !value)} aria-expanded={instructions}>{t('How to install')}</button>}</div>}
    </div>
    {instructions && !pwa.installed && <div className="pwa-instructions"><p>{t('On iPhone or iPad: open the Share menu, then choose Add to Home Screen. You may need to choose Open as Web App.')}</p><p>{t('On desktop or Android: look for Install Kaku or Install app in your browser menu. On Mac Safari, choose File → Add to Dock. Options vary by browser.')}</p></div>}
    <div className="setting-row"><div><strong>{t('Offline pronunciation')}</strong><p>{t('{count} of {total} recordings saved.', { count, total: audioUrls.length })}</p></div></div>
    <p className="settings-description">{t('Played audio is saved automatically. Download all recordings to hear every kana offline.')}</p>
    <div className="backup-actions"><button className="button-secondary" disabled={!pwa.ready || !pwa.online || downloading || count === audioUrls.length} onClick={() => void download()}>{t(downloading ? 'Downloading…' : 'Download all audio')}</button>
      {downloading ? <button className="button-secondary" onClick={() => abort.current?.abort()}>{t('Cancel download')}</button>
        : <button className="button-secondary" disabled={!count} onClick={() => void remove()}>{t('Remove downloaded audio')}</button>}</div>
    {downloading && <progress aria-label={t('Audio download progress')} value={count} max={audioUrls.length} />}
    {error && <p role="alert">{t('Could not save audio. Check your connection and available storage, then retry. Saved recordings will be reused.')}</p>}
    <p className="settings-description">{t('Your browser may clear offline files and progress. Export a backup to keep your notebook safe.')}</p>
  </section>;
}
