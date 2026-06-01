import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
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

function parseGeminiError(error: any): string {
  const errorMsg = error?.message || "";
  const errorStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
  const fullContent = `${errorMsg} ${errorStr}`;

  if (fullContent.includes("reported as leaked") || fullContent.includes("leaked")) {
    return "YOUR_API_KEY_LEAKED: The currently configured Gemini API key has been flagged as leaked on a public repository/website and disabled by Google. To fix this, please open'Settings' (top-right gear icon) -> 'Secrets' panel in your AI Studio workstation, update GEMINI_API_KEY with a fresh, active key from Google AI Studio console, and refresh the app.";
  }
  if (fullContent.includes("API_KEY_INVALID") || fullContent.includes("API key not valid") || fullContent.includes("API key is invalid")) {
    return "INVALID_API_KEY: The configured Gemini API key is invalid or incorrect. Please open 'Settings' (top-right gear icon) -> 'Secrets' panel in AI Studio to verify GEMINI_API_KEY is copied correctly.";
  }
  return error.message || "An unknown concierge travel planning error occurred.";
}

// Resilient helper to handle temporary Gemini spikes, high load, or 503 UNAVAILABLE errors
async function generateContentWithFallback(
  prompt: string, 
  systemInstruction?: string,
  responseSchema?: any
): Promise<string> {
  const client = getGeminiClient();
  
  // Try newer gemini-3.5-flash first, and fall back to gemini-3.1-flash-lite under congestion
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
        
        // Stop retrying this model if 400 Bad Request
        if (errStr.includes("400") && !errStr.includes("503") && !errStr.includes("429")) {
          break;
        }
        // Proceed to next model immediately on 404/not found errors
        if (errStr.includes("404") || errStr.includes("not found")) {
          break;
        }

        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content block across standard Gemini model paths");
}

