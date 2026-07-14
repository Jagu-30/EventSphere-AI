"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, Shield, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  
  const { login, register, loading, error } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!email || !password) {
      setFormError("Please fill out all required fields.");
      return;
    }

    let success = false;
    if (isRegister) {
      if (!name) {
        setFormError("Please enter your name.");
        return;
      }
      success = await register(name, email, password, role);
    } else {
      success = await login(email, password);
    }

    if (success) {
      // Clear forms
      setName("");
      setEmail("");
      setPassword("");
      setFormError(null);
      onClose();
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
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl p-6 z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-gradient-to-tr from-indigo-500 to-cyan-400 p-2 rounded-xl text-white mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">
            {isRegister ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            {isRegister ? "Join EventSphere-AI for smart booking" : "Sign in to access your dashboard"}
          </p>
        </div>

        {/* Error Notifications */}
        {(error || formError) && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
            {formError || error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <User className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-600" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-600" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`py-2 px-3 border rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    role === "customer"
                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("organizer")}
                  className={`py-2 px-3 border rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    role === "organizer"
                      ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Organizer</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle between Register/Login */}
        <div className="mt-6 text-center border-t border-zinc-900 pt-4">
          <p className="text-zinc-500 text-xs">
            {isRegister ? "Already have an account?" : "New to EventSphere-AI?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setFormError(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none transition-colors"
            >
              {isRegister ? "Sign In" : "Register Now"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
