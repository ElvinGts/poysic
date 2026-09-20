import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ms from './locales/ms.json';
import id from './locales/id.json';
import es from './locales/es.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ms', name: 'Bahasa Melayu', short: 'MS', flag: '🇲🇾' },
  { code: 'id', name: 'Bahasa Indonesia', short: 'ID', flag: '🇮🇩' },
  { code: 'es', name: 'Español', short: 'ES', flag: '🇪🇸' },
  { code: 'zh', name: '简体中文', short: 'ZH', flag: '🇨🇳' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ms: { translation: ms },
      id: { translation: id },
      es: { translation: es },
      zh: { translation: zh },
    },
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
  });

export default i18n;
