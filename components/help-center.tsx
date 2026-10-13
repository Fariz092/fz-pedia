'use client';

import React, { useState } from 'react';
import { PageStage } from './page-stage';
import {
  Search,
  ChevronDown,
} from 'lucide-react';

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara menghubungkan dengan Pairing Code?',
      a: 'Buka tab Pairing di FZPEDIA, masukkan nomor WhatsApp Anda, salin kode 8 digit yang muncul. Di ponsel utama Anda, buka WhatsApp > Perangkat Tertaut > Tautkan Perangkat > "Tautkan dengan nomor telepon saja", lalu ketikkan kode 8 digit tersebut.',
    },
    {
      q: 'Bagaimana cara menghubungkan dengan QR Code?',
      a: 'Pilih opsi QR Code di tab Pairing, lalu buka WhatsApp di ponsel Anda > Perangkat Tertaut > Tautkan Perangkat, dan arahkan kamera ponsel ke QR Code yang ditampilkan di layar.',
    },
    {
      q: 'Bagaimana cara kerja proteksi bot privat nomor owner?',
      a: 'Sistem FZPEDIA memeriksa metadata nomor pengirim di setiap pesan masuk. Jika pengirim bukan nomor owner yang Anda daftarkan, sistem akan otomatis melakukan silent drop tanpa balasan, tanpa centang biru, dan tanpa konsumsi kuota.',
    },
    {
      q: 'Apakah sebutan grup (@bot) dan obrolan grup akan diabaikan?',
      a: 'Ya, opsi proteksi grup aktif secara baku. Bot akan mengabaikan panggilan sebutan grup maupun pesan obrolan grup sehingga nomor Anda aman dari spam.',
    },
    {
      q: 'Apa fungsi pembatasan kuota API harian?',
      a: 'Batas kuota harian dan rate limit per menit mencegah bot mengirimkan pesan dalam frekuensi banjir (flood) yang dapat memicu deteksi spam WhatsApp.',
    },
    {
      q: 'Bagaimana cara deploy website FZPEDIA ini ke hosting gratis via GitHub?',
      a: 'Sangat mudah! Push repository ini ke akun GitHub Anda, lalu buka Vercel (vercel.com) atau Render/Netlify. Klik "Add New Project" > impor repo GitHub Anda > biarkan setting bawaan Next.js > klik "Deploy". Website akan langsung aktif dalam 1 menit.',
    },
    {
      q: 'Apakah Pairing Code dan QR Code ini resmi langsung menyambung ke WhatsApp saya?',
      a: 'Web frontend FZPEDIA saat ini memproses format handshake resmi WhatsApp Multi-Device (Baileys/WA Web protocol). Untuk menjadikannya bot aktif 24 jam yang membaca pesan WhatsApp Anda di dunia nyata, arsitektur resmi WhatsApp memerlukan daemon socket backend Baileys (Node.js engine) yang menyimpan kredensial auth_info di server untuk menjaga koneksi socket TCP TLS ke server WhatsApp (g.us).',
    },
    {
      q: 'Apakah FZPEDIA aman dari pemblokiran akun (Anti-Ban)?',
      a: 'Ya, FZPEDIA menggunakan protokol resmi WhatsApp Multi-Device (Baileys v6), rate limiting otomatis, jeda pengetikan natural di Safe Mode, dan proteksi privat mutlak.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      searchQuery === '' ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageStage
      badgeTag="BANTUAN"
      badgeTagColor="bg-yellow-400 text-black"
      badgeText="Pusat Dokumentasi & Tanya Jawab"
      title="Pusat Bantuan &amp; Panduan"
      subtitle="Panduan langkah demi langkah cara pairing WhatsApp, proteksi bot privat, dan konfigurasi server."
    >
      <div className="space-y-4 text-left">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari panduan (pairing, privat, kuota, ban)..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* FAQs */}
        <div className="space-y-2">
          {filteredFaqs.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/5 bg-zinc-900/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
                >
                  <span className="text-xs font-semibold text-white leading-snug">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-yellow-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-0.5 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-zinc-950/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageStage>
  );
}
