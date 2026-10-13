import { NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp-service';

export async function GET() {
  const state = waManager.getState();
  return NextResponse.json(state);
}
