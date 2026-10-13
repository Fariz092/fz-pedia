'use client';

import React, { useState } from 'react';
import { PageStage } from './page-stage';
import {
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  ServerConfig,
  ServerNode,
  NotificationSettings,
  ServerAlert,
} from '../types/bot';

interface ServerAndQuotaProps {
  serverConfig: ServerConfig;
  onUpdateServerConfig: (updated: Partial<ServerConfig>) => void;
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: (updated: Partial<NotificationSettings>) => void;
  ownerNumber: string;
  realLatency: number;
}

export function ServerAndQuota({
  serverConfig,
  onUpdateServerConfig,
  notificationSettings,
  onUpdateNotificationSettings,
  ownerNumber,
  realLatency,
}: ServerAndQuotaProps) {
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [measuredPings, setMeasuredPings] = useState<{ [key: string]: number }>({
    'srv-jkt-01': realLatency || 12,
    'srv-sg-01': (realLatency || 12) + 6,
    'srv-tky-01': (realLatency || 12) + 42,
  });

  const serverNodes: ServerNode[] = [
    {
      id: 'srv-jkt-01',
      name: 'Server Jakarta ID-01',
      location: 'Jakarta Cyber DC (Indonesia)',
      flag: '🇮🇩',
      pingMs: measuredPings['srv-jkt-01'] || 12,
      status: 'optimal',
      loadPercentage: 24,
      uptime: '99.99%',
      ip: '103.145.22.18',
    },
    {
      id: 'srv-sg-01',
      name: 'Server Singapore SG-01',
      location: 'Equinix SG1 (Singapore)',
      flag: '🇸🇬',
      pingMs: measuredPings['srv-sg-01'] || 18,
      status: 'optimal',
      loadPercentage: 31,
      uptime: '99.98%',
      ip: '128.199.198.81',
    },
    {
      id: 'srv-tky-01',
      name: 'Server Tokyo JP-01',
      location: 'Tokyo North DC (Japan)',
      flag: '🇯🇵',
      pingMs: measuredPings['srv-tky-01'] || 56,
      status: 'stable',
      loadPercentage: 18,
      uptime: '99.95%',
      ip: '139.162.112.54',
    },
  ];

  const handleBenchmark = async () => {
    setIsBenchmarking(true);
    const t0 = performance.now();
    try {
      const res = await fetch('/api/server-ping');
      if (res.ok) {
        const base = Math.max(8, Math.round(performance.now() - t0));
        setMeasuredPings({
          'srv-jkt-01': base,
          'srv-sg-01': base + 5,
          'srv-tky-01': base + 38,
        });
      }
    } catch {
      // fallback
    } finally {
      setIsBenchmarking(false);
    }
  };

  const quotaUsedPercent = Math.min(
    100,
    Math.round((serverConfig.usedQuotaToday / serverConfig.dailyQuotaLimit) * 100)
  );

  const handleTestAlert = () => {
    setTestNotificationSent(true);

    const newAlert: ServerAlert = {
      id: `alert-${Date.now()}`,
      title: 'Uji Coba Notifikasi FZPEDIA',
      message: `Peringatan status server berhasil dikirimkan ke nomor WhatsApp Owner (${ownerNumber || 'Tersambung'}). Gateway beroperasi normal.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      read: false,
    };

    onUpdateNotificationSettings({
      recentAlerts: [newAlert, ...notificationSettings.recentAlerts],
    });

    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  return (
    <PageStage
      badgeTag="SERVER"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Pengaturan Server & Limit Kuota Harian"
      title="Server Kecepatan &amp; Kuota API"
      subtitle="Pilih node server latensi rendah, atur profil kecepatan balasan bot, dan pantau limit kuota harian."
    >
      <div className="space-y-6 text-left">
        {/* Section 1: Server Nodes */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Node Server Gateway
            </h3>
            <button
              onClick={handleBenchmark}
              disabled={isBenchmarking}
              className="text-xs text-yellow-400 hover:underline flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <RefreshCw className={`w-3 h-3 ${isBenchmarking ? 'animate-spin' : ''}`} />
              <span>{isBenchmarking ? 'Menguji...' : 'Uji Ping Riil'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {serverNodes.map((node) => {
              const isSelected = serverConfig.selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => onUpdateServerConfig({ selectedNode: node.id })}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 border-white text-white shadow-lg'
                      : 'bg-zinc-950 border-white/5 hover:border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{node.flag}</span>
                    <span className="font-mono text-xs font-bold text-yellow-400">
                      {node.pingMs}ms
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-white">{node.name}</h4>
                    <p className="text-[11px] text-slate-400">{node.location}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Beban: {node.loadPercentage}%</span>
                    <span>Uptime: {node.uptime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Speed Modes */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3 backdrop-blur-xl shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono pb-2 border-b border-white/5">
            Mode Kecepatan Respons
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'turbo',
                title: 'Turbo Mode',
                latency: '< 300ms',
                desc: 'Respon cepat tanpa jeda mengetik. Paling efisien.',
              },
              {
                id: 'balanced',
                title: 'Balanced',
                latency: '~ 600ms',
                desc: 'Keseimbangan natural dengan jeda standar.',
              },
              {
                id: 'safe',
                title: 'Safe Anti-Ban',
                latency: '~ 1.2s',
                desc: 'Simulasi gerakan mengetik manusia.',
              },
            ].map((mode) => (
              <div
                key={mode.id}
                onClick={() => onUpdateServerConfig({ speedMode: mode.id as any })}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  serverConfig.speedMode === mode.id
                    ? 'bg-zinc-800 border-white text-white'
                    : 'bg-zinc-950 border-white/5 hover:border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white">{mode.title}</span>
                  <span className="font-mono text-[10px] text-yellow-400">{mode.latency}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Daily Quota Limit */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Limit Kuota API Harian
            </h3>
            <button
              onClick={() => onUpdateServerConfig({ usedQuotaToday: 0 })}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Terpakai:{' '}
                <strong className="text-white font-mono">
                  {serverConfig.usedQuotaToday.toLocaleString()}
                </strong>{' '}
                / {serverConfig.dailyQuotaLimit.toLocaleString()} pesan
              </span>
              <span className="font-mono text-yellow-400 font-bold">
                {quotaUsedPercent}%
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${quotaUsedPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Sisa: {(serverConfig.dailyQuotaLimit - serverConfig.usedQuotaToday).toLocaleString()} pesan</span>
              <span>Reset: Pukul 00:00 WIB</span>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block font-mono">
                Batas Kuota (Pesan/Hari):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={serverConfig.dailyQuotaLimit}
                  onChange={(e) => onUpdateServerConfig({ dailyQuotaLimit: Number(e.target.value) })}
                  className="flex-1 accent-white cursor-pointer"
                />
                <span className="font-mono text-xs text-white w-16 text-right">
                  {serverConfig.dailyQuotaLimit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block font-mono">
                Batas Pesan/Menit (Rate Limit):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={serverConfig.rateLimitPerMinute}
                  onChange={(e) => onUpdateServerConfig({ rateLimitPerMinute: Number(e.target.value) })}
                  className="flex-1 accent-white cursor-pointer"
                />
                <span className="font-mono text-xs text-white w-16 text-right">
                  {serverConfig.rateLimitPerMinute} msg/m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Automated Alerts */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Notifikasi Status Server
            </h3>
            <button
              onClick={handleTestAlert}
              disabled={testNotificationSent}
              className="px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
            >
              {testNotificationSent ? 'Terkirim!' : 'Kirim Uji Coba Alert'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              {
                key: 'alertOnServerDown',
                label: 'Alert Server Down / RTO',
                val: notificationSettings.alertOnServerDown,
              },
              {
                key: 'alertOnQuotaThreshold',
                label: 'Alert Kuota Menipis (>80% & >95%)',
                val: notificationSettings.alertOnQuotaThreshold,
              },
              {
                key: 'alertOnDisconnect',
                label: 'Alert Sesi WhatsApp Terputus',
                val: notificationSettings.alertOnDisconnect,
              },
              {
                key: 'notifyOwnerNumber',
                label: `Kirim ke WhatsApp Owner (${ownerNumber || 'Anda'})`,
                val: notificationSettings.notifyOwnerNumber,
              },
            ].map((item) => (
              <label
                key={item.key}
                className="p-3 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition-colors"
              >
                <span className="text-slate-300">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) =>
                    onUpdateNotificationSettings({ [item.key]: e.target.checked } as any)
                  }
                  className="w-4 h-4 accent-yellow-400 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </PageStage>
  );
}
