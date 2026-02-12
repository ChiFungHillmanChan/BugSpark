export const locales = ["en", "zh-HK"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-HK";
export const LOCALE_COOKIE_NAME = "bugspark_locale";
