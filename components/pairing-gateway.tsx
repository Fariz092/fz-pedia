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
  AlertCircle,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ExternalLink,
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
  realLatency,
}: PairingGatewayProps) {
  const [phoneNumberInput, setPhoneNumberInput] = useState(
    bot.phoneNumber ? bot.phoneNumber.replace(/^\+62\s*/, '') : ''
  );
  const [countryCode, setCountryCode] = useState('+62');
  const [selectedMethod, setSelectedMethod] = useState<PairingMethod>(bot.pairingMethod || 'pairing_code');
  const [pairingCode, setPairingCode] = useState<string>(bot.pairingCode || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFeedback, setStatusFeedback] = useState('');

  // Synchronize QR code generation from raw QR payload
  const renderQrCode = useCallback(async (rawQr: string) => {
    if (!rawQr) return;
    try {
      const url = await QRCode.toDataURL(rawQr, {
        width: 240,
        margin: 2,
        color: {
          dark: '#07070a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to render QR', err);
    }
  }, []);

  // Poll status from Baileys backend
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wa/status');
      if (!res.ok) return;
      const data = await res.json();

      if (data.connectionState === 'connected') {
        onUpdateBot({
          connectionState: 'connected',
          hasSavedSession: true,
          phoneNumber: data.phoneNumber,
          ownerNumber: data.ownerNumber,
          deviceName: data.deviceName,
          waVersion: data.waVersion,
          lastConnectedAt: data.lastConnectedAt || new Date().toLocaleTimeString('id-ID'),
          pingMs: realLatency || 12,
        });
        setIsWaitingForVerification(false);
        setErrorMessage('');
      } else if (data.connectionState === 'connecting') {
        onUpdateBot({
          hasSavedSession: Boolean(data.hasSavedSession),
          phoneNumber: data.phoneNumber || bot.phoneNumber,
        });
        if (data.pairingCode && !pairingCode) {
          setPairingCode(data.pairingCode);
        }
        if (data.qrCodeRaw) {
          renderQrCode(data.qrCodeRaw);
        }
      } else if (data.connectionState === 'disconnected') {
        onUpdateBot({
          hasSavedSession: Boolean(data.hasSavedSession),
          phoneNumber: data.phoneNumber || bot.phoneNumber,
          connectionState: bot.connectionState === 'connected' ? 'disconnected' : bot.connectionState,
        });
      }
    } catch {
      // ignore network glitch
    }
  }, [bot.connectionState, bot.phoneNumber, onUpdateBot, pairingCode, realLatency, renderQrCode]);

  // Periodic polling when waiting for verification
  useEffect(() => {
    if (bot.connectionState === 'connected') return;

    const interval = setInterval(() => {
      if (isWaitingForVerification || selectedMethod === 'qrcode') {
        checkStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [bot.connectionState, checkStatus, isWaitingForVerification, selectedMethod]);

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPairing = async () => {
    let fullNumber = '';

    if (selectedMethod === 'pairing_code') {
      let cleanNum = phoneNumberInput.replace(/\D/g, '');
      if (cleanNum.startsWith('0')) {
        cleanNum = cleanNum.replace(/^0+/, '');
      }
      if (!cleanNum || cleanNum.length < 8) {
        setErrorMessage('Silakan masukkan nomor WhatsApp yang valid (minimal 8 digit).');
        return;
      }
      const cleanCountry = countryCode.replace(/\D/g, '');
      fullNumber = `${cleanCountry}${cleanNum}`;
    }

    setErrorMessage('');
    setStatusFeedback(
      selectedMethod === 'pairing_code'
        ? 'Menghubungi server resmi WhatsApp & meminta kode tautan...'
        : 'Membuat sesi WebSocket dan memuat QR Code resmi WhatsApp...'
    );
    setIsRequestingPairing(true);

    try {
      const res = await fetch('/api/wa/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullNumber,
          method: selectedMethod,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.pairingCode) {
          setPairingCode(data.pairingCode);
          setIsWaitingForVerification(true);
          setStatusFeedback('Kode berhasil diminta dari WhatsApp! Masukkan kode ini di HP Anda.');
        }
        if (data.qrCode) {
          await renderQrCode(data.qrCode);
          setIsWaitingForVerification(true);
          setStatusFeedback('QR Code aktif! Silakan scan dari aplikasi WhatsApp di HP Anda.');
        } else if (selectedMethod === 'qrcode') {
          setIsWaitingForVerification(true);
          setStatusFeedback(data.message || 'QR Code sedang disiapkan...');
        }
        checkStatus();
      } else {
        setErrorMessage(data.message || 'Gagal meminta kode pairing dari WhatsApp.');
        setStatusFeedback('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error?.message || 'Gagal terhubung ke server internal Gateway.');
      setStatusFeedback('');
    } finally {
      setIsRequestingPairing(false);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingStatus(true);
    setStatusFeedback('');
    setErrorMessage('');
    try {
      const res = await fetch('/api/wa/status');
      const data = await res.json();

      if (data.connectionState === 'connected') {
        onUpdateBot({
          connectionState: 'connected',
          phoneNumber: data.phoneNumber,
          ownerNumber: data.ownerNumber,
          deviceName: data.deviceName,
          waVersion: data.waVersion,
          lastConnectedAt: data.lastConnectedAt || new Date().toLocaleTimeString('id-ID'),
          pingMs: realLatency || 12,
        });
        setIsWaitingForVerification(false);
      } else {
        setStatusFeedback(
          'Perangkat belum terverifikasi oleh WhatsApp. Pastikan Anda sudah membuka WhatsApp > Perangkat Tertaut dan memasukkan kode.'
        );
      }
    } catch {
      setErrorMessage('Gagal memeriksa status koneksi.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/wa/disconnect', { method: 'POST' });
    } catch {}

    onUpdateBot({
      connectionState: 'disconnected',
      phoneNumber: '',
      ownerNumber: '',
      pairingCode: '',
    });
    setPhoneNumberInput('');
    setPairingCode('');
    setQrDataUrl('');
    setIsWaitingForVerification(false);
    setStatusFeedback('Sesi WhatsApp telah diputus.');
  };

  const isConnected = bot.connectionState === 'connected';

  return (
    <PageStage
      badgeTag="GATEWAY REALTIME"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Tautan Perangkat WhatsApp Asli (Baileys Engine)"
      title="Pairing WhatsApp Gateway Realtime"
      subtitle="Hubungkan akun WhatsApp nomor Anda secara nyata. Server akan meminta kode pairing resmi dari server WhatsApp."
    >
      {isConnected ? (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 text-left space-y-4 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                  Status: Terhubung &amp; Aktif Realtime
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
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
            <span>Owner: <strong className="text-white">{bot.ownerNumber || bot.phoneNumber}</strong></span>
            <span>·</span>
            <span>Engine: <strong className="text-yellow-400">Baileys WebSocket</strong></span>
            <span>·</span>
            <span>Mode Privat: <strong className="text-emerald-400">Aktif (Tolak Orang Asing)</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-6 backdrop-blur-xl text-left shadow-2xl">
          {/* Saved Multi-Device Session Banner */}
          {bot.hasSavedSession && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-300 font-mono flex items-center gap-2">
                    <span>Sesi WhatsApp Tersimpan Permanen</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Nomor <strong className="text-white font-mono">{bot.phoneNumber || 'terdaftar'}</strong> tersimpan aman di disk server. Anda tidak perlu scan atau meminta kode pairing lagi!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setStatusFeedback('Sedang memulihkan koneksi permanen...');
                    try {
                      await fetch('/api/wa/pair', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber: bot.phoneNumber || '', method: 'qrcode' }),
                      });
                    } catch {}
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm"
                >
                  Hubungkan Otomatis
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-300 text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Ganti Akun
                </button>
              </div>
            </div>
          )}

          {/* Method Segment */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod('pairing_code');
                  setIsWaitingForVerification(false);
                  setErrorMessage('');
                }}
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
                onClick={() => {
                  setSelectedMethod('qrcode');
                  setIsWaitingForVerification(false);
                  setErrorMessage('');
                }}
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

          {/* Phone Number Input (Only needed for Pairing Code) */}
          {selectedMethod === 'pairing_code' ? (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 block uppercase tracking-wider font-mono">
                Nomor WhatsApp HP Anda:
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
                    setIsWaitingForVerification(false);
                  }}
                  placeholder="Contoh: 08123456789 atau 8123456789"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400"
                />
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                Bisa diawali 08... atau 8... (sistem otomatis menstandarkan nomor ke format E.164).
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/5 text-xs text-slate-300 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Metode QR Code Instan</span>
                <span className="text-slate-400 text-[11px]">
                  Tidak memerlukan input nomor HP. Cukup klik tombol di bawah lalu scan dengan kamera WhatsApp di HP Anda.
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusFeedback && (
            <div className="p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs text-yellow-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-yellow-400" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Pairing Code Content */}
          {selectedMethod === 'pairing_code' ? (
            <div className="p-5 rounded-xl bg-zinc-950 border border-white/5 space-y-4">
              {!isWaitingForVerification && !pairingCode ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 mx-auto flex items-center justify-center text-yellow-400">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Minta Kode Pairing Resmi</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Server akan melakukan handshake langsung ke server WhatsApp dan meminta 8-digit kode tautan resmi untuk nomor Anda.
                    </p>
                  </div>

                  <button
                    onClick={handleRequestPairing}
                    disabled={isRequestingPairing}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isRequestingPairing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menghubungi Server WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <span>Minta Kode Pairing Sekarang</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-yellow-400/30">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-yellow-400/90 font-mono font-bold block">
                        Kode Tautan Resmi WhatsApp (Aktif):
                      </span>
                      <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white select-all mt-0.5">
                        {pairingCode || 'MEMPROSES...'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Kode</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleRequestPairing}
                        disabled={isRequestingPairing}
                        className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                        title="Minta Kode Baru"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRequestingPairing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Real Instructions */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs">
                    <div className="font-semibold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase text-yellow-400">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Langkah Memasukkan Kode di HP:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed font-sans">
                      <li>Buka aplikasi WhatsApp di HP nomor Anda.</li>
                      <li>
                        Buka <strong>Pengaturan</strong> &gt; <strong>Perangkat Tertaut</strong> &gt; <strong>Tautkan Perangkat</strong>.
                      </li>
                      <li>
                        Klik tulisan biru di bagian bawah: <strong>&quot;Tautkan dengan nomor telepon saja&quot;</strong>.
                      </li>
                      <li>
                        Masukkan kode 8 digit di atas: <span className="font-mono text-yellow-300 font-bold">{pairingCode}</span>.
                      </li>
                    </ol>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleManualCheck}
                      disabled={isCheckingStatus}
                      className="w-full sm:flex-1 py-3 px-4 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      {isCheckingStatus ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengecek Verifikasi WhatsApp...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cek Status Verifikasi HP Sekarang</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsWaitingForVerification(false);
                        setPairingCode('');
                      }}
                      className="w-full sm:w-auto px-5 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                    >
                      Batal / Ganti Nomor
                    </button>
                  </div>
                </div>
              )}
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
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-3 text-xs text-zinc-600 space-y-2">
                    <RefreshCw className={`w-5 h-5 text-zinc-400 ${isRequestingPairing ? 'animate-spin' : ''}`} />
                    <span>Klik tombol di bawah untuk membuat QR session resmi</span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={handleRequestPairing}
                  disabled={isRequestingPairing}
                  className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isRequestingPairing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat QR Session WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Buat / Segarkan QR Code</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 leading-relaxed">
                  Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat &gt; Arahkan kamera ke QR di atas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </PageStage>
  );
}
