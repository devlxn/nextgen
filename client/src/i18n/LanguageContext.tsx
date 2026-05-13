/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Language, TranslationKey, translations } from "./translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem("language");
  return saved === "ru" || saved === "en" ? saved : "en";
};

const interpolate = (template: string, replacements?: Record<string, string | number>) => {
  if (!replacements) return template;

  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem("language", nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ru" : "en");
  }, [language, setLanguage]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage,
      toggleLanguage,
      t: (key, replacements) => interpolate(translations[language][key] || translations.en[key], replacements),
    };
  }, [language, setLanguage, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
