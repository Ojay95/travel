export interface RecommendedHotel {
  name: string;
  tier: 'budget' | 'mid' | 'luxury';
  costPerNight: number;
  description: string;
  highlights: string[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  matchScore: number;
  tagline: string;
  description: string;
  whyItFits: string;
  bestSeason: string;
  localVibe: string;
  estimatedFlightCost: {
    minPrice: number;
    maxPrice: number;
    advice: string;
  };
  recommendedHotels: RecommendedHotel[];
}

export interface Activity {
  time: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  description: string;
  estimatedCost: number;
  locationName: string;
}

export interface RecommendedFood {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  dishName: string;
  specialtyDetails: string;
  avgCost: number;
  venueRecommendation: string;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  activities: Activity[];
  recommendedFood: RecommendedFood[];
  localTip: string;
  notes?: string;
}

export interface UserInputs {
  origin: string;
  duration: number;
  companions: 'Solo' | 'Couple' | 'Family' | 'Friends';
  interests: string[];
  budgetCategory: 'Budget' | 'Midrange' | 'Luxury';
  additionalDetails: string;
  specificDestination?: string;
}

export interface VacationPlan {
  id: string;
  title: string;
  destination: Destination;
  selectedHotel: RecommendedHotel;
  daysCount: number;
  itinerary: ItineraryDay[];
  userInputs: UserInputs;
  createdAt: string;
}
