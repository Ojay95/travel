import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateContentWithFallback, parseGeminiError } from "@/src/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { destination, userInputs, selectedHotel } = await req.json();
    
    if (!destination || !userInputs) {
      return NextResponse.json({ error: "Missing destination or traveler inputs to generate itinerary." }, { status: 400 });
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

    return NextResponse.json(JSON.parse(itineraryText.trim()));
  } catch (error: any) {
    console.error("Error in /api/generate-itinerary:", error);
    return NextResponse.json({ error: parseGeminiError(error) }, { status: 500 });
  }
}
