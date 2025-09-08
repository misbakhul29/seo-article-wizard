import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Article, Section, FAQ, KeywordSuggestion } from '../types';
import { useI18n } from '../hooks/useI18n';
import { supportedLocales } from '../i18n/config';


interface ArticleDisplayProps {
  articles: Record<string, Article>;
  primaryKeyword: string;
  userLsiKeywords: string[];
  onSave: () => void;
  isSaved: boolean;
  isSaving: boolean;
  articleImage: string | null;
  isGeneratingImage: boolean;
  onGenerateImage: () => void;
  primaryKeywordIntent: KeywordSuggestion['intent'] | null;
}

const CopyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const ExportIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SaveIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

const SpinnerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const FileTextIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const MarkdownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l-8 8" />
    </svg>
);

const ImageIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

const slugify = (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')       // Replace spaces with -
      .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
      .replace(/\-\-+/g, '-');      // Replace multiple - with single -
};

interface KeywordStats {
    keyword: string;
    frequency: number;
    density: number;
    isPrimary: boolean;
    isUserProvided: boolean;
}

const SearchIntentDisplay: React.FC<{ intent: KeywordSuggestion['intent'] }> = ({ intent }) => {
    const { t } = useI18n();

    const intentDetails = useMemo(() => ({
        Informational: {
            icon: <InfoIcon className="h-8 w-8 text-sky-400" />,
            description: t('article.intent.informational'),
        },
        Commercial: {
            icon: <BuildingStorefrontIcon className="h-8 w-8 text-amber-400" />,
            description: t('article.intent.commercial'),
        },
        Transactional: {
            icon: <ShoppingCartIcon className="h-8 w-8 text-green-400" />,
            description: t('article.intent.transactional'),
        },
        Navigational: {
            icon: <GlobeAltIcon className="h-8 w-8 text-purple-400" />,
            description: t('article.intent.navigational'),
        },
    }), [t]);

    const details = intentDetails[intent];
    if (!details) return null;

    return (
        <div className="bg-slate-700/50 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-lg text-indigo-400 mb-3">
                {t('article.intent.title')}
            </h3>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{details.icon}</div>
                <div>
                    <p className="font-bold text-slate-200 capitalize">{intent}</p>
                    <p className="text-sm text-slate-400">{details.description}</p>
                </div>
            </div>
        </div>
    );
};


