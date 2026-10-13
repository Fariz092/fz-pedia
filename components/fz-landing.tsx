'use client';

import React, { useState } from 'react';
import { PageStage } from './page-stage';
import { ArrowRight } from 'lucide-react';

interface FzLandingProps {
  onStartConnect: () => void;
  onOpenManagement: () => void;
  isConnected: boolean;
  botPhoneNumber: string;
}

export function FzLanding({
  onStartConnect,
  onOpenManagement,
  isConnected,
  botPhoneNumber,
}: FzLandingProps) {
  const [badgeVisible, setBadgeVisible] = useState(true);

  return (
    <PageStage
      badgeTag="BARU"
      badgeTagColor="bg-purple-600 text-white"
      badgeText={badgeVisible ? 'FZPEDIA v2.5.0 Dirilis' : ''}
      onDismissBadge={() => setBadgeVisible(false)}
      title={
        <>
          Platform Bot WhatsApp <br />
          Tanpa Batas Ruang &amp; Waktu
        </>
      }
      subtitle="Hubungkan bot gateway WhatsApp Anda secara instan dengan Pairing Code 8 digit atau QR Code. Bot privat eksklusif yang hanya mematuhi nomor owner sendiri."
      showTechStrip={true}
    >
      <div className="space-y-4">
        {/* Two CTA Buttons exactly matching template */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
          <button
            onClick={onStartConnect}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-xl shadow-white/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isConnected ? 'Buka Dashboard Sesi' : 'Mulai Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenManagement}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1c1c24]/90 hover:bg-[#272733] text-slate-200 font-medium text-xs sm:text-sm border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Pelajari Fitur</span>
          </button>
        </div>

        {/* Status text if connected */}
        {isConnected && (
          <p className="text-xs text-emerald-400 font-mono pt-1">
            ✓ Perangkat aktif terhubung: {botPhoneNumber}
          </p>
        )}
      </div>
    </PageStage>
  );
}
