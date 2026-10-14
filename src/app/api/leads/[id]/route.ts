import { NextRequest, NextResponse } from 'next/server';
import { firestoreDb } from '@/lib/db/firestoreStore';
import { PipelineStage } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await firestoreDb.getLead(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { stage, noteText, author } = body;

    const lead = await firestoreDb.getLead(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (stage) {
      lead.stage = stage as PipelineStage;
    }

    if (noteText) {
      lead.notes.unshift({
        id: `note-${Date.now()}`,
        author: author || 'Admin',
        text: noteText,
        createdAt: new Date().toISOString(),
      });
    }

    await firestoreDb.saveLead(lead);
    return NextResponse.json({ lead });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

