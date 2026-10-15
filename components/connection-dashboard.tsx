'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageStage } from './page-stage';
import {
  BatteryCharging,
  RefreshCw,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { BotInstance } from '../types/bot';

interface ConnectionDashboardProps {
  bot: BotInstance;
  onUpdateBot: (updated: Partial<BotInstance>) => void;
  onNavigateToPairing: () => void;
  onNavigateToServer: () => void;
  realLatency: number;
}

export function ConnectionDashboard({
  bot,
  onUpdateBot,
  onNavigateToPairing,
  onNavigateToServer,
  realLatency,
}: ConnectionDashboardProps) {
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [liveUptimeSeconds, setLiveUptimeSeconds] = useState(bot.uptimeSeconds || 0);

  const isConnected = bot.connectionState === 'connected';

  const testRealPing = useCallback(async () => {
    setIsTestingPing(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/server-ping');
      if (res.ok) {
        const duration = Math.max(8, Math.round(performance.now() - start));
        onUpdateBot({ pingMs: duration });
      }
    } catch {
      // fallback
    } finally {
      setIsTestingPing(false);
    }
  }, [onUpdateBot]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setLiveUptimeSeconds((prev) => prev + 5);
      testRealPing();
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected, testRealPing]);

  const handleDisconnect = async () => {
    try {
      await fetch('/api/wa/disconnect', { method: 'POST' });
    } catch {
      // fallback
    }
    onUpdateBot({
      connectionState: 'disconnected',
      phoneNumber: '',
      ownerNumber: '',
      hasSavedSession: false,
    });
  };

  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}j ${mins % 60}m`;
    if (mins > 0) return `${mins} menit`;
    return `${sec} detik`;
  };

  return (
    <PageStage
      badgeTag="STATUS"
      badgeTagColor="bg-emerald-500 text-black"
      badgeText="Pemantauan Gateway Real-Time"
      title="Status Gateway &amp; Perangkat"
      subtitle="Pemantauan latensi bolak-balik riil, baterai perangkat bot, dan status enkripsi multi-device."
    >
      {!isConnected ? (
        <div className="p-8 rounded-2xl bg-zinc-900/80 border border-white/10 text-center space-y-4 backdrop-blur-xl">
          <p className="text-sm text-slate-300">
            Belum ada perangkat WhatsApp yang terhubung. Silakan lakukan pairing terlebih dahulu.
          </p>
          <button
            onClick={onNavigateToPairing}
            className="px-6 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Tautkan Perangkat Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 space-y-6 backdrop-blur-xl text-left shadow-2xl">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider">
                  Terhubung &amp; Beroperasi
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                  {bot.phoneNumber}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Sesi Multi-Device Permanen (Tersimpan)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Nomor Owner: <span className="text-white font-mono">{bot.ownerNumber}</span> • Kredensial tersimpan aman di disk server.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={testRealPing}
                disabled={isTestingPing}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-yellow-400 ${isTestingPing ? 'animate-spin' : ''}`}
                />
                <span>Uji Ping Riil</span>
              </button>

              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-red-300 text-xs font-medium border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putus Sesi</span>
              </button>
            </div>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Latensi Nyata
              </span>
              <div className="text-2xl font-mono font-bold text-yellow-400">
                {bot.pingMs}ms
              </div>
              <span className="text-[10px] text-slate-500">Live RTT API</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Durasi Sesi
              </span>
              <div className="text-2xl font-mono font-bold text-white">
                {formatUptime(liveUptimeSeconds)}
              </div>
              <span className="text-[10px] text-slate-500">Sejak {bot.lastConnectedAt || 'Koneksi'}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Baterai Ponsel
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span>{bot.batteryLevel}%</span>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-500">Normal</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Node Server
              </span>
              <div className="text-lg font-mono font-bold text-white truncate">
                Jakarta ID-01
              </div>
              <button
                onClick={onNavigateToServer}
                className="text-[10px] text-yellow-400 hover:underline cursor-pointer"
              >
                Ganti Node &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </PageStage>
  );
}
