import React, { useState } from 'react';
import { 
  Compass, Mail, User, Shield, CheckCircle, 
  Star, ArrowRight, Eye, EyeOff, Globe, 
  Sparkles, Check, ChevronRight, ListCollapse, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AventurLandingAuthProps {
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

export default function AventurLandingAuth({ onAuthSuccess }: AventurLandingAuthProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Popular Destinations lists representation from all over the world
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const popularDestinations = [
    {
      name: "Kyoto Sanctuaries",
      country: "Japan",
      region: "Asia",
      tagline: "Golden pavilions, traditional tea ceremonies & quiet bamboo groves.",
      season: "Oct - May",
      cost: "$$$",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Fushimi Inari Torii", "Arashiyama Forest", "Tofuku-ji Zen Gardens"]
    },
    {
      name: "Serengeti Savannah",
      country: "Tanzania",
      region: "Africa",
      tagline: "Behold the legendary great migration across golden native plains.",
      season: "Jun - Oct",
      cost: "$$$$",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Hot Air Hotspots", "Mara River Crossing", "Big Five Safaris"]
    },
    {
      name: "Machu Picchu Citadel",
      country: "Peru",
      region: "Americas",
      tagline: "Uncover mysterious Incan cities suspended in high mountain mist.",
      season: "May - Sep",
      cost: "$$",
      image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Inca Trail Paths", "Sacred Valley Walks", "Huayna Picchu Peak"]
    },
    {
      name: "Petra Sandstone Gorges",
      country: "Jordan",
      region: "Middle East",
      tagline: "Walk deep sandstone canyons to marvel at temples carved in cliffs.",
      season: "Mar - May",
      cost: "$$$",
      image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Al-Khazneh Treasury", "Siq Narrow Gorges", "Monastery Ridge Trails"]
    },
    {
      name: "Santorini Horizon",
      country: "Greece",
      region: "Europe",
      tagline: "Iconic azure-domed villas perched above high volcanic clifftops.",
      season: "Jun - Sep",
      cost: "$$$$",
      image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Oia Golden Sunsets", "Acrotiri Excavations", "Caldera Catamaran"]
    },
    {
      name: "Queenstown Alpines",
      country: "New Zealand",
      region: "Oceania",
      tagline: "Azure glacial lakes framed by towering peaks & pure adrenaline.",
      season: "Nov - Apr",
      cost: "$$$",
      image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&h=400&q=80",
      highlights: ["Milford Sound Fiord", "Coronet Peak Trails", "Shotover Jet Loop"]
    }
  ];

  const filteredDestinations = regionFilter === 'All' 
    ? popularDestinations 
    : popularDestinations.filter(d => d.region === regionFilter);

  const handleDeepPlan = (destName: string) => {
    setIsLoading(true);
    // Dynamically sign in and save deep plan flag for instant convenience response
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = { name: "Ojay Explorer", email: "iamojay89@gmail.com" };
      localStorage.setItem('aventur_user_session', JSON.stringify(demoUser));
      // Save deep link value so components can auto fill or focus
      localStorage.setItem('aventur_deep_inspiration', destName);
      onAuthSuccess(demoUser);
    }, 650);
  };

  // Landing interactive tabs: Benefit Highlight Category
  const [activeTab, setActiveTab ] = useState<'concierge' | 'optimizer' | 'guides' | 'diary'>('concierge');

  // Interactive testimonial state
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const testimonials = [
    {
      quote: "Creating a Kyoto honeymoon itinerary was taking us weeks. Aventur planned the whole thing in 40 seconds, selected an exquisite Ryokan in Gion, and Hiroto (our guide) was incredibly courteous!",
      author: "Jessica & Liam K.",
      location: "San Francisco, USA",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      quote: "The day-by-day remix with AI is marvelous. We had heavy rain on Day 3 in Paris, asked the Gemini concierge to remodel for indoor museums, and got local gems instead of long queues.",
      author: "Mathieu B.",
      location: "Brandywine, Canada",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
    },
    {
      quote: "The cost estimations here are genuinely accurate. Saved us nearly $600 by pointing out shoulder-season booking windows and direct flight structures. Highly recommended!",
      author: "Priya M.",
      location: "London, UK",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
    }
  ];

  const handleNextTestimonial = () => {
    setTestimonialIdx((prev) => (prev + 1) % testimonials.length);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError("Kindly supply both email & secret passcode.");
      return;
    }
    if (authMode === 'signup' && !name.trim()) {
      setFormError("Kindly supply your travel companion handle/name.");
      return;
    }

    setIsLoading(true);

    // Dynamic timeout simulating secure authentication
    setTimeout(() => {
      setIsLoading(false);
      const chosenName = authMode === 'signup' ? name : email.split('@')[0];
      const payload = {
        name: chosenName.charAt(0).toUpperCase() + chosenName.slice(1),
        email: email.toLowerCase()
      };
      // Store session
      localStorage.setItem('aventur_user_session', JSON.stringify(payload));
      onAuthSuccess(payload);
    }, 900);
  };

  // Instant demo helper
  const triggerDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = { name: "Ojay Explorer", email: "iamojay89@gmail.com" };
      localStorage.setItem('aventur_user_session', JSON.stringify(demoUser));
      onAuthSuccess(demoUser);
    }, 700);
  };

  return (
    <div className="w-full space-y-16 animate-fade-in font-sans">
      
      {/* 1. HERO SECTION & INTEGRATIVE AUTH GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 md:pt-6">
        
        {/* Value Proposition Hero Card */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100/50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold leading-none select-none">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Conquer Trip Stress Seamlessly</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 font-display leading-[1.12] tracking-tight">
            Stop Starlight Searching. Start Living Your <span className="text-blue-600 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Ideal Escape.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-650 leading-relaxed max-w-2xl">
            Aventur solves the complex variables of luxury or budget travel. From automated seasonal flight cost indicators, to premium hotel suggestions, customizable AI-molded itineraries, and instant vetted local guides linkup. 
          </p>

          {/* Quick core metrics widgets */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg pt-3">
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-150 shadow-xs">
              <span className="text-xl md:text-2xl font-black text-blue-600 font-display block leading-none">30s</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase tracking-wider mt-1">Full Match</span>
            </div>
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-150 shadow-xs">
              <span className="text-xl md:text-2xl font-black text-blue-600 font-display block leading-none">100%</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase tracking-wider mt-1">Vetted Guides</span>
            </div>
            <div className="bg-white p-3.5 md:p-4 rounded-xl border border-slate-150 shadow-xs">
              <span className="text-xl md:text-2xl font-black text-blue-600 font-display block leading-none">Offline</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase tracking-wider mt-1">Plans Diary</span>
            </div>
          </div>
        </div>

        {/* Custom High-Fidelity Authentication Frame */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col justify-between relative" id="auth-panel-card">
          <div className="absolute top-0 right-0 p-3 select-none">
            <Shield className="w-5 h-5 text-slate-200" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-6">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-lg font-black text-slate-900 font-display tracking-tight">
                {authMode === 'login' ? 'Welcome Traveler' : 'Initiate Secure Profile'}
              </h2>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-150 flex items-center gap-1.5 mb-4 animate-shake" id="auth-error-notif">
                <span>🚫</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Your Full Handle Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
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

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Email Coordinates</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. traveler@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 placeholder-slate-400 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Passphrase Secret</label>
                <div className="relative">
                  <input
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
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                id="btn-auth-submission"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs font-bold font-display cursor-pointer transition select-none flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>{isLoading ? 'Accessing Secure Desk...' : authMode === 'login' ? 'Sign In Securely' : 'Establish Free Account'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4 scale-95" />}
              </button>
            </form>

            <div className="relative my-5 text-center select-none">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-150" />
              <span className="relative bg-white px-3.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or Fast Track</span>
            </div>

            {/* Core Convenience Shortcut Option */}
            <button
              type="button"
              onClick={triggerDemoLogin}
              id="btn-quick-one-click-login"
              className="w-full py-3 border border-slate-200 bg-slate-55/70 text-slate-800 rounded-xl hover:border-slate-350 hover:bg-slate-50 text-xs font-bold font-display cursor-pointer transition flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Explore Instant Demo Guest</span>
            </button>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs select-none">
            <span className="text-slate-500">
              {authMode === 'login' ? "Don't have an escape coordinate?" : 'Already a registered adventurer?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setFormError(null);
              }}
              id="btn-switch-auth-mode"
              className="text-blue-700 hover:underline font-bold cursor-pointer whitespace-nowrap"
            >
              {authMode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>

      </section>

      {/* NEW: POPULAR CURATED GLOBAL ESCAPES */}
      <section className="space-y-8 text-left" id="popular-global-escapes">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono block">Curated Inspirations</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display tracking-tight">Worldwide Handpicked Escapes</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              Explore legendary spots from every corner of the planet. From ancient Asian sanctuaries to high-altitude Andean trails, choose an inspiration to jumpstart your AI planning.
            </p>
          </div>

          {/* Inline Filter Selectors */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            {['All', 'Asia', 'Africa', 'Americas', 'Europe', 'Middle East', 'Oceania'].map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setRegionFilter(region)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  regionFilter === region 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => (
            <div 
              key={dest.name} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden select-none">
                <img 
                  referrerPolicy="no-referrer"
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-950 font-bold px-2.5 py-1 rounded-lg text-[10px] tracking-wider uppercase shadow-xs">
                  {dest.region}
                </div>
                
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-mono font-bold text-blue-300 block">{dest.country}</span>
                  <h3 className="text-lg font-black font-display tracking-tight leading-none mt-0.5">{dest.name}</h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{dest.tagline}"
                  </p>
                  
                  {/* Highlight pill rows */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {dest.highlights.map((tag) => (
                      <span key={tag} className="bg-slate-50 border border-slate-150 text-slate-600 px-2 py-0.5 rounded-md text-[9px] font-mono whitespace-nowrap">
                        ✦ {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-3 text-slate-500">
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
                    onClick={() => handleDeepPlan(dest.name)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-display font-extrabold text-[10px] transition cursor-pointer flex items-center gap-0.5 shrink-0"
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

      {/* 2. CORE TRAVEL CONVENIENCE BENEFIT SHOWCASE */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden" id="convenience-benefit-showcase">
        <div className="absolute top-0 right-0 p-8 select-none pointer-events-none opacity-5">
          <Globe className="w-96 h-96 text-blue-500 animate-spin-slow" />
        </div>

        <div className="max-w-3xl text-left space-y-4 mb-10 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono block">Zero-Stress Structural Blueprint</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">Aventur Core Convenience Benefits</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Planning trips shouldn't take more hours than the trip itself. Explore how our concierge layers everything you need on one seamless digital canvas.
          </p>
        </div>

        {/* Dynamic Category Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Left selectors Menu */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            {[
              { id: 'concierge', label: 'Adaptive AI Curation', desc: 'No more multi-tab overload' },
              { id: 'optimizer', label: 'Budget & Flight Estimator', desc: 'Real seasonal smart pricing' },
              { id: 'guides', label: 'Vetted Local Guides Desk', desc: 'Skip tourist traps completely' },
              { id: 'diary', label: 'Journey Offline Diary', desc: 'All reservation codes saved' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between group cursor-pointer ${
                    isActive 
                      ? 'border-blue-500 bg-blue-900/40' 
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="space-y-0.5 truncate mr-2">
                    <span className="text-xs font-black block text-white font-display truncate">{tab.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{tab.desc}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-blue-400 group-hover:translate-x-1 transition shrink-0 ${isActive ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </div>

          {/* Right dynamic content viewport */}
          <div className="lg:col-span-8 bg-white/5 rounded-2xl border border-white/5 p-6 md:p-8 flex flex-col justify-between min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === 'concierge' && (
                <motion.div
                  key="tab-curation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-400 border border-blue-500/20 select-none">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">No-stress Vacation Formulation</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    By compiling multiple variables (origins, days count, companion profiles and interest matrices), Aventur models several perfect matched destinations. Once selected, our suite maps down day-by-day routines with specific morning, afternoon, and evening durations. 
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 font-mono">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Local restaurant reviews embedded</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Full timing constraints built</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Customize any day instructions</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Dynamic seasonal advice</li>
                  </ul>
                </motion.div>
              )}

              {activeTab === 'optimizer' && (
                <motion.div
                  key="tab-optimizer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-400 border border-blue-500/20 select-none">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Cheapest Price Optimization</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Aventur calculates flight price fluctuations based on departure nodes and destination records. In addition, lodging rates are compiled dynamically for Budget, Midrange, and Luxury categories. Avoid overpaying at checkout.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 font-mono">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Flight advice thresholds</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Dynamic lodging selectors</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Companion math divided</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Visual estimates summary</li>
                  </ul>
                </motion.div>
              )}

              {activeTab === 'guides' && (
                <motion.div
                  key="tab-guides"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-400 border border-blue-500/20 select-none">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Honest Local Connections</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Hire licensed experts based in Rome, Tokyo, Paris or any target country directly from the planner's digital workspace. Handshake messaging automatically packages your plans so they recommend tailored, safe alleys and local eats.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 font-mono">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Direct query dispatch</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> 100% certified ratings</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Native dialect companion</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Hourly transparent pricing</li>
                  </ul>
                </motion.div>
              )}

              {activeTab === 'diary' && (
                <motion.div
                  key="tab-diary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-400 border border-blue-500/20 select-none">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Private Offline Travel Journal</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Keep and trace your planned vacations securely stored inside your local travel diary dashboard. Insert reservation codes, transport tickets details, or dinner timings per day. Take back control of your travel schedule!
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 font-mono">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> JSON secure backups export</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Custom text notepad blocks</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Interactive activity checklist</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Instant plans printout</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-white/5 pt-4 mt-6 flex justify-end">
              <button
                type="button"
                onClick={triggerDemoLogin}
                id="btn-tab-cta-shortcut"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold text-xs rounded-xl cursor-pointer transition whitespace-nowrap inline-flex items-center justify-center gap-1 shrink-0"
              >
                <span>Instantly Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CONVENIENCE MATRIX COMPARISON TABLE */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6" id="comparison-convenience-matrix">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 font-display">Manual Planning vs. Aventur Concierge</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Why suffer through old fragmented tools and chaotic bookings? See how Aventur coordinates the entire journey.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-150 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
            <thead className="bg-slate-50 border-b border-slate-150 font-display font-extrabold text-slate-900">
              <tr>
                <th className="p-4">VARIABLE FACTOR</th>
                <th className="p-4 bg-red-50/20 text-red-900">MANUAL TRIP NOISE</th>
                <th className="p-4 bg-blue-50/25 text-blue-900">AVENTUR SECURE WAY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <tr>
                <td className="p-4 font-bold text-slate-900">Formulating Routine</td>
                <td className="p-4 text-slate-600">3-4 days querying blogs, forums, and maps</td>
                <td className="p-4 bg-blue-50/10 font-bold text-blue-800">Instant matched routing under 30 seconds</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Price Checkers</td>
                <td className="p-4 text-slate-600">Constant browser tabs open to verify rates</td>
                <td className="p-4 bg-blue-50/10 font-bold text-blue-800 font-mono">Flight average alerts & explicit hotel cost</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Guide Bookings</td>
                <td className="p-4 text-slate-600">Untrusted local touts or costly tour operators</td>
                <td className="p-4 bg-blue-50/10 font-bold text-blue-800">Secure connection desk with certified experts</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Backup Storage</td>
                <td className="p-4 text-slate-600">Chaotic screenshots/emails matching files</td>
                <td className="p-4 bg-blue-50/10 font-bold text-blue-800 font-mono">JSON transport backups, local journal updates</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. DYNAMIC TRAVELER TESTIMONIALS SLIDER */}
      <section className="bg-blue-50/40 rounded-3xl border border-blue-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between text-left" id="user-testimonials">
        <div className="space-y-4 max-w-xl">
          <div className="flex gap-1 select-none text-amber-500">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 shrink-0" />)}
          </div>
          <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed font-sans">
            "{testimonials[testimonialIdx].quote}"
          </p>
          <div className="flex items-center gap-3">
            <img
              referrerPolicy="no-referrer"
              src={testimonials[testimonialIdx].avatar}
              alt={testimonials[testimonialIdx].author}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <span className="text-xs font-black block text-slate-950 font-display">{testimonials[testimonialIdx].author}</span>
              <span className="text-[10px] text-slate-400 block">{testimonials[testimonialIdx].location}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextTestimonial}
          id="btn-next-testimonial-trigger"
          className="px-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl hover:bg-slate-50 transition text-xs font-bold font-display cursor-pointer whitespace-nowrap inline-flex items-center gap-1 select-none shrink-0"
        >
          <span>Next Review</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </section>

    </div>
  );
}