// API endpoint to search destinations based on user's desired experience
app.post("/api/find-destinations", async (req, res) => {
  try {
    const { origin, duration, companions, interests, budgetCategory, additionalDetails, specificDestination } = req.body;
    
    let destPrompt = '';
    if (specificDestination && specificDestination.trim()) {
      destPrompt = `The traveler specifically wants to go to: "${specificDestination}".
      Your absolute top recommendation (the first item in the array) MUST be this exact destination with authentic country, local details, estimated flight costs from ${origin || "their departure location"}, and 3 tailored hotel options (budget, mid, and luxury).
      The other 2 recommendations in the array should be alternative city or region choices that match similar vibes or are excellent nearby alternatives.`;
    } else {
      destPrompt = `Analyze the traveler's profile and recommend exactly 3 highly customized vacation destinations that fit perfectly, drawn from a truly global perspective. 
      You are explicitly instructed to search across all regions of the world, including Asia, Africa, Central & South America, Middle East, Oceania/Pacific Islands, North America, and Europe.`;
    }
    
    const prompt = `Analyze the traveler's profile and suggest exactly 3 vacation destinations:
    
    ${destPrompt}
    
    Traveler Profile:
    - Departure/Origin Location: ${origin || "Not specified"}
    - Trip Duration (Days): ${duration || 5}
    - Travel Companions: ${companions || "Solo"}
    - Vibe & Interests: ${interests && interests.length > 0 ? interests.join(", ") : "general explore"}
    - Budget Level: ${budgetCategory || "Midrange"}
    - Specific Desires or Description: "${additionalDetails || "No further details"}"
    
    Find destinations with a strong focus on matches for these vibes.
    Provide realistic travel flight estimate ranges (from ${origin || "their region"}) and 3 hotel recommendations inside each destination (1 budget, 1 mid-range, 1 luxury) with average costs per night in USD.
    Ensure values are realistic. Match Score must be an integer between 75 and 100 representing how well it aligns with their profile.`;

    const destinationsText = await generateContentWithFallback(
      prompt,
      "You are an elite, globe-trotting personal travel concierge. Seek out and suggest magnificent vacation destinations from any region or continent on Earth (including Asia, Africa, Central & South America, Europe, North America, the Middle East, and Oceania/Pacific Islands). Do NOT bias recommendations towards just Europe or the USA. Provide accurate, inspiring, and realistic travel recommendations with estimated prices in JSON format.",
      {
        type: Type.ARRAY,
        description: "List of 3 recommended destinations.",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Kebab-case short identifier, e.g. 'bali-indonesia'" },
            name: { type: Type.STRING, description: "City or specific region name, e.g. 'Kyoto'" },
            country: { type: Type.STRING, description: "Country name, e.g. 'Japan'" },
            matchScore: { type: Type.INTEGER, description: "Match score out of 100 based on user request." },
            tagline: { type: Type.STRING, description: "A catchy 1-sentence tagline capturing the match reason." },
            description: { type: Type.STRING, description: "General summary of what this destination offers." },
            whyItFits: { type: Type.STRING, description: "Specific justification why this perfectly fits their interests and companion style." },
            bestSeason: { type: Type.STRING, description: "Best time of the year to visit for budget or weather (e.g. October to April)." },
            localVibe: { type: Type.STRING, description: "A descriptive phrase of the atmosphere, e.g. 'Vibrant night markets, spiritual temples, and majestic bamboo forests'." },
            estimatedFlightCost: {
              type: Type.OBJECT,
              properties: {
                minPrice: { type: Type.INTEGER, description: "Minimum typical flight/transit price per person in USD" },
                maxPrice: { type: Type.INTEGER, description: "Maximum typical flight/transit price per person in USD" },
                advice: { type: Type.STRING, description: "Insider tip on finding cheapest flights for this route." }
              },
              required: ["minPrice", "maxPrice", "advice"]
            },
            recommendedHotels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "A realistic or real hotel name matching the vibe" },
                  tier: { type: Type.STRING, description: "Must be 'budget', 'mid', or 'luxury'" },
                  costPerNight: { type: Type.INTEGER, description: "Average USD price per night" },
                  description: { type: Type.STRING, description: "Short description highlighting why this is perfect" },
                  highlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of 2-3 key attributes, e.g. ['Rooftop pool', 'Free traditional breakfast']"
                  }
                },
                required: ["name", "tier", "costPerNight", "description", "highlights"]
              }
            }
          },
          required: [
            "id", "name", "country", "matchScore", "tagline", "description", 
            "whyItFits", "bestSeason", "localVibe", "estimatedFlightCost", "recommendedHotels"
          ]
        }
      }
    );

    res.json(JSON.parse(destinationsText.trim()));
  } catch (error: any) {
    console.error("Error in /api/find-destinations:", error);
    res.status(500).json({ error: parseGeminiError(error) });
  }
});

