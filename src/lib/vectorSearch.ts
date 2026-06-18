import fs from 'fs';
import path from 'path';
import { getGeminiClient } from './gemini';

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  tagline: string;
  description: string;
  whyItFits: string;
  bestSeason: string;
  localVibe: string;
  estimatedFlightCost: {
    minPrice: number;
    maxPrice: number;
    advice: string;
  };
  recommendedHotels: {
    name: string;
    tier: 'budget' | 'mid' | 'luxury';
    costPerNight: number;
    description: string;
    highlights: string[];
  }[];
}

interface VectorEntry {
  id: string;
  embedding: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getKeywordScore(query: string, dest: Destination): number {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'is', 'are', 'was', 'were', 'of']);
  const cleanWords = (str: string) => 
    str.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

  const queryWords = new Set(cleanWords(query));
  if (queryWords.size === 0) return 0;

  const textToSearch = [
    dest.name,
    dest.country,
    dest.region,
    dest.tagline,
    dest.description,
    dest.whyItFits,
    dest.localVibe,
    dest.bestSeason
  ].join(' ');

  const targetWords = cleanWords(textToSearch);
  let matchCount = 0;
  for (const word of targetWords) {
    if (queryWords.has(word)) {
      matchCount++;
    }
  }
  return matchCount / queryWords.size;
}

export async function findSimilarDestinations(
  queryText: string,
  limit: number = 3
): Promise<{ destination: Destination; score: number; method: 'vector' | 'keyword' }[]> {
  const catalogPath = path.join(process.cwd(), 'data', 'destination_catalog.json');
  const dbPath = path.join(process.cwd(), 'data', 'vector_database.json');

  // Load catalog
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog file not found at ${catalogPath}`);
  }
  const catalog: Destination[] = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // Attempt vector search
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const hasVectorDb = fs.existsSync(dbPath);

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && hasVectorDb) {
      console.log('[VectorSearch] Performing semantic vector search...');
      const vectorDb: VectorEntry[] = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const client = getGeminiClient();

      const response = await client.models.embedContent({
        model: 'text-embedding-004',
        contents: queryText
      });

      if (response.embeddings?.[0]?.values) {
        const queryVector = response.embeddings[0].values;
        const results = catalog.map(dest => {
          const vectorEntry = vectorDb.find(v => v.id === dest.id);
          const score = vectorEntry ? cosineSimilarity(queryVector, vectorEntry.embedding) : 0;
          return { destination: dest, score, method: 'vector' as const };
        });

        // Sort descending by score
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
      }
    }
  } catch (err) {
    console.warn('[VectorSearch] Vector search failed or skipped, falling back to keyword matching:', err);
  }

  // Fallback to keyword overlap search
  console.log('[VectorSearch] Performing keyword similarity search (fallback)...');
  const results = catalog.map(dest => {
    const score = getKeywordScore(queryText, dest);
    return { destination: dest, score, method: 'keyword' as const };
  });

  // Sort descending by keyword match score
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
