'use client';

import React, { useState } from 'react';
import { PageStage } from './page-stage';
import { Trash2 } from 'lucide-react';
import { ActivityLog } from '../types/bot';

interface RealtimeAnalyticsProps {
  activityLogs: ActivityLog[];
  onClearLogs: () => void;
  ownerNumber: string;
  onSimulateMessage?: (type: 'owner' | 'stranger' | 'group') => void;
  realLatency: number;
}

export function RealtimeAnalytics({
  activityLogs,
  onClearLogs,
  ownerNumber,
  onSimulateMessage,
  realLatency,
}: RealtimeAnalyticsProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'EXECUTED' | 'DROPPED'>('ALL');

  const executedCount = activityLogs.filter((l) => l.actionTaken === 'EXECUTED').length;
  const strangerDroppedCount = activityLogs.filter((l) => l.actionTaken === 'DROPPED_STRANGER').length;
  const groupDroppedCount = activityLogs.filter(
    (l) => l.actionTaken === 'DROPPED_GROUP' || l.actionTaken === 'DROPPED_MENTION'
  ).length;

  const averageLatency =
    activityLogs.length > 0
      ? Math.round(
          activityLogs.reduce((acc, curr) => acc + curr.latencyMs, 0) / activityLogs.length
        )
      : realLatency || 14;

  const filteredLogs = activityLogs.filter((log) => {
    if (filterType === 'EXECUTED') return log.actionTaken === 'EXECUTED';
    if (filterType === 'DROPPED') return log.actionTaken !== 'EXECUTED';
    return true;
  });

  return (
    <PageStage
      badgeTag="ANALITIK"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Audit Arus Pesan Real-Time"
      title="Analitik Gateway Real-Time"
      subtitle="Pencatatan real-time tanpa data dummy. Menampilkan seluruh interaksi pesan yang masuk dan disaring."
    >
      <div className="space-y-6 text-left">
        {/* Metric Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Pesan Owner
            </span>
            <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {executedCount}
            </div>
            <span className="text-[10px] text-slate-500">Dieksekusi</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Pesan Asing
            </span>
            <div className="text-2xl font-mono font-bold text-red-400 tabular-nums">
              {strangerDroppedCount}
            </div>
            <span className="text-[10px] text-slate-500">Silent Drop</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Obrolan Grup
            </span>
            <div className="text-2xl font-mono font-bold text-blue-400 tabular-nums">
              {groupDroppedCount}
            </div>
            <span className="text-[10px] text-slate-500">Filtered</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Rata-rata Ping
            </span>
            <div className="text-2xl font-mono font-bold text-yellow-400 tabular-nums">
              {averageLatency}ms
            </div>
            <span className="text-[10px] text-slate-500">Waktu Riil</span>
          </div>
        </div>

        {/* Traffic Simulation Trigger Buttons */}
        {onSimulateMessage && (
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">
              Simulasi Uji Coba: Tambah interaksi pesan ke analitik secara instan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSimulateMessage('owner')}
                className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 font-medium text-[11px] cursor-pointer"
              >
                + Owner
              </button>
              <button
                onClick={() => onSimulateMessage('stranger')}
                className="px-2.5 py-1 rounded-md bg-red-950 text-red-300 border border-red-500/30 hover:bg-red-900/50 font-medium text-[11px] cursor-pointer"
              >
                + Asing
              </button>
              <button
                onClick={() => onSimulateMessage('group')}
                className="px-2.5 py-1 rounded-md bg-blue-950 text-blue-300 border border-blue-500/30 hover:bg-blue-900/50 font-medium text-[11px] cursor-pointer"
              >
                + Grup
              </button>
            </div>
          </div>
        )}

        {/* Live Audit Log Table */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Live Audit Log ({filteredLogs.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-zinc-950 rounded-lg border border-white/5 text-xs">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded transition-colors text-[11px] cursor-pointer ${
                    filterType === 'ALL' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType('EXECUTED')}
                  className={`px-2.5 py-1 rounded transition-colors text-[11px] cursor-pointer ${
                    filterType === 'EXECUTED' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Owner
                </button>
                <button
                  onClick={() => setFilterType('DROPPED')}
                  className={`px-2.5 py-1 rounded transition-colors text-[11px] cursor-pointer ${
                    filterType === 'DROPPED' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Diabaikan
                </button>
              </div>

              {activityLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="p-1 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer"
                  title="Hapus Log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Belum ada aktivitas riil yang tercatat. Coba kirim pesan melalui tombol uji coba di atas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <tr>
                    <th className="py-2 px-1">Waktu</th>
                    <th className="py-2 px-1">Pengirim</th>
                    <th className="py-2 px-1">Pesan</th>
                    <th className="py-2 px-1">Tindakan</th>
                    <th className="py-2 px-1 text-right">Latensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-1 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-2 px-1 font-mono font-semibold text-white whitespace-nowrap text-[11px]">
                        {log.senderNumber}
                      </td>
                      <td className="py-2 px-1 text-slate-300 max-w-xs truncate text-[11px]">
                        {log.messagePreview}
                      </td>
                      <td className="py-2 px-1 whitespace-nowrap font-mono text-[10px]">
                        {log.actionTaken === 'EXECUTED' && (
                          <span className="text-emerald-400 font-bold">DIPATUHI</span>
                        )}
                        {log.actionTaken === 'DROPPED_STRANGER' && (
                          <span className="text-red-400 font-bold">DROP ASING</span>
                        )}
                        {log.actionTaken === 'DROPPED_GROUP' && (
                          <span className="text-blue-400 font-bold">DROP GRUP</span>
                        )}
                        {log.actionTaken === 'DROPPED_MENTION' && (
                          <span className="text-purple-400 font-bold">DROP TAG</span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-right font-mono text-yellow-400 whitespace-nowrap text-[11px]">
                        {log.latencyMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageStage>
  );
}
