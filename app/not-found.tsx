import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">404 - Halaman Tidak Ditemukan</h2>
      <p className="text-slate-400 text-sm mb-4">Halaman yang Anda cari tidak tersedia.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-slate-200"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
