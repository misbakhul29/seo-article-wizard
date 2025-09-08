
import React, { useMemo } from 'react';
import { SavedArticle, KeywordSuggestion } from '../types';
import { useI18n } from '../hooks/useI18n';

// --- ICONS (Copied for simplicity, could be moved to a shared file) ---

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const InfoIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingCartIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const BuildingStorefrontIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0 0 11.25 11.25H4.5A2.25 2.25 0 0 0 2.25 13.5V21M3 4.5h1.5M3 4.5V3M3 4.5l1.5 1.5M21 15h.008v.008H21V15Zm0 2.25h.008v.008H21v-.008Zm0 2.25h.008v.008H21v-.008Zm0 2.25h.008v.008H21v-.008ZM12.75 6.75h.008v.008h-.008V6.75Zm0 2.25h.008v.008h-.008V9Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm0 2.25h.008v.008h-.008V20.25ZM9.75 6.75h.008v.008H9.75V6.75Zm0 2.25h.008v.008H9.75V9Zm0 2.25h.008v.008H9.75v-.008Zm0 2.25h.008v.008H9.75V13.5Zm0 2.25h.008v.008H9.75v-.008Zm0 2.25h.008v.008H9.75V18Zm0 2.25h.008v.008H9.75V20.25ZM6.75 6.75h.008v.008H6.75V6.75Zm0 2.25h.008v.008H6.75V9Zm0 2.25h.008v.008H6.75v-.008Zm0 2.25h.008v.008H6.75V13.5Zm0 2.25h.008v.008H6.75v-.008Zm0 2.25h.008v.008H6.75V18Zm0 2.25h.008v.008H6.75V20.25Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
);

const GlobeAltIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0 0 12 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253m0 0c1.396.444 2.923.684 4.51.684 1.588 0 3.114-.24 4.51-.684M5.082 15a8.966 8.966 0 0 1-1.803-5.253M18.918 15a8.966 8.966 0 0 0 1.803-5.253" />
    </svg>
);

// --- HELPER COMPONENTS ---

const IntentIcon: React.FC<{ intent: KeywordSuggestion['intent'] | null }> = ({ intent }) => {
    if (!intent) return null;

    const intentMap: Record<KeywordSuggestion['intent'], React.ReactNode> = {
// Fix: Removed the `title` prop from Icon components as they do not accept it. The tooltip is handled by a parent element.
        Informational: <InfoIcon className="h-5 w-5 text-sky-400" />,
        Commercial: <BuildingStorefrontIcon className="h-5 w-5 text-amber-400" />,
        Transactional: <ShoppingCartIcon className="h-5 w-5 text-green-400" />,
        Navigational: <GlobeAltIcon className="h-5 w-5 text-purple-400" />,
    };

    return <div className="flex-shrink-0">{intentMap[intent]}</div>;
};

const LanguageFlags: React.FC<{ locales: string[] }> = ({ locales }) => {
    const getFlagEmoji = (locale: string) => {
        const countryCode = locale.split('-')[1]?.toUpperCase();
        if (!countryCode) return '🏳️';
        // Simple mapping for common locales
        const flagMap: Record<string, string> = {
            'US': '🇺🇸', 'ID': '🇮🇩', 'ES': '🇪🇸', 'FR': '🇫🇷', 'DE': '🇩🇪', 'JP': '🇯🇵'
        };
        return flagMap[countryCode] || '🏳️';
    };
    return (
        <div className="flex space-x-1">
            {locales.map(locale => (
                <span key={locale} title={locale} className="text-lg">{getFlagEmoji(locale)}</span>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---

interface SavedArticlesProps {
    articles: SavedArticle[];
    onView: (article: SavedArticle) => void;
    onDelete: (id: string) => void;
}

export const SavedArticles: React.FC<SavedArticlesProps> = ({ articles, onView, onDelete }) => {
    const { t } = useI18n();
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    if (articles.length === 0) {
        return (
            <div className="text-center text-slate-500 max-w-md mx-auto animate-fade-in">
                <p>{t('saved.empty.message')}</p>
            </div>
        );
    }
    
    const getDisplayTitle = (savedArticle: SavedArticle) => {
        const firstLocale = Object.keys(savedArticle.articles)[0];
        return firstLocale ? savedArticle.articles[firstLocale].title : "Untitled Article";
    };

    return (
        <div className="w-full max-w-4xl animate-fade-in space-y-4">
            {articles.map((savedArticle) => (
                <div key={savedArticle.id} className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-grow w-full">
                        {savedArticle.thumbnailUrl && (
                            <img src={savedArticle.thumbnailUrl} alt={getDisplayTitle(savedArticle)} className="w-24 h-24 object-cover rounded-md flex-shrink-0 hidden sm:block" />
                        )}
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-white mb-2">{getDisplayTitle(savedArticle)}</h3>
                            <p className="text-sm text-slate-400 mb-3">
                                {t('saved.keyword.label')} <span className="font-semibold text-indigo-400">{savedArticle.primaryKeyword}</span>
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                                {savedArticle.searchIntent && (
                                    <div className="flex items-center gap-1.5" title={`Search Intent: ${savedArticle.searchIntent}`}>
                                        <IntentIcon intent={savedArticle.searchIntent} />
                                        <span>{savedArticle.searchIntent}</span>
                                    </div>
                                )}
                                {savedArticle.seoAnalysis && (
                                     <div title="Word Count">
                                        <strong>{savedArticle.seoAnalysis.wordCount}</strong> words
                                    </div>
                                )}
                                {savedArticle.generationSettings?.locales && (
                                    <LanguageFlags locales={savedArticle.generationSettings.locales} />
                                )}
                            </div>
                             <p className="text-xs text-slate-500 mt-3">
                                {t('saved.date.label')} {formatDate(savedArticle.savedAt)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto self-end sm:self-center">
                        <button
                            onClick={() => onView(savedArticle)}
                            className="w-1/2 sm:w-auto flex items-center justify-center bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all"
                            aria-label={`View article: ${getDisplayTitle(savedArticle)}`}
                        >
                           <EyeIcon className="h-5 w-5 sm:mr-2" />
                           <span className="hidden sm:inline">{t('saved.view.button')}</span>
                        </button>
                        <button
                            onClick={() => onDelete(savedArticle.id)}
                             className="w-1/2 sm:w-auto flex items-center justify-center bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-all"
                             aria-label={`Delete article: ${getDisplayTitle(savedArticle)}`}
                        >
                            <TrashIcon className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline">{t('saved.delete.button')}</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
