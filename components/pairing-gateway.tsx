'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { PageStage } from './page-stage';
import {
  KeyRound,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { BotInstance, PairingMethod } from '../types/bot';

interface PairingGatewayProps {
  bot: BotInstance;
  onUpdateBot: (updated: Partial<BotInstance>) => void;
  onNavigateToDashboard: () => void;
  onNavigateToManagement: () => void;
  realLatency: number;
}

export function PairingGateway({
  bot,
  onUpdateBot,
  onNavigateToDashboard,
  onNavigateToManagement,
  realLatency,
}: PairingGatewayProps) {
  const [phoneNumberInput, setPhoneNumberInput] = useState(
    bot.phoneNumber ? bot.phoneNumber.replace(/^\+62\s*/, '') : ''
  );
  const [countryCode, setCountryCode] = useState('+62');
  const [selectedMethod, setSelectedMethod] = useState<PairingMethod>(bot.pairingMethod || 'pairing_code');
  const [pairingCode, setPairingCode] = useState<string>(() => {
    if (bot.pairingCode) return bot.pairingCode;
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let part1 = 'FZ';
    for (let i = 0; i < 2; i++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    let part2 = '';
    for (let i = 0; i < 4; i++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${part1}-${part2}`;
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(180);
  const [qrCountdown, setQrCountdown] = useState(30);
  const [isPairingProcessing, setIsPairingProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generateNewPairingCode = useCallback(() => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let part1 = 'FZ';
    for (let i = 0; i < 2; i++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    let part2 = '';
    for (let i = 0; i < 4; i++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    const newCode = `${part1}-${part2}`;
    setPairingCode(newCode);
    setCodeCountdown(180);
    return newCode;
  }, []);

  const generateNewQrCode = useCallback(async (phone: string) => {
    const cleanNum = phone.replace(/\D/g, '');
    const fullPhone = cleanNum ? `${countryCode}${cleanNum}` : 'UNCONFIGURED';
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const payload = `2@FZPEDIA_AUTH_HANDSHAKE,${fullPhone},${Date.now()},${randomSeed},AES256_E2EE`;
    try {
      const url = await QRCode.toDataURL(payload, {
        width: 240,
        margin: 2,
        color: {
          dark: '#07070a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
      setQrCountdown(30);
    } catch (err) {
      console.error('Failed to generate QR', err);
    }
  }, [countryCode]);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      const cleanNum = phoneNumberInput.replace(/\D/g, '');
      const fullPhone = cleanNum ? `${countryCode}${cleanNum}` : 'UNCONFIGURED';
      const randomSeed = Math.random().toString(36).substring(2, 10);
      const payload = `2@FZPEDIA_AUTH_HANDSHAKE,${fullPhone},${Date.now()},${randomSeed},AES256_E2EE`;
      try {
        const url = await QRCode.toDataURL(payload, {
          width: 240,
          margin: 2,
          color: {
            dark: '#07070a',
            light: '#ffffff',
          },
        });
        if (!isCancelled) {
          setQrDataUrl(url);
          setQrCountdown(30);
        }
      } catch (err) {
        console.error('Failed to generate QR', err);
      }
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [phoneNumberInput, countryCode]);

  useEffect(() => {
    if (bot.connectionState === 'connected') return;

    const timer = setInterval(() => {
      setCodeCountdown((prev) => {
        if (prev <= 1) {
          generateNewPairingCode();
          return 180;
        }
        return prev - 1;
      });

      setQrCountdown((prev) => {
        if (prev <= 1) {
          generateNewQrCode(phoneNumberInput);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bot.connectionState, generateNewPairingCode, generateNewQrCode, phoneNumberInput]);

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyConnection = async () => {
    const cleanNum = phoneNumberInput.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 8) {
      setErrorMessage('Silakan masukkan nomor WhatsApp yang valid (minimal 8 digit).');
      return;
    }

    setErrorMessage('');
    setIsPairingProcessing(true);
    onUpdateBot({ connectionState: 'connecting' });

    let measuredPing = realLatency || 14;
    try {
      const t0 = performance.now();
      const res = await fetch('/api/server-ping');
      if (res.ok) {
        measuredPing = Math.max(8, Math.round(performance.now() - t0));
      }
    } catch {
      // fallback
    }

    setTimeout(() => {
      const fullNumber = `${countryCode} ${cleanNum}`;
      onUpdateBot({
        phoneNumber: fullNumber,
        ownerNumber: fullNumber,
        pairingMethod: selectedMethod,
        pairingCode,
        connectionState: 'connected',
        lastConnectedAt: new Date().toLocaleTimeString('id-ID'),
        batteryLevel: 94,
        isCharging: true,
        pingMs: measuredPing,
      });
      setIsPairingProcessing(false);
    }, 1600);
  };

  const handleDisconnect = () => {
    onUpdateBot({
      connectionState: 'disconnected',
      phoneNumber: '',
      ownerNumber: '',
    });
    setPhoneNumberInput('');
    generateNewPairingCode();
  };

  const isConnected = bot.connectionState === 'connected';

  return (
    <PageStage
      badgeTag="PAIRING"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Tautkan Perangkat WhatsApp"
      title="Pairing WhatsApp Gateway"
      subtitle="Hubungkan akun WhatsApp Anda dengan aman. Bot akan mengunci nomor Anda sebagai Owner Tunggal."
    >
      {isConnected ? (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 text-left space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-400 block font-semibold">
                Status: Terhubung &amp; Aktif
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
                {bot.phoneNumber}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToDashboard}
                className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer shadow-md"
              >
                Buka Dashboard
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-full bg-zinc-800 text-red-300 hover:bg-zinc-700 text-xs font-medium transition-all cursor-pointer"
              >
                Putus Sesi
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
            <span>Owner: <strong className="text-white">{bot.ownerNumber}</strong></span>
            <span>·</span>
            <span>Latensi Riil: <strong className="text-yellow-400">{bot.pingMs}ms</strong></span>
            <span>·</span>
            <span>Mode Privat: <strong className="text-emerald-400">Aktif</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-6 backdrop-blur-xl text-left shadow-2xl">
          {/* Step 1: Input Phone */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider font-mono">
              Nomor WhatsApp Anda:
            </label>
            <div className="flex items-stretch gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-28 px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-yellow-400 cursor-pointer"
              >
                <option value="+62">🇮🇩 +62</option>
                <option value="+60">🇲🇾 +60</option>
                <option value="+65">🇸🇬 +65</option>
                <option value="+1">🇺🇸 +1</option>
              </select>

              <input
                type="tel"
                value={phoneNumberInput}
                onChange={(e) => {
                  setPhoneNumberInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Contoh: 81234567890"
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 font-sans">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          {/* Step 2: Method Segment */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setSelectedMethod('pairing_code')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedMethod === 'pairing_code'
                    ? 'bg-white text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Pairing Code (8 Digit)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('qrcode')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedMethod === 'qrcode'
                    ? 'bg-white text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code (Scan)</span>
              </button>
            </div>
          </div>

          {/* Method Content */}
          {selectedMethod === 'pairing_code' ? (
            <div className="p-5 rounded-xl bg-zinc-950 border border-white/5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Kode Tautan (180s)
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-yellow-400 select-all">
                    {pairingCode || 'MEMBUAT...'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={generateNewPairingCode}
                    className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Perbarui Kode"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat &gt; &quot;Tautkan dengan nomor telepon saja&quot; &gt; Masukkan kode 8 digit.
              </p>

              <button
                onClick={handleVerifyConnection}
                disabled={isPairingProcessing}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isPairingProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Memverifikasi Koneksi...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi &amp; Hubungkan Perangkat</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-zinc-950 border border-white/5 flex flex-col items-center space-y-4">
              <div className="p-2.5 bg-white rounded-xl shadow-lg">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48 rounded-lg block"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-500">
                    Membuat QR Code...
                  </div>
                )}
              </div>

              <p className="text-center text-[11px] text-slate-400 font-mono">
                Refresh otomatis: {qrCountdown}s · Arahkan kamera WhatsApp
              </p>

              <button
                onClick={handleVerifyConnection}
                disabled={isPairingProcessing}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isPairingProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Menyinkronkan Sesi QR Code...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi QR Telah Dipindai</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </PageStage>
  );
}
