// Language registry. Adding a language = add an entry here and provide its
// strings in the system `labels` + UI dictionary. Everything else falls back
// gracefully through `fallback` chains, so partial translations are safe.

export type Lang = string; // ISO-639-1 code, e.g. 'ru', 'en', 'uk'

export interface LangDef {
  code: Lang;
  /** Native name shown in the language switcher. */
  name: string;
  /** Ordered fallback codes tried when a string is missing for `code`. */
  fallback: Lang[];
}

export const AVAILABLE_LANGS: LangDef[] = [
  { code: 'ru', name: 'Русский', fallback: ['en'] },
  { code: 'en', name: 'English', fallback: ['ru'] },
];

export const DEFAULT_LANG: Lang = 'ru';

export function isKnownLang(code: string): code is Lang {
  return AVAILABLE_LANGS.some((l) => l.code === code);
}

export function langDef(code: Lang): LangDef {
  return AVAILABLE_LANGS.find((l) => l.code === code) ?? AVAILABLE_LANGS[0];
}

/** A value translated into zero or more languages. Missing keys are fine. */
export type LocalizedText = Partial<Record<Lang, string>>;

/**
 * Resolve a localized value for `lang`, walking the language's fallback chain,
 * then any available translation, before giving up with an empty string.
 */
export function localize(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  if (text[lang] != null) return text[lang] as string;
  for (const fb of langDef(lang).fallback) {
    if (text[fb] != null) return text[fb] as string;
  }
  const first = Object.values(text).find((v) => v != null);
  return first ?? '';
}

/**
 * Resolve a key from a per-language string dictionary (system labels / UI strings),
 * with the same fallback behaviour as `localize`.
 */
export function tr(
  dict: Partial<Record<Lang, Record<string, string>>>,
  lang: Lang,
  key: string,
): string {
  const direct = dict[lang]?.[key];
  if (direct != null) return direct;
  for (const fb of langDef(lang).fallback) {
    const v = dict[fb]?.[key];
    if (v != null) return v;
  }
  return key;
}
