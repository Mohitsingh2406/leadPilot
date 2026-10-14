import { NextRequest, NextResponse } from 'next/server';
import { executeEvalSuite } from '@/lib/evalRunner';

export async function POST(req: NextRequest) {
  try {
    let suiteId = 'default_suite';
    try {
      const body = await req.json();
      if (body?.suiteId) suiteId = body.suiteId;
    } catch {
      // Body is optional
    }

    const { report, failures } = await executeEvalSuite(suiteId);

    return NextResponse.json({ report, failures });
  } catch (err) {
    console.error('Error in runEvalSuite:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error in runEvalSuite' },
      { status: 500 }
    );
  }
}

