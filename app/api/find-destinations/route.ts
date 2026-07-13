import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateContentWithFallback, parseGeminiError } from "@/src/lib/gemini";
import { findSimilarDestinations } from "@/src/lib/vectorSearch";

export async function POST(req: NextRequest) {
  try {
    const { origin, duration, companions, interests, budgetCategory, additionalDetails, specificDestination } = await req.json();
    
    // 1. Build prompt based on whether they specified a city
    let prompt = '';
    const hasSpecificDest = specificDestination && specificDestination.trim();

    if (hasSpecificDest) {
      prompt = `Analyze the traveler's profile and recommend EXACTLY 1 destination matching this specific city or region: "${specificDestination.trim()}".
      
      Traveler Profile:
      - Departure/Origin Location: ${origin || "Not specified"}
      - Trip Duration (Days): ${duration || 5}
      - Travel Companions: ${companions || "Solo"}
      - Vibe & Interests: ${interests && interests.length > 0 ? interests.join(", ") : "general explore"}
      - Budget Level: ${budgetCategory || "Midrange"}
      - Specific Desires or Description: "${additionalDetails || "No further details"}"
      
      Instructions:
      1. Calculate an integer matchScore (75-100) based on how well it fits.
      2. Write a custom, personalized whyItFits explaining why this destination fits their specific interests, companions, and duration.
      3. For the flight estimates and 3 recommended hotels (budget, mid, and luxury), provide highly realistic, real-world data and pricing based on the current departure location: ${origin || "their location"}.
      4. Ensure the return JSON schema is followed exactly. Return an array containing exactly 1 item.`;
    } else {
      prompt = `Analyze the traveler's profile and recommend EXACTLY 3 diverse, high-quality vacation destinations from around the world that best fit their preferences.
      
      Traveler Profile:
      - Departure/Origin Location: ${origin || "Not specified"}
      - Trip Duration (Days): ${duration || 5}
      - Travel Companions: ${companions || "Solo"}
      - Vibe & Interests: ${interests && interests.length > 0 ? interests.join(", ") : "general explore"}
      - Budget Level: ${budgetCategory || "Midrange"}
      - Specific Desires or Description: "${additionalDetails || "No further details"}"
      
      Instructions:
      1. Recommend exactly 3 different matching destinations from anywhere in the world. Do not repeat recommendations.
      2. For each recommendation, calculate an integer matchScore (75-100) based on how well it fits.
      3. Write a custom, personalized whyItFits explaining why this destination fits their specific interests, companions, and duration.
      4. Provide highly realistic, real-world flight cost estimates and 3 recommended hotels (budget, mid, and luxury) for each destination based on their departure location: ${origin || "their location"}.
      5. Ensure the return JSON schema is followed exactly. Return an array containing exactly 3 items.`;
    }

    const destinationsText = await generateContentWithFallback(
      prompt,
      "You are an elite, globe-trotting personal travel concierge. Provide accurate, inspiring, and realistic travel recommendations with estimated prices in JSON format.",
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

    return NextResponse.json(JSON.parse(destinationsText.trim()));
  } catch (error: any) {
    console.error("Error in /api/find-destinations:", error);
    return NextResponse.json({ error: parseGeminiError(error) }, { status: 500 });
  }
}
