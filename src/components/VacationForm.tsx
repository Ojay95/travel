"use client";

import React, { useState } from 'react';
import { UserInputs } from '../types';
import { Compass, Calendar, Users, DollarSign, Sparkles, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface VacationFormProps {
  onSubmit: (inputs: UserInputs) => void;
  isLoading: boolean;
}

const INTERESTS_PRESETS = [
  { id: 'beach', label: '🏖️ Sun & Beach' },
  { id: 'nature', label: '🌲 Nature & Wildlife' },
  { id: 'culture', label: '🏛️ Culture & History' },
  { id: 'food', label: '🍝 Food & Culinary' },
  { id: 'adventure', label: '🧗 Hiking & Adventure' },
  { id: 'wellness', label: '🧘 Spa & Wellness' },
  { id: 'shopping', label: '🛍️ Shopping & City' },
  { id: 'nightlife', label: '🍸 Nightlife & Shows' },
  { id: 'family', label: '🎡 Family Friendly' }
];

const COMPANIONS_PRESETS = [
  { id: 'Solo', label: '🙋 Solo', desc: 'Me, myself and the world' },
  { id: 'Couple', label: '💑 Couple', desc: 'Romantic or quiet getaway' },
  { id: 'Family', label: '👨‍👩‍👧‍👦 Family', desc: 'Perfect for all ages' },
  { id: 'Friends', label: '👯 Friends', desc: 'Group fun and memories' }
] as const;

const BUDGET_PRESETS = [
  { id: 'Budget', label: 'Backpacker / Budget', price: '$', desc: 'Hostels, local transit & free sights' },
  { id: 'Midrange', label: 'Balanced / Midrange', price: '$$', desc: 'Comfortable hotels, tours & good meals' },
  { id: 'Luxury', label: 'Premium / Luxury', price: '$$$', desc: 'Boutique stay, fine dining & private guides' }
] as const;

export default function VacationForm({ onSubmit, isLoading }: VacationFormProps) {
  const [origin, setOrigin] = useState('');
  const [duration, setDuration] = useState(5);
  const [companions, setCompanions] = useState<'Solo' | 'Couple' | 'Family' | 'Friends'>('Solo');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budgetCategory, setBudgetCategory] = useState<'Budget' | 'Midrange' | 'Luxury'>('Midrange');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [planningMode, setPlanningMode] = useState<'recommend' | 'specific'>('recommend');
  const [specificDestination, setSpecificDestination] = useState('');

  React.useEffect(() => {
    const inspiration = localStorage.getItem('aventur_deep_inspiration');
    if (inspiration) {
      setAdditionalDetails(`I want to plan an amazing trip inspired by the beautiful ${inspiration}!`);
      if (inspiration.includes('Kyoto') || inspiration.includes('Petra')) {
        setSelectedInterests(['culture', 'food']);
      } else if (inspiration.includes('Serengeti')) {
        setSelectedInterests(['nature', 'adventure']);
      } else if (inspiration.includes('Machu')) {
        setSelectedInterests(['nature', 'culture', 'adventure']);
      } else if (inspiration.includes('Santorini')) {
        setSelectedInterests(['beach', 'culture', 'food']);
      } else if (inspiration.includes('Queenstown')) {
        setSelectedInterests(['nature', 'adventure']);
      }
      localStorage.removeItem('aventur_deep_inspiration');
    }
  }, []);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(item => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim()) return;
    if (planningMode === 'specific' && !specificDestination.trim()) return;
    onSubmit({
      origin: origin.trim(),
      duration,
      companions,
      interests: selectedInterests,
      budgetCategory,
      additionalDetails: additionalDetails.trim(),
      specificDestination: planningMode === 'specific' ? specificDestination.trim() : undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden"
      id="vacation-form-card"
    >
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 md:p-8 text-white relative">
        <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-full backdrop-blur-md">
          <Compass className="w-6 h-6 animate-spin-slow text-blue-400" />
        </div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight mb-2">Build Your Dream Getaway</h2>
        <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
          Tell us where you are based and what kind of memories you want to make. Our AI planner will assemble customized matches, price models, and perfect daily activities.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-8">
        {/* Row 1: Origin and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Where are you flying/leaving from?
            </label>
            <div className="relative">
              <input
                id="origin-input"
                type="text"
                required
                placeholder="e.g. Chicago, IL or London, UK"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white text-slate-900 placeholder-slate-400 transition"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Needed for flight average pricing estimates</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              How many days is your trip?
            </label>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <button
                type="button"
                id="btn-duration-minus"
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-150 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 transition"
              >
                -
              </button>
              <div className="text-center flex-1 font-display">
                <span className="text-lg font-bold text-slate-950">{duration}</span>
                <span className="text-sm text-slate-500 ml-1">{duration === 1 ? 'day' : 'days'}</span>
              </div>
              <button
                type="button"
                id="btn-duration-plus"
                onClick={() => setDuration(Math.min(14, duration + 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-150 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 transition"
              >
                +
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">AI custom models support 1 to 14 days</p>
          </div>
        </div>

        {/* Row 1.5: Destination Choice Mode Selection */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-150 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-sm font-semibold text-slate-800">Planning Mode</span>
              <span className="text-xs text-slate-400">Do you want AI recommendations, or a specific destination?</span>
            </div>
            
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                id="btn-mode-recommend"
                onClick={() => setPlanningMode('recommend')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  planningMode === 'recommend'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-650 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Let AI Match
              </button>
              <button
                type="button"
                id="btn-mode-specific"
                onClick={() => setPlanningMode('specific')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  planningMode === 'specific'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-650 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Specific City
              </button>
            </div>
          </div>

          {planningMode === 'specific' && (
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Where do you want to go?
              </label>
              <input
                id="specific-destination-input"
                type="text"
                required={planningMode === 'specific'}
                placeholder="e.g. Paris, France or Tokyo, Japan or Bali"
                value={specificDestination}
                onChange={(e) => setSpecificDestination(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm text-slate-900 placeholder-slate-400 transition shadow-sm animate-fadeIn"
              />
            </div>
          )}
        </div>

        {/* Row 2: Companions */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Who is joining you?
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {COMPANIONS_PRESETS.map((item) => (
              <button
                key={item.id}
                id={`companion-${item.id}`}
                type="button"
                onClick={() => setCompanions(item.id)}
                className={`p-3 text-left rounded-xl border text-sm transition-all flex flex-col justify-between h-20 ${
                  companions === item.id
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="font-bold text-slate-900">{item.label}</span>
                <span className="text-xs text-slate-500 leading-tight block">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Budget tier */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            What is your desired budget pace?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BUDGET_PRESETS.map((item) => (
              <button
                key={item.id}
                id={`budget-${item.id}`}
                type="button"
                onClick={() => setBudgetCategory(item.id)}
                className={`p-4 text-left rounded-xl border transition flex items-start gap-3 h-24 ${
                  budgetCategory === item.id
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  budgetCategory === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.price}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-900 block text-xs md:text-sm">{item.label}</span>
                  <span className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-tight">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Interests */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3 font-display">
            Select Your Interests (Multi-select)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS_PRESETS.map((item) => {
              const selected = selectedInterests.includes(item.id);
              return (
                <button
                  key={item.id}
                  id={`interest-tag-${item.id}`}
                  type="button"
                  onClick={() => toggleInterest(item.id)}
                  className={`px-3 py-2 rounded-full border text-sm transition-all cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600 font-medium'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-350'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 5: Experience Details */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Describe your dream experience & scenery
          </label>
          <textarea
            id="experience-details"
            rows={3}
            placeholder="e.g. 'I'd love to explore street markets, stay somewhere close to historical landmarks, hike beautiful greenery, and sample traditional seafood dishes side by side. I prefer walking to driving when possible.'"
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white text-slate-900 placeholder-slate-400 transition"
          />
          <div className="flex items-center gap-2 mt-2 w-full overflow-hidden">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Suggestions:</span>
            <div className="flex overflow-x-auto gap-1.5 py-1 scroll-smooth max-w-full text-xs">
              {[
                "Historic European alleys & street cafés",
                "Kyoto cherry blossoms & serene bamboo temples in Asia",
                "Safari hikes & wildlife game reserves in East Africa",
                "Andean mountain trails & Incan ruins in South America",
                "Middle Eastern spice bazaars & desert oasis dunes",
                "Pristine tropical islands, reefs & beach bonfire"
              ].map((suggestText) => (
                <button
                  key={suggestText}
                  type="button"
                  onClick={() => setAdditionalDetails(suggestText)}
                  className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition whitespace-nowrap shrink-0 cursor-pointer block"
                >
                  "{suggestText}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-discover-destinations"
            disabled={isLoading || !origin.trim()}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-display font-extrabold rounded-xl shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="whitespace-nowrap">Curating Destinations with AI...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline">Search Best Destinations & Plan Vacation</span>
                  <span className="sm:hidden">Search & Plan Trip</span>
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
