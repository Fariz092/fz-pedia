'use client';

import React from 'react';
import { TechStrip } from './tech-strip';

interface PageStageProps {
  badgeTag?: string;
  badgeTagColor?: string; // e.g. 'bg-purple-600 text-white' or 'bg-yellow-400 text-black'
  badgeText?: string;
  onDismissBadge?: () => void;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  showTechStrip?: boolean;
}

export function PageStage({
  badgeTag = 'BARU',
  badgeTagColor = 'bg-purple-600 text-white',
  badgeText,
  onDismissBadge,
  title,
  subtitle,
  children,
  showTechStrip = true,
}: PageStageProps) {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4 sm:px-6 py-10 sm:py-14 z-10">
      {/* Main Centered Content Stage */}
      <div className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-6">
        {/* Top Badge Pill matching template */}
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white backdrop-blur-md shadow-lg select-none">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeTagColor}`}
            >
              {badgeTag}
            </span>
            <span className="text-slate-200 text-xs font-medium">{badgeText}</span>
            {onDismissBadge && (
              <button
                type="button"
                onClick={onDismissBadge}
                className="text-slate-400 hover:text-white cursor-pointer ml-1 text-xs"
                aria-label="Tutup badge"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] text-balance">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed text-balance">
          {subtitle}
        </p>

        {/* Page Content Slot (Children) */}
        <div className="pt-2 w-full">{children}</div>

        {/* Tech Icon Strip matching template architecture on every page */}
        {showTechStrip && <TechStrip />}
      </div>
    </section>
  );
}
