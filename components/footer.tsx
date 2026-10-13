'use client';

import React from 'react';
import { SoftAurora } from './ui/soft-aurora';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative z-10 w-full border-t border-white/5 bg-transparent text-slate-400 py-10 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-tight">
            FZ<span className="text-yellow-400">PEDIA</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500 font-mono">©2026 FZPEDIA | Velicia Inc.</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400 font-medium">
          <button onClick={() => onNavigate('gateway')} className="hover:text-white transition-colors cursor-pointer">
            Pairing
          </button>
          <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors cursor-pointer">
            Monitor
          </button>
          <button onClick={() => onNavigate('management')} className="hover:text-white transition-colors cursor-pointer">
            Privat
          </button>
          <button onClick={() => onNavigate('server')} className="hover:text-white transition-colors cursor-pointer">
            Server
          </button>
          <button onClick={() => onNavigate('analytics')} className="hover:text-white transition-colors cursor-pointer">
            Analitik
          </button>
          <button onClick={() => onNavigate('help')} className="hover:text-white transition-colors cursor-pointer">
            Bantuan
          </button>
        </div>
      </div>
    </footer>
  );
}
