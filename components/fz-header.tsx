'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface FzHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnected: boolean;
}

export function FzHeader({ activeTab, setActiveTab, isConnected }: FzHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'hero', label: 'Beranda' },
    { id: 'gateway', label: 'Pairing Bot' },
    { id: 'dashboard', label: 'Monitor' },
    { id: 'management', label: 'Manajemen' },
    { id: 'server', label: 'Server & Kuota' },
    { id: 'analytics', label: 'Analitik' },
    { id: 'schema', label: 'Database' },
    { id: 'help', label: 'Bantuan' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Name: FZ in pure white, PEDIA in yellow */}
        <button
          onClick={() => setActiveTab('hero')}
          className="flex items-center gap-1.5 font-black text-xl sm:text-2xl tracking-tight select-none cursor-pointer focus:outline-none transition-transform active:scale-95"
        >
          <span className="text-white">FZ</span>
          <span className="text-yellow-400">PEDIA</span>
        </button>

        {/* Center Nav tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === tab.id
                  ? 'text-yellow-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Masuk / Entry Pill Button matching reference template */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(isConnected ? 'dashboard' : 'gateway')}
            className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all cursor-pointer shadow-lg shadow-white/10 active:scale-95"
          >
            {isConnected ? 'Dashboard Sesi' : 'Masuk'}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07070a]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-4 space-y-1.5 text-xs">
          {navLinks.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2.5 px-3 rounded-xl transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-yellow-400/10 text-yellow-400 font-bold'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
