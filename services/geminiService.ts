import { GoogleGenAI, Type } from "@google/genai";
import { Article, KeywordSuggestion } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const articleSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "An engaging, SEO-friendly title for the article. It must contain the primary keyword.",
        },
        metaDescription: {
            type: Type.STRING,
            description: "A concise summary for search engine results pages (SERPs), between 150-160 characters. It must include the primary keyword.",
        },
        sections: {
            type: Type.ARRAY,
            description: "The main content of the article, divided into logical sections.",
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: {
                        type: Type.STRING,
                        description: "A descriptive heading (H2 or H3) for the section. It should be keyword-rich where natural.",
                    },
                    content: {
                        type: Type.STRING,
                        description: "The paragraph(s) for this section. The content should be informative, easy to read, and naturally incorporate the primary keyword and related LSI keywords. Write at least 2-3 paragraphs per section.",
                    },
                },
                 required: ["heading", "content"],
            },
        },
        faq: {
            type: Type.ARRAY,
            description: "A list of 3-5 frequently asked questions related to the topic, formatted for a 'People Also Ask' section.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: {
                        type: Type.STRING,
                        description: "A relevant question about the topic.",
                    },
                    answer: {
                        type: Type.STRING,
                        description: "A clear and concise answer to the question.",
                    },
                },
                 required: ["question", "answer"],
            },
        },
        lsiKeywords: {
            type: Type.ARRAY,
            description: "A list of the top 5-7 most relevant LSI (Latent Semantic Indexing) keywords that were naturally used throughout the article. This can include user-provided keywords.",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ["title", "metaDescription", "sections", "faq", "lsiKeywords"],
};


export const generateSeoArticle = async (
    topic: string, 
    length: 'very short' | 'short' | 'medium' | 'long' | 'very long' | 'epic',
    userLsiKeywords: string[],
    locales: string[],
    includeTable: boolean,
    includeInArticleImages: boolean
): Promise<Record<string, Article>> => {
    try {
        const lengthInstructions = {
            'very short': "The article should be a brief summary, around 250 words, with 1-2 main sections.",
            short: "The article should be concise, around 500 words, with 2-3 main sections.",
            medium: "The article should be detailed, around 1000 words, with 4-5 main sections.",
            long: "The article should be comprehensive and in-depth, around 1500 words, with 6-8 main sections.",
            'very long': "The article should be extremely comprehensive and exhaustive, over 2000 words, with 8-10 main sections.",
            'epic': "The article must be an ultimate guide, extremely comprehensive and exhaustive, over 3000 words, with at least 10-12 detailed sections."
        };

        const lengthPrompt = lengthInstructions[length];

        const userKeywordsPrompt = userLsiKeywords.length > 0
            ? `In addition to the keywords you identify, you MUST naturally incorporate the following user-provided keywords into the article: ${userLsiKeywords.join(', ')}.`
            : '';

        const tablePrompt = includeTable 
            ? "If the topic is suitable (e.g., for comparisons, data, specifications), include one relevant, well-structured markdown table within the article content."
            : "";

        const inArticleImagePrompt = includeInArticleImages
            ? "Strategically place 2-3 image placeholders throughout the article where visuals would be most impactful. Use the exact format `[IMAGE: A descriptive prompt for a relevant image]`. Example: `[IMAGE: A diagram showing the process of photosynthesis]`."
            : "";

        const generationPromises = locales.map(async (locale) => {
            const prompt = `Generate a comprehensive, high-quality, and SEO-optimized article about "${topic}". The article MUST be written in the language with locale code: "${locale}". ${lengthPrompt} The article must be unique, engaging, and provide genuine value to the reader. Ensure the primary keyword "${topic}" is used appropriately in the title, meta description, headings, and throughout the content. Also include semantically related keywords (LSI keywords) to enhance context and relevance. ${userKeywordsPrompt} ${tablePrompt} ${inArticleImagePrompt} Identify and list the top 5-7 LSI keywords you used (this list can include some of the user-provided ones if you used them). The tone should be authoritative yet accessible. Structure the output as a JSON object that strictly follows the provided schema.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: articleSchema,
                },
            });
            
            const jsonText = response.text.trim();
            const articleData: Article = JSON.parse(jsonText);
            return { locale, articleData };
        });

        const results = await Promise.all(generationPromises);
        const articlesByLocale: Record<string, Article> = {};
        results.forEach(({ locale, articleData }) => {
            articlesByLocale[locale] = articleData;
        });
        
        return articlesByLocale;

    } catch (error) {
        console.error("Error generating article:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate article: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the article.");
    }
};

export const researchKeywords = async (topic: string): Promise<KeywordSuggestion[]> => {
    try {
        const keywordSchema = {
            type: Type.OBJECT,
            properties: {
                keyword: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Related', 'LSI', 'Long-tail'] },
                intent: { type: Type.STRING, enum: ['Informational', 'Commercial', 'Transactional', 'Navigational'] },
                relevance: { type: Type.INTEGER, description: 'A score from 1 to 100 for relevance.' }
            },
            required: ["keyword", "type", "intent", "relevance"]
        };

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                keywords: {
                    type: Type.ARRAY,
                    description: "A comprehensive list of 20-30 keyword suggestions.",
                    items: keywordSchema
                }
            },
            required: ["keywords"]
        };

        const prompt = `Act as a senior SEO strategist. For the primary topic "${topic}", generate a comprehensive list of 20-30 related keywords, LSI keywords, and long-tail variations. For each keyword, determine the likely user search intent (Informational, Commercial, Transactional, or Navigational) and a relevance score from 1-100 indicating how closely it relates to the primary topic. Provide the output as a JSON object that strictly adheres to the provided schema.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText) as { keywords: KeywordSuggestion[] };
        return data.keywords;

    } catch (error) {
        console.error("Error researching keywords:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to research keywords: ${error.message}`);
        }
        throw new Error("An unknown error occurred while researching keywords.");
    }
};

export const generateArticleImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};