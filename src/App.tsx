"use client";

import React, { useState, useEffect } from 'react';
import { Destination, ItineraryDay, RecommendedHotel, UserInputs, VacationPlan } from './types';
import VacationForm from './components/VacationForm';
import DestinationSelector from './components/DestinationSelector';
import ItineraryWorkspace from './components/ItineraryWorkspace';
import SavedPlansList from './components/SavedPlansList';
import AventurLandingAuth from './components/AventurLandingAuth';
import { auth } from './lib/firebase';
import { getUserPlans, getPlanById, saveUserPlan, deleteUserPlan } from './lib/firestoreService';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import { syncPlans } from './lib/syncService';
import { 
  Compass, Luggage, Map, Sparkles, FolderUp, 
  HelpCircle, CheckCircle, Info, PlaneTakeoff, Heart, Globe, LogOut,
  Share2, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activePhase, setActivePhase] = useState<'journal' | 'form' | 'choices' | 'workspace'>('journal');

  // Load plans reactively from Dexie IndexedDB local-first database
  const savedPlans = useLiveQuery(
    async () => {
      if (!user) return [];
      const localPlans = await db.plans
        .where('userEmail')
        .equalsIgnoreCase(user.email)
        .toArray();
      
      // Filter out plans pending deletion and sort by creation date
      return localPlans
        .filter((p) => p.syncStatus !== 'pending-delete')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    [user]
  ) || [];

  const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);
  
  // Dynamic search inputs
  const [userInputs, setUserInputs] = useState<UserInputs | null>(null);
  
  // Results structures
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<RecommendedHotel | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // Loaders and errors
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [remixError, setRemixError] = useState<string | undefined>(undefined);

  // File drag states
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Full stack shared states
  const [sharedPlan, setSharedPlan] = useState<VacationPlan | null>(null);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [shareInfoMessage, setShareInfoMessage] = useState<string | null>(null);

  // Sync users plans list from firestore database
  const fetchUserPlans = async (email: string) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("[App] Fetching remote plans from Firestore...");
        const remotePlans = await getUserPlans(currentUser.uid);
        
        // Merge remote plans into local IndexedDB
        for (const plan of remotePlans) {
          const existingLocal = await db.plans.get(plan.id);
          // If local plan does not exist or remote is newer and local is already synced, update local
          if (!existingLocal || (existingLocal.syncStatus === 'synced')) {
            await db.plans.put({
              ...plan,
              userId: currentUser.uid,
              userEmail: email.toLowerCase(),
              syncStatus: 'synced',
              localUpdatedAt: Date.now()
            });
          }
        }
        // Run background sync for any queued changes
        syncPlans().catch(console.error);
      }
    } catch (err) {
      console.error("Failed to sync plans from Firestore database:", err);
    }
  };

  // Fetch specific shared plan from public link on Mount
  const loadSharedItinerary = async (shareId: string) => {
    setIsLoadingShared(true);
    setShareInfoMessage(null);
    try {
      const data = await getPlanById(shareId);
      if (!data) {
        throw new Error("Shared travel plan not found.");
      }
      setSharedPlan(data);
      
      // Load directly into the interactive Workspace!
      setSelectedDestination(data.destination);
      setSelectedHotel(data.selectedHotel);
      setUserInputs(data.userInputs);
      setItinerary(data.itinerary);
      setActivePlanId(data.id);
      setActivePhase('workspace');
      
      setShareInfoMessage(`🌎 You are viewing a shared travel configuration: "${data.title}" by other adventurer. Choose "Clone Itinerary" above to copy it to your personal workspace!`);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Failed to load public shared destination link.");
    } finally {
      setIsLoadingShared(false);
    }
  };

  // Clone a shared plan into personal Vacation Journal list
  const handleClonePlan = async () => {
    if (!sharedPlan) return;
    
    const cleanId = `plan-cloned-${Date.now()}`;
    const clonedObj: VacationPlan = {
      ...sharedPlan,
      id: cleanId,
      title: `Cloned: ${sharedPlan.title}`,
      createdAt: new Date().toISOString()
    };

    const currentUser = auth.currentUser;
    const isOnline = typeof window !== 'undefined' && navigator.onLine;

    // Save locally to Dexie IndexedDB
    await db.plans.put({
      ...clonedObj,
      userId: currentUser?.uid || 'guest',
      userEmail: currentUser?.email?.toLowerCase() || 'guest',
      syncStatus: isOnline && currentUser ? 'synced' : 'pending-save',
      localUpdatedAt: Date.now()
    });

    setActivePlanId(cleanId);

    if (isOnline && currentUser) {
      try {
        await saveUserPlan(currentUser.uid, currentUser.email || '', clonedObj);
      } catch (e) {
        console.error("Failed to sync cloned plan to Firestore:", e);
        await db.plans.update(cleanId, { syncStatus: 'pending-save' });
      }
    }

    setSharedPlan(null); // Now editing user's active clone
    setShareInfoMessage("🎉 Successfully cloned this beautiful itinerary to your custom Vacation Journal!");
  };

  // Sync state on Mount & parse shared itinerary query params
  useEffect(() => {
    try {
      const persistedUser = localStorage.getItem('aventur_user_session');
      if (persistedUser) {
        const parsedUser = JSON.parse(persistedUser);
        setUser(parsedUser);
        // Sync user list directly from database
        fetchUserPlans(parsedUser.email);
      }

      // Detect and process public shared links
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      if (shareId) {
        loadSharedItinerary(shareId);
      }
    } catch (e) {
      console.error("Local storage read error on mounting:", e);
    }
  }, []);

  // Sync state dynamically with real Firebase Auth credentials
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const parsed = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Traveler",
          email: firebaseUser.email || ""
        };
        setUser(parsed);
        localStorage.setItem('aventur_user_session', JSON.stringify(parsed));
        fetchUserPlans(parsed.email);
      }
    });
    return () => unsubscribe();
  }, []);

  //savePlansToLocal removed since we use Dexie hooks

  // Submission of prompt to search choices
  const handleFormSubmit = async (inputs: UserInputs) => {
    setIsLoading(true);
    setErrorHeader(null);
    setUserInputs(inputs);

    try {
      const res = await fetch("/api/find-destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search destinations from server.");
      }
      
      setDestinations(data);
      setActivePhase('choices');
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Something went wrong. Please confirm your API key is correctly configured.");
    } finally {
      setIsLoading(false);
    }
  };

  // Launch of Itinerary generation
  const handleDestinationSelect = async (destination: Destination, hotel: RecommendedHotel) => {
    if (!userInputs) return;
    setIsGeneratingItinerary(true);
    setErrorHeader(null);
    setSelectedDestination(destination);
    setSelectedHotel(hotel);

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          userInputs,
          selectedHotel: hotel
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assemble the itinerary.");
      }

      setItinerary(data);
      setActivePlanId(null); // Fresh planning iteration
      setActivePhase('workspace');
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Failed to craft your day-by-day plan. Please retry.");
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  // AI Remix of a single day
  const handleRemixDay = async (dayNumber: number, remixInstructions: string) => {
    if (!selectedDestination || !itinerary || !userInputs) return;
    setIsRemixing(true);
    setRemixError(undefined);

    try {
      const activeIdx = dayNumber - 1;
      const currentDayData = itinerary[activeIdx];
      
      const res = await fetch("/api/remix-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationName: selectedDestination.name,
          dayNumber,
          currentDayData,
          remixPrompt: remixInstructions,
          userInputs
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revise Day " + dayNumber);
      }

      const updatedItinerary = itinerary.map((d) => 
        d.dayNumber === dayNumber ? data : d
      );
      setItinerary(updatedItinerary);
    } catch (err: any) {
      console.error(err);
      setRemixError(err.message || "Could not remix this day. Try a simpler prompt.");
    } finally {
      setIsRemixing(false);
    }
  };

  // Save active vacation plan to Local Journals with IndexedDB local-first storage & sync
  const handleSavePlan = async (title: string, updatedDays: ItineraryDay[]) => {
    if (!selectedDestination || !selectedHotel || !userInputs) return;

    const planId = activePlanId || `plan-${Date.now()}`;
    const refreshedPlan: VacationPlan = {
      id: planId,
      title,
      destination: selectedDestination,
      selectedHotel,
      daysCount: userInputs.duration,
      itinerary: updatedDays,
      userInputs,
      createdAt: new Date().toISOString()
    };

    const currentUser = auth.currentUser;
    const isOnline = typeof window !== 'undefined' && navigator.onLine;

    // Save locally to Dexie IndexedDB
    await db.plans.put({
      ...refreshedPlan,
      userId: currentUser?.uid || 'guest',
      userEmail: currentUser?.email?.toLowerCase() || 'guest',
      syncStatus: isOnline && currentUser ? 'synced' : 'pending-save',
      localUpdatedAt: Date.now()
    });

    setActivePlanId(planId);

    // Sync saved plans to backend database if user is logged in and online
    if (isOnline && currentUser) {
      try {
        await saveUserPlan(currentUser.uid, currentUser.email || '', refreshedPlan);
      } catch (e) {
        console.error("Failed to sync plan to Firestore on write:", e);
        // Set syncStatus back to pending-save so background sync retries later
        await db.plans.update(planId, { syncStatus: 'pending-save' });
      }
    }
  };

  // Load old vacation from list
  const handleLoadPlan = (plan: VacationPlan) => {
    // Clear shared state since we load a personal saved copy
    setSharedPlan(null);
    setShareInfoMessage(null);
    setSelectedDestination(plan.destination);
    setSelectedHotel(plan.selectedHotel);
    setUserInputs(plan.userInputs);
    setItinerary(plan.itinerary);
    setActivePlanId(plan.id);
    setActivePhase('workspace');
  };

  // Delete plan card and sync with backend
  const handleDeletePlan = async (id: string) => {
    const currentUser = auth.currentUser;
    const isOnline = typeof window !== 'undefined' && navigator.onLine;

    if (activePlanId === id) {
      setActivePlanId(null);
    }

    if (isOnline && currentUser) {
      try {
        await deleteUserPlan(id);
        await db.plans.delete(id);
      } catch (e) {
        console.error("Failed to delete plan on Firestore, marking pending-delete:", e);
        await db.plans.update(id, { syncStatus: 'pending-delete' });
      }
    } else {
      // Offline or guest - mark for deletion sync
      const plan = await db.plans.get(id);
      if (plan) {
        if (plan.syncStatus === 'pending-save') {
          // Never synced to Firestore, delete locally immediately
          await db.plans.delete(id);
        } else {
          // Mark pending-delete to propagate to Firestore later
          await db.plans.update(id, { syncStatus: 'pending-delete' });
        }
      }
    }
  };

  // Parse backup travel JSON input safely
  const handleImportJSON = async (fileText: string) => {
    try {
      const obj = JSON.parse(fileText);
      // basic validate
      if (obj.destination && obj.localDays && obj.selectedHotel && obj.userInputs) {
        const parsedPlan: VacationPlan = {
          id: obj.id || `plan-${Date.now()}`,
          title: obj.tripTitle || `${obj.userInputs.duration}-Day Escape in ${obj.destination.name}`,
          destination: obj.destination,
          selectedHotel: obj.selectedHotel,
          daysCount: obj.userInputs.duration,
          itinerary: obj.localDays,
          userInputs: obj.userInputs,
          createdAt: obj.createdAt || new Date().toISOString()
        };

        const currentUser = auth.currentUser;
        const isOnline = typeof window !== 'undefined' && navigator.onLine;

        // Save locally to Dexie IndexedDB
        await db.plans.put({
          ...parsedPlan,
          userId: currentUser?.uid || 'guest',
          userEmail: currentUser?.email?.toLowerCase() || 'guest',
          syncStatus: isOnline && currentUser ? 'synced' : 'pending-save',
          localUpdatedAt: Date.now()
        });

        handleLoadPlan(parsedPlan);

        if (isOnline && currentUser) {
          try {
            await saveUserPlan(currentUser.uid, currentUser.email || '', parsedPlan);
          } catch (e) {
            console.error("Failed to sync imported plan to Firestore:", e);
            await db.plans.update(parsedPlan.id, { syncStatus: 'pending-save' });
          }
        }
      } else {
        throw new Error("JSON file missing required traveler fields (itinerary, selected hotel, inputs).");
      }
    } catch (err: any) {
      console.error(err);
      alert("Invalid files. Please upload a valid JSON backup file created by this planner.");
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleImportJSON(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleImportJSON(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col font-sans">
      
      {/* Brand Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div 
            onClick={() => { if (user) setActivePhase('journal'); }} 
            className={`flex items-center gap-2 group ${user ? 'cursor-pointer' : 'cursor-default'}`}
            id="brand-navigation-logo"
          >
            <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Compass className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-slate-950 tracking-tight block flex items-center gap-1.5 leading-none">
                Aventur
                {isOffline && (
                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse inline-block leading-none">
                    Offline
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-widest leading-none mt-0.5">AI Vacation Concierge</span>
            </div>
          </div>

          {/* Quick Nav elements / authenticated profile state */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setActivePhase('journal')}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activePhase === 'journal' ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  <Luggage className="w-4 h-4 shrink-0" />
                  <span className="font-sans whitespace-nowrap hidden md:inline">Diary Journal</span>
                </button>
                <button
                  onClick={() => {
                    setUserInputs(null);
                    setDestinations([]);
                    setActivePhase('form');
                  }}
                  className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activePhase === 'form' ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  <PlaneTakeoff className="w-4 h-4 shrink-0" />
                  <span className="font-sans whitespace-nowrap hidden md:inline">Plan Vacation</span>
                </button>
              </nav>

              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 sm:pl-3">
                <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-xl flex items-center gap-1 select-none max-w-[90px] sm:max-w-[130px] truncate">
                  👤 <span className="truncate">{user.name}</span>
                </span>
                <button
                  onClick={() => {
                    auth.signOut().catch(console.error);
                    localStorage.removeItem('aventur_user_session');
                    setUser(null);
                    setUserInputs(null);
                    setDestinations([]);
                    setActivePhase('journal');
                  }}
                  title="Sign Out"
                  id="btn-header-logout"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1 text-xs font-bold shrink-0"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline leading-none">Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs select-none">
              <span className="text-slate-400 font-bold hidden sm:inline tracking-wider uppercase text-[10px]">Secure Access Desk</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse align-middle ml-1" />
            </div>
          )}
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Error alert billboard */}
        {errorHeader && (() => {
          const isLeaked = errorHeader.includes("YOUR_API_KEY_LEAKED") || errorHeader.toLowerCase().includes("leaked");
          const isInvalid = errorHeader.includes("INVALID_API_KEY") || errorHeader.toLowerCase().includes("invalid");
          
          if (isLeaked) {
            return (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row items-start gap-4 shadow-md font-sans animate-fade-in" id="error-billboard">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xl font-bold border border-amber-200 header-alert-icon">
                  ⚠️
                </div>
                <div className="space-y-3">
                  <h4 className="text-base font-extrabold text-amber-950 font-display">Gemini API Key Disabled (Leaked Key detected)</h4>
                  <p className="text-sm text-amber-800 leading-relaxed max-w-3xl">
                    Google automatically disabled the configured Gemini API key because it has been flagged as publicly leaked (e.g., posted on GitHub or in public web client code).
                  </p>
                  
                  <div className="bg-white/80 border border-amber-100 p-4 rounded-xl text-xs text-amber-900 space-y-2">
                    <p className="font-bold text-amber-950">How to configure your custom API key:</p>
                    <ol className="list-decimal pl-5 space-y-1 text-slate-755">
                      <li>Generate a fresh API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Google AI Studio Secrets Console</a>.</li>
                      <li>In this workstation, click on the **Settings** gear icon (top-right corner).</li>
                      <li>Under **Secrets**, edit or add <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY</code> and insert your new key.</li>
                      <li>Click Save and reload/retry planning!</li>
                    </ol>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={() => setErrorHeader(null)}
                      className="text-xs font-bold text-amber-950 hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 transition"
                    >
                      Dismiss Instruction
                    </button>
                    <span className="text-[11px] text-amber-600 font-medium">Secure server-side API is ready to accept your new key.</span>
                  </div>
                </div>
              </div>
            );
          }
          
          if (isInvalid) {
            return (
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col md:flex-row items-start gap-4 shadow-md font-sans animate-fade-in" id="error-billboard">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xl font-bold border border-red-200 header-alert-icon">
                  🚫
                </div>
                <div className="space-y-3">
                  <h4 className="text-base font-extrabold text-red-950 font-display">Invalid Gemini API Key</h4>
                  <p className="text-sm text-red-800 leading-relaxed max-w-3xl">
                    The Gemini API returned an error stating that your API key is invalid or copied incorrectly.
                  </p>
                  
                  <div className="bg-white/80 border border-red-100 p-4 rounded-xl text-xs text-red-900 space-y-2">
                    <p className="font-bold text-red-950">Instructions to resolve:</p>
                    <ol className="list-decimal pl-5 space-y-1 text-slate-755">
                      <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">Google AI Studio Keys panel</a> and copy your active key.</li>
                      <li>Click the **Settings** gear icon in this window's top-right corner.</li>
                      <li>Under **Secrets**, set/update <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY</code> with the correct copied value.</li>
                      <li>Click Save and retry your action.</li>
                    </ol>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={() => setErrorHeader(null)}
                      className="text-xs font-bold text-red-950 hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
                    >
                      Dismiss Warning
                    </button>
                    <span className="text-[11px] text-red-600 font-medium">Verify there are no leading/trailing spaces or typos in your secret definition.</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-3 shadow-sm font-sans" id="error-billboard">
              <div className="w-8 h-8 rounded-lg bg-red-150 text-red-700 flex items-center justify-center shrink-0 font-bold text-lg border border-red-200 header-alert-icon">
                !
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-950">Concierge Service Issue</h4>
                <p className="text-xs text-red-800 leading-normal mt-0.5">{errorHeader}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    onClick={() => setErrorHeader(null)}
                    className="text-xs font-bold text-red-950 hover:underline cursor-pointer"
                  >
                    Dismiss warning
                  </button>
                  <span className="text-[10px] text-red-400">Please verify your secrets panel credentials.</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Phase router viewports with animations */}
        <AnimatePresence mode="wait">
          
          {isLoadingShared ? (
            <div className="w-full flex flex-col justify-center items-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-mono text-slate-500">Retrieving shared travel itinerary...</p>
            </div>
          ) : !user && !sharedPlan ? (
            <motion.div
              key="auth-landing-view"
              initial={{ opacity: 0, scale: 0.99, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -15 }}
              className="w-full"
            >
              <AventurLandingAuth onAuthSuccess={(profile) => {
                setUser(profile);
                setActivePhase('journal');
                // Fetch saved items on successful login
                fetchUserPlans(profile.email);
              }} />
            </motion.div>
          ) : (
            <div className="w-full space-y-6">
              {/* Share Info Notification Alert */}
              {shareInfoMessage && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl flex items-center justify-between gap-4 font-sans text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌎</span>
                    <span className="font-medium">{shareInfoMessage}</span>
                  </div>
                  <button
                    onClick={() => setShareInfoMessage(null)}
                    className="text-blue-500 hover:text-blue-700 font-bold px-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Phase 0: The journal diary */}
              {activePhase === 'journal' && (
                <motion.div
                  key="journal-phase"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  className="space-y-8"
                >
                  {/* Journal Hero Billboard */}
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12">
                      <Globe className="w-64 h-64 text-blue-500/5 animate-spin-slow" />
                    </div>
                    
                    <div className="space-y-4 max-w-2xl relative z-10">
                      <div className="inline-flex items-center gap-1 bg-white/10 text-white px-2.5 py-1 rounded-full text-xs font-bold font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        <span>Next-gen vacation planner</span>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">Your Personalized Escape, Perfected by AI</h1>
                      <p className="text-sm md:text-base text-slate-350 leading-relaxed font-sans">
                        Set your matching travel guidelines, search cheapest pricing structures, choose lodging tiers, and customized dynamic itineraries – fully stored details preserved offline in your customized journey journal.
                      </p>
                      <div>
                        <button
                          onClick={() => setActivePhase('form')}
                          id="btn-journal-plan-now"
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer active:scale-98 whitespace-nowrap"
                        >
                          Plan New Vacation
                        </button>
                      </div>
                    </div>

                    {/* Drag and Drop uploader widget for backup files */}
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center select-none cursor-pointer transition relative z-10 w-full md:w-80 flex flex-col justify-center items-center gap-2 ${
                        isDraggingFile 
                          ? 'border-blue-500 bg-blue-950/20' 
                          : 'border-white/10 background-blur-md hover:border-white/20'
                      }`}
                      onClick={() => document.getElementById('backup-file-picker')?.click()}
                    >
                      <label htmlFor="backup-file-picker" className="cursor-pointer flex flex-col items-center">
                        <FolderUp className="w-8 h-8 text-blue-400 mb-2" />
                        <span className="text-xs font-bold text-white block font-display">Import Travel Backup</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5 leading-normal">
                          Drag & drop your saved trip .json file here, or click to choose from system files.
                        </span>
                      </label>
                      <input
                        id="backup-file-picker"
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Saved trip cards list */}
                  <SavedPlansList
                    plans={savedPlans}
                    onSelect={handleLoadPlan}
                    onDelete={handleDeletePlan}
                    onNewTrip={() => setActivePhase('form')}
                  />
                </motion.div>
              )}

              {/* Phase 1: Input Preferences Questionnaire */}
              {activePhase === 'form' && (
                <VacationForm
                  onSubmit={handleFormSubmit}
                  isLoading={isLoading}
                />
              )}

              {/* Phase 2: Matches selector slider */}
              {activePhase === 'choices' && (
                <DestinationSelector
                  destinations={destinations}
                  onBack={() => setActivePhase('form')}
                  onSelect={handleDestinationSelect}
                  isGeneratingItinerary={isGeneratingItinerary}
                />
              )}

              {/* Phase 3: Interactive Itinerary Workspace */}
              {activePhase === 'workspace' && selectedDestination && selectedHotel && userInputs && (
                <ItineraryWorkspace
                  destination={selectedDestination}
                  selectedHotel={selectedHotel}
                  userInputs={userInputs}
                  itinerary={itinerary}
                  onBack={() => {
                    if (user) {
                      setActivePhase('journal');
                    } else {
                      // Exit public viewer mode back to signing desk
                      setSharedPlan(null);
                      setShareInfoMessage(null);
                      setActivePhase('journal');
                    }
                  }}
                  onSavePlan={handleSavePlan}
                  onRemixDay={handleRemixDay}
                  isRemixing={isRemixing}
                  remixError={remixError}
                  isSharedView={!!sharedPlan}
                  onClonePlan={handleClonePlan}
                  userLoggedIn={!!user}
                />
              )}
            </div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer credits and details */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Aventur Companion Services. All customized routes structured via elite Gemini 3.5 Models.</p>
        </div>
      </footer>

    </div>
  );
}
