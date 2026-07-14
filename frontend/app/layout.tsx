"use client";

import "./globals.css";
import React, { useEffect, useState } from "react";
import { Ticket, Search, User, Compass, Calendar, PlusCircle, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useEventStore } from "../store/eventStore";
import AuthModal from "../components/AuthModal";
import HostEventModal from "../components/HostEventModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, initialize, logout } = useAuthStore();
  const { searchQuery, setSearchQuery, fetchEvents } = useEventStore();
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [hostWarning, setHostWarning] = useState<string | null>(null);

  // Initialize auth store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleHostClick = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 glass-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-indigo-500 to-cyan-400 p-2 rounded-lg text-white">
                  <Ticket className="w-6 h-6" />
                </div>
                <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  EventSphere<span className="text-cyan-400 font-normal">.AI</span>
                </span>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5 text-zinc-100">
                  <Compass className="w-4 h-4 text-indigo-400" /> Discover
                </a>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Schedule
                </a>
                <a 
                  href="#" 
                  onClick={handleHostClick}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Host Event
                </a>
              </nav>

              {/* Search and Auth Controls */}
              <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Search concerts, movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors w-60"
                  />
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                </div>
                
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-semibold text-white">{user.name}</div>
                      <div className="text-[10px] text-indigo-400 capitalize">{user.role}</div>
                    </div>
                    <button 
                      onClick={logout}
                      className="p-2 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-full transition-all"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white py-1.5 px-4 rounded-full transition-all"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Organizer Host Warning alert */}
        {hostWarning && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs text-center py-2 z-30 relative animate-pulse">
            ⚠️ {hostWarning}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-zinc-950 border-t border-zinc-900 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-zinc-500 text-xs">
                &copy; {new Date().getFullYear()} EventSphere-AI. All rights reserved.
              </div>
              <div className="flex gap-6 text-zinc-500 text-xs">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>

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
      </body>
    </html>
  );
}
