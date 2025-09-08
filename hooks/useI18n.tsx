
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUiLocale, saveUiLocale } from '../services/storageService';
import { defaultUiLocale } from '../i18n/config';

// Define a type for the translation dictionary to allow for nested objects
type Translations = { [key: string]: string | Translations };

// Define the shape of the context
interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

// Create the context with a default value
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper function to get a nested value from an object using dot notation
const getNestedValue = (obj: Translations, path: string): string | undefined => {
    const value = path.split('.').reduce<string | Translations | undefined>((acc, part) => {
        if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
            return (acc as Translations)[part];
        }
        return undefined;
    }, obj);

    // Ensure we only return strings, not object fragments
    return typeof value === 'string' ? value : undefined;
};


// The provider component
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(getUiLocale());
  const [translations, setTranslations] = useState<Translations>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<Translations>({});

  useEffect(() => {
    const fetchTranslations = async (lang: string, isFallback = false) => {
      try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) throw new Error(`Translation file not found for ${lang}`);
        const data: Translations = await response.json();
        if (isFallback) {
          setFallbackTranslations(data);
        } else {
          setTranslations(data);
        }
      } catch (error) {
        console.warn(error);
        if (!isFallback && locale !== defaultUiLocale) {
            // If fetching the primary locale fails, attempt to switch to the default
            setLocale(defaultUiLocale);
        }
      }
    };
    
    fetchTranslations(locale);
    if (locale !== defaultUiLocale) {
        fetchTranslations(defaultUiLocale, true);
    } else {
        // If the current locale is the default, there's no need for a separate fallback
        setFallbackTranslations({});
    }

  }, [locale]);

  const setLocale = (newLocale: string) => {
    saveUiLocale(newLocale);
    setLocaleState(newLocale);
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
    // Look for the translation in the current locale, then fallback, then return the key itself
    const value = getNestedValue(translations, key) || getNestedValue(fallbackTranslations, key);

    if (value === undefined) {
        // This makes it clear in the UI when a translation is missing
        console.warn(`Translation not found for key: ${key}`);
        return key;
    }

    if (!replacements) {
        return value;
    }

    return Object.entries(replacements).reduce((acc, [k, v]) => {
        return acc.replace(`{${k}}`, String(v));
    }, value);
  }, [translations, fallbackTranslations]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook to use the i18n context
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
