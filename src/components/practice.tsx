'use client';

import { displayReading } from '@/lib/readings';
import { speakCharacter, stopPronunciation } from '@/lib/speech';

import { useI18n } from './language-provider';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lightbulb, RotateCcw, Undo2, Volume2, Leaf, Trophy, PenLine } from 'lucide-react';
import WritingPad from './writing-pad';
import { stageNames, stageDescriptions, examples } from '@/lib/content';
import { dayKey, evaluateStroke, samplePath } from '@/lib/handwriting';
import type { Attempt, Character, Lesson, Point, Settings } from '@/lib/types';

export default function Practice({ lesson, settings, onAttempt, onExit, onRepeat }: {
  lesson: Lesson; settings: Settings; onAttempt: (attempt: Attempt) => Promise<void>; onExit: () => void; onRepeat: (characters: Character[]) => void;
}) {
  const { t, n } = useI18n();
  const [characterIndex, setCharacterIndex] = useState(0);
  const [stage, setStage] = useState(0);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [hint, setHint] = useState(false);
  const [replay, setReplay] = useState(0);
  const [feedback, setFeedback] = useState({ kind: 'neutral', message: 'Take your time. Every stroke is a small step forward.' });
  const [stageComplete, setStageComplete] = useState(false);
  const [retries, setRetries] = useState(0);
  const [hints, setHints] = useState(0);
  const [memoryHelp, setMemoryHelp] = useState(false);
  const [results, setResults] = useState<Attempt[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const character = lesson.characters[characterIndex];
  const finished = characterIndex >= lesson.characters.length;

  useEffect(() => stopPronunciation, [characterIndex, stage]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; if (timer.current) clearTimeout(timer.current); if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, []);

  const resetPad = () => {
    if (timer.current) clearTimeout(timer.current);
    setStrokes([]); setStageComplete(false);
    setFeedback({ kind: 'neutral', message: 'A fresh start. You’ve got this.' });
  };

  const advance = async () => {
    if (stage < 2) {
      setStage(s => s + 1); setStrokes([]); setStageComplete(false); setHint(false);
      setFeedback({ kind: 'neutral', message: stage === 0 ? 'Now trace the whole character. Let your hand remember.' : 'No outline this time. Trust what you’ve learned.' });
    } else {
      const attempt: Attempt = { characterId: character.id, completedAt: new Date().toISOString(), day: dayKey(), independent: !memoryHelp, retries, hints };
      await onAttempt(attempt);
      if (!isMounted.current) return;
      setResults(r => [...r, attempt]);
      setCharacterIndex(i => i + 1); setStage(0); setStrokes([]); setStageComplete(false); setHint(false); setRetries(0); setHints(0); setMemoryHelp(false);
      setFeedback({ kind: 'neutral', message: 'A new character. Start with the highlighted stroke.' });
    }
  };

  const acceptStroke = (points: Point[]) => {
    if (stageComplete || !character.paths[strokes.length]) return;
    const result = evaluateStroke(points, samplePath(character.paths[strokes.length]), stage === 2);
    if (!result.accepted) {
      setRetries(n => n + 1);
      if (stage === 2) setMemoryHelp(true);
      setFeedback({ kind: 'retry', message: result.message });
      return;
    }
    const next = [...strokes, points];
    setStrokes(next);
    if (next.length === character.paths.length) {
      setStageComplete(true);
      setFeedback({ kind: 'success', message: stage === 2 ? 'Beautifully written! Three steps, one character learned.' : 'Nicely done. Ready for a little less guidance?' });
      timer.current = setTimeout(() => { void advance(); }, settings.reducedMotion ? 1800 : 1150);
    } else setFeedback({ kind: 'success', message: result.message });
  };

  const showHint = () => {
    setHints(n => n + 1); if (stage === 2) setMemoryHelp(true);
    setHint(true); setReplay(n => n + 1);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(false), 4000);
  };

  if (finished) {
    const needsReview = results.filter(r => !r.independent).map(r => lesson.characters.find(c => c.id === r.characterId)!);
    return <div className="session-finished page-enter">
      <div className="celebration-icon"><Trophy size={35} strokeWidth={1.4} /></div>
      <span className="eyebrow">{t("ONE SMALL SESSION. REAL PROGRESS.")}</span>
      <h1>{t("Look what you wrote.")}</h1>
      <p>{t("You gave {count} characters your full attention. That’s how a habit begins.", { count: lesson.characters.length })}</p>
      <div className="finished-characters">{lesson.characters.map(c => <span key={c.id}>{c.symbol}<small>{displayReading(c.reading)}</small></span>)}</div>
      <div className="result-stats"><div><strong>{n(results.filter(r => r.independent).length)}</strong><span>{t("recalled independently")}</span></div><div><strong>{n(needsReview.length)}</strong><span>{t("to practice again")}</span></div><div><strong>{n(results.length * 3)}</strong><span>{t("rounds completed")}</span></div></div>
      <div className="finished-actions">{needsReview.length > 0 && <button className="button-primary" onClick={() => onRepeat(needsReview)}>{t("Practice tricky characters")} <ArrowRight size={17} /></button>}<button className={needsReview.length ? 'button-secondary' : 'button-primary'} onClick={onExit}>{t("Back to my lessons")} <ArrowRight size={17} /></button></div>
    </div>;
  }

  const example = examples[character.reading];
  const progress = ((characterIndex * 3 + stage) / (lesson.characters.length * 3)) * 100;
  return <div className="practice-page page-enter">
    <div className="practice-heading"><button className="back-link" onClick={onExit}><ArrowLeft size={17} /> {t("Back to lessons")}</button><span>{t(lesson.name)} <span className="muted">/</span> {t("Character {current} of {total}", { current: characterIndex + 1, total: lesson.characters.length })}</span></div>
    <div className="lesson-progress-track"><div style={{ width: `${progress}%` }} /></div>
    <div className="practice-layout">
      <section className="practice-main">
        <div className="practice-stage-tabs">{stageNames.map((name, index) => <div key={name} className={`${stage === index ? 'active' : ''} ${stage > index ? 'done' : ''}`}><span>{stage > index ? <Check size={12} /> : n(index + 1)}</span>{t(name)}</div>)}</div>
        <div className="writing-prompt"><span className="eyebrow">{stage === 2 ? t("WRITE FROM MEMORY") : stage === 1 ? t("FOLLOW THE OUTLINE") : t("LET’S TAKE IT STROKE BY STROKE")}</span><h1>{t("Write “{reading}”", { reading: displayReading(character.reading) })}<button className="audio-button" disabled={!settings.sound} aria-label={t("Hear {reading}", { reading: displayReading(character.reading) })} onClick={() => { void speakCharacter(character).then(message => { if (message && isMounted.current) setFeedback({ kind: 'neutral', message }); }); }}><Volume2 size={19} /></button></h1><p>{t(stageDescriptions[stage])}</p></div>
        <div className="pad-container"><WritingPad key={`${character.id}-${stage}`} paths={character.paths} strokes={strokes} stage={stage} hint={hint} grid={settings.grid} disabled={stageComplete} replay={replay} onStroke={acceptStroke} />{stageComplete && <div className="pad-success"><CheckCircle2 size={35} /></div>}</div>
        <div className="stroke-status"><span>{t("Stroke {current} of {total}", { current: Math.min(strokes.length + 1, character.paths.length), total: character.paths.length })}</span><div>{character.paths.map((_, index) => <i key={index} className={index < strokes.length ? 'complete' : index === strokes.length ? 'current' : ''} />)}</div></div>
        <div className={`writing-feedback ${feedback.kind}`} role="status">{feedback.kind === 'success' ? <CheckCircle2 size={16} /> : <PenLine size={16} />}<span>{t(feedback.message)}</span></div>
        <div className="pad-controls"><button disabled={!strokes.length || stageComplete} onClick={() => { setStrokes(s => s.slice(0, -1)); setFeedback({ kind: 'neutral', message: 'Try that stroke again.' }); if (stage === 2) setMemoryHelp(true); }}><Undo2 size={17} /> {t("Undo")}</button><button disabled={stageComplete} onClick={() => { resetPad(); if (stage === 2 && strokes.length) setMemoryHelp(true); }}><RotateCcw size={16} /> {t("Clear")}</button><span /><button disabled={stageComplete} onClick={showHint}><Lightbulb size={17} /> {t("Hint")}</button><button disabled={stageComplete} onClick={() => { if (stage !== 0) showHint(); else setReplay(n => n + 1); }}><PenLine size={17} /> {t("Replay")}</button></div>
      </section>
      <aside className="practice-aside"><div className="reference-card"><span className="eyebrow">{stage === 2 && !hint ? t("YOU’VE GOT THIS") : t("YOUR CHARACTER")}</span><div className="reference-character">{stage === 2 && !hint ? '?' : character.symbol}</div><div className="reference-reading">{displayReading(character.reading)}</div><span className="pill">{t(character.script)}</span><div className="reference-divider" /><div className="reference-details"><span>{t("Stroke count")}</span><strong>{n(character.paths.length)}</strong></div><div className="reference-details"><span>{t("Lesson")}</span><strong>{n(lesson.number).padStart(2, n(0))}</strong></div>{example && stage !== 2 && <div className="example-word"><small>{t("A LITTLE CONTEXT")}</small><strong>{example[0]}</strong><span>{t(example[1])}</span></div>}</div><div className="gentle-note"><Leaf size={19} /><p>{t("Progress is a practice,")}<br />{t("not a perfect stroke.")}</p></div></aside>
    </div>
  </div>;
}
