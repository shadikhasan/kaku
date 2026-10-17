'use client';

import { banglaReadings, displayReading, matchesReading } from '@/lib/readings';

import { useI18n, LanguageSwitcher } from './language-provider';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, Flame, Flower2, Globe2, LayoutGrid, Leaf, Menu, PenLine, RotateCcw, Search, Settings2, ShieldCheck, Target, TrendingUp, Upload, Volume2, X } from 'lucide-react';
import { characters, lessons } from '@/lib/content';
import { dayKey, streakForDays } from '@/lib/handwriting';
import { db, defaultSettings, readProgress } from '@/lib/storage';
import type { Attempt, Character, Lesson, Script, Settings, View } from '@/lib/types';
import Practice from './practice';
import { PwaSettings } from './pwa-settings';
import { stopPronunciation, speakCharacter } from '@/lib/speech';

const navigation = [
  { view: 'overview', label: 'Overview', icon: LayoutGrid, href: '/' },
  { view: 'lessons', label: 'My lessons', icon: BookOpen, href: '/lessons/' },
  { view: 'library', label: 'Character library', icon: Globe2, href: '/library/' },
  { view: 'review', label: 'Review', icon: RotateCcw, href: '/review/' },
  { view: 'progress', label: 'My progress', icon: TrendingUp, href: '/progress/' },
] as const;

export default function KakuApp({ initialView = 'overview' }: { initialView?: View }) {
  const { t } = useI18n();
  return <Suspense fallback={<div className="loading-screen"><Flower2 size={30} /><span>{t("Opening your notebook…")}</span></div>}><KakuAppContent initialView={initialView} /></Suspense>;
}

