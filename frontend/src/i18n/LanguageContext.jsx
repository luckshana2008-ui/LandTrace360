import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🌐' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🌐' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🌐' }
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem('landtrace360_language');
      if (stored && ['en', 'ta', 'hi'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      // ignore storage access issues
    }
    return 'en';
  });

  const setLanguage = (langCode) => {
    if (['en', 'ta', 'hi'].includes(langCode)) {
      setLanguageState(langCode);
      try {
        localStorage.setItem('landtrace360_language', langCode);
      } catch (e) {
        // ignore
      }
    }
  };

  // Helper function to resolve dot-notated key paths e.g. t('nav.dashboard')
  const t = useMemo(() => {
    return (keyPath, defaultText = '') => {
      if (!keyPath) return defaultText;
      const parts = keyPath.split('.');
      
      // Try active language
      let current = translations[language];
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      if (current && typeof current === 'string') {
        return current;
      }

      // Fallback to English
      let fallback = translations['en'];
      for (const part of parts) {
        if (fallback && typeof fallback === 'object' && part in fallback) {
          fallback = fallback[part];
        } else {
          fallback = null;
          break;
        }
      }
      if (fallback && typeof fallback === 'string') {
        return fallback;
      }

      return defaultText || keyPath;
    };
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    currentLang: SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, defaultText) => defaultText || key,
      languages: SUPPORTED_LANGUAGES,
      currentLang: SUPPORTED_LANGUAGES[0]
    };
  }
  return ctx;
};

export default LanguageContext;
