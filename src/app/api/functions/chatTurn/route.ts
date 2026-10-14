import { NextRequest, NextResponse } from 'next/server';
import { executeChatTurn } from '@/lib/agentEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message, apiKey } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Field 'message' is required and must be a string." },
        { status: 400 }
      );
    }

    const convId = conversationId || `conv-${Date.now().toString(36)}`;
    const result = await executeChatTurn(convId, message, apiKey);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error in chatTurn:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error in chatTurn' },
      { status: 500 }
    );
  }
}

