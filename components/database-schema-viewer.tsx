'use client';

import React, { useState } from 'react';
import { PageStage } from './page-stage';
import {
  Table2,
  Copy,
  Check,
  Code2,
  Key,
} from 'lucide-react';
import { DATABASE_SCHEMA_TABLES, SQL_SCHEMA_EXPORT } from '../lib/db-schema';

export function DatabaseSchemaViewer() {
  const [activeTab, setActiveTab] = useState<'visual' | 'sql'>('visual');
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTable = DATABASE_SCHEMA_TABLES[selectedTableIndex];

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_EXPORT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageStage
      badgeTag="DATABASE"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Skema Relasional PostgreSQL Ternormalisasi"
      title="Skema Database Gateway"
      subtitle="Struktur basis data efisien untuk menyimpan sesi WhatsApp, proteksi nomor owner, limit kuota, dan audit log."
    >
      <div className="space-y-5 text-left">
        {/* Switcher & Copy */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center p-0.5 bg-zinc-950 rounded-lg border border-white/5 text-xs">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-white text-black font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table2 className="w-3 h-3" />
              <span>Tabel Visual</span>
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'sql'
                  ? 'bg-white text-black font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Script SQL</span>
            </button>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>SQL Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Salin SQL</span>
              </>
            )}
          </button>
        </div>

        {activeTab === 'visual' ? (
          <div className="space-y-4">
            {/* Table Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DATABASE_SCHEMA_TABLES.map((t, idx) => (
                <button
                  key={t.tableName}
                  onClick={() => setSelectedTableIndex(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTableIndex === idx
                      ? 'bg-zinc-800 border-white text-white shadow-lg'
                      : 'bg-zinc-950/70 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="text-[9px] text-yellow-400 font-mono block uppercase">
                    {t.category}
                  </span>
                  <span className="font-mono font-bold text-xs truncate block mt-0.5">
                    {t.tableName}
                  </span>
                </button>
              ))}
            </div>

            {/* Table Details */}
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <span className="text-base font-mono font-bold text-white block">
                    {activeTable.tableName}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{activeTable.description}</p>
                </div>
                <span className="text-xs font-mono text-yellow-400">
                  {activeTable.columns.length} Kolom
                </span>
              </div>

              {/* Columns */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                    <tr>
                      <th className="py-2 px-2">Nama Kolom</th>
                      <th className="py-2 px-2">Tipe Data</th>
                      <th className="py-2 px-2">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {activeTable.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-2 font-mono font-bold text-white flex items-center gap-1">
                          {col.constraints.includes('PRIMARY KEY') && (
                            <Key className="w-3 h-3 text-yellow-400" />
                          )}
                          <span>{col.name}</span>
                        </td>
                        <td className="py-2 px-2 font-mono text-purple-300 text-[11px] whitespace-nowrap">
                          {col.type}
                        </td>
                        <td className="py-2 px-2 text-slate-300 text-xs">
                          {col.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3 backdrop-blur-xl shadow-xl">
            <span className="text-xs font-mono font-semibold text-slate-300 block">
              schema.sql (PostgreSQL 15+ / Cloud SQL Ready)
            </span>
            <pre className="p-4 bg-zinc-950 rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
              {SQL_SCHEMA_EXPORT}
            </pre>
          </div>
        )}
      </div>
    </PageStage>
  );
}
