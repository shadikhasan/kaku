"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  localeFor,
  translate,
  type Language,
  type TranslationValues,
} from "@/lib/i18n";

const LANGUAGE_KEY = "kana-studio-language";
type LanguageContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: TranslationValues) => string;
  n: (value: number) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    try {
      if (localStorage.getItem(LANGUAGE_KEY) === "bn") setLanguageState("bn");
    } catch {
      /* The switch still works when browser storage is unavailable. */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === "bn"
        ? "Kaku — প্রতিদিন একটু জাপানি শেখা"
        : "Kaku — A little Japanese, every day";
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: localeFor(language),
      setLanguage: (next) => {
        setLanguageState(next);
        try {
          localStorage.setItem(LANGUAGE_KEY, next);
        } catch {
          /* Persistence is optional; switching is immediate. */
        }
      },
      t: (key, values) => translate(language, key, values),
      n: (value) => new Intl.NumberFormat(localeFor(language)).format(value),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used within LanguageProvider");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <div className="language-switch" role="group" aria-label={t("Language")}>
      <button
        type="button"
        lang="en"
        aria-label={t("Switch to English")}
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        lang="bn"
        aria-label={t("Switch to Bangla")}
        aria-pressed={language === "bn"}
        onClick={() => setLanguage("bn")}
      >
        বাংলা
      </button>
    </div>
  );
}
