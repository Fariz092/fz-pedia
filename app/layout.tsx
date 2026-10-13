import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FZPEDIA - WA Gateway & Private Bot Platform',
  description: 'Platform WhatsApp Bot Gateway profesional dengan pairing code, QR code, manajemen bot privat eksklusif, monitoring status real-time, kontrol kecepatan server, dan limit kuota API harian.',
  openGraph: {
    title: 'FZPEDIA - WA Gateway & Private Bot Platform',
    description: 'Platform WhatsApp Bot Gateway profesional dengan pairing code, QR code, manajemen bot privat eksklusif, monitoring status real-time, kontrol kecepatan server, dan limit kuota API harian.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FZPEDIA - WA Gateway & Private Bot Platform',
    description: 'Platform WhatsApp Bot Gateway profesional dengan pairing code, QR code, manajemen bot privat eksklusif, monitoring status real-time, kontrol kecepatan server, dan limit kuota API harian.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#07070a] text-slate-100 antialiased font-sans selection:bg-yellow-400 selection:text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
