import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// 1. Manually parse .env.local or read from env
function loadApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    return process.env.GEMINI_API_KEY;
  }
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('GEMINI_API_KEY=')) {
          return line.split('=')[1].replace(/['"\r]/g, '').trim();
        }
      }
    }
  } catch (e) {
    console.warn('[EmbeddingsGenerator] Failed to parse .env.local file:', e);
  }
  throw new Error("GEMINI_API_KEY environment variable is not set and was not found in .env.local.");
}

async function main() {
  try {
    console.log('[EmbeddingsGenerator] Initializing...');
    const apiKey = loadApiKey();
    const client = new GoogleGenAI({ apiKey });

    const catalogPath = path.join(process.cwd(), 'data', 'destination_catalog.json');
    if (!fs.existsSync(catalogPath)) {
      throw new Error(`Catalog not found at: ${catalogPath}`);
    }

    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    console.log(`[EmbeddingsGenerator] Loaded ${catalog.length} destinations from catalog.`);

    const vectorDb: { id: string; embedding: number[] }[] = [];

    for (const dest of catalog) {
      console.log(`[EmbeddingsGenerator] Generating embedding for: ${dest.name}, ${dest.country}...`);
      
      // Construct descriptive text string representation of the destination for vector search
      const textToEmbed = [
        dest.name,
        dest.country,
        dest.region,
        dest.tagline,
        dest.description,
        dest.whyItFits,
        dest.localVibe,
        dest.bestSeason
      ].join(' ').toLowerCase();

      // Retrieve embedding from Gemini text-embedding-004
      const response = await client.models.embedContent({
        model: 'text-embedding-004',
        contents: textToEmbed
      });

      if (!response.embeddings?.[0]?.values) {
        throw new Error(`Failed to generate embedding vector for ${dest.name}`);
      }

      vectorDb.push({
        id: dest.id,
        embedding: response.embeddings[0].values
      });
      
      // Throttle calls slightly to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const dbPath = path.join(process.cwd(), 'data', 'vector_database.json');
    fs.writeFileSync(dbPath, JSON.stringify(vectorDb, null, 2));
    console.log(`[EmbeddingsGenerator] Successfully wrote vector database to: ${dbPath}`);
  } catch (err) {
    console.error('[EmbeddingsGenerator] Fatal error generating embeddings:', err);
    process.exit(1);
  }
}

main();
