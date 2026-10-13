import { NextRequest, NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber = '', method = 'pairing_code' } = body;

    const result = await waManager.startSession(phoneNumber, method);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses permintaan pairing.' },
      { status: 500 }
    );
  }
}
