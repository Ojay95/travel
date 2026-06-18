import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured or is the default placeholder. Please add your Gemini API key in Settings > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

export function parseGeminiError(error: any): string {
  const errorMsg = error?.message || "";
  const errorStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
  const fullContent = `${errorMsg} ${errorStr}`;

  if (fullContent.includes("reported as leaked") || fullContent.includes("leaked")) {
    return "YOUR_API_KEY_LEAKED: The currently configured Gemini API key has been flagged as leaked on a public repository/website and disabled by Google. To fix this, please open 'Settings' (top-right gear icon) -> 'Secrets' panel in your AI Studio workstation, update GEMINI_API_KEY with a fresh, active key from Google AI Studio console, and refresh the app.";
  }
  if (fullContent.includes("API_KEY_INVALID") || fullContent.includes("API key not valid") || fullContent.includes("API key is invalid")) {
    return "INVALID_API_KEY: The configured Gemini API key is invalid or incorrect. Please open 'Settings' (top-right gear icon) -> 'Secrets' panel in AI Studio to verify GEMINI_API_KEY is copied correctly.";
  }
  return error.message || "An unknown concierge travel planning error occurred.";
}

export async function generateContentWithFallback(
  prompt: string, 
  systemInstruction?: string,
  responseSchema?: any
): Promise<string> {
  const client = getGeminiClient();
  
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini] Requesting ${model} (attempt ${attempt}/${maxRetries})...`);
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
          }
        });
        
        if (response.text) {
          console.log(`[Gemini] Request succeeded with model ${model}`);
          return response.text;
        }
        throw new Error("No text response from Gemini model");
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        console.warn(`[Gemini] Failed attempt on model ${model} (attempt ${attempt}/${maxRetries}):`, errStr);
        
        if (errStr.includes("400") && !errStr.includes("503") && !errStr.includes("429")) {
          break;
        }
        if (errStr.includes("404") || errStr.includes("not found")) {
          break;
        }

        if (attempt < maxRetries) {
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content block across standard Gemini model paths");
}
