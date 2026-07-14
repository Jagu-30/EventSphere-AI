import { create } from "zustand";

export interface EventItem {
  id: number;
  title: string;
  description?: string;
  banner_image?: string;
  category: string;
  start_time: string;
  end_time: string;
  status: string;
  venue_id: number;
  organizer_id: number;
  created_at: string;
}

interface EventState {
  events: EventItem[];
  searchQuery: string;
  selectedCategory: string;
  loading: boolean;
  error: string | null;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  fetchEvents: () => Promise<void>;
}

const API_BASE = "http://localhost:8000/api";

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  searchQuery: "",
  selectedCategory: "All",
  loading: false,
  error: null,

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchEvents();
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
    get().fetchEvents();
  },

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { selectedCategory, searchQuery } = get();
      const params = new URLSearchParams();
      
      if (selectedCategory && selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`${API_BASE}/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events list");
      }

      const data = await response.json();
      set({ events: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
