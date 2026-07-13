"use client";

import React, { useState, useEffect } from 'react';
import { generateTravelpayoutsLink, constructSubId } from '../lib/travelpayouts';

interface TripadvisorEnrichmentProps {
  locationName: string;
  destinationName: string;
  session: string;
}

export default function TripadvisorEnrichment({
  locationName,
  destinationName,
  session
}: TripadvisorEnrichmentProps) {
  const [data, setData] = useState<{
    rating: number;
    reviewsCount: number;
    url: string;
    photo?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchEnrichment = async () => {
      try {
        const query = `${locationName}, ${destinationName}`;
        const res = await fetch(`/api/enrich-location?query=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (active && res.ok) {
          setData(json);
        }
      } catch (err) {
        console.warn("[Tripadvisor Enrichment] Failed to load ratings:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEnrichment();
    return () => {
      active = false;
    };
  }, [locationName, destinationName]);

  const renderBubbles = (rating: number) => {
    return (
      <div className="flex gap-0.5 items-center select-none" title={`Tripadvisor: ${rating}/5`}>
        {[...Array(5)].map((_, i) => {
          const bubbleVal = i + 1;
          const isFull = rating >= bubbleVal;
          const isHalf = !isFull && rating >= bubbleVal - 0.5;
          return (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full border border-emerald-600 inline-block ${
                isFull 
                  ? 'bg-emerald-600' 
                  : isHalf 
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-transparent' 
                  : 'bg-transparent'
              }`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 animate-pulse text-slate-350 text-[10.5px]">
        <span className="w-3 h-3 rounded-full bg-slate-200" />
        <span className="w-16 h-3 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!data) return null;

  // Generate trackable redirect URL
  const subId = constructSubId(destinationName, 'tripadvisor', session);
  const trackedUrl = generateTravelpayoutsLink(data.url, subId);

  return (
    <a
      href={trackedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/50 hover:border-emerald-350/50 rounded-xl transition shadow-xs group select-none text-slate-800 font-sans"
      title="View reviews on Tripadvisor (Affiliate link)"
    >
      <div className="flex items-center gap-1 select-none">
        {/* Tripadvisor Icon/Mark mimic */}
        <span className="w-5 h-5 rounded-full bg-[#34e0a1] text-slate-950 font-black text-[9.5px] flex items-center justify-center border border-slate-950/10 leading-none">
          🦉
        </span>
        <span className="font-black text-slate-900 text-xs tracking-tight">
          Tripadvisor
        </span>
      </div>
      
      <div className="w-[1.5px] h-3.5 bg-emerald-250 self-center" />
      
      <div className="flex items-center gap-1.5">
        {renderBubbles(data.rating)}
        <span className="text-slate-600 font-mono text-xs font-bold leading-none">
          {data.rating.toFixed(1)} ({data.reviewsCount.toLocaleString()})
        </span>
      </div>
    </a>
  );
}
