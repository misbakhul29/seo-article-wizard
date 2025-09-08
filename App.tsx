
import React, { useState, useCallback, useEffect } from 'react';
import { generateSeoArticle, generateArticleImage } from './services/geminiService';
import * as apiService from './services/apiService';
import * as storageService from './services/storageService';
import { Article, SavedArticle, KeywordSuggestion, SeoAnalysisData, KeywordStat } from './types';
import { ArticleDisplay } from './components/ArticleDisplay';
import { Loader } from './components/Loader';
import { KeywordResearch } from './components/KeywordResearch';
import { SavedArticles } from './components/SavedArticles';
import { Settings } from './components/Settings';
import { useI18n } from './hooks/useI18n';

type View = 'generator' | 'research' | 'saved' | 'settings';

const MagicWandIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-3-3m0 0l-3-3m3 3h12M5 5l3 3m0 0l3 3m-3-3H2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19l3-3" />
    </svg>
);

const formatArticleForMarkdown = (article: Article): string => {
    let md = `# ${article.title}\n\n`;
    md += `> ${article.metaDescription}\n\n`;
    md += "---\n\n";

    article.sections.forEach(section => {
        md += `## ${section.heading}\n\n`;
        md += `${section.content.replace(/(\r\n|\n|\r)/gm, "\n\n")}\n\n`;
    });

    if (article.faq && article.faq.length > 0) {
        md += "---\n\n";
        md += "## Frequently Asked Questions\n\n";
        article.faq.forEach(faqItem => {
            md += `### ${faqItem.question}\n\n`;
            md += `${faqItem.answer}\n\n`;
        });
    }
    return md;
};

const calculateSeoAnalysis = (article: Article, primaryKeyword: string, userLsiKeywords: string[]): SeoAnalysisData => {
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
        { keyword: primaryKeyword, isPrimary: true, isUserProvided: true },
        ...article.lsiKeywords
            .filter(lsi => lsi.toLowerCase() !== primaryLower)
            .map(lsi => ({ keyword: lsi, isPrimary: false, isUserProvided: userLsiLower.includes(lsi.toLowerCase()) }))
    ];

    const keywordStats: KeywordStat[] = allKeywords.map(({ keyword, isPrimary, isUserProvided }) => {
        const frequency = countOccurrences(fullText, keyword);
        const density = (frequency / wordCount) * 100;
        return { keyword, frequency, density, isPrimary, isUserProvided };
    });

    return { wordCount, keywordStats };
};


