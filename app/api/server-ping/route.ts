import { NextResponse } from 'next/server';

export async function GET() {
  const timestamp = Date.now();
  return NextResponse.json({
    status: 'optimal',
    timestamp,
    server: 'FZPEDIA-Gateway-Core',
    environment: process.env.NODE_ENV || 'production',
  });
}
