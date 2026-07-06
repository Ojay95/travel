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
      className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition group select-none text-[10.5px] font-sans font-medium text-slate-500"
      title="View on Tripadvisor (Affiliate Redirect)"
    >
      <span className="font-black text-emerald-600 group-hover:text-emerald-700 text-[11px] font-mono leading-none">
        Tripadvisor
      </span>
      {renderBubbles(data.rating)}
      <span className="text-slate-400 group-hover:text-slate-500 font-mono text-[10px]">
        ({data.reviewsCount.toLocaleString()})
      </span>
    </a>
  );
}
