
import React, { useState, useMemo } from 'react';
import { researchKeywords } from '../services/geminiService';
import { KeywordSuggestion } from '../types';
import { Loader } from './Loader';
import { useI18n } from '../hooks/useI18n';

const SearchIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

type SortKey = keyof KeywordSuggestion | null;
type SortDirection = 'asc' | 'desc';

interface KeywordResearchProps {
  onKeywordsSelected: (primary: KeywordSuggestion, lsi: string[], allResearch: KeywordSuggestion[]) => void;
}

export const KeywordResearch: React.FC<KeywordResearchProps> = ({ onKeywordsSelected }) => {
    const { t } = useI18n();
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('relevance');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleResearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setKeywords([]);
        setSelectedKeywords(new Set());

        try {
            const results = await researchKeywords(topic);
            setKeywords(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectKeyword = (keyword: string) => {
        setSelectedKeywords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(keyword)) {
                newSet.delete(keyword);
            } else {
                newSet.add(keyword);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedKeywords(new Set(filteredAndSortedKeywords.map(k => k.keyword)));
        } else {
            setSelectedKeywords(new Set());
        }
    };
    
    const handleUseKeywords = () => {
        if (selectedKeywords.size === 0) return;
        
        const selectedArray = Array.from(selectedKeywords);
        
        // Find the full object for the primary keyword (first selected one)
        const primaryKeywordString = selectedArray[0];
        const primaryKeywordObject = keywords.find(k => k.keyword === primaryKeywordString);

        if (!primaryKeywordObject) {
            console.error("Could not find the primary keyword object. This should not happen.");
            return;
        }

        const lsi = selectedArray.slice(1);
        onKeywordsSelected(primaryKeywordObject, lsi, keywords);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedKeywords = useMemo(() => {
        let result = keywords.filter(k => k.keyword.toLowerCase().includes(filter.toLowerCase()));

        if (sortKey) {
            result.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [keywords, filter, sortKey, sortDirection]);

    const SortIndicator: React.FC<{ for: SortKey }> = ({ for: key }) => {
        if (sortKey !== key) return null;
        return <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>;
    };
    
    const allSelected = selectedKeywords.size > 0 && selectedKeywords.size === filteredAndSortedKeywords.length;

    return (
        <div className="w-full max-w-4xl animate-fade-in">
            <div className="w-full bg-slate-800 p-6 rounded-xl shadow-2xl mb-8">
                <form onSubmit={handleResearch} className="space-y-4">
                    <div>
                        <label htmlFor="research-topic-input" className="block text-sm font-medium text-slate-300 mb-2">
                            {t('research.form.topic.label')}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                id="research-topic-input"
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={t('research.form.topic.placeholder')}
                                className="flex-grow bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !topic.trim()}
                                className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                <SearchIcon className="h-5 w-5 mr-2" />
                                {isLoading ? t('research.form.button.researching') : t('research.form.button.research')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            
            {isLoading && <Loader />}
            {error && <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg animate-fade-in"><p className="font-bold">{t('error.title')}</p><p>{error}</p></div>}
            
            {keywords.length > 0 && !isLoading && (
                <div className="bg-slate-800 p-6 rounded-lg shadow-2xl w-full animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <input
                            type="text"
                            placeholder={t('research.filter.placeholder')}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full sm:w-64 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                         <button
                            onClick={handleUseKeywords}
                            disabled={selectedKeywords.size === 0}
                            className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {t('research.use.button', { count: selectedKeywords.size })}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-700 text-xs text-slate-200 uppercase">
                                <tr>
                                    <th scope="col" className="p-4">
                                        <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="w-4 h-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500" />
                                    </th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => handleSort('keyword')}>{t('research.table.keyword')} <SortIndicator for="keyword" /></th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => handleSort('type')}>{t('research.table.type')} <SortIndicator for="type" /></th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => handleSort('intent')}>{t('research.table.intent')} <SortIndicator for="intent" /></th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer text-right" onClick={() => handleSort('relevance')}>{t('research.table.relevance')} <SortIndicator for="relevance" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedKeywords.map((kw) => (
                                    <tr key={kw.keyword} className="border-b border-slate-700 hover:bg-slate-700/50">
                                        <td className="p-4">
                                            <input type="checkbox" checked={selectedKeywords.has(kw.keyword)} onChange={() => handleSelectKeyword(kw.keyword)} className="w-4 h-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500"/>
                                        </td>
                                        <th scope="row" className="px-4 py-3 font-medium text-white">{kw.keyword}</th>
                                        <td className="px-4 py-3">{kw.type}</td>
                                        <td className="px-4 py-3">{kw.intent}</td>
                                        <td className="px-4 py-3 text-right font-mono">{kw.relevance}/100</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && !error && keywords.length === 0 && (
                <div className="text-center text-slate-500 max-w-md mx-auto animate-fade-in">
                    <p>{t('research.initial.message')}</p>
                </div>
            )}
        </div>
    );
};
