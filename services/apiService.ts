
import { SavedArticle, Article, GenerationSettings, SeoAnalysisData, KeywordSuggestion } from '../types';
import { getApiUrl } from './storageService';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    // Handle 204 No Content response
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const getSavedArticles = async (): Promise<SavedArticle[]> => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/articles`, {
        method: 'GET'
    });
    return handleResponse(response);
};

export const saveArticle = async (
    primaryKeyword: string, 
    userLsiKeywords: string[], 
    articles: Record<string, Article>, 
    markdownContent: string, 
    thumbnailUrl: string | null,
    generationSettings: GenerationSettings,
    searchIntent: KeywordSuggestion['intent'] | null,
    seoAnalysis: SeoAnalysisData,
    keywordResearchData: KeywordSuggestion[]
): Promise<SavedArticle> => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/articles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            primaryKeyword,
            userLsiKeywords,
            articles,
            markdownContent,
            thumbnailUrl,
            generationSettings,
            searchIntent,
            seoAnalysis,
            keywordResearchData
        }),
    });
    return handleResponse(response);
};

export const deleteArticle = async (id: string): Promise<void> => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        method: 'DELETE',
    });
    await handleResponse(response);
};

export const uploadImage = async (imageData: string): Promise<{ url: string }> => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
    });
    return handleResponse(response);
};