function KakuAppContent({ initialView }: { initialView: View }) {
  const { t, n, locale } = useI18n();
  const router = useRouter();
  const query = useSearchParams();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [script, setScript] = useState<Script>('hiragana');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const [detail, setDetail] = useState<Character | null>(null);
  const [detailAudioError, setDetailAudioError] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setDate(new Date());
    readProgress().then(data => { if (!cancelled) { setAttempts(data.attempts); setSettings(data.settings); } }).catch(() => { if (!cancelled) setStorageError(true); }).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => stopPronunciation, []);
  useEffect(() => { setDetailAudioError(''); return stopPronunciation; }, [detail]);
  useEffect(() => { if (!settings.sound) stopPronunciation(); }, [settings.sound]);
  useEffect(() => { setMenuOpen(false); setDetail(null); }, [initialView]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const today = date ? dayKey(date) : '';
  const practiced = new Set(attempts.map(a => a.characterId));
  const independent = new Set(attempts.filter(a => a.independent).map(a => a.characterId));
  const todayCount = new Set(attempts.filter(a => a.day === today).map(a => a.characterId)).size;
  const streak = streakForDays(attempts.map(a => a.day), date ?? new Date());
  const latestAttempts = new Map<string, Attempt>();
  attempts.forEach(a => { const current = latestAttempts.get(a.characterId); if (!current || a.completedAt >= current.completedAt) latestAttempts.set(a.characterId, a); });
  const dueCharacters = characters.filter(c => {
    const attempt = latestAttempts.get(c.id);
    if (!attempt) return false;
    if (!attempt.independent) return true;
    const age = ((date?.getTime() ?? Date.now()) - new Date(attempt.completedAt).getTime()) / 86400000;
    const successes = attempts.filter(a => a.characterId === c.id && a.independent).length;
    return age >= Math.min(14, 2 ** Math.min(successes - 1, 4));
  });
  const nextLesson = lessons.find(l => l.script === script && !l.characters.every(c => independent.has(c.id))) ?? lessons.find(l => l.script === script)!;
  const activeLesson = useMemo(() => {
    const id = query.get('lesson') ?? 'hiragana-0';
    const base = lessons.find(l => l.id === id) ?? lessons[0];
    const ids = query.get('characters')?.split(',');
    const selected = ids ? ids.map(id => characters.find(c => c.id === id)).filter((c): c is Character => !!c) : base.characters;
    return { ...base, id: id === 'review' ? 'review' : base.id, name: id === 'review' ? 'Your review' : base.name, characters: selected.length ? [...new Map(selected.map(c => [c.id, c])).values()] : base.characters };
  }, [query]);

  const startLesson = (lesson: Lesson) => router.push(`/practice/?lesson=${lesson.id}`);
  const startCustom = (selected: Character[], review = true) => {
    if (!selected.length) return;
    router.push(`/practice/?lesson=${review ? 'review' : selected[0].lessonId}&characters=${selected.map(c => c.id).join(',')}&session=${Date.now()}`);
  };
  const saveAttempt = async (attempt: Attempt) => {
    setAttempts(previous => [...previous, attempt]);
    try { await db.attempts.add(attempt); } catch { setStorageError(true); }
  };
  const updateSettings = async (value: Partial<Settings>) => {
    const next = { ...settings, ...value };
    setSettings(next);
    try { await db.preferences.put({ key: 'settings', value: next }); } catch { setStorageError(true); }
  };
  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), settings, attempts }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `kaku-${today || 'backup'}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000); setNotice('Your notebook backup is ready.');
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Too large');
      const data = JSON.parse(await file.text());
      const known = new Set(characters.map(c => c.id));
      if (data.version !== 1 || !Array.isArray(data.attempts) || !data.attempts.every((a: Attempt) => known.has(a.characterId) && typeof a.independent === 'boolean' && Number.isFinite(Date.parse(a.completedAt)) && /^\d{4}-\d{2}-\d{2}$/.test(a.day) && Number.isInteger(a.retries) && a.retries >= 0 && Number.isInteger(a.hints) && a.hints >= 0)) throw new Error('Invalid backup');
      const combined = [...attempts];
      const keys = new Set(combined.map(a => `${a.characterId}-${a.completedAt}`));
      for (const attempt of data.attempts as Attempt[]) {
        const key = `${attempt.characterId}-${attempt.completedAt}`;
        if (!keys.has(key)) { const { id: _id, ...record } = attempt; combined.push(record); keys.add(key); }
      }
      await db.transaction('rw', db.attempts, async () => { await db.attempts.clear(); await db.attempts.bulkAdd(combined.map(({ id: _id, ...record }) => record)); });
      setAttempts(combined);
      setNotice('Your practice history has been restored.');
    } catch { setNotice('Could not restore this file. Choose a valid Kaku backup.'); }
    if (importRef.current) importRef.current.value = '';
  };

  const dateLabel = date?.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const title = initialView === 'practice' ? 'Writing practice' : initialView === 'settings' ? 'Settings' : navigation.find(n => n.view === initialView)?.label ?? 'Overview';

  return <div className={`app-shell ${settings.reducedMotion ? 'reduce-motion' : ''}`}>
    {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label={t("Close navigation")} />}
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <Link className="brand" href="/"><span className="brand-mark">書</span><span>Kaku<span className="brand-dot">.</span><small>{t("A LITTLE EVERY DAY")}</small></span></Link>
      <div className="sidebar-label">{t("YOUR LEARNING SPACE")}</div>
      <nav>{navigation.map(({ view, label, href, icon: Icon }) => <Link key={view} href={href} className={`nav-item ${initialView === view || initialView === 'practice' && view === 'lessons' ? 'selected' : ''}`}><Icon size={19} strokeWidth={1.65} /><span>{t(label)}</span>{view === 'review' && dueCharacters.length > 0 && <span className="nav-badge">{n(dueCharacters.length)}</span>}{initialView === view && <span className="selected-dot" />}</Link>)}</nav>
      <div className="sidebar-note"><span className="note-flower"><Flower2 size={27} strokeWidth={1.3} /></span><p>{t("Small strokes.")}<br /><strong>{t("Beautiful beginnings.")}</strong></p><span>{t("Make a little space for")}<br />{t("Japanese, every day.")}</span></div>
      <div className="sidebar-bottom"><Link href="/settings/" className={`nav-item ${initialView === 'settings' ? 'selected' : ''}`}><Settings2 size={18} strokeWidth={1.65} />{t("Settings")}</Link><button className="nav-item" onClick={() => setHelpOpen(true)}><CircleHelp size={18} strokeWidth={1.65} />{t("A little help")}<ArrowUpRight size={14} className="help-arrow" /></button><div className="local-profile"><span className="avatar">Y</span><span><strong>{t("Your little notebook")}</strong><small><i /> {t("Saved on this device")}</small></span><ShieldCheck size={17} /></div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label={t("Open navigation")} onClick={() => setMenuOpen(true)}><Menu size={21} /></button><span className="breadcrumb-home">{t("My workspace")}</span><ChevronRight size={13} /><strong>{t(title)}</strong></div><div className="topbar-right"><LanguageSwitcher /><span className="topbar-date">{dateLabel}</span><span className="streak-pill"><Flame size={16} />{t(streak === 1 ? '{count} day' : '{count} days', { count: streak })}</span><button className="profile-button" onClick={() => router.push('/settings/')} aria-label={t("Open your settings")}>Y</button></div></header>
      {storageError && <div className="storage-warning" role="alert">{t("Your browser couldn’t save progress. This session still works; enable browser storage to keep your notebook.")}</div>}
      <main className={initialView === 'practice' ? 'main-content practice-content' : 'main-content'}>
        {initialView === 'overview' && <div className="page-enter">
          <div className="page-heading"><div><span className="eyebrow"><span className="tiny-line" /> {t("A LITTLE BETTER, EVERY DAY")}</span><h1>{t("Your next chapter starts here")}<span className="sage-dot">.</span></h1><p>{t("Slow down, pick up your pen, and make your mark.")}</p></div><span className="heading-seal">日<br />々</span></div>
          <section className="welcome-card"><div className="welcome-copy"><span className="hero-tag"><Leaf size={13} /> {t("FIND YOUR FLOW")}</span><h2>{t("Small strokes.")}<br />{t("Lasting progress.")}</h2><p>{t("Learn to write Japanese, one character at a time.")}<br className="desktop-break" /> {t("No rush. Just you, your pen, and a little practice.")}</p><button className="button-primary" disabled={!ready} onClick={() => startLesson(nextLesson)}>{practiced.size ? t("Continue learning") : t("Start your first lesson")}<ArrowRight size={17} /></button><span className="hero-caption"><span className="tiny-avatars"><i>あ</i><i>ア</i><i>か</i></span>{t("Three simple steps. A skill that stays.")}</span></div><div className="welcome-art" aria-hidden="true"><span className="art-circle" /><span className="art-orbit" /><span className="art-character">あ</span><span className="art-label">書くことは、学ぶこと。</span><span className="art-caption">{t("to write is to learn")}</span><span className="art-stamp">一<br />歩</span></div></section>
          <div className="dashboard-middle"><section className="learning-section"><div className="section-heading"><h2>{t("Your learning paths")} <span className="small-sprout">✳</span></h2><Link href="/lessons/">{t("View all lessons")} <ArrowUpRight size={15} /></Link></div><div className="path-cards">{(['hiragana', 'katakana'] as Script[]).map((name, index) => {
            const count = characters.filter(c => c.script === name && practiced.has(c.id)).length;
            return <button key={name} className={`path-card ${name}`} onClick={() => { setScript(name); router.push(`/lessons/?script=${name}`); }}><div className="path-top"><span className="path-symbol">{index ? 'ア' : 'あ'}</span><span className="path-level">{index ? t("NEXT CHAPTER") : t("START HERE")}</span></div><h3>{index ? t("Katakana") : t("Hiragana")}<ArrowUpRight size={18} /></h3><p>{index ? t("A new shape. A familiar sound.") : t("Your foundation in Japanese.")}</p><div className="path-progress"><span style={{ width: `${count / 46 * 100}%` }} /></div><div className="path-bottom"><span>{t('{count} / 46 characters', { count })}</span><span>{n(Math.round(count / 46 * 100))}%</span></div></button>;
          })}</div></section><section className="daily-card"><div className="daily-heading"><h2>{t("A little, every day")}</h2><Target size={18} /></div><div className="goal-ring"><svg viewBox="0 0 130 130"><circle cx="65" cy="65" r="54" fill="none" stroke="#e9e9df" strokeWidth="7" /><circle cx="65" cy="65" r="54" fill="none" stroke="#637956" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.min(todayCount / settings.dailyGoal, 1) * 339.3} 339.3`} transform="rotate(-90 65 65)" /></svg><div><strong>{n(todayCount)}<small> / {n(settings.dailyGoal)}</small></strong><span>{t("characters today")}</span></div></div><p>{todayCount >= settings.dailyGoal ? t("Your daily moment, beautifully done.") : t("A few minutes is all it takes.")}</p><button onClick={() => router.push('/settings/')} className="text-button">{t("Adjust daily goal")} <ArrowRight size={13} /></button></section></div>
          <section className="how-section"><div className="section-heading"><h2>{t("A rhythm that helps it stick")}</h2><span>{t("Less guessing. More remembering.")}</span></div><div className="how-cards"><div><span className="step-number">01</span><span className="step-symbol guide-symbol">し<svg viewBox="0 0 45 45"><path d="M17 4Q10 37 32 29" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" /><path d="M26 27L33 29L29 35" fill="none" stroke="currentColor" strokeWidth="2" /></svg></span><h3>{t("Follow the stroke")}</h3><p>{t("Start with a little direction.")}<br />{t("One guided stroke at a time.")}</p></div><span className="step-arrow"><ArrowRight size={20} /></span><div><span className="step-number">02</span><span className="step-symbol trace-symbol">し</span><h3>{t("Trace the character")}</h3><p>{t("Let the outline guide your hand.")}<br />{t("Feel the shape come together.")}</p></div><span className="step-arrow"><ArrowRight size={20} /></span><div><span className="step-number">03</span><span className="step-symbol memory-symbol">し</span><h3>{t("Make it your own")}</h3><p>{t("No guides. Just your memory.")}<br />{t("You know more than you think.")}</p></div></div></section>
          <div className="dashboard-footer"><span><Flower2 size={16} /> 千里の道も一歩から。</span><span>{t("A journey of a thousand miles begins with a single step.")}</span></div>
        </div>}

        {initialView === 'lessons' && <div className="page-enter"><PageHeading eyebrow={t("ONE CHARACTER AT A TIME")} title={t("Find your next little step.")} description={t("A few characters. Three rounds of practice. Something new to carry with you.")} /><ScriptTabs script={(query.get('script') as Script) || script} onChange={value => { setScript(value); router.replace(`/lessons/?script=${value}`); }} /><div className="lesson-list">{lessons.filter(l => l.script === (query.get('script') || script)).map(lesson => {
          const count = lesson.characters.filter(c => practiced.has(c.id)).length;
          return <button key={lesson.id} className="lesson-row" onClick={() => startLesson(lesson)}><span className={`lesson-number ${count === lesson.characters.length ? 'lesson-done' : ''}`}>{count === lesson.characters.length ? <Check size={20} /> : n(lesson.number).padStart(2, n(0))}</span><div className="lesson-row-info"><h3>{t(lesson.name)}</h3><span><span lang="bn">{lesson.characters.map(c => banglaReadings[c.reading] ?? c.reading).join(' · ')}</span><span lang="ja-Latn">{lesson.characters.map(c => c.reading).join(' · ')}</span></span></div><div className="lesson-preview">{lesson.characters.map(c => <span key={c.id} className={practiced.has(c.id) ? 'practiced' : ''}>{c.symbol}</span>)}</div><span className="lesson-completion">{t('{done}/{total} practiced', { done: count, total: lesson.characters.length })}</span><span className="lesson-go"><ArrowRight size={19} /></span></button>;
        })}</div><div className="inline-note"><Leaf size={17} /><p>{t("Every lesson is open. Start anywhere, and come back as often as you like.")}</p></div></div>}

        {initialView === 'library' && <div className="page-enter"><PageHeading eyebrow={t("YOUR POCKET REFERENCE")} title={t("Meet the characters.")} description={t("Explore the shapes, hear the sounds, and make a little time for the ones you love.")} /><div className="library-toolbar"><ScriptTabs script={script} onChange={setScript} /><label className="search-field"><Search size={17} /><input aria-label={t("Search characters")} placeholder={t("Search character or reading…")} value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label={t("Clear search")} onClick={() => setSearch('')}><X size={14} /></button>}</label></div><div className="character-grid">{characters.filter(c => c.script === script && (!search || matchesReading(c.symbol, c.reading, search))).map(c => <button className={`character-tile ${practiced.has(c.id) ? 'character-practiced' : ''}`} key={c.id} onClick={() => setDetail(c)}>{practiced.has(c.id) && <Check size={12} className="character-check" />}<strong>{c.symbol}</strong><span>{displayReading(c.reading)}</span><small>{t(c.paths.length === 1 ? '{count} stroke' : '{count} strokes', { count: c.paths.length })}</small></button>)}</div>{!characters.some(c => c.script === script && matchesReading(c.symbol, c.reading, search)) && <div className="empty-state"><Search size={28} /><h3>{t("No characters found.")}</h3><p>{t("Try a character or a reading like “shi”.")}</p></div>}</div>}

        {initialView === 'review' && <div className="page-enter"><PageHeading eyebrow={t("A LITTLE REPETITION GOES A LONG WAY")} title={t("Make it feel familiar.")} description={t("Revisit the tricky ones, or put together a practice session of your own.")} /><div className="review-banner"><span className="review-banner-icon"><RotateCcw size={25} /></span><div><h2>{dueCharacters.length ? t('{count} characters are ready for another look.', { count: dueCharacters.length }) : t("A fresh page. No reviews due.")}</h2><p>{dueCharacters.length ? t("A gentle refresher helps your practice stay with you.") : practiced.size ? t("You’re up to date. Choose a few characters below for extra practice.") : t("Finish your first lesson and your review collection will grow here.")}</p></div><button className="button-primary" onClick={() => dueCharacters.length ? startCustom(dueCharacters) : startLesson(nextLesson)}>{dueCharacters.length ? t("Start review") : t("Start a lesson")}<ArrowRight size={16} /></button></div><div className="section-heading custom-review-heading"><h2>{t("Your own little session")}</h2><span>{t('{count} selected', { count: selection.length })}</span></div><ScriptTabs script={script} onChange={setScript} /><div className="character-grid review-grid">{characters.filter(c => c.script === script).map(c => <button className={`character-tile ${selection.includes(c.id) ? 'character-selected' : ''}`} key={c.id} onClick={() => setSelection(previous => previous.includes(c.id) ? previous.filter(id => id !== c.id) : [...previous, c.id])} aria-pressed={selection.includes(c.id)}><strong>{c.symbol}</strong><span>{displayReading(c.reading)}</span>{selection.includes(c.id) && <Check size={13} className="character-check" />}</button>)}</div><div className="review-selection-bar"><span>{selection.length ? t('{count} characters, at your own pace.', { count: selection.length }) : t("Choose the characters you’d like to revisit.")}</span><div><button className="text-button" disabled={!selection.length} onClick={() => setSelection([])}>{t("Clear selection")}</button><button className="button-primary" disabled={!selection.length} onClick={() => startCustom(selection.map(id => characters.find(c => c.id === id)!))}>{t("Practice selected")} <ArrowRight size={16} /></button></div></div></div>}

        {initialView === 'progress' && <div className="page-enter"><PageHeading eyebrow={t("EVERY STROKE ADDS UP")} title={t("See how far you’ve come.")} description={t("Your progress, at your pace. There’s no finish line to rush toward.")} /><div className="stats-grid"><StatCard label={t("Characters practiced")} value={practiced.size} detail={t("of 92 basic kana")} icon={<PenLine size={20} />} /><StatCard label={t("Recalled independently")} value={independent.size} detail={t("without hints or retries")} icon={<ShieldCheck size={20} />} /><StatCard label={t("Current streak")} value={streak} detail={streak === 1 ? t("day of making time") : t("days of making time")} icon={<Flame size={20} />} /><StatCard label={t("Practice sessions")} value={attempts.length} detail={t("completed character cycles")} icon={<BookOpen size={20} />} /></div><section className="progress-panel"><div className="section-heading"><h2>{t("A week of little moments")}</h2><span>{t("Last 7 days")}</span></div><div className="activity-chart">{Array.from({ length: 7 }, (_, i) => {
          const d = new Date(date ?? Date.now()); d.setDate(d.getDate() - (6 - i));
          const count = attempts.filter(a => a.day === dayKey(d)).length;
          const max = Math.max(settings.dailyGoal, ...Array.from({ length: 7 }, (_, j) => { const x = new Date(date ?? Date.now()); x.setDate(x.getDate() - j); return attempts.filter(a => a.day === dayKey(x)).length; }));
          return <div key={i} className={`activity-day ${i === 6 ? 'is-today' : ''}`}><strong>{n(count)}</strong><div className="activity-bar-track"><div style={{ height: `${count ? Math.max(4, count / max * 100) : 0}%` }} /></div><span>{i === 6 ? t("Today") : d.toLocaleDateString(locale, { weekday: 'short' })}</span></div>;
        })}</div></section><section className="progress-panel"><div className="section-heading"><h2>{t("Your latest pages")}</h2><span>{t('{count} characters written', { count: attempts.length })}</span></div>{attempts.length ? <div className="history-list">{[...attempts].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 12).map((attempt, index) => { const character = characters.find(c => c.id === attempt.characterId)!; return <div key={`${attempt.completedAt}-${index}`}><span className="history-character">{character.symbol}</span><div><strong>{displayReading(character.reading)}</strong><small>{t(character.script)}</small></div><span className={`history-label ${attempt.independent ? 'independent' : ''}`}>{attempt.independent ? t("Recalled independently") : t("Keep practicing")}</span><time>{new Date(attempt.completedAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</time></div>; })}</div> : <div className="empty-state"><Leaf size={28} /><h3>{t("Your story starts with a stroke.")}</h3><p>{t("Complete a lesson and watch your notebook fill up.")}</p><button className="button-primary" onClick={() => startLesson(nextLesson)}>{t("Start learning")} <ArrowRight size={16} /></button></div>}</section></div>}

        {initialView === 'settings' && <div className="page-enter settings-page"><PageHeading eyebrow={t("MAKE YOURSELF AT HOME")} title={t("Your practice, your way.")} description={t("A few small adjustments for a space that feels like yours.")} /><section className="settings-panel"><h2>{t("Your daily rhythm")}</h2><div className="setting-row"><div><strong>{t("Interface language")}</strong><p>{t("Choose Bangla or English. Your learning progress stays the same.")}</p></div><LanguageSwitcher /></div><div className="setting-row"><div><strong>{t("Daily character goal")}</strong><p>{t("A gentle target. You can always do a little more.")}</p></div><select aria-label={t("Daily character goal")} value={settings.dailyGoal} onChange={e => void updateSettings({ dailyGoal: Number(e.target.value) })}>{[3, 5, 10, 15, 20].map(n => <option key={n} value={n}>{t('{count} characters', { count: n })}</option>)}</select></div><SettingToggle title={t("Writing grid")} description={t("Subtle guide lines to help with balance and placement.")} checked={settings.grid} onChange={value => void updateSettings({ grid: value })} /><SettingToggle title={t("Audio prompts")} description={t("Allow pronunciation playback when reviewing characters.")} checked={settings.sound} onChange={value => void updateSettings({ sound: value })} /><SettingToggle title={t("Reduced motion")} description={t("Pause looping stroke animation and keep transitions gentle.")} checked={settings.reducedMotion} onChange={value => void updateSettings({ reducedMotion: value })} /></section><PwaSettings /><section className="settings-panel"><h2>{t("Keep your notebook safe")}</h2><p className="settings-description">{t("Your progress is stored in this browser, on this device. Clearing browser data removes it. Keep a backup to bring your practice with you.")}</p><div className="backup-actions"><button className="button-secondary" onClick={downloadBackup}><ArrowDownToLine size={17} /> {t("Export progress")}</button><button className="button-secondary" onClick={() => importRef.current?.click()}><Upload size={17} /> {t("Import progress")}</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => void importBackup(e.target.files?.[0])} /></div><div className="reset-row"><div><strong>{t("Start with a fresh page")}</strong><p>{t("Remove your practice history from this device.")}</p></div><button className="danger-link" onClick={() => setResetConfirm(true)}>{t("Reset progress")}</button></div></section><section className="attribution"><Flower2 size={20} /><div><strong>{t("A little credit, where it’s due.")}</strong><p>{t("Character stroke data by")} <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer">KanjiVG</a>{t(", © Ulrich Apel and contributors. Reference paths and sampled stroke guides are shared under")} <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. <a href="/KANJIVG-LICENSE.txt" target="_blank">{t("Read the license.")}</a></p></div></section></div>}

        {initialView === 'practice' && <Practice key={`${activeLesson.id}-${query.get('characters')}-${query.get('session')}`} lesson={activeLesson} settings={settings} onAttempt={saveAttempt} onExit={() => router.push(activeLesson.id === 'review' ? '/review/' : '/lessons/')} onRepeat={selected => startCustom(selected)} />}
      </main>
      <footer className="workspace-footer"><span>{t("Made for a little progress, every day.")}</span><span><span className="footer-dot" /> {t("Your pace. Your practice.")}</span></footer>
    </div>
    {notice && <div className="toast" role="status"><Check size={16} />{t(notice)}<button aria-label={t("Dismiss notification")} onClick={() => setNotice('')}><X size={15} /></button></div>}
    {detail && <Modal onClose={() => setDetail(null)} label={t("Character details")}><span className="eyebrow">{t(detail.script)} · {t(detail.group)}</span><div className="detail-symbol">{detail.symbol}</div><h2 className="detail-reading">{displayReading(detail.reading)}<button className="audio-button" aria-label={t("Play pronunciation")} disabled={!settings.sound} onClick={() => { setDetailAudioError(''); void speakCharacter(detail).then(message => { if (message) setDetailAudioError(message); }); }}><Volume2 size={20} /></button></h2>{detailAudioError && <p role="status">{t(detailAudioError)}</p>}<p>{t(detail.paths.length === 1 ? '{count} stroke' : '{count} strokes', { count: detail.paths.length })} · {practiced.has(detail.id) ? t("Practiced before") : t("A new little beginning")}</p><div className="detail-stroke-preview">{detail.paths.map((path, i) => <svg key={i} viewBox="0 0 109 109"><text x="5" y="15" fontSize="12" fill="#87917e">{n(i + 1)}</text>{detail.paths.slice(0, i + 1).map((p, j) => <path d={p} key={j} fill="none" stroke={j === i ? '#4a6540' : '#d4d9cb'} strokeWidth="4" strokeLinecap="round" />)}</svg>)}</div><button className="button-primary" onClick={() => { startCustom([detail], false); setDetail(null); }}>{t("Practice this character")} <ArrowRight size={17} /></button></Modal>}
    {helpOpen && <Modal onClose={() => setHelpOpen(false)} label={t("How to practice")}><span className="eyebrow">{t("WELCOME TO YOUR LITTLE NOTEBOOK")}</span><h2>{t("Three steps. A little more confidence.")}</h2><div className="help-steps"><p><strong>{t("01 · Follow the stroke")}</strong>{t("Draw the highlighted path, starting at the numbered dot. The animation shows the direction.")}</p><p><strong>{t("02 · Trace the character")}</strong>{t("Follow the faint outline with the same stroke order.")}</p><p><strong>{t("03 · Write from memory")}</strong>{t("Read the prompt and write without a guide. Hint is always there if you need it.")}</p></div><p>{t("Lift your pen or finger after each stroke. We check it automatically and move forward when you finish.")}</p><button className="button-primary" onClick={() => setHelpOpen(false)}>{t("Got it")} <Check size={16} /></button></Modal>}
    {resetConfirm && <Modal onClose={() => setResetConfirm(false)} label={t("Reset practice history")}><h2>{t("Start with a fresh page?")}</h2><p>{t("This removes all practice history on this device. Your settings stay. Export a backup first if you’d like to keep your progress.")}</p><div className="backup-actions"><button className="button-secondary" onClick={() => setResetConfirm(false)}>{t("Keep my progress")}</button><button className="button-danger" onClick={async () => { try { await db.attempts.clear(); setAttempts([]); setResetConfirm(false); setNotice('A fresh page, ready for you.'); } catch { setResetConfirm(false); setStorageError(true); } }}>{t("Reset progress")}</button></div></Modal>}
  </div>;
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  const { t } = useI18n();
  return <div className="page-heading"><div><span className="eyebrow"><span className="tiny-line" />{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></div>;
}

function ScriptTabs({ script, onChange }: { script: Script; onChange: (script: Script) => void }) {
  const { t } = useI18n();
  return <div className="script-tabs" aria-label={t("Choose script")}>{(['hiragana', 'katakana'] as Script[]).map((value, i) => <button key={value} aria-pressed={script === value} className={script === value ? 'active' : ''} onClick={() => onChange(value)}><span>{i ? 'ア' : 'あ'}</span>{i ? t("Katakana") : t("Hiragana")}</button>)}</div>;
}

function StatCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  const { n } = useI18n();
  return <div className="stat-card"><span>{icon}</span><p>{label}</p><strong>{n(value)}</strong><small>{detail}</small></div>;
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  const { t } = useI18n();
  return <div className="setting-row"><div><strong>{t(title)}</strong><p>{description}</p></div><button className={`toggle ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)}><span /></button></div>;
}

function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = dialogRef.current; dialog?.showModal(); return () => { dialog?.close(); }; }, []);
  return <dialog ref={dialogRef} className="modal" aria-label={label} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-inner"><button className="modal-close icon-button" aria-label={t("Close dialog")} onClick={onClose}><X size={20} /></button>{children}</div></dialog>;
}
