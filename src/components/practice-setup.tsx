"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "./language-provider";
import { displayReading } from "@/lib/readings";
import { repetitionStages, type RepetitionOptions } from "@/lib/repetition";
import type { Character } from "@/lib/types";

export default function PracticeSetup({
  character,
  onBack,
  onStart,
}: {
  character: Character;
  onBack: () => void;
  onStart: (options?: RepetitionOptions) => void;
}) {
  const { t } = useI18n();
  const [repeat, setRepeat] = useState(false);
  const [options, setOptions] = useState<RepetitionOptions>({
    count: 5,
    start: "guided",
  });
  const stages = repetitionStages(options);
  return (
    <div className="practice-setup">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        {t("Character details")}
      </button>
      <div className="setup-character" lang="ja">
        {character.symbol}
      </div>
      <p className="setup-reading">{displayReading(character.reading)}</p>
      <h2>{t("How would you like to practise?")}</h2>
      <fieldset className="setup-modes">
        <legend className="sr-only">{t("Practice mode")}</legend>
        <label className={!repeat ? "selected" : ""}>
          <input
            type="radio"
            name="practice-mode"
            checked={!repeat}
            onChange={() => setRepeat(false)}
          />
          <span>
            <strong>{t("Learn to write")}</strong>
            <small>{t("Stroke guide → Outline → From memory")}</small>
          </span>
        </label>
        <label className={repeat ? "selected" : ""}>
          <input
            type="radio"
            name="practice-mode"
            checked={repeat}
            onChange={() => setRepeat(true)}
          />
          <span>
            <strong>{t("Repeat writing")}</strong>
            <small>{t("Build confidence with one character.")}</small>
          </span>
        </label>
      </fieldset>
      {repeat && (
        <>
          <fieldset className="quiz-field">
            <legend>{t("How many times?")}</legend>
            <div className="quiz-segments">
              {([5, 10, 20] as const).map((count) => (
                <button
                  key={count}
                  aria-pressed={options.count === count}
                  onClick={() => setOptions({ ...options, count })}
                >
                  {t("{count} times", { count })}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="quiz-field">
            <legend>{t("How will you start?")}</legend>
            <div className="quiz-segments">
              {(["guided", "memory"] as const).map((start) => (
                <button
                  key={start}
                  aria-pressed={options.start === start}
                  onClick={() => setOptions({ ...options, start })}
                >
                  {t(
                    start === "guided"
                      ? "Learn with guides"
                      : "Write from memory",
                  )}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="setup-plan" aria-live="polite">
            {options.start === "memory"
              ? t("{count} times from memory. Hints are always available.", {
                  count: options.count,
                })
              : t("{guide} guided → {outline} outline → {memory} from memory", {
                  guide: stages.filter((s) => s === 0).length,
                  outline: stages.filter((s) => s === 1).length,
                  memory: stages.filter((s) => s === 2).length,
                })}
          </p>
          <p className="quiz-hint">
            {t("You can finish early. Completed writing stays saved.")}
          </p>
        </>
      )}
      {!repeat && (
        <p className="setup-plan">
          {t("Three rounds, one character: follow, trace, then recall.")}
        </p>
      )}
      <button
        className="button-primary setup-start"
        onClick={() => onStart(repeat ? options : undefined)}
      >
        {t("Start writing")} <ArrowRight size={17} />
      </button>
    </div>
  );
}
