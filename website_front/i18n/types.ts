export type Locale = "en" | "uk";

export type TranslationValue =
  | string
  | {
      [key: string]: TranslationValue;
    };

export type TranslationDictionary = {
  [key: string]: TranslationValue;
} & {
  text?: Record<string, string>;
};

export type TranslationValues = Record<string, string | number>;

export interface TranslationOptions {
  defaultValue?: string;
  values?: TranslationValues;
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslationOptions) => string;
  translateText: (text: string, defaultValue?: string) => string;
}