const SeoAnalysis: React.FC<{ 
    article: Article; 
    primaryKeyword: string;
    userLsiKeywords: string[];
    isHighlightingEnabled: boolean;
    onHighlightToggle: () => void;
}> = ({ article, primaryKeyword, userLsiKeywords, isHighlightingEnabled, onHighlightToggle }) => {
    const { t } = useI18n();
    const analysis = useMemo(() => {
        const fullText = article.sections.map(s => s.content).join(' ');
        const words = fullText.split(/\s+/).filter(Boolean);
        const wordCount = words.length;

        if (wordCount === 0) return { wordCount: 0, keywordStats: [] };

        const countOccurrences = (text: string, keyword: string): number => {
            const regex = new RegExp(`\\b${keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
            return (text.match(regex) || []).length;
        };
        
        const primaryLower = primaryKeyword.toLowerCase();
        const userLsiLower = userLsiKeywords.map(k => k.toLowerCase());

        const allKeywords = [
            { keyword: primaryKeyword, isPrimary: true, isUserProvided: true }, // Primary is always considered user-provided
            ...article.lsiKeywords
                .filter(lsi => lsi.toLowerCase() !== primaryLower)
                .map(lsi => ({ keyword: lsi, isPrimary: false, isUserProvided: userLsiLower.includes(lsi.toLowerCase()) }))
        ];

        const keywordStats: KeywordStats[] = allKeywords.map(({ keyword, isPrimary, isUserProvided }) => {
            const frequency = countOccurrences(fullText, keyword);
            const density = (frequency / wordCount) * 100;
            return { keyword, frequency, density, isPrimary, isUserProvided };
        });

        return { wordCount, keywordStats };
    }, [article, primaryKeyword, userLsiKeywords]);

    return (
        <details className="bg-slate-700/50 rounded-lg p-4 mb-8 group" open>
            <summary className="font-semibold text-lg text-indigo-400 flex justify-between items-center cursor-pointer list-none">
                {t('article.seo.title')}
                <span className="transform transition-transform duration-300 group-open:rotate-180">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
            </summary>
            <div className="mt-4">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                     <p className="text-slate-300">
                        <span className="font-bold">{t('article.seo.wordcount')}</span> {analysis.wordCount}
                    </p>
                    <label htmlFor="highlight-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id="highlight-toggle" className="sr-only peer" checked={isHighlightingEnabled} onChange={onHighlightToggle} />
                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-300">{t('article.seo.highlight')}</span>
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-600/50 text-xs text-slate-200 uppercase">
                            <tr>
                                <th scope="col" className="px-4 py-3">{t('article.seo.table.keyword')}</th>
                                <th scope="col" className="px-4 py-3 text-center">{t('article.seo.table.frequency')}</th>
                                <th scope="col" className="px-4 py-3 text-right">{t('article.seo.table.density')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.keywordStats.map(({ keyword, frequency, density, isPrimary, isUserProvided }) => (
                                <tr key={keyword} className="border-b border-slate-700 hover:bg-slate-700/30">
                                    <th scope="row" className={`px-4 py-3 font-medium ${isPrimary ? 'text-indigo-400' : 'text-slate-200'}`}>
                                        {keyword} 
                                        {isPrimary && <span className="text-xs text-slate-400 font-normal ml-1">{t('article.seo.keyword.primary')}</span>}
                                        {!isPrimary && isUserProvided && <span className="text-xs text-slate-400 font-normal ml-1">{t('article.seo.keyword.user')}</span>}
                                    </th>
                                    <td className="px-4 py-3 text-center">{frequency}</td>
                                    <td className="px-4 py-3 text-right">{density.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </details>
    );
};

const highlightKeywords = (
    text: string, 
    primaryKeyword: string, 
    lsiKeywords: string[], 
    isEnabled: boolean
): React.ReactNode => {
    if (!isEnabled || !text) {
        return text;
    }

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const primaryLower = primaryKeyword.toLowerCase();
    
    const allKeywords = [
        { keyword: primaryKeyword, type: 'primary' },
        ...lsiKeywords
            .filter(lsi => lsi.toLowerCase() !== primaryLower)
            .map(lsi => ({ keyword: lsi, type: 'lsi' }))
    ].sort((a, b) => b.keyword.length - a.keyword.length); 

    if (allKeywords.length === 0) {
        return text;
    }

    const regex = new RegExp(`\\b(${allKeywords.map(k => escapeRegExp(k.keyword)).join('|')})\\b`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
        if (index % 2 === 1) { 
            const lowerPart = part.toLowerCase();
            const matchedKeyword = allKeywords.find(k => k.keyword.toLowerCase() === lowerPart);
            
            const className = matchedKeyword?.type === 'primary' 
                ? 'bg-indigo-500/30 text-indigo-300 rounded px-1' 
                : 'bg-sky-500/30 text-sky-300 rounded px-1';

            return <mark key={index} className={`font-semibold ${className}`}>{part}</mark>;
        } else {
            return part;
        }
    });
};


export const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ 
    articles, 
    primaryKeyword, 
    userLsiKeywords, 
    onSave, 
    isSaved, 
    isSaving,
    articleImage,
    isGeneratingImage,
    onGenerateImage,
    primaryKeywordIntent
}) => {
    const { t } = useI18n();
    const availableLocales = Object.keys(articles);
    const [activeLocale, setActiveLocale] = useState(availableLocales[0] || '');
    const article = articles[activeLocale];

    const [copied, setCopied] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isHighlightingEnabled, setIsHighlightingEnabled] = useState(true);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        // Reset active locale if articles change
        setActiveLocale(Object.keys(articles)[0] || '');
    }, [articles]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatArticleForText = (articleToFormat: Article): string => {
        let text = `Title: ${articleToFormat.title}\n\n`;
        text += `Meta Description: ${articleToFormat.metaDescription}\n\n`;
        text += "---\n\n";

        articleToFormat.sections.forEach(section => {
            text += `## ${section.heading}\n\n`;
            text += `${section.content}\n\n`;
        });

        if (articleToFormat.faq && articleToFormat.faq.length > 0) {
            text += "---\n\n";
            text += "## Frequently Asked Questions\n\n";
            articleToFormat.faq.forEach(faqItem => {
                text += `### ${faqItem.question}\n\n`;
                text += `${faqItem.answer}\n\n`;
            });
        }
        return text;
    };

    const formatArticleForMarkdown = (articleToFormat: Article): string => {
        let md = `# ${articleToFormat.title}\n\n`;
        md += `> ${articleToFormat.metaDescription}\n\n`;
        md += "---\n\n";

        articleToFormat.sections.forEach(section => {
            md += `## ${section.heading}\n\n`;
            md += `${section.content.replace(/(\r\n|\n|\r)/gm, "\n\n")}\n\n`;
        });

        if (articleToFormat.faq && articleToFormat.faq.length > 0) {
            md += "---\n\n";
            md += "## Frequently Asked Questions\n\n";
            articleToFormat.faq.forEach(faqItem => {
                md += `### ${faqItem.question}\n\n`;
                md += `${faqItem.answer}\n\n`;
            });
        }
        return md;
    };

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleCopy = useCallback(() => {
        if (!article) return;
        const articleText = formatArticleForText(article);
        navigator.clipboard.writeText(articleText).then(() => {
            setCopied(true);
            setIsExportMenuOpen(false);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [article]);

    const handleDownload = (format: 'txt' | 'md') => {
        if (!article) return;
        const fileNameBase = slugify(article.title) || 'untitled-article';
        if (format === 'txt') {
            const content = formatArticleForText(article);
            downloadFile(content, `${fileNameBase}.txt`, 'text/plain;charset=utf-8');
        } else if (format === 'md') {
            const content = formatArticleForMarkdown(article);
            downloadFile(content, `${fileNameBase}.md`, 'text/markdown;charset=utf-8');
        }
        setIsExportMenuOpen(false);
    };
    
    const getSaveButtonContent = () => {
        if (isSaved) {
            return <><CheckIcon className="h-5 w-5 mr-2" /> {t('article.save.button.saved')}</>;
        }
        if (isSaving) {
            return <><SpinnerIcon className="h-5 w-5 mr-2" /> {t('article.save.button.saving')}</>;
        }
        return <><SaveIcon className="h-5 w-5 mr-2" /> {t('article.save.button.main')}</>;
    };

  if (!article) {
    return null;
  }

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-2xl max-w-4xl w-full animate-fade-in relative">
        <div className="absolute top-4 right-4 flex items-center gap-2" ref={exportMenuRef}>
            <button
                onClick={onSave}
                disabled={isSaved || isSaving}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg flex items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-green-600 disabled:text-white disabled:cursor-default"
                aria-label={isSaved ? "Article is saved" : "Save article"}
            >
                {getSaveButtonContent()}
            </button>
            <div className="relative">
                <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
                    aria-label="Export options"
                    aria-haspopup="true"
                    aria-expanded={isExportMenuOpen}
                >
                    <ExportIcon className="h-5 w-5 mr-2" />
                    {t('article.export.button')}
                </button>
                {isExportMenuOpen && (
                     <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="py-1">
                            <button onClick={handleCopy} className="text-slate-200 hover:bg-slate-600 w-full flex items-center px-4 py-2 text-sm text-left">
                                {copied ? <CheckIcon className="h-5 w-5 mr-3 text-green-400" /> : <CopyIcon className="h-5 w-5 mr-3" />}
                                {copied ? t('article.export.copied') : t('article.export.copy')}
                            </button>
                             <button onClick={() => handleDownload('txt')} className="text-slate-200 hover:bg-slate-600 w-full flex items-center px-4 py-2 text-sm text-left">
                                <FileTextIcon className="h-5 w-5 mr-3" />
                                {t('article.export.download.txt')}
                            </button>
                            <button onClick={() => handleDownload('md')} className="text-slate-200 hover:bg-slate-600 w-full flex items-center px-4 py-2 text-sm text-left">
                                <MarkdownIcon className="h-5 w-5 mr-3" />
                                {t('article.export.download.md')}
                            </button>
                        </div>
                     </div>
                )}
            </div>
        </div>

      {availableLocales.length > 1 && (
        <div className="border-b border-slate-700 mb-6">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {availableLocales.map(locale => (
                    <button
                        key={locale}
                        onClick={() => setActiveLocale(locale)}
                        className={`${
                            activeLocale === locale
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        {supportedLocales[locale] || locale}
                    </button>
                ))}
            </nav>
        </div>
      )}
      
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 pr-48">{article.title}</h1>
      
      <div className="mb-8">
            {articleImage ? (
                <img src={articleImage} alt={article.title} className="w-full h-auto rounded-lg shadow-lg object-cover" />
            ) : (
                <div className="w-full aspect-video bg-slate-700/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-600 p-4 text-center">
                    {isGeneratingImage ? (
                        <div>
                            <SpinnerIcon className="h-10 w-10 text-indigo-400 mx-auto" />
                            <p className="mt-2 text-slate-400">{t('article.image.generating')}</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-400 mb-4">{t('article.image.prompt')}</p>
                            <button
                                onClick={onGenerateImage}
                                className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700/50 focus:ring-indigo-500 transition-all duration-300 flex items-center"
                            >
                                <ImageIcon className="h-5 w-5 mr-2" />
                                {t('article.image.button')}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>

      <div className="mb-8">
          <h2 className="text-lg font-semibold text-indigo-400 mb-2">{t('article.meta.title')}</h2>
          <p className="text-slate-300 italic bg-slate-700 p-3 rounded-md">{article.metaDescription}</p>
      </div>
      
      <SeoAnalysis 
        article={article} 
        primaryKeyword={primaryKeyword}
        userLsiKeywords={userLsiKeywords} 
        isHighlightingEnabled={isHighlightingEnabled} 
        onHighlightToggle={() => setIsHighlightingEnabled(prev => !prev)} 
      />
      
      {primaryKeywordIntent && <SearchIntentDisplay intent={primaryKeywordIntent} />}

      <div className="space-y-8">
        {article.sections.map((section: Section, index: number) => (
          <section key={index}>
            <h2 className="text-2xl font-semibold text-white border-l-4 border-indigo-500 pl-4 mb-4">{section.heading}</h2>
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                {highlightKeywords(section.content, primaryKeyword, article.lsiKeywords, isHighlightingEnabled)}
            </div>
          </section>
        ))}
      </div>

      {article.faq && article.faq.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-700">
              <h2 className="text-3xl font-bold text-center mb-8 text-white">{t('article.faq.title')}</h2>
              <div className="space-y-6">
                  {article.faq.map((item: FAQ, index: number) => (
                      <details key={index} className="bg-slate-700 rounded-lg p-4 cursor-pointer group">
                          <summary className="font-semibold text-indigo-400 flex justify-between items-center list-none">
                              {item.question}
                              <span className="transform transition-transform duration-300 group-open:rotate-180">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </span>
                          </summary>
                          <p className="text-slate-300 mt-3 leading-relaxed">
                              {highlightKeywords(item.answer, primaryKeyword, article.lsiKeywords, isHighlightingEnabled)}
                          </p>
                      </details>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};