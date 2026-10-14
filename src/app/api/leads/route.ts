import { NextRequest, NextResponse } from 'next/server';
import { firestoreDb } from '@/lib/db/firestoreStore';

export async function GET() {
  try {
    const leads = await firestoreDb.listLeads();
    return NextResponse.json({ leads });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lead = {
      ...body,
      id: body.id || `lead-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await firestoreDb.saveLead(lead);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