// API endpoint to generate high-quality day-by-day itineraries
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, userInputs, selectedHotel } = req.body;
    
    if (!destination || !userInputs) {
      return res.status(404).json({ error: "Missing destination or traveler inputs to generate itinerary." });
    }

    const duration = userInputs.duration || 5;

    const prompt = `Generate a comprehensive, engaging, and flawless ${duration}-day itinerary for a trip to ${destination.name}, ${destination.country}.
    Travel Details:
    - Companions: ${userInputs.companions}
    - Budget Level: ${userInputs.budgetCategory} (Staying at hotel: ${selectedHotel?.name || "Standard Hotel"} costing $${selectedHotel?.costPerNight || 120}/night)
    - Key Interests: ${(userInputs.interests || []).join(", ") || "Exploring everything"}
    - Specific vibe: "${userInputs.additionalDetails || "Excited to travel!"}"

    Structure an incredible, time-optimized schedule of exactly ${duration} days.
    For EACH day:
    - Provide a specific unique theme (e.g. 'A Walk Through Ancient Shrines', 'Tropical Coastal Adventure').
    - List 3 well-paced chronological activities (Morning, Afternoon, Evening) with descriptions, realistic estimated consumer cost in USD (0-100+ depending on budget), and specific place/landmark names. Make sure pacing is natural (don't overcommit).
    - Provide 3-4 local food recommendations (Breakfast, Lunch, Dinner, Snack) with name of dish, avg cost, venue tip, and what makes it special/local.
    - Provide a useful, hyper-local "concierge tip" for that specific day's activities.`;

    const itineraryText = await generateContentWithFallback(
      prompt,
      "You are a top-tier luxury travel advisor. Build realistic, curated daily itineraries with exact times and costs in USD formatted in JSON.",
      {
        type: Type.ARRAY,
        description: `Array of daily itineraries, length ${duration}.`,
        items: {
          type: Type.OBJECT,
          properties: {
            dayNumber: { type: Type.INTEGER },
            theme: { type: Type.STRING, description: "A poetic or active theme for the day." },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "Must be 'Morning', 'Afternoon', or 'Evening'" },
                  title: { type: Type.STRING, description: "Name of the landmark or activity, e.g. 'Gion District Walking Tour'" },
                  description: { type: Type.STRING, description: "Immersive description of what they will see, do, or experience." },
                  estimatedCost: { type: Type.INTEGER, description: "Cost range average per person in USD (0 for free activities)" },
                  locationName: { type: Type.STRING, description: "Specific neighborhood or address descriptor" }
                },
                required: ["time", "title", "description", "estimatedCost", "locationName"]
              }
            },
            recommendedFood: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mealType: { type: Type.STRING, description: "Must be 'Breakfast', 'Lunch', 'Dinner', or 'Snack'" },
                  dishName: { type: Type.STRING, description: "Local specialty dish name, e.g. 'Tonkotsu Ramen'" },
                  specialtyDetails: { type: Type.STRING, description: "A mouth-watering translation or description of ingredients/vibe." },
                  avgCost: { type: Type.INTEGER, description: "Typical cost in USD" },
                  venueRecommendation: { type: Type.STRING, description: "Recommended neighborhood spot or eatery style" }
                },
                required: ["mealType", "dishName", "specialtyDetails", "avgCost", "venueRecommendation"]
              }
            },
            localTip: { type: Type.STRING, description: "Pro-tip about transportation, best photo angles, avoiding queues, or scams for this day." }
          },
          required: ["dayNumber", "theme", "activities", "recommendedFood", "localTip"]
        }
      }
    );

    res.json(JSON.parse(itineraryText.trim()));
  } catch (error: any) {
    console.error("Error in /api/generate-itinerary:", error);
    res.status(500).json({ error: parseGeminiError(error) });
  }
});

// API endpoint to remix/modify a single day's plan based on custom user instruction
app.post("/api/remix-day", async (req, res) => {
  try {
    const { destinationName, dayNumber, currentDayData, remixPrompt, userInputs } = req.body;
    
    if (!destinationName || !dayNumber || !currentDayData || !remixPrompt) {
      return res.status(400).json({ error: "Missing required inputs for tweaking day itinerary." });
    }

    const prompt = `You are editing Day ${dayNumber} of an itinerary in ${destinationName}.
    The traveler wants to apply this modification: "${remixPrompt}"
    
    Current Day Schedule:
    ${JSON.stringify(currentDayData, null, 2)}
    
    Overall traveler style:
    - Companion: ${userInputs?.companions || "Solo"}
    - Budget category: ${userInputs?.budgetCategory || "Midrange"}

    Generate a completely updated itinerary for only this single Day ${dayNumber}. Keeping the overall JSON schema exact. Keep existing items where logical, or modify/remix them to fulfill the user's custom instruction beautifully.`;

    const dayText = await generateContentWithFallback(
      prompt,
      "You are a flexible, brilliant local travel coordinator. Revise only the single day schema to accommodate custom requests perfectly, returning valid JSON matching the Day schema.",
      {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER },
          theme: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedCost: { type: Type.INTEGER },
                locationName: { type: Type.STRING }
              },
              required: ["time", "title", "description", "estimatedCost", "locationName"]
            }
          },
          recommendedFood: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                mealType: { type: Type.STRING },
                dishName: { type: Type.STRING },
                specialtyDetails: { type: Type.STRING },
                avgCost: { type: Type.INTEGER },
                venueRecommendation: { type: Type.STRING }
              },
              required: ["mealType", "dishName", "specialtyDetails", "avgCost", "venueRecommendation"]
            }
          },
          localTip: { type: Type.STRING }
        },
        required: ["dayNumber", "theme", "activities", "recommendedFood", "localTip"]
      }
    );

    res.json(JSON.parse(dayText.trim()));
  } catch (error: any) {
    console.error("Error in /api/remix-day:", error);
    res.status(500).json({ error: parseGeminiError(error) });
  }
});

