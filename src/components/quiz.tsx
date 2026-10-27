"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Flame,
  Leaf,
  RotateCcw,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { characters, lessons } from "@/lib/content";
import { db } from "@/lib/storage";
import { banglaReadings } from "@/lib/readings";
import { speakCharacter, stopPronunciation } from "@/lib/speech";
import {
  answerChoices,
  createQuestions,
  defaultQuizOptions,
  parseQuizOptions,
  quizKey,
  type QuizAnswer,
  type QuizOptions,
  type QuizResult,
} from "@/lib/quiz";
import type { Character, Settings } from "@/lib/types";
import { useI18n } from "./language-provider";

export default function Quiz({
  settings,
  onPractice,
}: {
  settings: Settings;
  onPractice: (characters: Character[]) => void;
}) {
  const { t, n, language } = useI18n();
  const query = useSearchParams();
  const lessonId = query.get("lesson");
  const [options, setOptions] = useState<QuizOptions>(defaultQuizOptions);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<"setup" | "playing" | "results">("setup");
  const [pool, setPool] = useState<Character[]>([]);
  const [questions, setQuestions] = useState<Character[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(15);
  const [paused, setPaused] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [retry, setRetry] = useState(false);
  const locked = useRef(false);
  const advanced = useRef(-1);
  const timeLeft = useRef(15000);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const active = questions[index];
  const answer = answers[index];
  const choices = useMemo(
    () => (active ? answerChoices(active, pool) : []),
    [active, pool],
  );
  const reading = (value: string) =>
    language === "bn" ? `${banglaReadings[value] ?? value} (${value})` : value;
  const selected = characters.filter(
    (c) =>
      (options.script === "mixed" || c.script === options.script) &&
      options.rows.includes(Number(c.lessonId.split("-").at(-1))),
  );
  const mistakes = [
    ...new Set(answers.filter((a) => !a.correct).map((a) => a.characterId)),
  ].map((id) => characters.find((c) => c.id === id)!);
  const score = answers.filter((a) => a.correct).length;
  let combo = 0;
  let maxCombo = 0;
  for (const a of answers) {
    combo = a.correct ? combo + 1 : 0;
    maxCombo = Math.max(combo, maxCombo);
  }

  useEffect(() => {
    let cancelled = false;
    db.quizPreferences
      .get("options")
      .then((saved) => {
        if (!cancelled) setOptions(parseQuizOptions(saved?.value));
      })
      .catch(() => {
        if (!cancelled) setStorageError(true);
      })
      .finally(() => {
        if (cancelled) return;
        const lesson = lessons.find((l) => l.id === lessonId);
        if (lesson)
          setOptions((previous) => ({
            ...previous,
            script: lesson.script,
            rows: [lesson.number - 1],
          }));
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  useEffect(() => {
    if (!loaded) return;
    db.quizPreferences
      .put({ key: "options", value: options })
      .catch(() => setStorageError(true));
  }, [loaded, options]);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    setBest(null);
    db.quizResults
      .where("configuration")
      .equals(quizKey(options))
      .toArray()
      .then((results) => {
        if (!cancelled && results.length)
          setBest(Math.max(...results.map((r) => r.score)));
      })
      .catch(() => {
        if (!cancelled) setStorageError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loaded, options]);

  useEffect(() => {
    heading.current?.focus();
    return stopPronunciation;
  }, [phase, index]);
  useEffect(() => {
    if (answer) nextButton.current?.focus();
  }, [answer]);
  useEffect(() => {
    if (leaveOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [leaveOpen]);
  useEffect(() => {
    if (phase !== "playing") return;
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [phase]);

  function submit(value: string | null) {
    if (locked.current || !active) return;
    locked.current = true;
    setAnswers((previous) => [
      ...previous,
      {
        characterId: active.id,
        correct: value === active.reading,
        reading: value,
      },
    ]);
  }

  useEffect(() => {
    if (phase !== "playing" || answer || !options.timed) return;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      if (!document.hidden && !leaveOpen)
        timeLeft.current = Math.max(0, timeLeft.current - (now - last));
      last = now;
      setRemaining(Math.ceil(timeLeft.current / 1000));
      if (timeLeft.current <= 0) submit(null);
    };
    const visibility = () => {
      last = performance.now();
      setPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", visibility);
    const interval = setInterval(tick, 100);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
    };
    // The question's target remains fixed until index changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, answer, options.timed, leaveOpen]);

  function start(targets = selected, isRetry = false) {
    if (!targets.length) return;
    stopPronunciation();
    setAudioError("");
    setPool(isRetry ? pool : targets);
    setQuestions(
      createQuestions(targets, isRetry ? targets.length : options.count),
    );
    setRetry(isRetry);
    setAnswers([]);
    setIndex(0);
    timeLeft.current = 15000;
    setRemaining(15);
    locked.current = false;
    advanced.current = -1;
    setPhase("playing");
  }

  async function next() {
    if (!answer || advanced.current === index) return;
    advanced.current = index;
    stopPronunciation();
    setAudioError("");
    if (index + 1 < questions.length) {
      locked.current = false;
      timeLeft.current = 15000;
      setRemaining(15);
      setIndex((value) => value + 1);
      return;
    }
    setPhase("results");
    if (retry) return;
    const result: QuizResult = {
      completedAt: new Date().toISOString(),
      configuration: quizKey(options),
      score,
      total: questions.length,
      combo: maxCombo,
      answers,
    };
    try {
      await db.quizResults.add(result);
      setBest((previous) => Math.max(previous ?? 0, score));
    } catch {
      setStorageError(true);
    }
  }

  return (
    <div className="quiz-page page-enter">
      {storageError && (
        <p className="quiz-notice" role="status">
          {t("Quiz progress could not be saved. You can still play.")}
        </p>
      )}
      {phase === "setup" && (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                <Leaf size={15} /> {t("A LITTLE CHALLENGE, EVERY DAY")}
              </span>
              <h1>{t("Kana Challenge")}</h1>
              <p>{t("A few familiar characters. A fresh little challenge.")}</p>
            </div>
          </div>
          <section className="quiz-card">
            <fieldset className="quiz-field">
              <legend>{t("Choose script")}</legend>
              <div className="quiz-segments">
                {(["hiragana", "katakana", "mixed"] as const).map((script) => (
                  <button
                    key={script}
                    aria-pressed={options.script === script}
                    onClick={() => setOptions({ ...options, script })}
                  >
                    {t(
                      script === "mixed"
                        ? "Both scripts"
                        : script === "hiragana"
                          ? "Hiragana"
                          : "Katakana",
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="quiz-row-heading">
              <h2>{t("Choose your rows")}</h2>
              <button
                className="text-link"
                onClick={() =>
                  setOptions({
                    ...options,
                    rows:
                      options.rows.length === 10
                        ? []
                        : Array.from({ length: 10 }, (_, i) => i),
                  })
                }
              >
                {t(
                  options.rows.length === 10 ? "Clear selection" : "Select all",
                )}
              </button>
            </div>
            <div className="quiz-rows">
              {lessons
                .filter(
                  (l) =>
                    l.script ===
                    (options.script === "katakana" ? "katakana" : "hiragana"),
                )
                .map((lesson, row) => (
                  <label
                    key={lesson.id}
                    className={`quiz-row ${options.rows.includes(row) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={options.rows.includes(row)}
                      onChange={() =>
                        setOptions({
                          ...options,
                          rows: options.rows.includes(row)
                            ? options.rows.filter((r) => r !== row)
                            : [...options.rows, row],
                        })
                      }
                    />
                    <span className="quiz-row-symbols" lang="ja">
                      {lesson.characters.map((c) => c.symbol).join(" ")}
                      {options.script === "mixed" && (
                        <small>
                          {lessons
                            .find((l) => l.id === `katakana-${row}`)
                            ?.characters.map((c) => c.symbol)
                            .join(" ")}
                        </small>
                      )}
                    </span>
                    <span className="quiz-row-name">{t(lesson.name)}</span>
                  </label>
                ))}
            </div>
            <fieldset className="quiz-field">
              <legend>{t("Number of questions")}</legend>
              <div className="quiz-segments">
                {([10, 20] as const).map((count) => (
                  <button
                    key={count}
                    aria-pressed={options.count === count}
                    onClick={() => setOptions({ ...options, count })}
                  >
                    {n(count)}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="quiz-timer-setting">
              <span>
                <strong id="quiz-timer-label">{t("Question timer")}</strong>
                <small id="quiz-timer-description">
                  {t(
                    options.timed
                      ? "15 seconds per question"
                      : "Play at your own pace, without a timer",
                  )}
                </small>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-labelledby="quiz-timer-label"
                aria-describedby="quiz-timer-description"
                disabled={!loaded}
                checked={options.timed}
                onChange={(event) =>
                  setOptions({ ...options, timed: event.target.checked })
                }
              />
              <span className="quiz-timer-control" aria-hidden="true">
                <span>{t(options.timed ? "On" : "Off")}</span>
                <span className="quiz-timer-track" />
              </span>
            </label>
            <p className="quiz-hint">
              {t("Questions and choices stay within your selected rows.")}
            </p>
            {best !== null && (
              <p className="quiz-best">
                <Trophy size={16} />{" "}
                {t("Personal best: {score}/{total}", {
                  score: best,
                  total: options.count,
                })}
              </p>
            )}
            <div className="quiz-start">
              <span>
                {t("{count} characters selected", { count: selected.length })}
              </span>
              <button
                className="button-primary"
                disabled={!loaded || !selected.length}
                onClick={() => start()}
              >
                {t("Start quiz")} <ArrowRight size={17} />
              </button>
            </div>
          </section>
        </>
      )}
      {phase === "playing" && active && (
        <section className="quiz-card quiz-play">
          <div className="quiz-play-header">
            <button className="back-link" onClick={() => setLeaveOpen(true)}>
              <X size={17} />
              {t("Leave quiz")}
            </button>
            <span>
              {t("Question {current} of {total}", {
                current: index + 1,
                total: questions.length,
              })}
            </span>
          </div>
          <progress
            className="quiz-progress"
            aria-label={t("Quiz progress")}
            value={index + (answer ? 1 : 0)}
            max={questions.length}
          />
          <div className="quiz-live-stats">
            <span>
              <Flame size={17} />
              {t("Combo: {count}", { count: combo })}
            </span>
            {options.timed && (
              <span className={remaining <= 5 ? "quiz-time-low" : ""}>
                <Clock3 size={17} />
                {paused
                  ? t("Paused")
                  : t("{count} seconds", { count: remaining })}
              </span>
            )}
          </div>
          <h1 tabIndex={-1} ref={heading} className="quiz-prompt">
            {t("What is this character?")}
          </h1>
          <div className="quiz-character" lang="ja">
            {active.symbol}
          </div>
          <span className="pill">{t(active.script)}</span>
          <div
            className="quiz-answers"
            role="group"
            aria-label={t("Choose the pronunciation")}
          >
            {choices.map((choice) => (
              <button
                key={choice}
                disabled={!!answer}
                className={`quiz-answer ${answer && choice === active.reading ? "correct" : ""} ${answer && answer.reading === choice && !answer.correct ? "incorrect" : ""}`}
                onClick={() => submit(choice)}
              >
                {answer && choice === active.reading && <Check size={19} />}
                {answer && answer.reading === choice && !answer.correct && (
                  <X size={19} />
                )}
                {reading(choice)}
              </button>
            ))}
          </div>
          {answer && (
            <div className="quiz-feedback" role="status">
              <strong>
                {t(
                  answer.correct
                    ? "Correct!"
                    : answer.reading === null
                      ? "Time is up"
                      : "A little more practice.",
                )}
              </strong>
              <p>
                {active.symbol} — {reading(active.reading)}{" "}
                <button
                  className="audio-button"
                  disabled={!settings.sound}
                  aria-label={t("Hear {reading}", {
                    reading: reading(active.reading),
                  })}
                  onClick={() => {
                    void speakCharacter(active).then((message) =>
                      setAudioError(message ?? ""),
                    );
                  }}
                >
                  <Volume2 size={19} />
                </button>
              </p>
              {audioError && <p>{t(audioError)}</p>}
              <button
                ref={nextButton}
                className="button-primary"
                onClick={() => void next()}
              >
                {t(
                  index + 1 === questions.length
                    ? "See results"
                    : "Next question",
                )}{" "}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
      )}
      {phase === "results" && (
        <section className="quiz-card quiz-results">
          <div className="quiz-trophy">
            <Trophy size={32} />
          </div>
          <span className="eyebrow">
            {t(retry ? "MISTAKES REVIEWED" : "ONE SMALL QUIZ. REAL PRACTICE.")}
          </span>
          <h1 tabIndex={-1} ref={heading}>
            {t("Nicely done!")}
          </h1>
          <div className="quiz-score">
            {n(score)}
            <span> / {n(questions.length)}</span>
          </div>
          <p>
            {t("{count}% correct", {
              count: Math.round((score / questions.length) * 100),
            })}
          </p>
          <div className="quiz-result-stats">
            <span>
              <Flame size={18} />
              {t("Best combo: {count}", { count: maxCombo })}
            </span>
            {!retry && best !== null && (
              <span>
                <Trophy size={18} />
                {t("Personal best: {score}/{total}", {
                  score: best,
                  total: questions.length,
                })}
              </span>
            )}
          </div>
          {mistakes.length > 0 ? (
            <>
              <h2>{t("Give these another look")}</h2>
              <div className="quiz-mistakes">
                {mistakes.map((c) => (
                  <span key={c.id}>
                    <b lang="ja">{c.symbol}</b>
                    {reading(c.reading)}
                  </span>
                ))}
              </div>
              <button
                className="button-primary"
                onClick={() => start(mistakes, true)}
              >
                <RotateCcw size={17} />
                {t("Retry mistakes")}
              </button>
              <button
                className="button-secondary"
                onClick={() => onPractice(mistakes)}
              >
                {t("Practice these in writing")} <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <p className="quiz-perfect">
              <Leaf size={18} />
              {t("Every answer correct. Keep growing!")}
            </p>
          )}
          <div className="quiz-result-actions">
            <button className="text-link" onClick={() => start()}>
              {t("Play again")}
            </button>
            <button className="text-link" onClick={() => setPhase("setup")}>
              {t("Change rows")}
            </button>
          </div>
        </section>
      )}
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="quiz-leave-title"
        onCancel={() => setLeaveOpen(false)}
      >
        <div className="modal-inner">
          <h2 id="quiz-leave-title">{t("Leave this quiz?")}</h2>
          <p>{t("This unfinished quiz will not be saved.")}</p>
          <div className="quiz-result-actions">
            <button
              className="button-secondary"
              onClick={() => setLeaveOpen(false)}
            >
              {t("Keep playing")}
            </button>
            <button
              className="button-primary"
              onClick={() => {
                setLeaveOpen(false);
                setPhase("setup");
              }}
            >
              {t("Leave quiz")}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
