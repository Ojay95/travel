/**
 * Travelpayouts Affiliate Integration Library
 */

/**
 * Future state: Fetch live pricing from Travelpayouts Data APIs
 * (Aviasales for flights, Hotellook for accommodations).
 */
export async function fetchLivePricing(params: {
  origin?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  travelersCount?: number;
}): Promise<{
  flights: { price: number; provider: string; url: string }[];
  accommodations: { hotelName: string; pricePerNight: number; url: string }[];
}> {
  console.log("[Travelpayouts] fetchLivePricing placeholder called with:", params);
  
  // Future state: Call Travelpayouts APIs here to fetch live pricing.
  // Example: Aviasales API for flights, Hotellook API for hotels.
  return {
    flights: [],
    accommodations: []
  };
}

/**
 * Dynamically generates a trackable Travelpayouts affiliate URL.
 * 
 * @param destinationUrl The base public URL of the recommended hotel or flight.
 * @param subId A dynamic SubID string.
 */
export function generateTravelpayoutsLink(destinationUrl: string, subId: string): string {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || "534729";
  const baseUrl = "https://tp.media/r";
  
  const params = new URLSearchParams({
    marker: marker,
    u: destinationUrl,
    sub_id: subId, // primary Travelpayouts SubID
    subid: subId   // fallback for compatibility
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Formats the SubID based on destination, travel type, and user/session.
 * Format: [destination]_[travel_type]_[user_id_or_session]
 */
export function constructSubId(
  destination: string,
  travelType: string,
  userIdOrSession: string
): string {
  const cleanDestination = destination
    .split(",")[0] // Take first part (e.g. "Tokyo" from "Tokyo, Japan")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, ""); // Strip non-alphanumeric characters
  
  const cleanTravelType = travelType
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
    
  const cleanUserSession = userIdOrSession
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  return `${cleanDestination}_${cleanTravelType}_${cleanUserSession}`;
}
