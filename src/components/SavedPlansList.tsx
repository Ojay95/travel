"use client";

import React from 'react';
import { VacationPlan } from '../types';
import { Luggage, Trash2, Calendar, Users, DollarSign, Compass, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SavedPlansListProps {
  plans: VacationPlan[];
  onSelect: (plan: VacationPlan) => void;
  onDelete: (id: string) => void;
  onNewTrip: () => void;
}

export default function SavedPlansList({
  plans,
  onSelect,
  onDelete,
  onNewTrip
}: SavedPlansListProps) {
  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xl font-sans">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-blue-100">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>
        <h3 className="text-lg font-display font-extrabold text-slate-900">Your Saved Trips & Itineraries list is empty</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Create custom itineraries, configure your hotel stays, calculate pricing, and save them here.
        </p>
        <button
          onClick={onNewTrip}
          id="btn-create-first-trip"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm rounded-xl cursor-pointer transition shadow-md shadow-blue-500/10 whitespace-nowrap inline-flex items-center justify-center gap-1 text-center"
        >
          Plan Your First Trip
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-extrabold text-slate-900 flex items-center gap-1.5">
            <Luggage className="w-5 h-5 text-blue-600" />
            Your Saved Trips & Itineraries
          </h3>
          <p className="text-xs text-slate-400">Instantly reload any planned trip or itinerary detail from local state memory.</p>
        </div>
        <span className="text-xs font-bold text-blue-800 bg-blue-105 px-2.5 py-1 rounded-full">
          {plans.length} {plans.length === 1 ? 'Trip' : 'Trips'} Saved
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="saved-plans-container">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all p-5 flex flex-col justify-between relative group shadow-sm animate-fade-in"
          >
            {/* Action buttons (top corner) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(plan.id);
              }}
              id={`btn-delete-plan-${plan.id}`}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Delete Travel Plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="space-y-3 cursor-pointer" onClick={() => onSelect(plan)}>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                  {plan.destination.country}
                </span>
                <h4 className="text-lg font-display font-extrabold text-slate-900 mt-2 hover:text-blue-700 transition line-clamp-2">
                  {plan.title}
                </h4>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/75 p-3 rounded-xl border border-slate-150 text-xs text-slate-650 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{plan.daysCount}d</span>
                </div>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{plan.userInputs.companions}</span>
                </div>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{plan.userInputs.budgetCategory}</span>
                </div>
              </div>

              <div className="text-xs text-slate-550 leading-normal line-clamp-2 font-sans">
                <strong>Stay:</strong> {plan.selectedHotel.name} (${plan.selectedHotel.costPerNight}/night)
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Created on {new Date(plan.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => onSelect(plan)}
                id={`btn-select-loaded-plan-${plan.id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition cursor-pointer font-display whitespace-nowrap"
              >
                <span>Open Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
