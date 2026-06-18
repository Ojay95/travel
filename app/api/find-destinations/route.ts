import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateContentWithFallback, parseGeminiError } from "@/src/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { origin, duration, companions, interests, budgetCategory, additionalDetails, specificDestination } = await req.json();
    
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

    return NextResponse.json(JSON.parse(destinationsText.trim()));
  } catch (error: any) {
    console.error("Error in /api/find-destinations:", error);
    return NextResponse.json({ error: parseGeminiError(error) }, { status: 500 });
  }
}
