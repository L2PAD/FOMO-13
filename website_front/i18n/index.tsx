import React, {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import en from "./dictionaries/en";
import uk from "./dictionaries/uk";
import {
  I18nContextValue,
  Locale,
  TranslationDictionary,
  TranslationOptions,
} from "./types";

export const DEFAULT_LOCALE: Locale = "en";
export const LANG_STORAGE_KEY = "fomoland_lang";

export const LOCALES: Array<{
  code: Locale;
  flag: string;
  labelKey: string;
}> = [
  { code: "en", flag: "🇬🇧", labelKey: "language.en" },
  { code: "uk", flag: "🇺🇦", labelKey: "language.uk" },
];

export const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  uk,
};

const resolveByPath = (
  dictionary: TranslationDictionary,
  key: string
): string | undefined => {
  const value = key.split(".").reduce<any>((current, part) => {
    if (!current || typeof current !== "object") return undefined;

    return current[part];
  }, dictionary);

  return typeof value === "string" ? value : undefined;
};

const isBrokenTranslation = (value?: string): boolean => {
  if (!value) return false;

  return /\?{3,}/.test(value);
};

const warnedMissingTranslations = new Set<string>();

const warnMissingTranslation = (type: "key" | "text", value: string): void => {
  if (process.env.NODE_ENV === "production") return;

  const warningKey = `${type}:${value}`;

  if (warnedMissingTranslations.has(warningKey)) return;

  warnedMissingTranslations.add(warningKey);

  if (typeof console !== "undefined") {
    console.warn(`[i18n] Missing translation ${type}: ${value}`);
  }
};

const getValidTranslation = (
  primary?: string,
  fallback?: string
): string | undefined => {
  if (primary && !isBrokenTranslation(primary)) {
    return primary;
  }

  if (fallback && !isBrokenTranslation(fallback)) {
    return fallback;
  }

  return undefined;
};

const interpolate = (
  value: string,
  values: TranslationOptions["values"] = {}
): string =>
  Object.entries(values).reduce(
    (result, [key, replacement]) =>
      result.replace(new RegExp(`{${key}}`, "g"), String(replacement)),
    value
  );

const getInitialClientLocale = (): Locale => DEFAULT_LOCALE;

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key, options) => options?.defaultValue || key,
  translateText: (text) => text,
});

export const I18nProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const nextLocale = getInitialClientLocale();
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, nextLocale);
      } catch {
        // Storage can be blocked in private/security modes; locale still updates in memory.
      }
    }
  }, []);

  const t = useCallback(
    (key: string, options?: TranslationOptions): string => {
      const dictionary = dictionaries[locale];
      const fallbackDictionary = dictionaries[DEFAULT_LOCALE];
      const translated = getValidTranslation(
        resolveByPath(dictionary, key),
        resolveByPath(fallbackDictionary, key)
      );
      const value = translated || options?.defaultValue || key;

      if (!translated && !options?.defaultValue) {
        warnMissingTranslation("key", key);
      }

      return interpolate(value, options?.values);
    },
    [locale]
  );

  const translateText = useCallback(
    (text: string, defaultValue = text): string => {
      const dictionaryText = dictionaries[locale].text?.[text];
      const fallbackText = dictionaries[DEFAULT_LOCALE].text?.[text];
      const translated = getValidTranslation(dictionaryText, fallbackText);

      if (!translated && defaultValue === text) {
        warnMissingTranslation("text", text);
      }

      return translated || defaultValue;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      translateText,
    }),
    [locale, setLocale, t, translateText]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextValue => useContext(I18nContext);

export const t = (
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  options?: TranslationOptions
): string => {
  const translated = getValidTranslation(
    resolveByPath(dictionaries[locale], key),
    resolveByPath(dictionaries[DEFAULT_LOCALE], key)
  );
  const value = translated || options?.defaultValue || key;

  if (!translated && !options?.defaultValue) {
    warnMissingTranslation("key", key);
  }

  return interpolate(value, options?.values);
};

export const translateText = (
  text: string,
  locale: Locale = DEFAULT_LOCALE
): string => {
  const translated = getValidTranslation(
    dictionaries[locale].text?.[text],
    dictionaries.en.text?.[text]
  );

  if (!translated) {
    warnMissingTranslation("text", text);
  }

  return translated || text;
};
