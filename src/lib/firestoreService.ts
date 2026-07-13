import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { VacationPlan } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetch all vacations belonging to the specified user from Firestore
 */
export async function getUserPlans(userId: string): Promise<VacationPlan[]> {
  const path = 'plans';
  try {
    const plansRef = collection(db, path);
    const q = query(plansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const plans: VacationPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push(docSnap.data() as VacationPlan);
    });
    return plans;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Retrieve a specific plan by its public identifier
 */
export async function getPlanById(planId: string): Promise<VacationPlan | null> {
  const path = `plans/${planId}`;
  try {
    const docRef = doc(db, 'plans', planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as VacationPlan;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Persist or update a traveler's plan in Firestore
 */
export async function saveUserPlan(userId: string, userEmail: string, plan: VacationPlan): Promise<void> {
  const path = `plans/${plan.id}`;
  try {
    const docRef = doc(db, 'plans', plan.id);
    const payload = {
      ...plan,
      userId,
      userEmail,
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a specific traveler's plan from Firestore
 */
export async function deleteUserPlan(planId: string): Promise<void> {
  const path = `plans/${planId}`;
  try {
    const docRef = doc(db, 'plans', planId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Log user page views, traffic referrers, devices, and countries/cities
 */
export async function logTrafficEvent(userId: string): Promise<void> {
  const path = 'traffic_logs';
  try {
    if (typeof window === 'undefined') return;

    const referrer = document.referrer || 'Direct';
    const pathName = window.location.pathname;
    const userAgent = navigator.userAgent;

    // Filter out internal admin navigation from general traveler traffic logs if needed
    if (pathName.startsWith('/admin')) return;

    // 1. Categorize traffic source
    let source = 'Direct';
    if (referrer.includes('google.com')) source = 'Google Search';
    else if (referrer.includes('bing.com') || referrer.includes('yahoo.com')) source = 'Organic Search';
    else if (referrer.includes('t.co') || referrer.includes('twitter.com') || referrer.includes('x.com')) source = 'Twitter/X';
    else if (referrer.includes('facebook.com') || referrer.includes('fb.me')) source = 'Facebook';
    else if (referrer.includes('instagram.com')) source = 'Instagram';
    else if (referrer.includes('linkedin.com')) source = 'LinkedIn';
    else if (referrer.includes('producthunt.com')) source = 'Product Hunt';
    else if (referrer !== 'Direct' && referrer !== '') {
      try {
        source = new URL(referrer).hostname;
      } catch {
        source = referrer;
      }
    }

    // 2. Detect device type
    let device = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = 'Tablet';
    }

    // 3. Resolve country and city using free IP API (timeout after 2.5s to prevent blocking UI)
    let country = 'Unknown';
    let countryCode = 'UN';
    let city = 'Unknown';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        country = data.countryName || 'Unknown';
        countryCode = data.countryCode || 'UN';
        city = data.cityName || 'Unknown';
      }
    } catch (e) {
      console.warn('Geotargeting lookup skipped or failed:', e);
    }

    // 4. Save entry to Firestore
    const trafficRef = collection(db, path);
    await addDoc(trafficRef, {
      userId,
      referrer,
      source,
      device,
      country,
      countryCode,
      city,
      path: pathName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging traffic event:', error);
  }
}

/**
 * Fetch traffic logs for the admin dashboard
 */
export async function getTrafficLogs(limitCount = 100): Promise<any[]> {
  const path = 'traffic_logs';
  try {
    const trafficRef = collection(db, path);
    const q = query(trafficRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching traffic logs:', error);
    return [];
  }
}

/**
 * Fetch affiliate click logs for the admin dashboard
 */
export async function getAffiliateClicks(limitCount = 150): Promise<any[]> {
  const path = 'affiliate_clicks';
  try {
    const clicksRef = collection(db, path);
    const q = query(clicksRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const clicks: any[] = [];
    querySnapshot.forEach((docSnap) => {
      clicks.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return clicks;
  } catch (error) {
    console.error('Error fetching affiliate clicks:', error);
    return [];
  }
}

/**
 * Clear all records in traffic_logs and affiliate_clicks collections
 */
export async function clearLogs(): Promise<void> {
  try {
    const trafficRef = collection(db, 'traffic_logs');
    const clicksRef = collection(db, 'affiliate_clicks');

    const trafficSnap = await getDocs(trafficRef);
    const clicksSnap = await getDocs(clicksRef);

    const promises: Promise<void>[] = [];
    trafficSnap.forEach((docSnap) => {
      promises.push(deleteDoc(doc(db, 'traffic_logs', docSnap.id)));
    });
    clicksSnap.forEach((docSnap) => {
      promises.push(deleteDoc(doc(db, 'affiliate_clicks', docSnap.id)));
    });

    await Promise.all(promises);
    console.log('[Firestore Service] Cleared logs successfully.');
  } catch (error) {
    console.error('[Firestore Service] Error clearing logs:', error);
    throw error;
  }
}

/**
 * Seed realistic demo data for the admin dashboard
 */
export async function seedDemoData(): Promise<void> {
  try {
    // Clear first to prevent piling up of duplicate mock data
    await clearLogs();

    const trafficRef = collection(db, 'traffic_logs');
    const clicksRef = collection(db, 'affiliate_clicks');

    // Cities / Countries configuration
    const locations = [
      { country: 'United States', countryCode: 'US', cities: ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'] },
      { country: 'United Kingdom', countryCode: 'GB', cities: ['London', 'Manchester', 'Edinburgh', 'Birmingham'] },
      { country: 'Japan', countryCode: 'JP', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'] },
      { country: 'Germany', countryCode: 'DE', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'] },
      { country: 'France', countryCode: 'FR', cities: ['Paris', 'Lyon', 'Marseille', 'Nice'] },
      { country: 'Canada', countryCode: 'CA', cities: ['Toronto', 'Vancouver', 'Montreal'] },
      { country: 'Australia', countryCode: 'AU', cities: ['Sydney', 'Melbourne', 'Brisbane'] },
      { country: 'Nigeria', countryCode: 'NG', cities: ['Lagos', 'Abuja'] },
      { country: 'Singapore', countryCode: 'SG', cities: ['Singapore'] },
      { country: 'India', countryCode: 'IN', cities: ['Mumbai', 'Bangalore', 'New Delhi'] }
    ];

    const referrers = [
      { source: 'Direct', referrer: 'Direct' },
      { source: 'Google Search', referrer: 'https://www.google.com/' },
      { source: 'Twitter/X', referrer: 'https://t.co/aventur' },
      { source: 'Product Hunt', referrer: 'https://www.producthunt.com/posts/aventur' },
      { source: 'LinkedIn', referrer: 'https://www.linkedin.com/feed/' },
      { source: 'Facebook', referrer: 'https://l.facebook.com/' },
      { source: 'Instagram', referrer: 'https://instagram.com/' }
    ];

    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const paths = ['/', '/plans', '/journal'];

    const brands = ['Booking.com', 'Google Flights', 'Viator', 'Yelp'];
    const destinations = ['Tokyo', 'Paris', 'London', 'New York', 'Rome', 'Cape Town', 'Kyoto', 'Berlin'];
    const travelTypes = [
      { type: 'flight', payout: 1.50 },
      { type: 'hotel', payout: 55.00 },
      { type: 'activity', payout: 8.50 },
      { type: 'food', payout: 1.50 },
      { type: 'guide', payout: 18.50 },
      { type: 'supporter', payout: 15.00 }
    ];

    const now = new Date();

    // 1. Seed 30 Traffic Logs
    const trafficPromises: Promise<any>[] = [];
    for (let i = 0; i < 30; i++) {
      // Randomize location
      const locIndex = Math.floor(Math.random() * locations.length);
      const loc = locations[locIndex];
      const city = loc.cities[Math.floor(Math.random() * loc.cities.length)];

      // Randomize referrer
      const refObj = referrers[Math.floor(Math.random() * referrers.length)];

      // Randomize device (skew towards desktop/mobile)
      const deviceRandom = Math.random();
      const device = deviceRandom < 0.45 ? 'Desktop' : (deviceRandom < 0.90 ? 'Mobile' : 'Tablet');

      // Randomize timestamp (spread over past 24 hours)
      const minutesAgo = Math.floor(Math.random() * 1440); // 24 hours
      const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

      const pathName = paths[Math.floor(Math.random() * paths.length)];
      const userId = 'sess_demo_' + Math.random().toString(36).substring(2, 8);

      trafficPromises.push(addDoc(trafficRef, {
        userId,
        referrer: refObj.referrer,
        source: refObj.source,
        device,
        country: loc.country,
        countryCode: loc.countryCode,
        city,
        path: pathName,
        timestamp
      }));
    }

    // 2. Seed 15 Affiliate Clicks
    const clickPromises: Promise<any>[] = [];
    for (let i = 0; i < 15; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const destCity = destinations[Math.floor(Math.random() * destinations.length)];
      const tTypeObj = travelTypes[Math.floor(Math.random() * travelTypes.length)];
      
      let destUrl = '';
      if (brand === 'Booking.com') {
        destUrl = `https://www.booking.com/searchresults.html?city=${destCity.toLowerCase()}`;
      } else if (brand === 'Google Flights') {
        destUrl = `https://www.google.com/travel/flights?q=Flights+to+${destCity}`;
      } else if (brand === 'Viator') {
        destUrl = `https://www.viator.com/search/${destCity}`;
      } else {
        destUrl = `https://www.yelp.com/search?find_desc=Restaurants&find_loc=${destCity}`;
      }

      const session = 'sess_demo_' + Math.random().toString(36).substring(2, 8);
      const subId = `${destCity.toLowerCase()}_${tTypeObj.type}_${session}`;

      const minutesAgo = Math.floor(Math.random() * 1440);
      const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

      clickPromises.push(addDoc(clicksRef, {
        dest: destUrl,
        subId,
        destinationCity: destCity,
        travelType: tTypeObj.type,
        session,
        payout: tTypeObj.payout,
        brand,
        timestamp
      }));
    }

    await Promise.all([...trafficPromises, ...clickPromises]);
    console.log('[Firestore Service] Seeded demo data successfully.');
  } catch (error) {
    console.error('[Firestore Service] Error seeding demo data:', error);
    throw error;
  }
}
