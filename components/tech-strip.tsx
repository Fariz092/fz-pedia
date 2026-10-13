'use client';

import React from 'react';

export function TechStrip() {
  return (
    <div className="pt-12 sm:pt-16 space-y-3">
      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block select-none">
        DITENAGAI OLEH TEKNOLOGI MODERN
      </span>

      <div className="flex items-center justify-center gap-5 sm:gap-6">
        {/* Firebase */}
        <div className="w-6 h-6 flex items-center justify-center" title="Firebase">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path
              d="M4.5 18.5L9.8 3.8C9.9 3.5 10.3 3.5 10.5 3.8L13 9.2L4.5 18.5Z"
              fill="#FFA000"
            />
            <path
              d="M4.5 18.5L6.6 6.5C6.7 6.2 7.1 6.1 7.3 6.4L13 18.5H4.5Z"
              fill="#F57C00"
            />
            <path
              d="M13 9.2L14.7 5.7C14.9 5.4 15.3 5.4 15.5 5.7L19.5 18.5L13 9.2Z"
              fill="#FFCA28"
            />
            <path
              d="M4.5 18.5L12 22.8C12.3 23 12.7 23 13 22.8L19.5 18.5H4.5Z"
              fill="#FFB300"
            />
          </svg>
        </div>

        {/* React */}
        <div className="w-6 h-6 flex items-center justify-center" title="React 19">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="12" rx="9" ry="3.5" />
            <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </div>

        {/* Vite / Next Lightning */}
        <div className="w-6 h-6 flex items-center justify-center" title="Next.js & Vite Core">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path
              d="M13 2L4 13.5H11L9.5 22L19.5 10.5H12.5L13 2Z"
              fill="url(#viteGrad)"
            />
            <defs>
              <linearGradient id="viteGrad" x1="4" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#41D1FF" />
                <stop offset="0.5" stopColor="#BD34FE" />
                <stop offset="1" stopColor="#FFEA83" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Tailwind Wave */}
        <div className="w-6 h-6 flex items-center justify-center" title="Tailwind CSS">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="currentColor">
            <path d="M12 6c-3 0-4.5 1.5-4.5 4.5 1-1.5 2.25-2 3.75-1.5 1 0.33 1.7 1.07 2.5 1.88C15 12.18 16.65 14 20.5 14c3 0 4.5-1.5 4.5-4.5-1 1.5-2.25 2-3.75 1.5-1-0.33-1.7-1.07-2.5-1.88C17.45 7.82 15.85 6 12 6zM3.5 14c-3 0-4.5 1.5-4.5 4.5 1-1.5 2.25-2 3.75-1.5 1 0.33 1.7 1.07 2.5 1.88C6.5 20.18 8.15 22 12 22c3 0 4.5-1.5 4.5-4.5-1 1.5-2.25 2-3.75 1.5-1-0.33-1.7-1.07-2.5-1.88C8.95 15.82 7.35 14 3.5 14z" />
          </svg>
        </div>

        {/* TypeScript */}
        <div className="w-5 h-5 rounded bg-[#3178C6] flex items-center justify-center text-[10px] font-black text-white font-mono" title="TypeScript">
          TS
        </div>

        {/* Star Sparkle */}
        <div className="w-6 h-6 flex items-center justify-center" title="AI Studio Core">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-400 fill-purple-400">
            <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" />
          </svg>
        </div>

        {/* Baileys / Signal Protocol */}
        <div className="w-6 h-6 flex items-center justify-center" title="Baileys WhatsApp Multi-Device">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.8-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2-.1-.4-.2-.5-.1-.2-.6-1.4-.8-1.9-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.6 1 2.8c.2.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.6.6.2 1.2.2 1.7.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
