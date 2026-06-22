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
  
  // Travelpayouts tracks SubID by appending it to the partner ID (marker) with a dot
  const shmarker = subId ? `${marker}.${subId}` : marker;
  
  // To prevent 404s and parameter errors in the sandbox demo environment where the
  // Travelpayouts marker might not be active/joined to the programs (especially Skyscanner
  // which is not hosted on Travelpayouts), we route the redirects through our local tracked
  // redirect endpoint, which logs the click and safely opens the travel provider page.
  const params = new URLSearchParams({
    dest: destinationUrl,
    subId: shmarker
  });
  
  return `/api/redirect?${params.toString()}`;
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
