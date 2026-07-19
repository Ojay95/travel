import { NextResponse } from 'next/server';
import { db } from '@/src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dest = searchParams.get('dest');
  const subId = searchParams.get('subId');

  if (!dest) {
    return NextResponse.json({ error: 'Missing destination URL' }, { status: 400 });
  }

  // Safe redirect validation: Ensure it is a valid web URL
  if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
    return NextResponse.json({ error: 'Invalid destination URL' }, { status: 400 });
  }

  // Parse SubID values: [destination]_[travel_type]_[session]
  let destinationCity = 'unknown';
  let travelType = 'unknown';
  let session = 'unknown';

  if (subId) {
    const parts = subId.split('_');
    if (parts.length >= 3) {
      destinationCity = parts[0];
      travelType = parts[1];
      session = parts.slice(2).join('_');
    } else {
      destinationCity = parts[0] || 'unknown';
      travelType = parts[1] || 'unknown';
      session = parts[2] || 'unknown';
    }
  }

  // Compute simulated commission payouts
  let payout = 0;
  if (travelType === 'flight') payout = 1.50;
  else if (travelType === 'hotel') payout = 55.00;
  else if (travelType === 'activity') payout = 8.50;
  else if (travelType === 'food') payout = 1.50;
  else if (travelType === 'guide') payout = 18.50;
  else if (travelType === 'supporter') payout = 15.00;
  else if (travelType === 'tripadvisor') payout = 4.50;

  // Determine partner brand
  let brand = 'External';
  if (dest.includes('google.com/travel/flights')) brand = 'Google Flights';
  else if (dest.includes('booking.com')) brand = 'Booking.com';
  else if (dest.includes('viator.com')) brand = 'Viator';
  else if (dest.includes('yelp.com')) brand = 'Yelp';
  else if (dest.includes('tripadvisor.com')) {
    brand = 'Tripadvisor';
    if (payout === 0) payout = 4.50;
  } else {
    try {
      brand = new URL(dest).hostname.replace('www.', '');
    } catch {
      brand = 'External';
    }
  }

  console.log(`[Affiliate Tracker] Redirecting: ${brand} | Dest: ${dest} | SubID: ${subId || 'none'} | Payout: $${payout}`);

  // Write click tracking details to Firestore server-side (Non-blocking redirect for instant client experience)
  try {
    const clicksRef = collection(db, 'affiliate_clicks');
    addDoc(clicksRef, {
      dest,
      subId: subId || 'none',
      destinationCity,
      travelType,
      session,
      payout,
      brand,
      timestamp: new Date().toISOString()
    }).catch(err => {
      console.error('[Affiliate Tracker] Non-blocking database write failed:', err);
    });
  } catch (err) {
    console.error('[Affiliate Tracker] Failed to initiate click logging:', err);
  }

  // Parse Travelpayouts marker and specific SubID parameters
  let tpMarker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || "534729";
  let tpSubId = "";
  if (subId) {
    const dotIndex = subId.indexOf('.');
    if (dotIndex !== -1) {
      tpMarker = subId.substring(0, dotIndex);
      tpSubId = subId.substring(dotIndex + 1);
    } else {
      tpMarker = subId;
    }
  }

  let finalRedirectUrl = dest;
  let programId = "";

  // Assign corresponding Travelpayouts Program IDs
  if (dest.includes("tripadvisor.com")) {
    programId = "6862";
  } else if (dest.includes("booking.com")) {
    programId = "1525";
  } else if (dest.includes("viator.com")) {
    programId = "2092";
  }

  if (programId) {
    const tpParams = new URLSearchParams({
      marker: tpMarker,
      p: programId,
      u: dest
    });
    if (tpSubId) {
      tpParams.set("subid", tpSubId);
    }
    finalRedirectUrl = `https://tp.media/r?${tpParams.toString()}`;
    console.log(`[Affiliate Tracker] Wrapped affiliate redirect: ${finalRedirectUrl}`);
  }

  return NextResponse.redirect(finalRedirectUrl, 302);
}
