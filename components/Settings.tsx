import React, { useState, useEffect } from 'react';
import { saveApiUrl, getApiUrl, saveUiLocale, getUiLocale, saveArticleLocales, getArticleLocales } from '../services/storageService';
import { supportedLocales } from '../i18n/config';
import { useI18n } from '../hooks/useI18n';

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export const Settings: React.FC = () => {
    const { t, setLocale } = useI18n();
    const [apiUrl, setApiUrl] = useState('');
    const [uiLocale, setUiLocaleState] = useState('');
    const [articleLocales, setArticleLocales] = useState<string[]>([]);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setApiUrl(getApiUrl());
        setUiLocaleState(getUiLocale());
        setArticleLocales(getArticleLocales());
    }, []);

    const handleArticleLocaleChange = (locale: string) => {
        setArticleLocales(prev => {
            if (prev.includes(locale)) {
                if (prev.length === 1) return prev; // Must have at least one
                return prev.filter(l => l !== locale);
            } else {
                return [...prev, locale];
            }
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveApiUrl(apiUrl);
        saveUiLocale(uiLocale);
        saveArticleLocales(articleLocales);
        setLocale(uiLocale); // Update context
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl animate-fade-in">
            <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="api-url-input" className="block text-sm font-medium text-slate-300 mb-2">
                            {t('settings.apiUrl.label')}
                        </label>
                        <input
                            id="api-url-input"
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://your-api-server.com"
                            className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300"
                            aria-describedby='api-url-description'
                        />
                        <p id="api-url-description" className="text-xs text-slate-500 mt-2">{t('settings.apiUrl.description')}</p>
                    </div>

                     <div>
                        <label htmlFor="ui-locale-select" className="block text-sm font-medium text-slate-300 mb-2">
                            {t('settings.uiLanguage.label')}
                        </label>
                        <select
                            id="ui-locale-select"
                            value={uiLocale}
                            onChange={(e) => setUiLocaleState(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300"
                        >
                            {Object.entries(supportedLocales).map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                           {t('settings.articleLanguages.label')}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-700 p-3 rounded-lg">
                            {Object.entries(supportedLocales).map(([code, name]) => (
                                <label key={code} htmlFor={`locale-checkbox-${code}`} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-600/50 transition-colors">
                                    <input
                                        id={`locale-checkbox-${code}`}
                                        type="checkbox"
                                        checked={articleLocales.includes(code)}
                                        onChange={() => handleArticleLocaleChange(code)}
                                        className="w-4 h-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500 focus:ring-offset-slate-700"
                                    />
                                    <span className="text-slate-200">{name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{t('settings.articleLanguages.description')}</p>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all duration-300 disabled:bg-green-600 disabled:cursor-default"
                        disabled={isSaved}
                        aria-live="polite"
                    >
                        {isSaved ? (
                            <>
                                <CheckIcon className="h-5 w-5 mr-2"/>
                                {t('settings.saveButton.saved')}
                            </>
                        ) : t('settings.saveButton.main')}
                    </button>
                </form>
            </div>
        </div>
    );
};
