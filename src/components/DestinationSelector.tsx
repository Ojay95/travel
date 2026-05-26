import React, { useState } from 'react';
import { Destination, RecommendedHotel } from '../types';
import { Plane, Calendar, Hotel, Check, Percent, Sparkles, MoveLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DestinationSelectorProps {
  destinations: Destination[];
  onSelect: (destination: Destination, selectedHotel: RecommendedHotel) => void;
  onBack: () => void;
  isGeneratingItinerary: boolean;
}

export default function DestinationSelector({
  destinations,
  onSelect,
  onBack,
  isGeneratingItinerary
}: DestinationSelectorProps) {
  // Store selected hotel per destination index. Default is Mid-range hotel package index
  const [selectedHotels, setSelectedHotels] = useState<Record<number, number>>({
    0: 1, // index 1 is usually mid-range
    1: 1,
    2: 1
  });

  const getHotelByTier = (destination: Destination, tierStr: string): RecommendedHotel | undefined => {
    return destination.recommendedHotels.find(h => h.tier.toLowerCase() === tierStr.toLowerCase());
  };

  const handleSelectHotel = (destIdx: number, hotelIdx: number) => {
    setSelectedHotels({ ...selectedHotels, [destIdx]: hotelIdx });
  };

  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
      id="destination-selector-viewport"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-750 transition cursor-pointer whitespace-nowrap"
            id="back-btn-to-form"
          >
            <MoveLeft className="w-4 h-4" /> Back to preferences
          </button>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Your AI Match Reports
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">We found 3 perfect matching cities for your vacation vibes.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {destinations.map((dest, idx) => (
            <button
              key={dest.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition cursor-pointer ${
                activeTab === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Active Tab Content */}
      <AnimatePresence mode="wait">
        {destinations.map((dest, destIdx) => {
          if (destIdx !== activeTab) return null;

          const chosenHotelIdx = selectedHotels[destIdx] ?? 0;
          const chosenHotel = dest.recommendedHotels[chosenHotelIdx] || dest.recommendedHotels[0];

          return (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Destination Vibe Card (Left) */}
              <div className="col-span-1 lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 space-y-6 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        Option #{destIdx + 1}
                      </span>
                      <h3 className="text-3xl font-display font-extrabold text-slate-900 mt-2">
                        {dest.name}, <span className="text-slate-500 font-semibold">{dest.country}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-lg px-4 py-2 rounded-xl shadow-md shadow-blue-500/10">
                      <Percent className="w-5 h-5 text-blue-200 animate-pulse" />
                      <span>{dest.matchScore}% Match</span>
                    </div>
                  </div>

                  <p className="text-lg font-medium text-blue-800 leading-relaxed italic font-display">
                    "{dest.tagline}"
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-display">Destination Overview</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{dest.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> Best Time to Go
                        </div>
                        <p className="text-sm font-bold text-slate-850 font-display">{dest.bestSeason}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Local Vibe
                        </div>
                        <p className="text-sm text-slate-605">{dest.localVibe}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-display font-semibold">Why It Fits Your Preferences</h4>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                        {dest.whyItFits}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flights & Cheap Travel info */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-t border-slate-150 p-6 md:p-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-lg text-blue-700 mt-1 border border-blue-100/30">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-display">Cheapest Flights & Transit Estimates</h4>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-gray-800">${dest.estimatedFlightCost.minPrice}</span>
                        <span className="text-xs text-gray-400">to</span>
                        <span className="text-xl font-black text-gray-800">${dest.estimatedFlightCost.maxPrice}</span>
                        <span className="text-xs font-semibold text-gray-500 ml-1">/ person roundtrip</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed italic">
                        <strong>Planner Tip:</strong> {dest.estimatedFlightCost.advice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotels Selection & Action Column (Right) */}
              <div className="col-span-1 lg:col-span-5 flex flex-col space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                      <Hotel className="w-5 h-5 text-blue-600" />
                      Select Hotel stay Package
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Select a pre-vetted hotel or lodging tier below</p>
                  </div>

                  {/* Lodging Tier Toggles */}
                  <div className="space-y-4">
                    {dest.recommendedHotels.map((hot, hotIdx) => {
                      const isSelected = chosenHotelIdx === hotIdx;
                      return (
                        <button
                          key={hot.name}
                          type="button"
                          id={`hotel-pkg-${destIdx}-${hot.tier}`}
                          onClick={() => handleSelectHotel(destIdx, hotIdx)}
                          className={`w-full text-left p-4 rounded-xl border transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
                              : 'border-slate-150 hover:border-slate-250'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1 shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-slate-900 font-display">{hot.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              hot.tier === 'luxury'
                                ? 'bg-amber-100 text-amber-800'
                                : hot.tier === 'mid'
                                ? 'bg-blue-100 text-blue-850'
                                : 'bg-slate-100 text-slate-850'
                            }`}>
                              {hot.tier}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-blue-700 mt-1">
                            ${hot.costPerNight} <span className="text-xs font-normal text-slate-400">/ night avg</span>
                          </div>

                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {hot.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {hot.highlights.map(h => (
                              <span key={h} className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">
                                {h}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary Box */}
                  <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-900 leading-relaxed">
                      Stay includes AI-matching recommendations for safe neighborhoods, walking proximities, and quality ratings.
                    </div>
                  </div>
                </div>

                 {/* CTA Action button to initiate Itinerary phase */}
                 <button
                   type="button"
                   id={`btn-build-itinerary-${dest.id}`}
                   disabled={isGeneratingItinerary}
                   onClick={() => onSelect(dest, chosenHotel)}
                   className="w-full py-4 text-white font-display font-extrabold bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 whitespace-nowrap"
                 >
                   {isGeneratingItinerary ? (
                     <>
                       <svg className="animate-spin h-5 w-5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                       </svg>
                       <span className="whitespace-nowrap">Crafting custom daily itinerary...</span>
                     </>
                   ) : (
                     <div className="flex items-center gap-1 min-w-0">
                       <span className="truncate">
                         <span className="hidden sm:inline">Generate Itinerary for {dest.name}</span>
                         <span className="sm:hidden">Plan {dest.name} Trip</span>
                       </span>
                       <ArrowRight className="w-5 h-5 shrink-0" />
                     </div>
                   )}
                 </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
