"use client";

import React, { useEffect, useState } from "react";
import { 
  Sparkles, 
  MapPin, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  ChevronRight, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { useEventStore } from "../store/eventStore";
import { useAuthStore } from "../store/authStore";
import AuthModal from "../components/AuthModal";
import HostEventModal from "../components/HostEventModal";

const CATEGORIES = ["All", "Concerts", "Sports", "Conferences", "Cinema"];

export default function HomePage() {
  const { events, loading, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, fetchEvents } = useEventStore();
  const { isAuthenticated, user } = useAuthStore();
  
  const [localSearch, setLocalSearch] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [hostWarning, setHostWarning] = useState<string | null>(null);

  // Load events on initial render
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync internal search field when store changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
  };

  const handleHostClick = () => {
    setHostWarning(null);
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    if (user?.role !== "organizer" && user?.role !== "admin") {
      setHostWarning("Only accounts registered as 'Organizer' can host events.");
      setTimeout(() => setHostWarning(null), 5000);
      return;
    }
    setIsHostOpen(true);
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoStr;
    }
  };

  // Mocked dynamic metrics for demonstration (to be bound to analytics service in later phases)
  const getOccupancy = (eventId: number) => {
    // Return values based on event ID for realistic metrics
    const occupancies: Record<number, number> = { 1: 84, 2: 45, 3: 92, 4: 61 };
    return occupancies[eventId] || 50;
  };

  const getAiPrediction = (eventId: number) => {
    const predictions: Record<number, { sellOut: number, trend: string, seats: string }> = {
      1: { sellOut: 98, trend: "Surging", seats: "VIP" },
      2: { sellOut: 72, trend: "Steady", seats: "Premium" },
      3: { sellOut: 99, trend: "Critical", seats: "Standard" },
      4: { sellOut: 80, trend: "Growing", seats: "Premium" }
    };
    return predictions[eventId] || { sellOut: 75, trend: "Steady", seats: "Premium" };
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      
      {/* Decorative Glow Elements */}
      <div className="accent-glow top-10 left-10"></div>
      <div className="accent-glow-cyan top-40 right-10"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full py-1 px-3 text-xs text-indigo-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time locking & AI-driven ticketing system</span>
        </div>
        
        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl tracking-tight leading-none mb-6">
          Book Tickets Intelligent. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-500 bg-clip-text text-transparent">
            Experience Seamless.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-zinc-400 text-sm sm:text-base mb-8">
          EventSphere-AI leverages distributed locks and Prophet-based demand forecasting 
          to provide secure seating booking and dynamic ticket pricing.
        </p>

        {/* Action Button & Search */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Search events, venues, cities..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm shrink-0"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {hostWarning && (
          <div className="max-w-md mx-auto mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg p-3">
            ⚠️ {hostWarning}
          </div>
        )}
      </section>

      {/* Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-900">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-2 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/25"
                  : "bg-transparent text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Events Grid / Loading State */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">Loading active event logs...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-sm">No scheduled events match your search filters.</p>
            <button 
              onClick={handleHostClick}
              className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Be the first to schedule an event!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => {
              const occupancy = getOccupancy(event.id);
              const ai = getAiPrediction(event.id);
              
              return (
                <div 
                  key={event.id} 
                  className="glass-card rounded-xl overflow-hidden flex flex-col sm:flex-row hover:border-indigo-500/20 transition-all duration-300 group"
                >
                  
                  {/* Event Image */}
                  <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-zinc-800 overflow-hidden shrink-0">
                    <img 
                      src={event.banner_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop"} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded text-cyan-400 border border-white/5">
                      {event.category}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {event.title}
                      </h3>
                      
                      <p className="text-zinc-500 text-xs line-clamp-2 mb-3">
                        {event.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        <span>Venue ID: {event.venue_id}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-4">
                        <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        <span>{formatDate(event.start_time)}</span>
                      </div>

                      {/* Occupancy bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Occupancy</span>
                          <span>{occupancy}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              occupancy > 80 ? "bg-red-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${occupancy}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* AI Prediction & Action Button */}
                    <div className="border-t border-zinc-900 pt-4 flex items-center justify-between mt-auto">
                      <div>
                        <div className="text-zinc-500 text-[10px] uppercase font-semibold">Seat Target</div>
                        <div className="text-white font-bold font-heading text-sm">{ai.seats} Category</div>
                      </div>

                      {/* Simulated Dynamic Pricing/Sell-Out predictions badge */}
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                          <TrendingUp className="w-3 h-3" />
                          <span>{ai.sellOut}% Sell-Out</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Trend: <span className={
                            ai.trend === "Critical" || ai.trend === "Surging"
                              ? "text-red-400 font-semibold"
                              : "text-emerald-400"
                          }>{ai.trend}</span>
                        </div>
                      </div>
                    </div>

                    <button className="mt-4 w-full flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium py-2 rounded-lg transition-colors text-xs">
                      <span>Explore Seats Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Tech Highlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="glass-card rounded-xl p-8 border border-indigo-500/10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <Sparkles className="w-64 h-64 text-indigo-400" />
          </div>
          
          <div className="max-w-3xl">
            <h3 className="font-heading font-extrabold text-2xl text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              Intelligent Seats Allocation & Dynamic Tariffs
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Our real-time seat lock operates with Redis distributed lock patterns, maintaining a strict 
              10-minute hold window to prevent double booking. When demand spikes, our AI Service dynamically 
              adjusts multipliers based on sales velocity and time coefficients.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/80">
                <div className="text-cyan-400 font-bold font-heading text-lg">10 Min TTL</div>
                <div className="text-zinc-500 text-xs mt-1">Automatic hold expiration & release.</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/80">
                <div className="text-indigo-400 font-bold font-heading text-lg">Redis Locks</div>
                <div className="text-zinc-500 text-xs mt-1">Concurrency isolation for hot seats.</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/80">
                <div className="text-purple-400 font-bold font-heading text-lg">LightGBM Pricing</div>
                <div className="text-zinc-500 text-xs mt-1">Real-time fair price adjustments.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Modals */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
      <HostEventModal 
        isOpen={isHostOpen} 
        onClose={() => setIsHostOpen(false)} 
        onSuccess={fetchEvents}
      />

    </div>
  );
}
