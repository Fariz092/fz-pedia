import { NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp-service';

export async function GET() {
  // If registered session files exist on disk but socket is currently disconnected, trigger auto-restore
  if (waManager.hasRegisteredSession() && waManager.getState().connectionState === 'disconnected') {
    waManager.restoreSessionIfAvailable().catch(() => {});
  }

  const state = waManager.getState();
  return NextResponse.json(state);
}
