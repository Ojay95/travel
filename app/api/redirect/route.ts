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

  // Determine partner brand
  let brand = 'External';
  if (dest.includes('skyscanner.com')) brand = 'Skyscanner';
  else if (dest.includes('booking.com')) brand = 'Booking.com';
  else if (dest.includes('viator.com')) brand = 'Viator';
  else if (dest.includes('yelp.com')) brand = 'Yelp';
  else {
    try {
      brand = new URL(dest).hostname.replace('www.', '');
    } catch {
      brand = 'External';
    }
  }

  console.log(`[Affiliate Tracker] Redirecting: ${brand} | Dest: ${dest} | SubID: ${subId || 'none'} | Payout: $${payout}`);

  // Write click tracking details to Firestore server-side
  try {
    const clicksRef = collection(db, 'affiliate_clicks');
    await addDoc(clicksRef, {
      dest,
      subId: subId || 'none',
      destinationCity,
      travelType,
      session,
      payout,
      brand,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Affiliate Tracker] Failed to log click to Firestore:', err);
    // Proceed to redirect anyways so traveler experience is not interrupted
  }

  return NextResponse.redirect(dest, 302);
}
