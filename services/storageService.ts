import { defaultUiLocale, defaultArticleLocales } from '../i18n/config';

const API_URL_KEY = 'seo-wizard-api-url';
const DEFAULT_API_URL = process.env.DEFAULT_API_URL || 'https://seo-wizard-server.vercel.app';
const UI_LOCALE_KEY = 'seo-wizard-ui-locale';
const ARTICLE_LOCALES_KEY = 'seo-wizard-article-locales';

export const saveApiUrl = (url: string): void => {
    try {
        if (url) {
            localStorage.setItem(API_URL_KEY, url);
        } else {
            localStorage.removeItem(API_URL_KEY);
        }
    } catch (e) {
        console.error("Failed to save API URL to localStorage", e);
    }
};

export const getApiUrl = (): string => {
    try {
        const url = localStorage.getItem(API_URL_KEY);
        return url || DEFAULT_API_URL;
    } catch (e) {
        console.error("Failed to get API URL from localStorage", e);
        return DEFAULT_API_URL;
    }
};

export const saveUiLocale = (locale: string): void => {
    try {
        localStorage.setItem(UI_LOCALE_KEY, locale);
    } catch (e) {
        console.error("Failed to save UI locale", e);
    }
};

export const getUiLocale = (): string => {
    try {
        return localStorage.getItem(UI_LOCALE_KEY) || defaultUiLocale;
    } catch (e) {
        console.error("Failed to get UI locale", e);
        return defaultUiLocale;
    }
};

export const saveArticleLocales = (locales: string[]): void => {
    try {
        localStorage.setItem(ARTICLE_LOCALES_KEY, JSON.stringify(locales));
    } catch (e) {
        console.error("Failed to save article locales", e);
    }
};

export const getArticleLocales = (): string[] => {
    try {
        const stored = localStorage.getItem(ARTICLE_LOCALES_KEY);
        return stored ? JSON.parse(stored) : defaultArticleLocales;
    } catch (e) {
        console.error("Failed to get article locales", e);
        return defaultArticleLocales;
    }
};