// JSON FILE-BASED DATABASE STORAGE UTILITIES FOR MULTI-USER SYNC & PERSISTENT DEPLOYMENTS
const PLANS_FILE = path.join(process.cwd(), "data", "plans_db.json");

function initPlansDb() {
  const dir = path.dirname(PLANS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PLANS_FILE)) {
    fs.writeFileSync(PLANS_FILE, JSON.stringify({ plans: [] }, null, 2));
  }
}

function readPlans(): any[] {
  try {
    initPlansDb();
    if (!fs.existsSync(PLANS_FILE)) return [];
    const data = fs.readFileSync(PLANS_FILE, "utf-8");
    return JSON.parse(data).plans || [];
  } catch (e) {
    console.error("Error reading plans database:", e);
    return [];
  }
}

function writePlans(plans: any[]) {
  try {
    initPlansDb();
    fs.writeFileSync(PLANS_FILE, JSON.stringify({ plans }, null, 2));
  } catch (e) {
    console.error("Error writing plans database:", e);
  }
}

// 1. GET ALL PLANS FOR LOGGED-IN EMAIL (SYNC)
app.get("/api/plans", (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required to load sync logs." });
    }
    const allPlans = readPlans();
    const userPlans = allPlans.filter(p => p.userEmail && p.userEmail.toLowerCase() === String(email).toLowerCase());
    res.json(userPlans);
  } catch (err: any) {
    console.error("Error fetching user plans:", err);
    res.status(500).json({ error: "Internal database read failure." });
  }
});

// 2. GET SINGLE SHARED PLAN BY ID (PUBLIC DIRECT ACCESS)
app.get("/api/plans/:id", (req, res) => {
  try {
    const { id } = req.params;
    const allPlans = readPlans();
    const plan = allPlans.find(p => p.id === id);
    if (!plan) {
      return res.status(404).json({ error: "The requested travel itinerary was not found, or it was deleted by the author." });
    }
    res.json(plan);
  } catch (err: any) {
    console.error("Error reading shared plan:", err);
    res.status(500).json({ error: "Could not query specific plan ID." });
  }
});

// 3. POST SAVE OR UPDATE TRIP PLAN (SECURED BY email)
app.post("/api/plans", (req, res) => {
  try {
    const { plan, userEmail } = req.body;
    if (!plan || !plan.id) {
      return res.status(400).json({ error: "Missing plan payload or ID identifier value." });
    }
    if (!userEmail) {
      return res.status(400).json({ error: "Authorization credentials (email) required to save." });
    }

    const allPlans = readPlans();
    const targetIdx = allPlans.findIndex(p => p.id === plan.id);
    const planToSave = { 
      ...plan, 
      userEmail: userEmail.toLowerCase(),
      updatedAt: new Date().toISOString()
    };

    if (targetIdx > -1) {
      // Security Check: Only the original creator can update
      const existing = allPlans[targetIdx];
      if (existing.userEmail && existing.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden. You are not authorized to revise this shared plan." });
      }
      allPlans[targetIdx] = planToSave;
    } else {
      allPlans.unshift(planToSave);
    }

    writePlans(allPlans);
    res.json({ success: true, plan: planToSave });
  } catch (err: any) {
    console.error("Error saving plan:", err);
    res.status(500).json({ error: "Failed to persist itinerary inside database." });
  }
});

// 4. DELETE TRIP PLAN (SECURED BY email query)
app.delete("/api/plans/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "User creator parameters required to authenticate deletion." });
    }

    const allPlans = readPlans();
    const targetPlan = allPlans.find(p => p.id === id);
    if (!targetPlan) {
      return res.status(404).json({ error: "Itinerary could not be identified." });
    }

    if (targetPlan.userEmail && targetPlan.userEmail.toLowerCase() !== String(email).toLowerCase()) {
      return res.status(403).json({ error: "Forbidden. You do not hold ownership permission over this itinerary." });
    }

    const activeFiltered = allPlans.filter(p => p.id !== id);
    writePlans(activeFiltered);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting plan:", err);
    res.status(500).json({ error: "Failed to delete plan record." });
  }
});

// Vite Middleware & static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
