"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, DollarSign, AlignLeft, Compass, Pin, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface HostEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VenueOption {
  id: number;
  name: str;
  address: str;
  capacity: number;
}

const CATEGORIES = ["Concerts", "Sports", "Conferences", "Cinema"];

export default function HostEventModal({ isOpen, onClose, onSuccess }: HostEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Concerts");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueId, setVenueId] = useState<string>("");
  const [basePrice, setBasePrice] = useState("45.00");
  
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { token } = useAuthStore();

  // Fetch available venues
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchVenues = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/events/venues");
        if (res.ok) {
          const data = await res.json();
          setVenues(data);
          if (data.length > 0) {
            setVenueId(String(data[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to load venues list:", err);
      }
    };

    fetchVenues();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !startTime || !endTime || !venueId || !basePrice) {
      setFormError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          venue_id: Number(venueId),
          base_price: Number(basePrice)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create event");
      }

      setLoading(false);
      // Clear forms
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setFormError(null);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Host Event
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            Fill in the scheduling details to launch a new event listing
          </p>
        </div>

        {/* Error Notification */}
        {formError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
            {formError}
          </div>
        )}

        {/* Event Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Event Title *</label>
            <input
              type="text"
              placeholder="e.g. Neon Horizon Festival"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
            <div className="relative">
              <textarea
                placeholder="Details about the event, layout, performances..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Compass className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Base Ticket Price ($) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <DollarSign className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-600" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Venue Location *</label>
            <div className="relative">
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} (Cap: {venue.capacity})
                  </option>
                ))}
              </select>
              <Pin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Start Date & Time *</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">End Date & Time *</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:bg-indigo-600/50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
