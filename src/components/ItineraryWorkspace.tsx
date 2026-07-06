"use client";

import React, { useState } from 'react';
import { Destination, ItineraryDay, RecommendedHotel, UserInputs } from '../types';
import { 
  Calendar, Check, Plus, Edit, Trash2, ArrowLeft, Heart, 
  MapPin, Coffee, Utensils, Lightbulb, ClipboardList, 
  Sparkles, DollarSign, Bookmark, Share2, Printer, 
  Compass, RotateCcw, AlertTriangle, X, MessageSquare, Send, ExternalLink, Plane, Hotel,
  FolderUp, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { generateTravelpayoutsLink, constructSubId } from '../lib/travelpayouts';
import TripadvisorEnrichment from './TripadvisorEnrichment';

interface ItineraryWorkspaceProps {
  destination: Destination;
  itinerary: ItineraryDay[];
  userInputs: UserInputs;
  selectedHotel: RecommendedHotel;
  onBack: () => void;
  onSavePlan: (title: string, updatedDays: ItineraryDay[]) => void;
  onRemixDay: (dayNumber: number, prompt: string) => Promise<void>;
  isRemixing: boolean;
  remixError?: string;
  isSharedView?: boolean;
  onClonePlan?: () => void;
  userLoggedIn?: boolean;
  activePlanId?: string | null;
}

function formatCityForSkyscanner(cityStr: string): string {
  if (!cityStr) return "any";
  return cityStr
    .split(',')[0]
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getDynamicGuides(destinationName: string, country: string) {
  const normCountry = country.toLowerCase();
  const normName = destinationName.toLowerCase();

  if (normCountry.includes('japan') || normName.includes('tokyo') || normName.includes('kyoto') || normName.includes('osaka')) {
    return [
      { name: "Hiroto Tanaka", rate: 35, rating: "4.9", reviews: 142, specialty: "Cultural Heritage & Ancient Shrines", languages: ["English", "Japanese"], image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80" },
      { name: "Reika Sato", rate: 30, rating: "4.8", reviews: 98, specialty: "Kyoto Food Tours & Authentic Teahouses", languages: ["English", "Japanese", "Mandarin"], image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" }
    ];
  }
  if (normCountry.includes('italy') || normName.includes('rome') || normName.includes('florence') || normName.includes('venice')) {
    return [
      { name: "Matteo Rossi", rate: 40, rating: "5.0", reviews: 210, specialty: "Colosseum Architecture & Art History", languages: ["English", "Italian"], image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" },
      { name: "Giulia Bianchi", rate: 35, rating: "4.8", reviews: 135, specialty: "Roman Trattorias & Regional Wines", languages: ["English", "Italian", "Spanish"], image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" }
    ];
  }
  if (normCountry.includes('france') || normName.includes('paris') || normName.includes('nice')) {
    return [
      { name: "Amélie Dubois", rate: 45, rating: "4.9", reviews: 178, specialty: "Sartorial Fashion & Hidden Courtyards", languages: ["English", "French"], image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80" },
      { name: "Pierre Martin", rate: 35, rating: "4.7", reviews: 88, specialty: "Montmartre Pastries & Seine River Art", languages: ["English", "French"], image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80" }
    ];
  }
  
  // Africa (Kenya, Egypt, Morocco, South Africa, Tanzania, etc.)
  if (normCountry.includes('kenya') || normCountry.includes('tanzania') || normCountry.includes('nairobi') || normCountry.includes('serengeti') || normCountry.includes('africa')) {
    return [
      { name: "Jomo Ochieng", rate: 32, rating: "4.9", reviews: 154, specialty: "Savannah Safaris & Tribal Wildlife Folklore", languages: ["English", "Swahili"], image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" },
      { name: "Zola Ndlazi", rate: 28, rating: "4.8", reviews: 87, specialty: "Rift Valley Crater Trails & Local Markets", languages: ["English", "Swahili", "French"], image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" }
    ];
  }
  if (normCountry.includes('egypt') || normCountry.includes('cairo') || normCountry.includes('giza') || normCountry.includes('morocco') || normCountry.includes('marrakesh') || normCountry.includes('casablanca')) {
    const isEgypt = normCountry.includes('egypt') || normName.includes('cairo');
    return [
      { 
        name: isEgypt ? "Tarek Mansour" : "Youssef Alaoui", 
        rate: 30, 
        rating: "4.9", 
        reviews: 165, 
        specialty: isEgypt ? "Ancient Pharaoh Heritage & Mosque Architecture" : "Medina Alleys, Riad Secrets & Custom Spices", 
        languages: ["English", "Arabic", "French"], 
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80" 
      },
      { 
        name: isEgypt ? "Nour El-Din" : "Malak Fahmy", 
        rate: 28, 
        rating: "4.8", 
        reviews: 112, 
        specialty: isEgypt ? "Nile Cruise Secrets & Giza Pyramids Escape" : "Berber Foothills Trekking & Souq Bargaining Guide", 
        languages: ["English", "Arabic", "French"], 
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" 
      }
    ];
  }

  // India
  if (normCountry.includes('india') || normName.includes('delhi') || normName.includes('mumbai') || normName.includes('jaipur')) {
    return [
      { name: "Arjun Mehta", rate: 26, rating: "4.9", reviews: 184, specialty: "Spice Bazaar Odysseys & Mughal Architectural Relics", languages: ["English", "Hindi"], image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" },
      { name: "Priya Sharma", rate: 24, rating: "4.8", reviews: 119, specialty: "Local Street Eats & Intricate Temple Sacred Gateways", languages: ["English", "Hindi", "Punjabi"], image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" }
    ];
  }

  // Southeast Asia (Thailand, Vietnam, Indonesia/Bali, Singapore)
  if (normCountry.includes('thailand') || normCountry.includes('bangkok') || normCountry.includes('vietnam') || normCountry.includes('indonesia') || normCountry.includes('bali') || normCountry.includes('phuket')) {
    const isBali = normCountry.includes('indonesia') || normCountry.includes('bali');
    return [
      { 
        name: isBali ? "Wayan Sudarta" : "Somchai Prasert", 
        rate: 28, 
        rating: "4.9", 
        reviews: 215, 
        specialty: isBali ? "Sacred Ubud Water Temples & Rice Terrace Hidden Trails" : "Vibrant Amphawa Floating Markets & TukTuk Side Streets", 
        languages: ["English", isBali ? "Indonesian" : "Thai"], 
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80" 
      },
      { 
        name: isBali ? "Putu Indah" : "Linh Nguyen", 
        rate: 25, 
        rating: "4.8", 
        reviews: 130, 
        specialty: isBali ? "Mount Batur Sunrise Hikes & Balinese Traditional Crafts" : "Old Quarter Street Food Explorations & Egg Coffee Gems", 
        languages: ["English", isBali ? "Indonesian" : "Vietnamese", "Mandarin"], 
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" 
      }
    ];
  }

  // Latin America & Central America & South America & Mexico
  if (normCountry.includes('mexico') || normCountry.includes('brazil') || normCountry.includes('rio') || normCountry.includes('peru') || normCountry.includes('lima') || normCountry.includes('machu') || normCountry.includes('colombia')) {
    const isBrazil = normCountry.includes('brazil') || normName.includes('rio');
    const isPeru = normCountry.includes('peru');
    return [
      { 
        name: isBrazil ? "Mateo Silva" : "Diego Ramirez", 
        rate: 28, 
        rating: "4.9", 
        reviews: 172, 
        specialty: isBrazil ? "Samba Alleys, Copacabana Scenic Points & Local Hangouts" : isPeru ? "Inca Sacred Valley Trails & Ancient Ruins Curation" : "Street Food Tacos & Pre-Columbian Art Districts", 
        languages: ["English", isBrazil ? "Portuguese" : "Spanish"], 
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" 
      },
      { 
        name: isBrazil ? "Isabela Santos" : "Sofía Flores", 
        rate: 26, 
        rating: "4.8", 
        reviews: 140, 
        specialty: isBrazil ? "Tijuca Rainforest Secret Paths & Culinary Barbecue Tours" : "Historic Architecture Walks & Traditional Cuisine Insights", 
        languages: ["English", isBrazil ? "Portuguese" : "Spanish", "French"], 
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" 
      }
    ];
  }

  // Turkey & Middle East
  if (normCountry.includes('turkey') || normName.includes('istanbul') || normCountry.includes('emirates') || normName.includes('dubai') || normCountry.includes('jordan') || normName.includes('petra')) {
    const isTurkey = normCountry.includes('turkey') || normName.includes('istanbul');
    return [
      { 
        name: isTurkey ? "Can Yilmaz" : "Zayd Mansoor", 
        rate: 34, 
        rating: "4.9", 
        reviews: 158, 
        specialty: isTurkey ? "Grand Bazaar Spice Masters & Bosphorus Ottoman Relics" : "Desert Dunes Off-roading & Bedouin Starlit Campgrounds", 
        languages: ["English", isTurkey ? "Turkish" : "Arabic"], 
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80" 
      },
      { 
        name: isTurkey ? "Aylin Kaya" : "Fatima Al-Harbi", 
        rate: 30, 
        rating: "4.8", 
        reviews: 95, 
        specialty: isTurkey ? "Underground Basilica Cisterns & Hidden Rooftop Teas" : "Traditional Souq Bargaining & Modern City Architecture Landmarks", 
        languages: ["English", isTurkey ? "Turkish" : "Arabic", "French"], 
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" 
      }
    ];
  }

  // Generic Dynamic Matcher using the country's name
  const upperCountry = country.charAt(0).toUpperCase() + country.slice(1);
  return [
    { 
      name: `Kofi Mensah`, 
      rate: 30, 
      rating: "4.9", 
      reviews: 110, 
      specialty: `Authentic ${upperCountry} Secret Pathways & Local Cuisine Landmarks`, 
      languages: ["English", "Local Dialect"], 
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80" 
    },
    { 
      name: `Alex Rivera`, 
      rate: 28, 
      rating: "4.8", 
      reviews: 94, 
      specialty: `Scenic Sightseeing Views & Fast Transit Hacks in ${destinationName}`, 
      languages: ["English", "Spanish"], 
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80" 
    }
  ];
}

export default function ItineraryWorkspace({
  destination,
  itinerary,
  userInputs,
  selectedHotel,
  onBack,
  onSavePlan,
  onRemixDay,
  isRemixing,
  remixError,
  isSharedView = false,
  onClonePlan,
  userLoggedIn = false,
  activePlanId
}: ItineraryWorkspaceProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [localDays, setLocalDays] = useState<ItineraryDay[]>(itinerary);
  const [tripTitle, setTripTitle] = useState(`${userInputs.duration}-Day Escape in ${destination.name}`);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  // Link sharing state variables
  const [isShareCopied, setIsShareCopied] = useState(false);

  // Dynamic guide profiles based on destination country
  const guideProfiles = getDynamicGuides(destination.name, destination.country);

  // Completed activities tracker (ID format: 'day-time')
  const [checkedActivities, setCheckedActivities] = useState<Record<string, boolean>>({});
  // Completed food items tracker (ID format: 'day-mealType')
  const [checkedFoods, setCheckedFoods] = useState<Record<string, boolean>>({});

  // Dynamic user notes per day
  const [dayNotes, setDayNotes] = useState<Record<number, string>>(
    itinerary.reduce((acc, curr) => {
      acc[curr.dayNumber] = curr.notes || '';
      return acc;
    }, {} as Record<number, string>)
  );

  // Remix input text for active day
  const [remixPrompt, setRemixPrompt] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Concierge booking states
  const [bookingModalType, setBookingModalType] = useState<'flights' | 'hotels' | 'guide' | null>(null);
  
  // Custom guide messenger states
  const [selectedGuideIndex, setSelectedGuideIndex] = useState<number>(0);
  const [customMsg, setCustomMsg] = useState('');
  const [guideStatusText, setGuideStatusText] = useState<string | null>(null);
  const [isSendingGuideRequest, setIsSendingGuideRequest] = useState(false);
  
  // Custom airline class state for flights search
  const [cabinClass, setCabinClass] = useState<'economy' | 'business'>('economy');
  const [stops, setStops] = useState<'all' | 'direct'>('all');

  const getUserIdOrSessionId = () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return currentUser.uid.substring(0, 10);
    }
    if (typeof window !== 'undefined') {
      let sessId = sessionStorage.getItem('aventur_session_id');
      if (!sessId) {
        sessId = 'sess' + Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('aventur_session_id', sessId);
      }
      return sessId;
    }
    return 'sessguest';
  };

  const getDynamicBookingLink = (baseUrl: string, travelType: string) => {
    const session = getUserIdOrSessionId();
    const subId = constructSubId(destination.name, travelType, session);
    return generateTravelpayoutsLink(baseUrl, subId);
  };

  const triggerSimulatedAffiliateClick = (type: 'flight' | 'hotel' | 'activity' | 'food' | 'guide' | 'supporter', title: string, basePayout: number) => {
    // Affiliate clicks are logged server-side in the /api/redirect route to prevent exposing commissions to travelers.
  };

  // Sync state if itinerary prop updates from a remix
  React.useEffect(() => {
    setLocalDays(itinerary);
    // update notes if a newly remixed day comes in
    setDayNotes(prev => {
      const updated = { ...prev };
      itinerary.forEach(d => {
        if (updated[d.dayNumber] === undefined || d.notes) {
          updated[d.dayNumber] = d.notes || '';
        }
      });
      return updated;
    });
  }, [itinerary]);

  const activeDayIndex = activeDay - 1;
  const currentDay = localDays[activeDayIndex] || localDays[0];

  const handleToggleActivity = (time: string) => {
    const key = `day-${activeDay}-${time}`;
    setCheckedActivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleFood = (mealType: string) => {
    const key = `day-${activeDay}-${mealType}`;
    setCheckedFoods(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNoteChange = (text: string) => {
    setDayNotes(prev => ({ ...prev, [activeDay]: text }));
    // update in localDays to keep sync
    setLocalDays(prevDays => 
      prevDays.map(d => d.dayNumber === activeDay ? { ...d, notes: text } : d)
    );
    setIsSaved(false);
  };

  const triggerRemix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remixPrompt.trim() || isRemixing) return;
    await onRemixDay(activeDay, remixPrompt);
    setRemixPrompt('');
  };

  // Pricing calculations
  const numDays = userInputs.duration || 5;
  const numPeople = userInputs.companions === 'Solo' ? 1 
                    : userInputs.companions === 'Couple' ? 2 
                    : userInputs.companions === 'Family' ? 4 
                    : 3; // Friends default is ~3

  const flightCostPerPerson = (destination.estimatedFlightCost.minPrice + destination.estimatedFlightCost.maxPrice) / 2;
  const totalFlightCost = flightCostPerPerson * numPeople;
  
  const totalHotelCost = selectedHotel.costPerNight * numDays;

  // Activities cost calculations based on checked or active values
  const totalActivitiesCost = localDays.reduce((acc, day) => {
    const dayActs = day.activities.reduce((sum, act) => sum + act.estimatedCost, 0);
    return acc + dayActs;
  }, 0) * numPeople;

  // Food cost calculations based on recommended values
  const totalFoodCost = localDays.reduce((acc, day) => {
    const dayFood = day.recommendedFood.reduce((sum, f) => sum + f.avgCost, 0);
    return acc + dayFood;
  }, 0) * numPeople;

  const totalBufferCost = 150 * numPeople; // General local transit or emergency buffer
  const grandTotalEstimate = totalFlightCost + totalHotelCost + totalActivitiesCost + totalFoodCost + totalBufferCost;

  // Calculation of completeness percentage
  const totalActivitiesCount = localDays.length * 3;
  const completedActivitiesCount = Object.values(checkedActivities).filter(Boolean).length;
  const completionPercent = Math.min(100, Math.round((completedActivitiesCount / totalActivitiesCount) * 100));

  const handleSave = () => {
    onSavePlan(tripTitle, localDays);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const copyShareLink = () => {
    // Force save list to trigger database synchronization
    onSavePlan(tripTitle, localDays);

    const activeId = activePlanId || `plan-${Date.now()}`;
    const targetUrl = `${window.location.origin}?share=${activeId}`;

    navigator.clipboard.writeText(targetUrl).then(() => {
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 3000);
    }).catch(err => {
      console.error("Clipboard copy error:", err);
    });
  };

  const exportPlanAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      tripTitle,
      destination,
      selectedHotel,
      userInputs,
      localDays,
      createdAt: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${tripTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 relative"
    >

      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to matches
          </button>
          
          <div className="flex items-center gap-2 mt-2 group">
            {isEditingTitle ? (
              <input
                type="text"
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="text-2xl font-display font-extrabold text-slate-900 border-b-2 border-blue-600 focus:outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
                {tripTitle}
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:text-blue-650 transition text-slate-400 cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </h2>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5 font-sans">
            Destination: <span className="font-semibold text-slate-800">{destination.name}, {destination.country}</span> &bull; Stay: <span className="font-semibold text-blue-800">{selectedHotel.name}</span>
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Completion Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <div className="text-xs">
              <span className="font-bold text-slate-950 font-display">{completionPercent}%</span> Checked
            </div>
            <div className="w-16 h-2 bg-slate-250 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercent}%` }} 
              />
            </div>
          </div>

          <a
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            title="Access the secure analytics admin control center"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:bg-slate-800 hover:border-slate-700 text-white cursor-pointer transition flex items-center gap-1.5 text-sm font-sans"
          >
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline font-bold">Admin Portal</span>
          </a>

          <button
            onClick={exportPlanAsJSON}
            title="Download itinerary backup file (JSON)"
            className="p-2.5 rounded-xl bg-white border border-slate-150 shadow-sm hover:bg-slate-50 text-slate-700 cursor-pointer transition flex items-center gap-1.5 text-sm font-sans"
          >
            <FolderUp className="w-4 h-4 text-blue-650" />
            <span className="hidden sm:inline font-bold">Export Backup File</span>
          </button>

          {/* Secure Cloud Link Sharing */}
          <button
            onClick={copyShareLink}
            title="Create and copy a secure traveler URL link to share with co-travellers"
            className={`p-2.5 rounded-xl border shadow-sm cursor-pointer transition flex items-center gap-1.5 text-sm font-sans ${
              isShareCopied 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Share2 className={`w-4 h-4 ${isShareCopied ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span className="font-bold">{isShareCopied ? 'Co-adventurer Link Copied!' : 'Share Itinerary Link'}</span>
          </button>

          {isSharedView && onClonePlan && (
            <button
              onClick={onClonePlan}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-extrabold text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer transition animate-pulse"
            >
              <Copy className="w-4 h-4" />
              <span>Clone & Customize Itinerary</span>
            </button>
          )}

          {!isSharedView && (
            <button
              onClick={handleSave}
              id="btn-save-trip"
              className={`px-4 py-2.5 rounded-xl font-display font-extrabold text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer transition ${
                isSaved 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-700 text-white hover:bg-blue-850'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{isSaved ? 'Itinerary Saved!' : 'Save Itinerary'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Day timeline selector (Left bar, vertical steps) */}
        <div className="col-span-1 lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2 lg:pb-0 h-fit lg:sticky lg:top-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
          <div className="hidden lg:block px-3 py-2 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200/50 mb-2">
            Timeline Days
          </div>
          {localDays.map((day) => {
            const isActive = day.dayNumber === activeDay;
            return (
              <button
                key={day.dayNumber}
                id={`day-nav-${day.dayNumber}`}
                onClick={() => setActiveDay(day.dayNumber)}
                className={`flex-shrink-0 text-left p-3 rounded-xl transition flex lg:items-center gap-3 w-40 lg:w-full cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white lg:bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-100 lg:border-none'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-150 text-slate-800'
                }`}>
                  D{day.dayNumber}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block font-display">Day {day.dayNumber}</span>
                  <span className={`text-[10px] truncate block mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {day.theme}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Timelines Workspace & Daily Actions (Center) */}
        <div className="col-span-1 lg:col-span-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Day Headline */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest font-display">
                  Active Day Plan
                </span>
                <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-1 flex items-baseline gap-2">
                  Day {activeDay}: <span className="text-blue-800 font-bold block sm:inline text-lg">{currentDay.theme}</span>
                </h3>
              </div>

              {/* Travelpayouts Affiliate Booking Gateways */}
              <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 border border-indigo-100 p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-widest leading-none">
                    Verified Booking Gateways
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    Travelpayouts Partner Link
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={getDynamicBookingLink(`https://www.skyscanner.com/transport/flights/${formatCityForSkyscanner(userInputs.origin)}/${formatCityForSkyscanner(destination.name)}`, 'flight')}
                    onClick={() => triggerSimulatedAffiliateClick('flight', `Flights to ${destination.name}`, 1.50)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold py-2.5 px-4 rounded-xl shadow-xs text-xs transition-all flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-750"
                  >
                    <Plane className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Book Flight via Skyscanner</span>
                  </a>
                  <a
                    href={getDynamicBookingLink(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(selectedHotel.name + ' ' + destination.name)}`, 'hotel')}
                    onClick={() => triggerSimulatedAffiliateClick('hotel', selectedHotel.name, 55.00)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Hotel className="w-4 h-4 text-white shrink-0" />
                    <span>Check Availability on Booking.com</span>
                  </a>
                </div>
              </div>

              {/* Time Blocks List */}
              <div className="space-y-4">
                {currentDay.activities.map((act) => {
                  const isChecked = !!checkedActivities[`day-${activeDay}-${act.time}`];
                  return (
                    <div
                      key={act.time}
                      id={`act-block-${activeDay}-${act.time}`}
                      className={`p-5 rounded-2xl border transition bg-white flex items-start gap-4 ${
                        isChecked ? 'border-blue-150 bg-blue-50/10 shadow-sm' : 'border-slate-200'
                      }`}
                    >
                      {/* Interactive checkbox */}
                      <button
                        type="button"
                        id={`chk-act-${activeDay}-${act.time}`}
                        onClick={() => handleToggleActivity(act.time)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition ${
                          isChecked 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-4 h-4 font-bold" />}
                      </button>

                      {/* Info Panel */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between flex-wrap gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            act.time === 'Morning' 
                              ? 'bg-amber-100 text-amber-800' 
                              : act.time === 'Afternoon' 
                              ? 'bg-sky-100 text-sky-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {act.time}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            Est: <span className="text-slate-900 font-black">${act.estimatedCost}</span>
                          </span>
                        </div>

                        <h4 className={`text-base font-bold mt-2 text-slate-950 font-display ${isChecked ? 'line-through text-slate-400' : ''}`}>
                          {act.title}
                        </h4>

                        <p className={`text-sm text-slate-600 mt-1.5 leading-relaxed ${isChecked ? 'text-slate-400 bg-transparent' : ''}`}>
                          {act.description}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-3.5 pt-3 border-t border-slate-100">
                          <div className="flex items-center flex-wrap gap-2.5 text-xs text-blue-700 font-semibold">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{act.locationName}</span>
                            </div>
                            <span className="text-slate-300 select-none">|</span>
                            <TripadvisorEnrichment 
                              locationName={act.title}
                              destinationName={destination.name}
                              session={getUserIdOrSessionId()}
                            />
                          </div>
                          
                          {/* Travelpayouts Affiliate Booking Link */}
                          <a
                            href={getDynamicBookingLink(`https://www.viator.com/search/${encodeURIComponent(act.title + ' ' + destination.name)}`, 'activity')}
                            onClick={() => triggerSimulatedAffiliateClick('activity', act.title, 8.50)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10.5px] font-extrabold text-slate-600 hover:text-blue-700 bg-slate-100/75 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 select-none cursor-pointer"
                          >
                            🎟️ Book Excursion via Viator <span className="text-slate-400 font-normal hidden xl:inline">(Earns 10% commission)</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Meals Checklist */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 font-sans">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Coffee className="w-5 h-5 text-blue-600" />
                  What to Eat & Drink today
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentDay.recommendedFood.map((food) => {
                    const isChecked = !!checkedFoods[`day-${activeDay}-${food.mealType}`];
                    return (
                      <div
                        key={food.mealType}
                        id={`food-block-${activeDay}-${food.mealType}`}
                        onClick={() => handleToggleFood(food.mealType)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleToggleFood(food.mealType); } }}
                        className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isChecked 
                            ? 'border-blue-200 bg-blue-50/10 shadow-sm' 
                            : 'border-slate-150 bg-slate-50/30 hover:border-slate-250'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {food.mealType}
                            </span>
                            <span className="text-xs font-bold text-blue-700">${food.avgCost}</span>
                          </div>
                          <h5 className={`text-sm font-bold text-slate-900 mt-1 truncate font-display ${isChecked ? 'line-through text-slate-400' : ''}`}>
                            {food.dishName}
                          </h5>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {food.specialtyDetails}
                          </p>
                          <div className="flex flex-col gap-2.5 mt-3.5 pt-2.5 border-t border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500 font-medium leading-none truncate">
                                <Utensils className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{food.venueRecommendation}</span>
                              </div>
                              <TripadvisorEnrichment 
                                locationName={food.venueRecommendation}
                                destinationName={destination.name}
                                session={getUserIdOrSessionId()}
                              />
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold font-mono">Cost: ~${food.avgCost}</span>
                              <a
                                href={getDynamicBookingLink(`https://www.yelp.com/search?find_desc=${encodeURIComponent(food.dishName)}&find_loc=${encodeURIComponent(food.venueRecommendation + ' ' + destination.name)}`, 'food')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerSimulatedAffiliateClick('food', `${food.dishName} Spot`, 1.50);
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9.5px] font-black tracking-wide text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition leading-none whitespace-nowrap"
                              >
                                🍽️ Reserve Table
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Local Pro Concierge Advice */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 p-5 rounded-2xl flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 leading-relaxed font-sans">
                  <strong>Insider pro-tip:</strong> {currentDay.localTip}
                </div>
              </div>

              {/* AI remix controls */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-xl overflow-hidden relative border border-slate-800">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4">
                  <Sparkles className="w-24 h-24 text-blue-400/10" />
                </div>
                <h4 className="text-base font-bold flex items-center gap-1.5 relative z-10 font-display">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  Have a custom tweak for Day {activeDay}?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1 relative z-10 max-w-md">
                  Change the pacing, add specific activities, tweak food styles, or focus on absolute relaxation for this single calendar day.
                </p>

                <form onSubmit={triggerRemix} className="mt-4 flex gap-2 relative z-10">
                  <input
                    type="text"
                    required
                    disabled={isRemixing}
                    placeholder="e.g. 'Make is highly focused on ancient temples' or 'Switch the morning walk with diving'..."
                    value={remixPrompt}
                    onChange={(e) => setRemixPrompt(e.target.value)}
                    className="flex-1 text-sm bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-white/45 focus:placeholder-slate-400 border border-white/10 px-3.5 py-2.5 rounded-xl outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={isRemixing || !remixPrompt.trim()}
                    className="bg-white hover:bg-blue-50 text-slate-950 text-sm font-bold px-4 py-2.5 rounded-xl transition cursor-pointer disabled:bg-slate-200/50 disabled:text-slate-400 shrink-0 flex items-center gap-1 font-display"
                  >
                    {isRemixing ? 'Updating...' : 'Tweak Day'}
                  </button>
                </form>

                {remixError && (
                  <div className="mt-3 text-xs bg-red-900/40 p-2.5 rounded-lg border border-red-500/20 text-red-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{remixError}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Financial Estimator & Day Notes Panel (Right Column) */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* Cost Estimates card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 font-sans">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-display">
                <DollarSign className="w-5 h-5 text-blue-600 font-bold" />
                Cheapest Cost Estimates
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Calculations for {numPeople} {numPeople === 1 ? 'traveler' : 'travelers'}</p>
            </div>

            {/* Price Wheel summary */}
            <div className="bg-slate-50/55 p-4 rounded-xl space-y-3.5 text-xs text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <span>Avg Flight Ticket ({numPeople}x):</span>
                <span className="font-bold text-slate-900">${totalFlightCost}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <span>Hotel package ({numDays} nights):</span>
                <span className="font-bold text-slate-900">${totalHotelCost}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <span>Daily Activities total:</span>
                <span className="font-bold text-slate-900">${totalActivitiesCost}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <span>Dining & culinary avg cost:</span>
                <span className="font-bold text-slate-900">${totalFoodCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transit & buffers:</span>
                <span className="font-bold text-slate-900">${totalBufferCost}</span>
              </div>
            </div>

            {/* Total Budget Price Tag */}
            <div className="border-t border-slate-150 pt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Est Total Budget</span>
                <span className="text-2xl font-black text-slate-900 font-display">${grandTotalEstimate}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-blue-105 text-blue-900 px-2 py-0.5 rounded font-black font-mono">
                  {userInputs.budgetCategory} Tier
                </span>
              </div>
            </div>
          </div>



          {/* New Interactive Booking Concierge Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 font-sans shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-display">
                <Plane className="w-4 h-4 text-blue-600" />
                Trip Booking Concierge
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                Lock in flight tickets, reserve lodgings, or connect with dynamic local guides.
              </p>
            </div>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setBookingModalType('flights');
                  setGuideStatusText(null);
                }}
                id="btn-book-flights-trigger"
                className="w-full text-left p-3 rounded-xl border border-slate-150 hover:border-blue-400 bg-slate-55/75 hover:bg-blue-50/10 transition flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 whitespace-nowrap"
              >
                <div className="flex items-center gap-2 truncate">
                  <Plane className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Flights & Train transit</span>
                </div>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-black shrink-0 whitespace-nowrap">Browse</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingModalType('hotels');
                  setGuideStatusText(null);
                }}
                id="btn-book-hotels-trigger"
                className="w-full text-left p-3 rounded-xl border border-slate-150 hover:border-blue-400 bg-slate-55/75 hover:bg-blue-50/10 transition flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 whitespace-nowrap"
              >
                <div className="flex items-center gap-2 truncate">
                  <Hotel className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Reserve {selectedHotel.tier} Hotel</span>
                </div>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-black shrink-0 whitespace-nowrap">Check-in</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingModalType('guide');
                  setGuideStatusText(null);
                  setCustomMsg(`Hello! I'm planning an amazing ${numDays}-day getaway to ${destination.name} leaving from ${userInputs.origin}. I would love to connect for custom daily excursions.`);
                }}
                id="btn-hire-guide-trigger"
                className="w-full text-left p-3 rounded-xl border border-slate-150 hover:border-blue-400 bg-slate-55/75 hover:bg-blue-50/10 transition flex items-center justify-between group cursor-pointer text-xs font-bold text-slate-800 whitespace-nowrap"
              >
                <div className="flex items-center gap-2 truncate">
                  <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Hire Vetted Local Guide</span>
                </div>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-black shrink-0 whitespace-nowrap">Hire Guide</span>
              </button>
            </div>
          </div>

          {/* Persistent Day Notes Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 font-sans">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-display">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              Day {activeDay} Diaries/Notes
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Bookings codes, addresses, times, custom plans, or notes for Day {activeDay}. Saves automatically.
            </p>
            <textarea
              rows={5}
              placeholder="e.g. 'Meet tour guide, Gion steps at 9:15 AM. Order tickets for afternoon castle in advance! Booking code: GION-9923'"
              value={dayNotes[activeDay] || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none rounded-xl text-slate-950"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold italic">
              <span>Sync Status:</span>
              <span className="text-blue-700 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3" /> Auto-saved local state
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Booking Dialog Modals Overlay */}
      <AnimatePresence>
        {bookingModalType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
          >
            {/* Backdrop close capture */}
            <div className="absolute inset-0" onClick={() => { setBookingModalType(null); setGuideStatusText(null); }} />

            <motion.div
              initial={{ scale: 0.96, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 15 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 relative z-10 flex flex-col max-h-[92vh] text-slate-900 font-sans"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {bookingModalType === 'flights' && <Plane className="w-5 h-5 text-blue-400 animate-pulse" />}
                  {bookingModalType === 'hotels' && <Hotel className="w-5 h-5 text-blue-400 animate-pulse" />}
                  {bookingModalType === 'guide' && <Compass className="w-5 h-5 text-blue-400 animate-pulse" />}
                  <h3 className="text-sm md:text-base font-extrabold font-display">
                    {bookingModalType === 'flights' && 'Secure Flights Desk'}
                    {bookingModalType === 'hotels' && 'Stay Reservation Desk'}
                    {bookingModalType === 'guide' && 'Vetted Local Guides Desk'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBookingModalType(null);
                    setGuideStatusText(null);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Modal */}
              <div className="p-6 md:p-7 overflow-y-auto space-y-5 flex-1">
                
                {/* 1. FLIGHTS PANEL */}
                {bookingModalType === 'flights' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-xs space-y-1">
                      <span className="font-extrabold text-blue-900 font-display text-[11px] block uppercase tracking-wider">Flight Estimator Profile</span>
                      <p className="text-slate-700 leading-relaxed">
                        Roundtrip routes from <strong className="text-slate-950">{userInputs.origin}</strong> to <strong className="text-slate-950">{destination.name}</strong>.
                      </p>
                      <p className="text-slate-650 mt-1">
                        Average cheap price range: <strong className="text-blue-700">${destination.estimatedFlightCost.minPrice} - ${destination.estimatedFlightCost.maxPrice}</strong> (based on seasonal trends).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Cabin Preference</label>
                        <select
                          value={cabinClass}
                          onChange={(e) => setCabinClass(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        >
                          <option value="economy">Economy Package</option>
                          <option value="business">First / Business Class</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Stops Preference</label>
                        <select
                          value={stops}
                          onChange={(e) => setStops(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        >
                          <option value="all">Any Layout</option>
                          <option value="direct">Direct flights only</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2 text-xs text-slate-600">
                      <h5 className="font-bold text-slate-800">Elite Concierge Advice:</h5>
                      <p className="leading-relaxed italic">"{destination.estimatedFlightCost.advice}"</p>
                    </div>

                    <div className="pt-2">
                      <a
                        href={getDynamicBookingLink(`https://www.skyscanner.com/transport/flights/${formatCityForSkyscanner(userInputs.origin)}/${formatCityForSkyscanner(destination.name)}`, 'flight')}
                        onClick={() => triggerSimulatedAffiliateClick('flight', `${userInputs.origin} ➔ ${destination.name}`, 1.50)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs font-bold font-display transition flex items-center justify-center gap-1.5 whitespace-nowrap truncate"
                      >
                        <span>Book Flight via Skyscanner</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
 
                {/* 2. HOTELS RESK */}
                {bookingModalType === 'hotels' && (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start pb-2 border-b border-slate-100">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">{selectedHotel.tier} LODGING TIER</span>
                        <h4 className="text-lg font-extrabold text-slate-900 font-display mt-0.5">{selectedHotel.name}</h4>
                        <span className="text-xl font-black text-blue-700 mt-1 block">${selectedHotel.costPerNight} <span className="text-xs font-normal text-slate-400">/ night avg</span></span>
                      </div>
                    </div>
 
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
                      <strong>Hotel Description:</strong> {selectedHotel.description}
                    </p>
 
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">Stay Amenities Highlighted:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedHotel.highlights.map(h => (
                          <span key={h} className="text-[10px] font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded border border-blue-100/40">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
 
                    <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-100">
                      <p className="font-semibold block mb-0.5">Est Hotel Stay Cost ({numDays} nights):</p>
                      <p className="text-sm font-black text-amber-950">${totalHotelCost} (all taxes included)</p>
                    </div>
 
                    <div className="pt-2">
                      <a
                        href={getDynamicBookingLink(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(selectedHotel.name + ' ' + destination.name)}`, 'hotel')}
                        onClick={() => triggerSimulatedAffiliateClick('hotel', selectedHotel.name, 55.00)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs font-bold font-display transition flex items-center justify-center gap-1.5 whitespace-nowrap truncate"
                      >
                        <span>Check Availability on Booking.com</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}

                {/* 3. GUIDE COUPLER CHAT */}
                {bookingModalType === 'guide' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Hand-picked local experts selected specifically for your target style and companions in <strong className="text-slate-900">{destination.name}</strong>.
                    </p>

                    {/* Guide picker toggles */}
                    <div className="space-y-2.5">
                      {guideProfiles.map((guide, idx) => {
                        const isPicked = selectedGuideIndex === idx;
                        return (
                          <button
                            key={guide.name}
                            type="button"
                            onClick={() => { setSelectedGuideIndex(idx); setGuideStatusText(null); }}
                            className={`w-full text-left p-3 rounded-xl border transition flex items-center gap-3 cursor-pointer ${
                              isPicked 
                                ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-500/10' 
                                : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              referrerPolicy="no-referrer"
                              src={guide.image}
                              alt={guide.name}
                              className="w-10 h-10 rounded-full shrink-0 object-cover border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black text-slate-900 font-display truncate">{guide.name}</span>
                                <span className="text-xs font-black text-blue-700 shrink-0">${guide.rate}/hr</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate mt-0.5">{guide.specialty}</span>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span>⭐ {guide.rating} ({guide.reviews} reviews)</span>
                                <span>&bull;</span>
                                <span>🗣️ {guide.languages.join(', ')}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Chat dispatch form */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setIsSendingGuideRequest(true);
                      setGuideStatusText("Opening handshake channels with local companion systems...");
                      setTimeout(() => {
                        setGuideStatusText("Parsing active itinerary daily themes & companion counts...");
                        setTimeout(() => {
                          setGuideStatusText(`Plan securely transmitted! ${guideProfiles[selectedGuideIndex].name} has received your itinerary. They will reach out to iamojay89@gmail.com within 2 hours.`);
                          setIsSendingGuideRequest(false);
                          setCustomMsg("");
                          triggerSimulatedAffiliateClick('guide', guideProfiles[selectedGuideIndex].name, 18.50);
                        }, 1200);
                      }, 1000);
                    }} className="space-y-3.5 pt-2">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Message to local guide:</label>
                        <textarea
                          rows={3}
                          required
                          value={customMsg}
                          onChange={(e) => setCustomMsg(e.target.value)}
                          placeholder="Introduce yourself and list special preferences..."
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingGuideRequest}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs font-bold font-display cursor-pointer transition flex items-center justify-center gap-1.5 whitespace-nowrap truncate"
                      >
                        {isSendingGuideRequest ? 'Sending Inquiry...' : 'Secure & Connect Guide'}
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {guideStatusText && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-700 leading-relaxed font-mono">
                        <span className="font-bold text-blue-800">Connection log:</span>
                        <p className="mt-1">{guideStatusText}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
