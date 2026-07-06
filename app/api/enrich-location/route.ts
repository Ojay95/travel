import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const fallbackImages = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1472214222555-d40d524a0022?auto=format&fit=crop&w=600&q=80"
];

function getDeterministicMock(query: string) {
  // Generate stable mock values based on the query string hash
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = query.charCodeAt(i) + ((hash << 5) - hash);
  }
  const ratingIndex = Math.abs(hash % 3); // 4.0, 4.5, 5.0
  const ratings = [4.0, 4.5, 5.0];
  const rating = ratings[ratingIndex];

  const reviewsCount = 150 + Math.abs(hash % 1800); // 150 to 1950 reviews
  const imageIndex = Math.abs(hash % fallbackImages.length);
  const photo = fallbackImages[imageIndex];

  const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`;

  return { rating, reviewsCount, url: searchUrl, photo };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Missing query parameter." }, { status: 400 });
    }

    const normalizedQuery = query.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");

    // 1. Check Firestore Cache
    try {
      const cacheRef = doc(db, "tripadvisor_cache", normalizedQuery);
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        console.log(`[TripAdvisor API] Cache HIT for: ${query}`);
        return NextResponse.json(cacheSnap.data());
      }
    } catch (cacheError) {
      console.warn("[TripAdvisor API] Cache read failed, proceeding to API:", cacheError);
    }

    // 2. Fetch TripAdvisor API
    const apiKey = process.env.TRIPADVISOR_API_KEY;
    if (apiKey) {
      try {
        console.log(`[TripAdvisor API] Cache MISS. Querying live API for: ${query}`);
        
        // Search Location ID
        const searchRes = await fetch(
          `https://api.content.tripadvisor.com/api/v1/location/search?key=${apiKey}&searchQuery=${encodeURIComponent(query)}&language=en`,
          { headers: { accept: "application/json" } }
        );
        const searchData = await searchRes.json();
        
        if (searchData.data && searchData.data.length > 0) {
          const locationId = searchData.data[0].location_id;

          // Fetch Location Details
          const detailsRes = await fetch(
            `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?key=${apiKey}&language=en&currency=USD`,
            { headers: { accept: "application/json" } }
          );
          const detailsData = await detailsRes.json();

          // Fetch Location Photos
          let photoUrl = "";
          try {
            const photosRes = await fetch(
              `https://api.content.tripadvisor.com/api/v1/location/${locationId}/photos?key=${apiKey}&language=en`,
              { headers: { accept: "application/json" } }
            );
            const photosData = await photosRes.json();
            if (photosData.data && photosData.data.length > 0) {
              const sizes = photosData.data[0].images;
              photoUrl = sizes.large?.url || sizes.medium?.url || sizes.original?.url || "";
            }
          } catch (photoError) {
            console.warn("[TripAdvisor API] Photo fetch failed:", photoError);
          }

          const result = {
            rating: parseFloat(detailsData.rating) || 4.5,
            reviewsCount: parseInt(detailsData.num_reviews) || 280,
            url: detailsData.web_url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(query)}`,
            photo: photoUrl || getDeterministicMock(query).photo
          };

          // Save to Firestore Cache
          try {
            const cacheRef = doc(db, "tripadvisor_cache", normalizedQuery);
            await setDoc(cacheRef, {
              ...result,
              cachedAt: new Date().toISOString()
            });
            console.log(`[TripAdvisor API] Successfully cached response for: ${query}`);
          } catch (cacheWriteError) {
            console.warn("[TripAdvisor API] Failed to write to cache:", cacheWriteError);
          }

          return NextResponse.json(result);
        }
      } catch (apiError) {
        console.error("[TripAdvisor API] Live API call failed, falling back to deterministic mock:", apiError);
      }
    }

    // 3. Resilient Fallback Mocks
    console.log(`[TripAdvisor API] Using mock fallback for: ${query}`);
    const mockResult = getDeterministicMock(query);
    
    // Attempt caching mock data to avoid repeated failures/computations
    try {
      const cacheRef = doc(db, "tripadvisor_cache", normalizedQuery);
      await setDoc(cacheRef, {
        ...mockResult,
        cachedAt: new Date().toISOString(),
        isMock: true
      });
    } catch (err) {
      // Ignore cache write errors
    }

    return NextResponse.json(mockResult);
  } catch (globalError: any) {
    console.error("[TripAdvisor API] Global enrichment handler failed:", globalError);
    return NextResponse.json({ error: globalError.message || "Enrichment failed." }, { status: 500 });
  }
}
