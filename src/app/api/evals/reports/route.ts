import { NextResponse } from 'next/server';
import { firestoreDb } from '@/lib/db/firestoreStore';

export async function GET() {
  try {
    const reports = await firestoreDb.listEvalReports();
    return NextResponse.json({ reports });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

