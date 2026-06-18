import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateContentWithFallback, parseGeminiError } from "@/src/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { destinationName, dayNumber, currentDayData, remixPrompt, userInputs } = await req.json();
    
    if (!destinationName || !dayNumber || !currentDayData || !remixPrompt) {
      return NextResponse.json({ error: "Missing required inputs for tweaking day itinerary." }, { status: 400 });
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

    return NextResponse.json(JSON.parse(dayText.trim()));
  } catch (error: any) {
    console.error("Error in /api/remix-day:", error);
    return NextResponse.json({ error: parseGeminiError(error) }, { status: 500 });
  }
}