const App: React.FC = () => {
  const { t } = useI18n();
  const [view, setView] = useState<View>('generator');
  const [topic, setTopic] = useState<string>('');
  const [primaryKeywordIntent, setPrimaryKeywordIntent] = useState<KeywordSuggestion['intent'] | null>(null);
  const [keywordResearchData, setKeywordResearchData] = useState<KeywordSuggestion[]>([]);
  const [userLsiKeywords, setUserLsiKeywords] = useState<string>('');
  const [length, setLength] = useState<'very short' | 'short' | 'medium' | 'long' | 'very long' | 'epic'>('medium');
  const [includeTable, setIncludeTable] = useState<boolean>(false);
  const [includeInArticleImages, setIncludeInArticleImages] = useState<boolean>(false);
  
  const [articles, setArticles] = useState<Record<string, Article> | null>(null);
  const [articleImage, setArticleImage] = useState<string | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedArticles = useCallback(async () => {
    try {
        const fetchedArticles = await apiService.getSavedArticles();
        setSavedArticles(fetchedArticles);
    } catch (err) {
        setError(t('error.fetch.saved'));
        console.error(err);
    }
  }, [t]);

  useEffect(() => {
    if (view === 'saved') {
        fetchSavedArticles();
    }
  }, [view, fetchSavedArticles]);
  
  useEffect(() => {
    fetchSavedArticles();
  }, [fetchSavedArticles]);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setArticles(null);
    setArticleImage(null);
    setCurrentArticleId(null);

    try {
      const lsiKeywordsArray = userLsiKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const articleLocales = storageService.getArticleLocales();
      const result = await generateSeoArticle(topic, length, lsiKeywordsArray, articleLocales, includeTable, includeInArticleImages);
      setArticles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, isLoading, length, userLsiKeywords, includeTable, includeInArticleImages]);

  const handleKeywordsSelected = (primary: KeywordSuggestion, lsi: string[], allResearch: KeywordSuggestion[]) => {
    setTopic(primary.keyword);
    setPrimaryKeywordIntent(primary.intent);
    setUserLsiKeywords(lsi.join(', '));
    setKeywordResearchData(allResearch); // Save all research data
    setView('generator');
  };

  const handleSaveArticle = async () => {
    if (!articles || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
        const lsiKeywordsArray = userLsiKeywords.split(',').map(k => k.trim()).filter(Boolean);
        const articleLocales = storageService.getArticleLocales();
        
        const firstLocale = Object.keys(articles)[0];
        if (!firstLocale) throw new Error("No article content available to save.");

        const markdownContent = formatArticleForMarkdown(articles[firstLocale]);
        const seoAnalysis = calculateSeoAnalysis(articles[firstLocale], topic, lsiKeywordsArray);

        const generationSettings = {
            length,
            includeTable,
            includeInArticleImages,
            locales: articleLocales,
        };
        
        const saved = await apiService.saveArticle(
            topic, 
            lsiKeywordsArray, 
            articles, 
            markdownContent, 
            articleImage,
            generationSettings,
            primaryKeywordIntent,
            seoAnalysis,
            keywordResearchData
        );

        setCurrentArticleId(saved.id);
        await fetchSavedArticles();
    } catch (err) {
        setError(t('error.save'));
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    setError(null);
    try {
        await apiService.deleteArticle(id);
        setSavedArticles(prev => prev.filter(a => a.id !== id));
        if (currentArticleId === id) {
            setArticles(null);
            setCurrentArticleId(null);
            setArticleImage(null);
            setPrimaryKeywordIntent(null);
            setKeywordResearchData([]);
        }
    } catch (err) {
        setError(t('error.delete'));
    }
  };

  const handleViewSavedArticle = (savedArticle: SavedArticle) => {
    setTopic(savedArticle.primaryKeyword);
    setUserLsiKeywords(savedArticle.userLsiKeywords.join(', '));
    setArticles(savedArticle.articles);
    setCurrentArticleId(savedArticle.id);
    setArticleImage(savedArticle.thumbnailUrl || null);
    setPrimaryKeywordIntent(savedArticle.searchIntent || null); // Restore search intent
    setKeywordResearchData(savedArticle.keywordResearchData || []); // Restore research data
    
    // Restore generation settings
    const settings = savedArticle.generationSettings;
    if (settings) {
        setLength(settings.length);
        setIncludeTable(settings.includeTable);
        setIncludeInArticleImages(settings.includeInArticleImages);
    }

    setView('generator');
  };

  const handleGenerateImage = async () => {
    if (!articles || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setError(null);
    try {
        const firstLocale = Object.keys(articles)[0];
        const article = firstLocale ? articles[firstLocale] : null;

        if (!article) {
            throw new Error("Article data is not available to generate an image.");
        }
        
        const titleForPrompt = article.title;
        const primaryKeyword = topic;
        const themes = [primaryKeyword, ...article.lsiKeywords].slice(0, 5).join(', ');
        
        const imagePrompt = `Create a visually stunning and professional blog header image for an article titled "${titleForPrompt}". The central topic is "${primaryKeyword}". The image should be conceptual or abstract, evoking themes like ${themes}. It needs to be high-quality, modern, and suitable for a professional blog. Absolutely no text in the image.`;
        
        const base64ImageData = await generateArticleImage(imagePrompt);
        const { url } = await apiService.uploadImage(base64ImageData);
        setArticleImage(url);

    } catch (err) {
        setError(err instanceof Error ? err.message : t('error.upload.image'));
    } finally {
        setIsGeneratingImage(false);
    }
  };


  const renderGeneratorView = () => (
    <div className="w-full max-w-2xl animate-fade-in">
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mb-8">
            <form onSubmit={handleGenerate} className="space-y-4">
            <div>
                <label htmlFor="topic-input" className="block text-sm font-medium text-slate-300 mb-2">
                {t('generator.form.topic.label')}
                </label>
                <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => {
                        setTopic(e.target.value);
                        setPrimaryKeywordIntent(null);
                        setKeywordResearchData([]);
                    }}
                    placeholder={t('generator.form.topic.placeholder')}
                    className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300"
                    disabled={isLoading}
                />
            </div>
             <div>
                <label htmlFor="lsi-keywords-input" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('generator.form.lsi.label')}
                </label>
                <textarea
                  id="lsi-keywords-input"
                  value={userLsiKeywords}
                  onChange={(e) => setUserLsiKeywords(e.target.value)}
                  placeholder={t('generator.form.lsi.placeholder')}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300"
                  disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="length-select" className="block text-sm font-medium text-slate-300 mb-2">
                {t('generator.form.length.label')}
                </label>
                <select
                id="length-select"
                value={length}
                onChange={(e) => setLength(e.target.value as 'very short' | 'short' | 'medium' | 'long' | 'very long' | 'epic')}
                disabled={isLoading}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300"
                >
                <option value="very short">{t('generator.form.length.veryshort')}</option>
                <option value="short">{t('generator.form.length.short')}</option>
                <option value="medium">{t('generator.form.length.medium')}</option>
                <option value="long">{t('generator.form.length.long')}</option>
                <option value="very long">{t('generator.form.length.verylong')}</option>
                <option value="epic">{t('generator.form.length.epic')}</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('generator.form.options.label')}
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <label htmlFor="include-table-checkbox" className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-700/50 transition-colors flex-1">
                        <input
                            id="include-table-checkbox"
                            type="checkbox"
                            checked={includeTable}
                            onChange={(e) => setIncludeTable(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500 focus:ring-offset-slate-800"
                            disabled={isLoading}
                        />
                        <span className="text-slate-300">{t('generator.form.options.table')}</span>
                    </label>
                    <label htmlFor="include-images-checkbox" className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-700/50 transition-colors flex-1">
                        <input
                            id="include-images-checkbox"
                            type="checkbox"
                            checked={includeInArticleImages}
                            onChange={(e) => setIncludeInArticleImages(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 bg-slate-600 border-slate-500 rounded focus:ring-indigo-500 focus:ring-offset-slate-800"
                            disabled={isLoading}
                        />
                        <span className="text-slate-300">{t('generator.form.options.images')}</span>
                    </label>
                </div>
            </div>
             <button
                    type="submit"
                    disabled={isLoading || !topic.trim()}
                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <MagicWandIcon className="h-5 w-5 mr-2"/>
                    {isLoading ? t('generator.form.button.generating') : t('generator.form.button.generate')}
                </button>
            </form>
        </div>

        <main className="w-full flex flex-col justify-center items-center">
            {isLoading && <Loader />}
            {error && <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg max-w-2xl w-full animate-fade-in"><p className="font-bold">{t('error.title')}</p><p>{error}</p></div>}
            {articles && <ArticleDisplay 
                articles={articles} 
                primaryKeyword={topic} 
                userLsiKeywords={userLsiKeywords.split(',').map(k => k.trim()).filter(Boolean)}
                onSave={handleSaveArticle}
                isSaved={!!savedArticles.find(a => a.id === currentArticleId)}
                isSaving={isSaving}
                articleImage={articleImage}
                isGeneratingImage={isGeneratingImage}
                onGenerateImage={handleGenerateImage}
                primaryKeywordIntent={primaryKeywordIntent}
             />}
            {!isLoading && !error && !articles && (
                <div className="text-center text-slate-500 max-w-md animate-fade-in">
                    <p>{t('generator.initial.message')}</p>
                </div>
            )}
      </main>
    </div>
  );

  const renderContent = () => {
    switch (view) {
        case 'generator':
            return renderGeneratorView();
        case 'research':
            return <KeywordResearch onKeywordsSelected={handleKeywordsSelected} />;
        case 'saved':
            return <SavedArticles articles={savedArticles} onView={handleViewSavedArticle} onDelete={handleDeleteArticle} />;
        case 'settings':
            return <Settings />;
        default:
            return renderGeneratorView();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
      
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
          {t('app.title.main')} <span className="text-indigo-400">{t('app.title.span')}</span>
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          {t('app.subtitle')}
        </p>
      </header>
      
      <div className="w-full max-w-4xl mb-8 flex justify-center border-b border-slate-700">
          <button 
            onClick={() => setView('generator')}
            className={`px-6 py-3 text-lg font-medium transition-colors duration-300 ${view === 'generator' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t('nav.generator')}
          </button>
          <button 
            onClick={() => setView('research')}
            className={`px-6 py-3 text-lg font-medium transition-colors duration-300 ${view === 'research' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t('nav.research')}
          </button>
           <button 
            onClick={() => setView('saved')}
            className={`px-6 py-3 text-lg font-medium transition-colors duration-300 ${view === 'saved' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t('nav.savedArticles')}
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`px-6 py-3 text-lg font-medium transition-colors duration-300 ${view === 'settings' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t('nav.settings')}
          </button>
      </div>

      {renderContent()}

    </div>
  );
};

export default App;
