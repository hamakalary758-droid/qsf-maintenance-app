import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Locale, dictionaries, RTL_LOCALES } from '../i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('qsf_app_lang');
      if (saved === 'en' || saved === 'ar' || saved === 'ckb') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const dir = useMemo<'ltr' | 'rtl'>(() => {
    return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('qsf_app_lang', newLocale);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  const t = useCallback(
    (key: string): string => {
      const currentDict = dictionaries[locale];
      const val = getNestedValue(currentDict, key);
      if (val !== undefined) return val;

      // Fallback to English
      const enDict = dictionaries.en;
      const enVal = getNestedValue(enDict, key);
      if (enVal !== undefined) return enVal;

      // Fallback to key itself
      return key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dir,
    }),
    [locale, setLocale, t, dir]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
