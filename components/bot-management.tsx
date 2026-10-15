'use client';

import React, { useState } from 'react';
import { PageStage } from './page-stage';
import {
  Send,
  Trash2,
} from 'lucide-react';
import { PrivacyConfig, CustomCommand, ActivityLog } from '../types/bot';

interface BotManagementProps {
  privacyConfig: PrivacyConfig;
  onUpdatePrivacy: (updated: Partial<PrivacyConfig>) => void;
  ownerNumber: string;
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  realLatency: number;
}

export function BotManagement({
  privacyConfig,
  onUpdatePrivacy,
  ownerNumber,
  onLogActivity,
  realLatency,
}: BotManagementProps) {
  const [commands, setCommands] = useState<CustomCommand[]>([
    {
      id: 'cmd-1',
      trigger: '!menu',
      response: '📋 *MENU FZPEDIA GATEWAY*\n\n1. !status - Cek status bot\n2. !speed - Cek latensi server\n3. !quota - Cek kuota harian\n4. !ping - Uji latensi jaringan\n\n_Bot bersifat privat untuk nomor Anda._',
      description: 'Menampilkan menu utama bot',
      enabled: true,
      isSystem: true,
    },
    {
      id: 'cmd-2',
      trigger: '!speed',
      response: `⚡ *SERVER SPEED REPORT*\nNode: Jakarta ID-01\nLatensi Riil: ${realLatency || 14}ms\nMode: Turbo Fast Response\nStatus: Optimal`,
      description: 'Cek kecepatan respons bot',
      enabled: true,
      isSystem: true,
    },
    {
      id: 'cmd-3',
      trigger: '!status',
      response: '🟢 *STATUS BOT FZPEDIA*\nKoneksi: WhatsApp Multi-Device\nBaterai: 94% (Charging)\nProteksi: Mode Privat Aktif',
      description: 'Status perangkat',
      enabled: true,
      isSystem: true,
    },
    {
      id: 'cmd-4',
      trigger: '!quota',
      response: '📊 *LIMIT KUOTA HARIAN*\nStatus: Aktif\nProteksi Anti-Spam: 30 pesan/menit\nReset: 00:00 WIB',
      description: 'Cek kuota API',
      enabled: true,
      isSystem: true,
    },
    {
      id: 'cmd-5',
      trigger: '!ping',
      response: `🏓 Pong! Latensi gateway: ${realLatency || 14}ms`,
      description: 'Uji responsivitas jaringan',
      enabled: true,
      isSystem: true,
    },
  ]);

  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [simSenderType, setSimSenderType] = useState<'owner' | 'stranger' | 'group'>('owner');
  const [simMessage, setSimMessage] = useState('!menu');
  const [simChatLog, setSimChatLog] = useState<
    Array<{ sender: string; text: string; role: 'user' | 'bot' | 'system' }>
  >([
    {
      sender: 'System',
      text: 'Simulasi pesan WhatsApp aktif. Coba kirim pesan sebagai Owner vs Orang Lain vs Grup untuk menguji aturan privat secara langsung.',
      role: 'system',
    },
  ]);

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger.trim() || !newResponse.trim()) return;

    const formattedTrigger = newTrigger.startsWith(privacyConfig.customPrefix)
      ? newTrigger.trim()
      : `${privacyConfig.customPrefix}${newTrigger.trim()}`;

    setCommands([
      ...commands,
      {
        id: `cmd-${Date.now()}`,
        trigger: formattedTrigger,
        response: newResponse,
        description: newDesc || 'Perintah kustom pengguna',
        enabled: true,
        isSystem: false,
      },
    ]);

    setNewTrigger('');
    setNewResponse('');
    setNewDesc('');
  };

  const handleDeleteCommand = (id: string) => {
    setCommands(commands.filter((c) => c.id !== id));
  };

  const handleToggleCommand = (id: string) => {
    setCommands(commands.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  const handleSimulateSend = () => {
    if (!simMessage.trim()) return;
    const msg = simMessage.trim();

    if (simSenderType === 'owner') {
      const displayOwner = ownerNumber || 'Nomor Anda';
      setSimChatLog((prev) => [
        ...prev,
        { sender: `Owner (${displayOwner})`, text: msg, role: 'user' },
      ]);

      const matchedCmd = commands.find(
        (c) => c.enabled && (c.trigger.toLowerCase() === msg.toLowerCase() || msg.startsWith(c.trigger))
      );

      setTimeout(() => {
        const replyText = matchedCmd
          ? matchedCmd.response
          : `🤖 *FZPEDIA*: Perintah "${msg}" diterima dan dipatuhi dari nomor owner.`;

        setSimChatLog((prev) => [
          ...prev,
          { sender: 'FZPEDIA Bot', text: replyText, role: 'bot' },
        ]);

        onLogActivity({
          senderNumber: ownerNumber || 'Owner',
          senderType: 'owner',
          chatType: 'private',
          messagePreview: msg,
          actionTaken: 'EXECUTED',
          latencyMs: realLatency || 14,
        });
      }, 300);
    } else if (simSenderType === 'stranger') {
      setSimChatLog((prev) => [
        ...prev,
        { sender: 'Orang Lain (+62 878-xxxx-xxxx)', text: msg, role: 'user' },
      ]);

      setTimeout(() => {
        if (privacyConfig.strictPrivateMode && privacyConfig.ignoreStrangers) {
          setSimChatLog((prev) => [
            ...prev,
            {
              sender: 'Filter Privat FZPEDIA',
              text: '⛔ [DIABAIKAN / SILENT DROP]: Pesan dari orang lain diabaikan tanpa balasan demi privasi.',
              role: 'system',
            },
          ]);

          onLogActivity({
            senderNumber: '+62 878-xxxx-xxxx',
            senderType: 'stranger',
            chatType: 'private',
            messagePreview: msg,
            actionTaken: 'DROPPED_STRANGER',
            latencyMs: 3,
          });
        }
      }, 250);
    } else {
      const isMention = msg.includes('@bot') || msg.includes('@FZPEDIA');
      setSimChatLog((prev) => [
        ...prev,
        { sender: 'Grup WhatsApp', text: msg, role: 'user' },
      ]);

      const matchedCmd = commands.find(
        (c) => c.enabled && (c.trigger.toLowerCase() === msg.toLowerCase() || msg.startsWith(c.trigger))
      );

      setTimeout(() => {
        if (matchedCmd) {
          setSimChatLog((prev) => [
            ...prev,
            { sender: 'FZPEDIA Bot (Grup)', text: matchedCmd.response, role: 'bot' },
          ]);

          onLogActivity({
            senderNumber: 'Owner di Grup',
            senderType: 'owner',
            chatType: 'group',
            messagePreview: msg,
            actionTaken: 'EXECUTED',
            latencyMs: realLatency || 12,
          });
        } else if (privacyConfig.ignoreGroupChats || (isMention && privacyConfig.ignoreGroupMentions)) {
          setSimChatLog((prev) => [
            ...prev,
            {
              sender: 'Filter Privat FZPEDIA',
              text: `⛔ [OBROLAN GRUP NON-PERINTAH]: ${
                isMention ? 'Sebutan santai diabaikan.' : 'Obrolan santai diabaikan agar tidak spam di grup.'
              }`,
              role: 'system',
            },
          ]);

          onLogActivity({
            senderNumber: 'Grup WhatsApp',
            senderType: 'group_member',
            chatType: 'group',
            messagePreview: msg,
            actionTaken: isMention ? 'DROPPED_MENTION' : 'DROPPED_GROUP',
            latencyMs: 2,
          });
        } else {
          setSimChatLog((prev) => [
            ...prev,
            {
              sender: 'FZPEDIA Bot (Grup)',
              text: `🤖 Bot aktif di grup. Ketik *!ping* atau *!menu* untuk menjalankan perintah.`,
              role: 'bot',
            },
          ]);
        }
      }, 250);
    }

    setSimMessage('');
  };

  return (
    <PageStage
      badgeTag="PRIVAT & GRUP"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Proteksi Mutlak & Dukungan Grup"
      title="Manajemen Bot &amp; Proteksi Privat"
      subtitle="Bot mematuhi perintah nomor owner di chat pribadi maupun di dalam grup WhatsApp (grup solo/komunitas)."
    >
      <div className="space-y-6 text-left">
        {/* Strict Privacy Toggles */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Aturan Proteksi &amp; Respon
              </h3>
              <p className="text-[11px] text-slate-400">
                Nomor Terdaftar: <span className="text-yellow-400 font-mono">{ownerNumber || 'Belum ditautkan'}</span>
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Strict Guard On</span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                key: 'strictPrivateMode',
                label: 'Hanya Patuhi Nomor Sendiri',
                desc: 'Hanya mengeksekusi perintah dari nomor WhatsApp owner terverifikasi.',
                val: privacyConfig.strictPrivateMode,
              },
              {
                key: 'ignoreStrangers',
                label: 'Abaikan Pesan Orang Lain (DM)',
                desc: 'Pesan langsung dari kontak selain owner otomatis di-drop tanpa balasan.',
                val: privacyConfig.ignoreStrangers,
              },
              {
                key: 'ignoreGroupMentions',
                label: 'Abaikan Sebutan / Tag Santai Grup',
                desc: 'Abaikan jika ada yang sekadar menandai (@bot) di dalam obrolan biasa.',
                val: privacyConfig.ignoreGroupMentions,
              },
              {
                key: 'ignoreGroupChats',
                label: 'Abaikan Obrolan Santai di Grup',
                desc: 'Mencegah spam obrolan biasa, bot hanya merespon perintah resmi (!ping, !status, !menu, dll).',
                val: privacyConfig.ignoreGroupChats,
              },
            ].map((item) => (
              <label
                key={item.key}
                className="p-3 rounded-xl bg-zinc-950 border border-white/5 flex items-start justify-between gap-4 cursor-pointer hover:border-white/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">{item.label}</span>
                  <span className="text-[11px] text-slate-400 block leading-relaxed">{item.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) =>
                    onUpdatePrivacy({ [item.key]: e.target.checked } as any)
                  }
                  className="w-4 h-4 accent-yellow-400 rounded cursor-pointer mt-1"
                />
              </label>
            ))}
          </div>

          {/* Trigger Prefix */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-mono">Trigger Prefix:</span>
            <div className="flex items-center gap-1.5">
              {['!', '.', '/', '#'].map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdatePrivacy({ customPrefix: p })}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    privacyConfig.customPrefix === p
                      ? 'bg-white text-black'
                      : 'bg-zinc-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulator */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Simulator WhatsApp Live
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Live Parser</span>
          </div>

          {/* Persona Switch */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-white/5 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setSimSenderType('owner');
                setSimMessage('!menu');
              }}
              className={`py-1.5 rounded transition-all cursor-pointer ${
                simSenderType === 'owner' ? 'bg-white text-black font-bold' : 'text-slate-400'
              }`}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setSimSenderType('stranger');
                setSimMessage('Halo, saya orang asing');
              }}
              className={`py-1.5 rounded transition-all cursor-pointer ${
                simSenderType === 'stranger' ? 'bg-white text-black font-bold' : 'text-slate-400'
              }`}
            >
              Orang Asing
            </button>
            <button
              type="button"
              onClick={() => {
                setSimSenderType('group');
                setSimMessage('@bot info');
              }}
              className={`py-1.5 rounded transition-all cursor-pointer ${
                simSenderType === 'group' ? 'bg-white text-black font-bold' : 'text-slate-400'
              }`}
            >
              Grup Chat
            </button>
          </div>

          {/* Terminal Screen */}
          <div className="h-48 overflow-y-auto p-3 rounded-xl bg-zinc-950 border border-white/5 space-y-2 text-xs font-sans">
            {simChatLog.map((c, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  c.role === 'user'
                    ? 'items-end'
                    : c.role === 'bot'
                    ? 'items-start'
                    : 'items-center'
                }`}
              >
                {c.role === 'system' ? (
                  <div className="text-[10px] text-yellow-300/80 my-1 text-center font-mono max-w-[95%]">
                    {c.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] p-2 rounded-lg text-xs ${
                      c.role === 'user'
                        ? 'bg-emerald-950 text-emerald-100 border border-emerald-500/20'
                        : 'bg-zinc-800 text-slate-100 border border-white/10'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block font-mono">{c.sender}</span>
                    <p className="whitespace-pre-line leading-relaxed">{c.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulateSend()}
              placeholder="Pesan simulasi..."
              className="flex-1 px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
            />
            <button
              type="button"
              onClick={handleSimulateSend}
              className="p-2 rounded-lg bg-white text-black hover:bg-slate-200 transition-colors cursor-pointer"
              title="Kirim"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Custom Commands List */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-3 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Perintah Bot Aktif ({commands.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {commands.map((cmd) => (
              <div
                key={cmd.id}
                className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-yellow-400 mr-2">{cmd.trigger}</span>
                  <span className="text-slate-400">{cmd.description}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCommand(cmd.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer ${
                      cmd.enabled ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {cmd.enabled ? 'Aktif' : 'Off'}
                  </button>
                  {!cmd.isSystem && (
                    <button
                      onClick={() => handleDeleteCommand(cmd.id)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add command form */}
          <form onSubmit={handleAddCommand} className="pt-2 border-t border-white/5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Trigger (!help)"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
              />
              <input
                type="text"
                placeholder="Keterangan"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <textarea
              placeholder="Balasan bot..."
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              + Simpan Perintah
            </button>
          </form>
        </div>
      </div>
    </PageStage>
  );
}
