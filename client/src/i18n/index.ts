import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ms', name: 'Bahasa Melayu', short: 'MS', flag: '🇲🇾' },
  { code: 'id', name: 'Bahasa Indonesia', short: 'ID', flag: '🇮🇩' },
  { code: 'es', name: 'Español', short: 'ES', flag: '🇪🇸' },
  { code: 'zh', name: '简体中文', short: 'ZH', flag: '🇨🇳' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Lazy-load locale files dynamically on demand per user selection
const dynamicResourceBackend = {
  type: 'backend' as const,
  init() {},
  read(language: string, _namespace: string, callback: (err: any, data: any) => void) {
    import(`./locales/${language}.json`)
      .then((module) => {
        callback(null, module.default || module);
      })
      .catch((err) => {
        console.warn(`[i18n] Failed to dynamic import locale "${language}":`, err);
        callback(err, null);
      });
  },
};

i18n
  .use(dynamicResourceBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ms', 'id', 'es', 'zh'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'poysic_lng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
