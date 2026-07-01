"use client";

import React, { useState } from 'react';
import { 
  Compass, Mail, User, Shield, CheckCircle, 
  Star, ArrowRight, Eye, EyeOff, Globe, 
  Sparkles, Check, ChevronRight, Play, Lock,
  Calendar, Users, DollarSign, Laptop, MapPin, 
  Phone, HelpCircle, ShieldCheck, Database, FileText, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import AventurLogo from './AventurLogo';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';

interface AventurLandingAuthProps {
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

export default function AventurLandingAuth({ onAuthSuccess }: AventurLandingAuthProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // FAQ Toggle States
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Popular curated destinations
  const popularDestinations = [
    {
      name: "Kyoto Sanctuaries",
      country: "Japan",
      season: "Spring / Autumn",
      cost: "$$$",
      estCost: "$1,850",
      matchScore: 96,
      idealFor: ["Couples", "Food Lovers", "Culture Explorers"],
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Fushimi Inari Torii", "Arashiyama Bamboo Forest", "Zen Gardens"]
    },
    {
      name: "Serengeti Savannah",
      country: "Tanzania",
      season: "Jun - Oct",
      cost: "$$$$",
      estCost: "$2,950",
      matchScore: 94,
      idealFor: ["Adventure Seekers", "Wildlife Enthusiasts"],
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Nile River Crossings", "Big Five Safaris", "Glamping Tents"]
    },
    {
      name: "Machu Picchu Citadel",
      country: "Peru",
      season: "May - Sep",
      cost: "$$",
      estCost: "$1,450",
      matchScore: 91,
      idealFor: ["Hikers", "History Buffs", "Solo Travelers"],
      image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Inca Trail Paths", "Sacred Valley Hikes", "Sun Gate Vibe"]
    },
    {
      name: "Santorini Horizon",
      country: "Greece",
      season: "Jun - Sep",
      cost: "$$$$",
      estCost: "$3,100",
      matchScore: 98,
      idealFor: ["Couples", "Luxury Seekers", "Sun Chasers"],
      image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Oia Caldera Sunset", "Volcano Catamaran", "Blue Dome Villas"]
    },
    {
      name: "Petra Rock Gorges",
      country: "Jordan",
      season: "Mar - May",
      cost: "$$$",
      estCost: "$1,980",
      matchScore: 93,
      idealFor: ["Archaeology Lovers", "Backpackers"],
      image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Al-Khazneh Treasury", "Siq Canyon Walk", "Monastery Trails"]
    },
    {
      name: "Queenstown Alpines",
      country: "New Zealand",
      season: "Nov - Apr",
      cost: "$$$",
      estCost: "$2,650",
      matchScore: 95,
      idealFor: ["Adrenaline Seekers", "Nature Lovers"],
      image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Milford Sound Fiord", "Glacial Lake Cruise", "Adrenaline Jumps"]
    }
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError("Please provide both email address and password.");
      return;
    }
    if (authMode === 'signup' && !name.trim()) {
      setFormError("Please provide your name.");
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const payload = {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email: userCredential.user.email || email.toLowerCase()
        };
        localStorage.setItem('aventur_user_session', JSON.stringify(payload));
        setIsAuthModalOpen(false);
        onAuthSuccess(payload);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const displayName = userCredential.user.displayName || email.split('@')[0];
        const payload = {
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          email: userCredential.user.email || email.toLowerCase()
        };
        localStorage.setItem('aventur_user_session', JSON.stringify(payload));
        setIsAuthModalOpen(false);
        onAuthSuccess(payload);
      }
    } catch (err: any) {
      console.error(err);
      let message = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        message = "Incorrect email address or password.";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "This email address is already registered with another account.";
      }
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In helper
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setFormError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userObj = result.user;
      const payload = {
        name: userObj.displayName || userObj.email?.split('@')[0] || "Traveler",
        email: userObj.email || "unknown@domain.com"
      };
      localStorage.setItem('aventur_user_session', JSON.stringify(payload));
      setIsAuthModalOpen(false);
      onAuthSuccess(payload);
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setFormError(err.message || "Failed to authenticate via Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Instant demo helper
  const triggerDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = { name: "Ojay Explorer", email: "iamojay89@gmail.com" };
      localStorage.setItem('aventur_user_session', JSON.stringify(demoUser));
      setIsAuthModalOpen(false);
      onAuthSuccess(demoUser);
    }, 600);
  };

  const openAuthWithPreselection = (destName: string) => {
    localStorage.setItem('aventur_deep_inspiration', destName);
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="w-full space-y-24 animate-fade-in font-sans text-slate-800 bg-slate-50/50 relative overflow-hidden">
      
      {/* Global CSS styles for floating elements and travel lines */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes subtle-drift {
          0% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(15px) translateY(-5px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        .animate-drift-slow {
          animation: subtle-drift 15s ease-in-out infinite;
        }
      `}} />

      {/* Ambient Travel Decorations Layer (Grids, topographic lines, and animated routes) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f604_1px,transparent_1px),linear-gradient(to_bottom,#3b82f604_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Radial glow effects in top right */}
        <div className="absolute -top-40 right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-[120px]" />
        
        {/* Topographic outline path overlay (low opacity) */}
        <svg className="absolute top-[8%] right-[-5%] w-[700px] h-[700px] text-blue-600/[0.025]" viewBox="0 0 500 500" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M 50,150 C 120,130 220,190 290,140 C 360,110 420,210 490,180" />
          <path d="M 30,190 C 110,160 190,230 280,180 C 350,150 410,240 480,210" />
          <path d="M 10,230 C 100,200 170,270 270,220 C 340,190 400,280 470,250" />
          <path d="M 70,110 C 130,90 230,150 290,110 C 360,80 410,180 480,150" />
          
          {/* Compass rose illustration */}
          <g transform="translate(100, 340)" className="text-blue-600/[0.04]">
            <circle cx="0" cy="0" r="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="-40" y1="0" x2="40" y2="0" stroke="currentColor" strokeWidth="1" />
            <line x1="0" y1="-40" x2="0" y2="40" stroke="currentColor" strokeWidth="1" />
            <polygon points="0,-25 4,-5 0,0 -4,-5" fill="currentColor" />
            <polygon points="0,25 4,5 0,0 -4,5" fill="currentColor" />
            <polygon points="25,0 5,4 0,0 5,-4" fill="currentColor" />
            <polygon points="-25,0 -5,4 0,0 -5,-4" fill="currentColor" />
          </g>
        </svg>

        {/* Animated Flight Route Overlay */}
        <svg className="absolute left-[-15%] top-[30%] w-[130%] h-[500px] text-blue-500/[0.035]" viewBox="0 0 1000 500" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path id="route-line-main" d="M 50,100 C 300,320 680,60 950,420" strokeDasharray="5 7" />
          <g className="text-blue-500/25">
            <animateMotion dur="28s" repeatCount="indefinite">
              <mpath href="#route-line-main" />
            </animateMotion>
            {/* Tiny airplane vector */}
            <path d="M-5,-5 L5,0 L-5,5 L-2,0 Z" fill="currentColor" transform="rotate(35)" />
          </g>
        </svg>
      </div>

      {/* Sticky Header Navbar */}
      <nav className="bg-white/85 backdrop-blur-md border-b border-slate-200 fixed top-0 left-0 w-full z-45 px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <AventurLogo size="sm" showTagline={true} />

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#sample-itinerary" className="hover:text-blue-600 transition">Sample Trip</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Login Button */}
            <button
              onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              id="btn-nav-login"
              className="hidden md:block px-4.5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              Sign In
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="block md:hidden p-2 hover:bg-slate-50 text-slate-700 rounded-xl transition cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Links Dropdown Panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-slate-100 mt-3 pt-3 pb-4 px-2 space-y-3 flex flex-col text-sm font-bold text-slate-650"
            >
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition">How It Works</a>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition">Features</a>
              <a href="#sample-itinerary" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition">Sample Trip</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition">Pricing</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition">FAQ</a>
              <button
                onClick={() => { setIsMobileMenuOpen(false); setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="w-full text-center py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* SECTION 1: HERO SECTION */}
      <section className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left relative z-10" id="hero">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold leading-none select-none">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Introducing Aventtur 2.0</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 font-display leading-[1.08] tracking-tight">
            Plan Your Perfect Trip in Minutes with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-655 leading-relaxed max-w-2xl">
            Stop spending hours researching flights, hotels and activities. Tell Aventtur where you want to go and let AI handle the planning.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              id="btn-hero-primary-cta"
              className="px-7 py-4 bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Start Planning Your Trip</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#sample-itinerary"
              className="px-7 py-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-display font-extrabold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <span>See Example Itinerary</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-8 text-slate-500 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
              <span>50,000+ Journeys Generated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
              <span>Trusted in 40+ Countries</span>
            </div>
          </div>
        </div>

        {/* Product Workspace CSS Mockup */}
        <div className="lg:col-span-5 relative lg:scale-115 lg:translate-x-6 z-10 animate-float" id="hero-preview-workspace">
          {/* Decorative glowing gradient in background */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-20 blur-2xl pointer-events-none" />
          
          <div className="relative bg-slate-900 border border-slate-800 p-4.5 rounded-2xl shadow-2xl space-y-4 text-xs font-mono text-slate-350">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-slate-550 font-bold">AVENTTUR WORKSPACE — LIVE PREVIEW</span>
            </div>

            {/* Simulated UI Content */}
            <div className="space-y-3.5 text-left">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between font-sans text-xs">
                  <span className="font-bold text-white flex items-center gap-1">📍 7 Days in Kyoto, Japan</span>
                  <span className="text-emerald-400 font-bold font-mono">98% Match</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Tailored for historical explorations and local culinary delights at a midrange budget tier.
                </p>
              </div>

              {/* Day item list */}
              <div className="space-y-2 font-sans">
                <div className="bg-slate-850/50 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-900/50 text-blue-400 font-mono font-black text-[10px] flex items-center justify-center shrink-0">D1</span>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-200 block">Morning: Kinkaku-ji Golden Temple Visit</span>
                    <span className="text-[9px] text-slate-400 block">Arrive early to capture pure reflections across mirror ponds.</span>
                  </div>
                </div>
                
                <div className="bg-slate-855/50 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-900/50 text-blue-400 font-mono font-black text-[10px] flex items-center justify-center shrink-0">D2</span>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-200 block">Afternoon: Arashiyama Zen Forest Walk</span>
                    <span className="text-[9px] text-slate-400 block">Wander the peaceful bamboo lanes and explore local tea rooms.</span>
                  </div>
                </div>
              </div>

              {/* Verified partners indicator mockup */}
              <div className="flex gap-2 font-sans text-[10px] font-semibold">
                <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Booking.com Verified</span>
                </div>
                <div className="bg-sky-950/40 border border-sky-900/50 text-sky-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Skyscanner Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="relative py-20 bg-white border-y border-slate-200/60 overflow-hidden" id="how-it-works">
        {/* Subtle background glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 z-10">
          <div className="space-y-3 max-w-2xl mx-auto text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono block">Zero Friction</span>
            <h2 className="text-3xl font-extrabold text-slate-950 font-display tracking-tight">How It Works</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your personalized vacation plan takes three simple steps to assemble.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 border border-slate-200/80 p-6 rounded-2xl text-left space-y-4 hover:border-slate-350 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-xs relative overflow-hidden">
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm select-none">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
              </div>
              <h3 className="text-base font-bold font-display text-slate-950">Tell Us About Your Trip</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide your travel dates, departure city, companion styles, and interests. Specify a concrete destination or let the AI discover options for you.
              </p>
            </div>

            <div className="bg-white/80 border border-slate-200/80 p-6 rounded-2xl text-left space-y-4 hover:border-slate-350 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-xs relative overflow-hidden">
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm select-none">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
              </div>
              <h3 className="text-base font-bold font-display text-slate-950">AI Builds Your Itinerary</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our models analyze flight rates and hotel tiers to produce a customized daily schedule, budget breakdown, and local restaurant/activity suggestions.
              </p>
            </div>

            <div className="bg-white/80 border border-slate-200/80 p-6 rounded-2xl text-left space-y-4 hover:border-slate-350 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-xs relative overflow-hidden">
              <div className="relative inline-block">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm select-none">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
              </div>
              <h3 className="text-base font-bold font-display text-slate-950">Book and Enjoy the Journey</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review verified Booking.com accommodations and Skyscanner flights. Save your itinerary offline, link up with local guides, and travel with peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left relative z-10" id="features">
        <div className="space-y-3 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono block">Complete Travel Suite</span>
          <h2 className="text-3xl font-extrabold text-slate-950 font-display tracking-tight">Everything You Need to Travel Smarter</h2>
          <p className="text-sm text-slate-550 leading-relaxed">
            Aventtur is more than a simple trip planner. It is a full travel optimizer combining AI customization with actual bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/70 border border-slate-200/60 p-6 rounded-2xl space-y-3 hover:border-blue-200/70 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-650 flex items-center justify-center shadow-xs mb-1 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-950">Adaptive Itinerary Generation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Day-by-day schedules mapped dynamically. Request a remix for any specific day to switch activities, change restaurants, or modify hours instantly.
            </p>
          </div>

          <div className="bg-white/70 border border-slate-200/60 p-6 rounded-2xl space-y-3 hover:border-blue-200/70 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-650 flex items-center justify-center shadow-xs mb-1 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-950">Smart Budget Estimation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provides real-time ranges for flights and hotel tiers (budget, mid, luxury) from your origin city, preventing unexpected pricing surprises at checkout.
            </p>
          </div>

          <div className="bg-white/70 border border-slate-200/60 p-6 rounded-2xl space-y-3 hover:border-blue-200/70 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-650 flex items-center justify-center shadow-xs mb-1 group-hover:scale-105 transition-transform">
              <Laptop className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-950">Offline Itinerary Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All saved plans are stored privately in your browser's local cache. Pull up hotel names, tickets, and scheduled routes even with zero network coverage.
            </p>
          </div>

          <div className="bg-white/70 border border-slate-200/60 p-6 rounded-2xl space-y-3 hover:border-blue-200/70 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-650 flex items-center justify-center shadow-xs mb-1 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-950">Accommodation Suggestions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Curated hotel selections with actual rates and attributes linked directly to Booking.com verified portals for secure, transparent reservation checkout.
            </p>
          </div>

          <div className="bg-white/70 border border-slate-200/60 p-6 rounded-2xl space-y-3 hover:border-blue-200/70 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-650 flex items-center justify-center shadow-xs mb-1 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-950">Vetted Local Guides</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Skip tourist traps and crowds. Connect directly with licensed native guides in Rome, Kyoto, Paris and other cities to coordinate customized private tours.
            </p>
          </div>

          <div className="bg-white/70 border border-slate-200/60 p-6 rounded-2xl space-y-3 hover:border-blue-200/70 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-650 flex items-center justify-center shadow-xs mb-1 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-950">Absolute Privacy First</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
              No invasive tracking. We prioritize data encryption and clear settings so you retain complete control over your private journeys and profile inputs.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: SAMPLE AI GENERATED ITINERARY */}
      <section className="bg-slate-900 text-white py-20 text-left relative overflow-hidden" id="sample-itinerary">
        {/* Glow spots in background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          
          {/* User Prompt Input Simulator */}
          <div className="max-w-3xl mx-auto bg-slate-950/80 border border-slate-850 p-5 rounded-3xl shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Traveler Prompt Input</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">V2.0 Engine</span>
            </div>
            
            <div className="flex items-center justify-between gap-4 font-sans">
              <p className="text-sm font-medium text-slate-200">
                "Plan a 7-day trip to Japan for me and my partner. We want a midrange budget focusing on culture, historical temples, and local food spots, departing SFO."
              </p>
              <span className="bg-blue-600 text-white font-display font-black text-[10px] px-3.5 py-1.5 rounded-xl uppercase tracking-wider shrink-0 select-none">
                Sent to AI
              </span>
            </div>
          </div>

          {/* Dotted Flow Connector */}
          <div className="flex flex-col items-center justify-center select-none">
            <div className="h-10 w-px border-r border-dashed border-blue-500/60" />
            <div className="bg-blue-900/40 text-blue-300 border border-blue-800/40 text-[9px] font-black font-mono px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">
              Gemini Concierge Processing
            </div>
            <div className="h-10 w-px border-r border-dashed border-blue-500/60" />
          </div>

          {/* AI Output Workspace columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <div className="lg:col-span-4 space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono block">AI Output Workspace</span>
              <h2 className="text-3xl font-extrabold text-white font-display">Aventtur Itinerary Output</h2>
              <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">
                This is a live output sample representing a curated, midrange trip to Japan. Aventtur combines daily attractions, pricing tiers, flight advice, and hotel links into a single unified workspace.
              </p>
              
              <div className="space-y-3 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Trip Type:</span>
                  <span className="font-bold text-white">Couples Adventure</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Duration:</span>
                  <span className="font-bold text-white">7 Days / 6 Nights</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Estimated Cost:</span>
                  <span className="font-bold text-emerald-450 font-mono">$1,850 - $2,400</span>
                </div>
              </div>

              <button
                onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer select-none"
              >
                Generate Your Own Trip
              </button>
            </div>

            <div className="lg:col-span-8 bg-slate-950/80 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-6">
              {/* Route preview details */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white font-display">7 Days in Japan (Kyoto & Tokyo Highlights)</h3>
                  <span className="text-[10px] text-slate-500 font-mono">ORIGIN: SFO DEPARTURE</span>
                </div>
                <span className="bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-900/60 px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider">
                  Midrange Tier
                </span>
              </div>

              {/* Flight cost advice */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex justify-between font-mono text-[10px] text-slate-400">
                  <span>ESTIMATED FLIGHT COST:</span>
                  <span className="text-white font-bold">$750 - $1,100 / person</span>
                </div>
                <p className="text-[10px] text-slate-455 leading-relaxed font-sans">
                  💡 <strong>Insider Tip:</strong> Book at least 6 weeks in advance. Direct flights from SFO to Haneda are typically cheaper on Tuesdays and Wednesdays. Avoid weekend departures.
                </p>
              </div>

              {/* Itinerary timeline split */}
              <div className="space-y-4 font-sans text-xs">
                <div className="border-l-2 border-blue-500 pl-4 space-y-2 relative">
                  <span className="absolute -left-1.5 top-0 w-3.5 h-3.5 rounded-full bg-blue-500 border-4 border-slate-950" />
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 font-display">
                    Day 1: Arrival & Historic Higashiyama District
                  </h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Morning check-in at hotel. Spend your afternoon wandering the historic cobblestone lanes of Higashiyama. Catch the twilight views around the Yasaka Pagoda and dine at a local noodle spot.
                  </p>
                </div>

                <div className="border-l-2 border-blue-500 pl-4 space-y-2 relative">
                  <span className="absolute -left-1.5 top-0 w-3.5 h-3.5 rounded-full bg-blue-500 border-4 border-slate-950" />
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 font-display">
                    Day 2: Zen Temples & Bamboo Forest Walk
                  </h4>
                  <p className="text-[10px] text-slate-455 leading-relaxed">
                    Start early at Kinkaku-ji (Golden Pavilion), then take the local train to Arashiyama. Explore the peaceful bamboo forest paths and enjoy a traditional matcha tea ceremony.
                  </p>
                </div>
              </div>

              {/* Curated accommodation list */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Curated Accommodations</span>
                <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="font-bold text-slate-250 block font-display">The Thousand Kyoto</span>
                    <span className="text-[10px] text-slate-500 block">Midrange Stay • Free hot breakfast • Steps from station</span>
                  </div>
                  <span className="font-bold text-slate-300 font-mono shrink-0">$185/night</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: DESTINATION INSPIRATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left relative z-10" id="inspirations">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono block">Curated Inspirations</span>
          <h2 className="text-3xl font-extrabold text-slate-950 font-display tracking-tight">Worldwide Handpicked Escapes</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            Choose an inspiration to pre-populate your travel planner parameters. Click "Instant Plan" to launch your AI generator immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDestinations.map((dest) => (
            <div 
              key={dest.name} 
              className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-200/50 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden select-none">
                <img 
                  referrerPolicy="no-referrer"
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                
                {/* AI Match Badge */}
                <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-xs text-white font-mono font-black text-[9px] px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                  {dest.matchScore}% Match
                </div>

                {/* Starting Price Badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs text-emerald-400 font-mono font-bold text-[9.5px] px-2.5 py-1 rounded-lg border border-slate-800">
                  From {dest.estCost}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white text-left">
                  <span className="text-xs font-mono font-bold text-blue-300 block">{dest.country}</span>
                  <h3 className="text-lg font-black font-display tracking-tight leading-none mt-0.5">{dest.name}</h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {dest.highlights.map((tag) => (
                      <span key={tag} className="bg-slate-50 border border-slate-150 text-slate-650 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap">
                        ✦ {tag}
                      </span>
                    ))}
                  </div>

                  {/* Ideal Traveler Profile Bullets */}
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                    <span className="block text-[8.5px] text-slate-400 font-bold uppercase tracking-wider leading-none text-left">Perfect For:</span>
                    <div className="flex flex-col gap-1 text-[10.5px] text-slate-600 font-semibold text-left">
                      {dest.idealFor.map(profile => (
                        <span key={profile} className="flex items-center gap-1">
                          <span className="text-emerald-500 font-bold">✓</span> {profile}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-3 text-slate-500 text-left">
                    <div>
                      <span className="block font-sans text-[9px] text-slate-400 font-bold uppercase leading-none">Best Window</span>
                      <span className="font-bold text-slate-800">{dest.season}</span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <span className="block font-sans text-[9px] text-slate-400 font-bold uppercase leading-none">Cost Level</span>
                      <span className="font-bold text-blue-600">{dest.cost}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAuthWithPreselection(dest.name)}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg font-display font-extrabold text-[10px] transition cursor-pointer flex items-center gap-0.5 shrink-0"
                  >
                    <span>Instant Plan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section className="bg-blue-50/20 border-y border-blue-100/50 py-20 text-left relative z-10" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono block">Traveler Stories</span>
            <h2 className="text-3xl font-extrabold text-slate-950 font-display tracking-tight">Trusted by Adventurers Worldwide</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Read how modern travelers are planning their perfect itineraries and optimizing budgets with our concierge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 border border-slate-200/60 p-6 rounded-2xl space-y-4 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 backdrop-blur-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500 select-none">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 shrink-0" />)}
                </div>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed italic">
                  "Creating our Kyoto honeymoon itinerary manually was taking us weeks. Aventtur planned the whole thing in 40 seconds, selected an exquisite Ryokan in Gion, and our guides were amazing!"
                </p>
              </div>
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    referrerPolicy="no-referrer"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"
                    alt="Jessica & Liam K."
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="text-xs font-black block text-slate-950 font-display">Jessica & Liam K.</span>
                    <span className="text-[10px] text-slate-400 block font-mono">San Francisco, USA</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="bg-blue-50/80 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    📍 Japan
                  </span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    ⏱️ 7 Days
                  </span>
                  <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    💕 Honeymoon
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200/60 p-6 rounded-2xl space-y-4 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 backdrop-blur-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500 select-none">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 shrink-0" />)}
                </div>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed italic">
                  "The day-by-day remix with AI is marvelous. We had heavy rain on Day 3 in Paris, asked the concierge to remodel for indoor museums, and got local gems instead of long queues."
                </p>
              </div>
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    referrerPolicy="no-referrer"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
                    alt="Mathieu B."
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="text-xs font-black block text-slate-950 font-display">Mathieu B.</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Toronto, Canada</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="bg-blue-50/80 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    📍 France
                  </span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    ⏱️ 10 Days
                  </span>
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    🏕️ Solo Explorer
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200/60 p-6 rounded-2xl space-y-4 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 backdrop-blur-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500 select-none">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 shrink-0" />)}
                </div>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed italic">
                  "The cost estimations here are genuinely accurate. Saved us nearly $600 by pointing out shoulder-season booking windows and direct flight structures. Highly recommended!"
                </p>
              </div>
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    referrerPolicy="no-referrer"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
                    alt="Priya M."
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="text-xs font-black block text-slate-950 font-display">Priya M.</span>
                    <span className="text-[10px] text-slate-400 block font-mono">London, UK</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="bg-blue-50/80 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    📍 Morocco
                  </span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    ⏱️ 5 Days
                  </span>
                  <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                    🎒 Budget Saver
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: TRUST SIGNALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-b border-slate-200 select-none">
        <div className="text-center space-y-1">
          <span className="text-3xl font-black text-blue-600 block font-display">50,000+</span>
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Itineraries Generated</span>
        </div>
        <div className="text-center space-y-1 border-y md:border-y-0 md:border-x border-slate-200 py-4 md:py-0">
          <span className="text-3xl font-black text-blue-600 block font-display">40+</span>
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Countries Supported</span>
        </div>
        <div className="text-center space-y-1">
          <span className="text-3xl font-black text-blue-600 block font-display">4.8/5</span>
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Average Satisfaction Score</span>
        </div>
      </section>

      {/* SECTION 8: PRICING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center" id="pricing">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono block">Transparent SaaS Model</span>
          <h2 className="text-3xl font-extrabold text-slate-950 font-display tracking-tight">Flexible Plans for Every Traveler</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Choose the plan that fits your travel style. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col justify-between text-left space-y-6 hover:border-slate-350 transition relative">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Free Explorer</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-950 font-display">$0</span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Perfect for planning a single upcoming trip.
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-6">
              <ul className="space-y-3 text-xs font-medium text-slate-650">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> 1 Itinerary per month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Flight & Hotel cost estimation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Booking.com verified links</li>
                <li className="text-slate-350 flex items-center gap-2 line-through">❌ Offline itinerary access</li>
                <li className="text-slate-350 flex items-center gap-2 line-through">❌ Unlimited daily AI Remixes</li>
              </ul>
            </div>

            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-blue-600 p-8 rounded-3xl flex flex-col justify-between text-left space-y-6 hover:shadow-lg transition relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono font-black px-3.5 py-1 rounded-full text-[9px] uppercase tracking-wider select-none">
              Most Popular
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Pro Traveler</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-950 font-display">$9</span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                For frequent travelers wanting ultimate backup stability.
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-6">
              <ul className="space-y-3 text-xs font-medium text-slate-650">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Unlimited AI Itineraries</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Offline Itinerary Mode</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Unlimited daily AI Remixes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Priority flight cost recommendations</li>
                <li className="text-slate-350 flex items-center gap-2 line-through">❌ 1-on-1 human expert support</li>
              </ul>
            </div>

            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl flex flex-col justify-between text-left space-y-6 hover:border-slate-350 transition relative">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Premium Concierge</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-950 font-display">$29</span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                Includes dedicated 1-on-1 support for complex vacations.
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-6">
              <ul className="space-y-3 text-xs font-medium text-slate-650">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> All Pro Traveler features</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Human travel expert support (1-on-1)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Direct travel agent linkup</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Bespoke reservation booking desks</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Custom vector DB search priority</li>
              </ul>
            </div>

            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-display font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
            >
              Sign Up for Concierge
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 9: FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left" id="faq">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-950 font-display tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Have questions about trust, payments, and data privacy? We have answers.
          </p>
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-6">
          {[
            {
              q: "Is my personal itinerary information private?",
              a: "Yes. Aventtur prioritizes data privacy. All saved plans, ticket coordinates, and travel schedules are stored privately in your browser's secure local IndexedDB database. We never sell or track your search data."
            },
            {
              q: "How does the pricing/payment model work?",
              a: "We offer a Free plan with 1 itinerary per month. The Pro and Premium plans are billed monthly. You can cancel at any time directly in your account settings. Payments are processed securely via SSL encrypted payment gateways."
            },
            {
              q: "Does Aventtur handle hotel or flight booking directly?",
              a: "Aventtur is an AI travel planner and concierge, not a booking platform. We recommend optimal flight departure schedules and certified lodging properties, then link you directly to Skyscanner and Booking.com verified checkout gates to finalize bookings."
            },
            {
              q: "Can I access my travel plans offline?",
              a: "Yes! Pro and Premium members have full offline itinerary mode. Once you save a trip in your workspace, all destination details, checklists, and hotel links are loaded locally and can be viewed anywhere in the world without an internet connection."
            },
            {
              q: "What is your refund policy?",
              a: "We offer a 14-day money-back guarantee for both our Pro and Premium memberships if you are not fully satisfied. Simply reach out to support within the window for a full refund."
            }
          ].map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={idx} className="border-b border-slate-200 pb-3">
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full text-left py-3 flex items-center justify-between font-bold text-slate-900 font-display hover:text-blue-600 transition cursor-pointer text-sm"
                >
                  <span>{item.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition ${isOpen ? 'rotate-90 text-blue-600' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-slate-500 leading-relaxed pb-3 pt-1">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 10: FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-10 md:p-14 text-center space-y-6 shadow-xl relative overflow-hidden flex flex-col items-center">
          {/* Glow spots in background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono block relative z-10">Begin Your Adventure</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white font-display relative z-10 max-w-xl">
            Ready for your next adventure?
          </h2>
          <p className="text-xs sm:text-sm text-slate-350 max-w-md leading-relaxed relative z-10 font-sans">
            Tell us about your trip and let our AI concierge formulate a pristine, ready-to-book itinerary in seconds.
          </p>
          
          <div className="relative z-10 pt-2">
            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              id="btn-final-cta"
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-extrabold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer select-none"
            >
              Generate My Trip
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-500 pt-12 pb-24 md:pb-12 text-xs font-medium text-left relative overflow-hidden">
        {/* Glowing World Map Background Vector */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 select-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
          
          <svg className="absolute w-full h-full text-slate-800" viewBox="0 0 1000 500" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M 0,100 L 1000,100 M 0,200 L 1000,200 M 0,300 L 1000,300 M 0,400 L 1000,400" strokeDasharray="4 8" opacity="0.4" />
            <path d="M 200,0 L 200,500 M 400,0 L 400,500 M 600,0 L 600,500 M 800,0 L 800,500" strokeDasharray="4 8" opacity="0.4" />
            
            <path d="M 250,220 C 350,150 650,150 780,280" stroke="url(#footer-route-grad)" strokeWidth="1.5" strokeDasharray="3 6" />
            <path d="M 250,220 C 150,150 50,350 200,420" stroke="url(#footer-route-grad)" strokeWidth="1.5" strokeDasharray="3 6" />
            <path d="M 780,280 C 850,200 950,250 820,380" stroke="url(#footer-route-grad)" strokeWidth="1.5" strokeDasharray="3 6" />

            <g className="text-blue-500">
              <circle cx="250" cy="220" r="3" fill="currentColor" />
              <circle cx="250" cy="220" r="8" stroke="currentColor" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '250px 220px' }} />
            </g>
            <g className="text-blue-500">
              <circle cx="780" cy="280" r="3" fill="currentColor" />
              <circle cx="780" cy="280" r="8" stroke="currentColor" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '780px 280px' }} />
            </g>
            <g className="text-indigo-400">
              <circle cx="200" cy="420" r="3" fill="currentColor" />
            </g>
            <g className="text-indigo-400">
              <circle cx="820" cy="380" r="3" fill="currentColor" />
            </g>

            <defs>
              <linearGradient id="footer-route-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          <div className="space-y-3">
            <AventurLogo size="sm" showTagline={true} light={true} />
            <p className="text-[10px] text-slate-600 font-sans leading-relaxed">
              Your AI travel concierge, compiling optimal travel details and itineraries in seconds.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-display text-[10px] font-bold uppercase tracking-wider">Product Features</h4>
            <div className="flex flex-col gap-2">
              <a href="#hero" className="hover:text-white transition">Trip Planner</a>
              <a href="#sample-itinerary" className="hover:text-white transition font-mono">Japan 7-Day Demo</a>
              <a href="#features" className="hover:text-white transition">Features Overview</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-display text-[10px] font-bold uppercase tracking-wider">Trust & Security</h4>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Privacy Policy</span>
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Terms of Service</span>
              <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Data Security</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-display text-[10px] font-bold uppercase tracking-wider">Support Desk</h4>
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@aventtur.com</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> FAQ Support Accordion</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-6 mt-8 text-center text-[10px] text-slate-600 font-mono relative z-10">
          © {new Date().getFullYear()} Aventtur AI Concierge Inc. All rights reserved.
        </div>
      </footer>

      {/* Sticky Bottom Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex justify-between items-center md:hidden shadow-lg">
        <div className="flex items-center gap-1.5">
          <AventurLogo size="sm" showTagline={false} />
        </div>
        <button
          onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer select-none"
        >
          Plan My Trip
        </button>
      </div>

      {/* INJECTIVE AUTHENTICATION MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-2xl relative z-10 max-w-md w-full max-h-[90vh] overflow-y-auto"
              id="auth-modal-panel"
            >
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold p-1 hover:bg-slate-50 rounded-lg transition"
                title="Close Portal"
              >
                ✕
              </button>

              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <AventurLogo onlyIcon={true} size="md" />
                <div>
                  <h3 className="text-xl font-display font-extrabold text-slate-900 tracking-tight">
                    {authMode === 'login' ? 'Sign In to Aventtur' : 'Create Your Account'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                    AI Travel Concierge Portal
                  </p>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-150 flex items-center gap-1.5 mb-4 animate-shake" id="auth-modal-error-notif">
                  <span>🚫</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label htmlFor="name-input" className="text-xs font-bold text-slate-550 block">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                      <input
                        id="name-input"
                        type="text"
                        required
                        placeholder="e.g. Liam K."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 placeholder-slate-400 font-sans"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="email-input" className="text-xs font-bold text-slate-550 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                    <input
                      id="email-input"
                      type="email"
                      required
                      placeholder="e.g. traveler@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 placeholder-slate-400 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password-input" className="text-xs font-bold text-slate-550 block">Password</label>
                  <div className="relative">
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 characters passcode"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 placeholder-slate-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  id="btn-modal-auth-submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs font-bold font-display cursor-pointer transition select-none flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span>{isLoading ? 'Accessing Secure Desk...' : authMode === 'login' ? 'Sign In Securely' : 'Create Account'}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4 scale-95" />}
                </button>
              </form>

              <div className="relative my-4 text-center select-none">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-150" />
                <span className="relative bg-white px-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Or access desk via</span>
              </div>

              <div className="space-y-2">
                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-display font-extrabold text-xs cursor-pointer transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Continue with Google</span>
                </button>

                {/* Explore guest demo */}
                <button
                  type="button"
                  onClick={triggerDemoLogin}
                  id="btn-modal-guest-login"
                  className="w-full py-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 text-xs font-bold font-display cursor-pointer transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Explore Guest Account (Demo)</span>
                </button>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs select-none">
                <span className="text-slate-500">
                  {authMode === 'login' ? "Don't have an account?" : 'Already a registered traveler?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setFormError(null);
                  }}
                  className="text-blue-700 hover:underline font-bold cursor-pointer whitespace-nowrap"
                >
                  {authMode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
