import { NextResponse } from 'next/server';
import { getPackagesConfig } from '@/config/packages';

export async function GET() {
  const config = getPackagesConfig();
  return NextResponse.json(config);
}

