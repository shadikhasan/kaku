'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from './language-provider';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type PwaState = {
  ready: boolean; failed: boolean; online: boolean; installed: boolean;
  prompt: InstallPrompt | null; dismissed: boolean; registration: ServiceWorkerRegistration | null;
  retry: () => void; dismiss: () => void; install: () => Promise<void>;
  busy: React.MutableRefObject<boolean>;
};
const PwaContext = createContext<PwaState | null>(null);
export function usePwa() { const value = useContext(PwaContext); if (!value) throw new Error('Missing PwaProvider'); return value; }

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [online, setOnline] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    const display = matchMedia('(display-mode: standalone)');
    const syncInstall = () => setInstalled(display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    syncInstall(); display.addEventListener('change', syncInstall);
    try { setDismissed(sessionStorage.getItem('kaku-install-dismissed') === '1'); } catch { /* Optional preference. */ }
    const connectivity = () => setOnline(navigator.onLine);
    connectivity();
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('online', connectivity); window.addEventListener('offline', connectivity);
    window.addEventListener('beforeinstallprompt', capture); window.addEventListener('appinstalled', complete);
    return () => {
      display.removeEventListener('change', syncInstall);
      window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity);
      window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', complete);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) { setFailed(true); return; }
    let disposed = false;
    let cleanupRegistration = () => {};
    let wasControlled = !!navigator.serviceWorker.controller;
    const checkReady = () => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => channel.port1.close(), 3000);
      channel.port1.onmessage = event => {
        clearTimeout(timer); channel.port1.close();
        if (!disposed && event.data?.type === 'OFFLINE_READY') { setReady(true); setFailed(false); }
      };
      navigator.serviceWorker.controller?.postMessage({ type: 'STATUS' }, [channel.port2]);
    };
    const changed = () => {
      if (wasControlled) { window.location.reload(); return; }
      wasControlled = true;
      checkReady();
    };
    const message = (event: MessageEvent) => {
      if (event.data?.type === 'CAN_RELOAD') {
        event.ports[0]?.postMessage(!window.location.pathname.startsWith('/practice') && !busy.current);
      }
      if (event.data?.type === 'UPDATE_BLOCKED') setBlocked(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    navigator.serviceWorker.addEventListener('message', message);
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => {
      if (disposed) return;
      setRegistration(reg); setWaiting(!!reg.waiting); checkReady();
      const watch = () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (disposed) return;
          if (worker.state === 'installed') setWaiting(!!navigator.serviceWorker.controller);
          if (worker.state === 'redundant' && !navigator.serviceWorker.controller) setFailed(true);
          if (worker.state === 'activated') checkReady();
        });
      };
      watch(); reg.addEventListener('updatefound', watch);
      const update = () => { if (navigator.onLine) void reg.update().catch(() => {}); };
      window.addEventListener('online', update); window.addEventListener('focus', update);
      cleanupRegistration = () => { reg.removeEventListener('updatefound', watch); window.removeEventListener('online', update); window.removeEventListener('focus', update); };
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true; cleanupRegistration();
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
      navigator.serviceWorker.removeEventListener('message', message);
    };
  }, [attempt]);

  const dismiss = () => { setDismissed(true); try { sessionStorage.setItem('kaku-install-dismissed', '1'); } catch { /* Optional. */ } };
  const install = async () => {
    if (!prompt) return;
    try { await prompt.prompt(); const result = await prompt.userChoice; if (result.outcome === 'dismissed') dismiss(); }
    catch { /* The browser may withdraw a prompt; keep manual instructions available. */ }
    finally { setPrompt(null); }
  };
  return <PwaContext.Provider value={{ ready, failed, online, installed, prompt, dismissed, registration, busy,
    retry: () => { setFailed(false); setAttempt(value => value + 1); }, dismiss, install }}>
    {children}
    {waiting && pathname !== '/practice/' && pathname !== '/practice' && <aside className="pwa-update" aria-label={t('App update')}>
      <p role="status">{t(blocked ? 'Finish practice in all open Kaku tabs, then try again.' : 'A new version of Kaku is ready.')}</p>
      <button className="button-primary" onClick={() => { setBlocked(false); registration?.waiting?.postMessage({ type: 'ACTIVATE_UPDATE' }); }}>{t('Update and reload')}</button>
    </aside>}
  </PwaContext.Provider>;
}
