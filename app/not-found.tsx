import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-3xl font-bold font-mono text-yellow-400 mb-2">404 - Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-slate-400 mb-6">Halaman yang Anda tuju tidak tersedia di server FZPEDIA.</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-200 transition-all"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
