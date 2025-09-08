
export interface FAQ {
  question: string;
  answer: string;
}

export interface Section {
  heading: string;
  content: string;
}

export interface Article {
  title: string;
  metaDescription: string;
  sections: Section[];
  faq: FAQ[];
  lsiKeywords: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  type: 'Related' | 'LSI' | 'Long-tail';
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  relevance: number; // Score from 1-100
}

// --- New Types for Enriched SEO Data ---
export interface GenerationSettings {
  length: 'very short' | 'short' | 'medium' | 'long' | 'very long' | 'epic';
  includeTable: boolean;
  includeInArticleImages: boolean;
  locales: string[];
}

export interface KeywordStat {
  keyword: string;
  frequency: number;
  density: number;
  isPrimary: boolean;
  isUserProvided: boolean;
}

export interface SeoAnalysisData {
  wordCount: number;
  keywordStats: KeywordStat[];
}

// --- Updated SavedArticle Type ---
export interface SavedArticle {
  id: string;
  savedAt: string;
  primaryKeyword: string;
  userLsiKeywords: string[];
  articles: Record<string, Article>;
  markdownContent: string;
  thumbnailUrl?: string;
  // New "Full Power SEO" fields
  generationSettings: GenerationSettings;
  searchIntent: KeywordSuggestion['intent'] | null;
  seoAnalysis: SeoAnalysisData;
  keywordResearchData?: KeywordSuggestion[];
}
