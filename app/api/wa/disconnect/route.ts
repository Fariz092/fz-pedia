import { NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp-service';

export async function POST() {
  await waManager.disconnectSession();
  return NextResponse.json({ success: true, message: 'Sesi WhatsApp berhasil diputus.' });
}
