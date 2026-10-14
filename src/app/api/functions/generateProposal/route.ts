import { NextRequest, NextResponse } from 'next/server';
import { generateProposalForLead } from '@/lib/proposalEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: "Field 'leadId' is required." },
        { status: 400 }
      );
    }

    const proposal = await generateProposalForLead(leadId);
    return NextResponse.json(proposal);
  } catch (err) {
    console.error('Error in generateProposal:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error in generateProposal' },
      { status: 500 }
    );
  }
}

