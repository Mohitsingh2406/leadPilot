import {
  Lead,
  Message,
  ToolCallRecord,
  ChatTurnResult,
  PipelineStage,
  ExtractedFields,
} from './types';
import { firestoreDb } from './db/firestoreStore';
import { checkRedTeamSafety } from './redTeamSafety';
import { parseAndAutoRepairToolCall } from './autoRepair';
import { validateAndEnforceGroundedOffer } from './grounding';
import { matchGroundedPackage } from '../config/packages';
import {
  ExtractLeadInput,
  ScoreLeadInput,
  SuggestOfferInput,
  BookSlotInput,
  HandoffToHumanInput,
} from './schemas';

const ALL_QUALIFICATION_DIMENSIONS = [
  'company',
  'role',
  'teamSize',
  'budget',
  'timeline',
  'decisionMaker',
];

/**
 * Intelligent BANT heuristic extraction from message text
 */
function extractBANTFromText(
  text: string,
  currentFields: ExtractedFields
): Partial<ExtractLeadInput> {
  const extracted: Partial<ExtractLeadInput> = {};
  const lower = text.toLowerCase();

  // Name extraction
  const nameMatch = text.match(/\b(?:i am|my name is|this is|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
  if (nameMatch && !currentFields.name) {
    extracted.name = nameMatch[1];
  }

  // Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && !currentFields.email) {
    extracted.email = emailMatch[0];
  }

  // Company extraction
  const companyMatch = text.match(
    /\b(?:at|from|company is|with|founder of|founder at|represent)\s+([A-Z][A-Za-z0-9&.\-_]+(?:\s+[A-Z][A-Za-z0-9&.\-_]+)?)\b/i
  );
  if (companyMatch && !currentFields.company) {
    const rawCo = companyMatch[1].trim();
    if (!['i', 'we', 'our', 'my', 'the'].includes(rawCo.toLowerCase())) {
      extracted.company = rawCo;
    }
  }

  // Role extraction
  const roleMatch = text.match(
    /\b(?:i am the|i'm the|as|role is|working as)\s+([A-Za-z\s]+?)(?:at|,|\.|\n|$)/i
  );
  if (roleMatch && !currentFields.role) {
    extracted.role = roleMatch[1].trim();
  } else {
    const directRole = text.match(
      /\b(VP of Sales|VP Sales|Director of Sales|Sales Director|Chief Revenue Officer|CRO|Founder|Co-Founder|CEO|CTO|VP of Engineering|SDR|BDR|Director of Compliance|Procurement Officer|Head of Growth|Head of Sales)\b/i
    );
    if (directRole && !currentFields.role) {
      extracted.role = directRole[1];
    }
  }

  // Team Size extraction
  const teamMatch = text.match(
    /\b(?:team of|have|around|about|managing|handling)\s+(\d+)\s*(?:sales reps|reps|account executives|ae|users|seats|people|team members|members)?\b/i
  );
  if (teamMatch && currentFields.teamSize === undefined) {
    extracted.teamSize = parseInt(teamMatch[1], 10);
  } else {
    const numSeats = text.match(/\b(\d+)\s*(?:sales reps|reps|seats|members)\b/i);
    if (numSeats && currentFields.teamSize === undefined) {
      extracted.teamSize = parseInt(numSeats[1], 10);
    }
  }

  // Budget extraction
  const budgetMatch = text.match(
    /\b(?:budget is|budget of|capped at|around|budget)\s*(\$?\s*[0-9]+(?:,[0-9]+)?(?:\s*k|\s*thousand)?(?:\s*\/\s*(?:mo|month|yr|year))?)\b/i
  );
  if (budgetMatch && !currentFields.budget) {
    extracted.budget = budgetMatch[1];
  } else {
    const standaloneDollar = text.match(/\$\s*([0-9]+(?:,[0-9]+)?(?:\s*\/\s*(?:mo|month|yr|year))?)/i);
    if (standaloneDollar && !currentFields.budget) {
      extracted.budget = standaloneDollar[0];
    }
  }

  // Timeline extraction
  const timelineMatch = text.match(
    /\b(?:launch|start|deploy|looking at|within|timeline is)\s+([A-Za-z0-9\s]+?)(?:\.|\,|$)/i
  );
  if (timelineMatch && !currentFields.timeline) {
    const val = timelineMatch[1].trim();
    if (val.length < 30) extracted.timeline = val;
  } else {
    const quickTimeline = text.match(/\b(immediately|next month|next quarter|in 2 weeks|in 30 days|q[1-4]|within 45 days)\b/i);
    if (quickTimeline && !currentFields.timeline) {
      extracted.timeline = quickTimeline[1];
    }
  }

  // Decision maker
  if (lower.includes('my vp makes the final') || lower.includes('not the decision maker') || lower.includes('for my boss')) {
    extracted.decisionMaker = false;
  } else if (
    lower.includes('full sign-off') ||
    lower.includes('i make all purchasing') ||
    lower.includes('i hold purchase') ||
    lower.includes('decision authority') ||
    lower.includes('budget approval') ||
    lower.includes('i make the call') ||
    lower.includes('i approve the technical') ||
    lower.includes('founder') ||
    lower.includes('ceo') ||
    lower.includes('cro')
  ) {
    extracted.decisionMaker = true;
  }

  return extracted;
}

/**
 * Executes a conversational turn through strict tool calling and grounding enforcement
 */
export async function executeChatTurn(
  conversationId: string,
  userMessage: string,
  geminiApiKey?: string
): Promise<ChatTurnResult> {
  if (geminiApiKey) {
    // Gemini key provided; ready for live LLM inference
    console.log(`[LeadPilot Agent] Gemini key detected for turn in ${conversationId}`);
  }

  // Retrieve or create conversation and lead
  let convo = await firestoreDb.getConversation(conversationId);
  let lead: Lead | null = null;

  if (convo) {
    lead = await firestoreDb.getLead(convo.leadId);
  }

  if (!convo || !lead) {
    const newLeadId = `lead-${Date.now().toString(36)}`;
    const newConvoId = conversationId || `conv-${Date.now().toString(36)}`;

    lead = {
      id: newLeadId,
      conversationId: newConvoId,
      stage: 'new',
      score: 10,
      scoreRationale: 'Initial prospect greeting received.',
      fitLevel: 'medium',
      extractedFields: {},
      unknowns: [...ALL_QUALIFICATION_DIMENSIONS],
      riskFlags: [],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    convo = {
      id: newConvoId,
      leadId: newLeadId,
      messages: [],
      toolCallsCount: 0,
      extractedFacts: [],
      unknownsToFollowUp: [...ALL_QUALIFICATION_DIMENSIONS],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Append user message
  const userMsgRecord: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  };
  convo.messages.push(userMsgRecord);

  // 1. Red-Team Security Check
  const safety = checkRedTeamSafety(userMessage);
  if (safety.riskFlags.length > 0) {
    for (const flag of safety.riskFlags) {
      if (!lead.riskFlags.includes(flag)) {
        lead.riskFlags.push(flag);
      }
    }
  }

  if (safety.hasViolation && safety.enforcedReply) {
    const assistantMsgRecord: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role: 'assistant',
      content: safety.enforcedReply,
      timestamp: new Date().toISOString(),
    };
    convo.messages.push(assistantMsgRecord);

    await firestoreDb.saveLead(lead);
    await firestoreDb.saveConversation(convo);

    return {
      reply: safety.enforcedReply,
      toolCalls: [],
      lead,
      conversation: convo,
      unknowns: lead.unknowns,
    };
  }

  // 2. Strict Tool Execution Cycle
  const toolCalls: ToolCallRecord[] = [];
  const currentTurn = convo.messages.length;

  // Tool 1: extractLead()
  const newlyExtracted = extractBANTFromText(userMessage, lead.extractedFields);
  if (Object.keys(newlyExtracted).length > 0) {
    const parseRes = parseAndAutoRepairToolCall<ExtractLeadInput>('extractLead', newlyExtracted);
    const validData = parseRes.data;

    // Merge into lead.extractedFields
    lead.extractedFields = {
      ...lead.extractedFields,
      ...validData,
    };

    // Update conversation facts & unknowns
    for (const [key, val] of Object.entries(validData)) {
      if (val !== undefined) {
        convo.extractedFacts.push({
          field: key,
          value: typeof val === 'object' ? JSON.stringify(val) : (val as string | number | boolean),
          turn: currentTurn,
        });
        lead.unknowns = lead.unknowns.filter((u) => u !== key);
      }
    }
    convo.unknownsToFollowUp = [...lead.unknowns];

    toolCalls.push({
      id: `call-extract-${Date.now()}`,
      name: 'extractLead',
      arguments: newlyExtracted,
      result: { extracted: validData, currentUnknowns: lead.unknowns },
      isRepaired: parseRes.isRepaired,
      repairedReason: parseRes.repairedReasons.join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  // Tool 2: scoreLead()
  // Calculate score based on extracted fields
  let calculatedScore = 15;
  if (lead.extractedFields.company) calculatedScore += 15;
  if (lead.extractedFields.role) calculatedScore += 15;
  if (lead.extractedFields.teamSize) calculatedScore += 15;
  if (lead.extractedFields.budget) calculatedScore += 20;
  if (lead.extractedFields.timeline) calculatedScore += 15;
  if (lead.extractedFields.decisionMaker === true) calculatedScore += 10;
  if (lead.extractedFields.decisionMaker === false) calculatedScore += 0;

  // Check if student / $0
  const budgetStr = String(lead.extractedFields.budget || '').toLowerCase();
  if (budgetStr.includes('$0') || budgetStr.includes('zero')) {
    calculatedScore = 10;
  }

  let stage: PipelineStage = lead.stage;
  if (calculatedScore >= 60 && stage === 'new') {
    stage = 'qualified';
  }

  const scorePayload: ScoreLeadInput = {
    score: Math.min(100, calculatedScore),
    qualificationStage: stage,
    fitLevel: calculatedScore >= 75 ? 'high' : calculatedScore >= 50 ? 'medium' : 'low',
    rationale: `Lead qualification calculated with ${Object.keys(lead.extractedFields).length} verified dimensions. Remaining unknowns: ${lead.unknowns.join(', ') || 'none'}.`,
    riskFlags: lead.riskFlags,
  };

  const scoreRes = parseAndAutoRepairToolCall<ScoreLeadInput>('scoreLead', scorePayload);
  lead.score = scoreRes.data.score;
  lead.stage = scoreRes.data.qualificationStage;
  lead.fitLevel = scoreRes.data.fitLevel;
  lead.scoreRationale = scoreRes.data.rationale;

  toolCalls.push({
    id: `call-score-${Date.now()}`,
    name: 'scoreLead',
    arguments: scorePayload,
    result: scoreRes.data,
    isRepaired: scoreRes.isRepaired,
    repairedReason: scoreRes.repairedReasons.join(', '),
    timestamp: new Date().toISOString(),
  });

  // Tool 3: suggestOffer()
  // Triggered when lead has enough info (score >= 50 or asked about pricing/proposal)
  const isAskingPricing =
    userMessage.toLowerCase().includes('package') ||
    userMessage.toLowerCase().includes('pricing') ||
    userMessage.toLowerCase().includes('proposal') ||
    userMessage.toLowerCase().includes('starter') ||
    userMessage.toLowerCase().includes('growth') ||
    userMessage.toLowerCase().includes('enterprise') ||
    userMessage.toLowerCase().includes('recommend') ||
    lead.score >= 55;

  if (isAskingPricing && !lead.suggestedOffer) {
    const matched = matchGroundedPackage(
      lead.extractedFields.budget,
      lead.extractedFields.teamSize,
      lead.riskFlags.includes('enterprise_compliance_required') ||
        (typeof lead.extractedFields.teamSize === 'number' && lead.extractedFields.teamSize > 25)
    );

    const rawOffer: SuggestOfferInput = {
      packageId: matched.id,
      packageName: matched.name,
      billingCycle: 'monthly',
      price: matched.pricing.monthly,
      recommendedAddons: lead.riskFlags.includes('enterprise_compliance_required')
        ? ['soc2_package']
        : [],
      rationale: `Matched ${matched.name} based on verified team size of ${lead.extractedFields.teamSize || 'unspecified'} and volume.`,
    };

    // Strict Grounding & Hallucination Check
    const groundingCheck = validateAndEnforceGroundedOffer(rawOffer);
    lead.suggestedOffer = groundingCheck.groundedOffer;
    if (lead.stage === 'qualified' && userMessage.toLowerCase().includes('proposal')) {
      lead.stage = 'proposal_sent';
    }

    toolCalls.push({
      id: `call-offer-${Date.now()}`,
      name: 'suggestOffer',
      arguments: rawOffer,
      result: groundingCheck.groundedOffer,
      groundingChecked: true,
      isHallucinated: groundingCheck.isHallucinated,
      repairedReason: groundingCheck.hallucinationReason,
      timestamp: new Date().toISOString(),
    });
  }

  // Tool 4: bookSlot()
  // Triggered when user asks to book demo or provides time
  const lowerMsg = userMessage.toLowerCase();
  const isBookingRequest =
    lowerMsg.includes('book') ||
    lowerMsg.includes('demo') ||
    lowerMsg.includes('schedule') ||
    lowerMsg.includes('calendar') ||
    lowerMsg.includes('tuesday') ||
    lowerMsg.includes('friday') ||
    lowerMsg.includes('thursday') ||
    lowerMsg.includes('wednesday') ||
    lowerMsg.includes('pm') ||
    lowerMsg.includes('am');

  if (isBookingRequest && (lead.extractedFields.email || userMessage.includes('@'))) {
    const dateMatch = userMessage.match(/\b(next\s+tuesday|next\s+wednesday|friday|thursday|tuesday|wednesday|monday|\d{4}-\d{2}-\d{2})\b/i);
    const timeMatch = userMessage.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)(?:\s*[A-Z]{3})?)\b/i);
    const emailMatch = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

    const bookingPayload: BookSlotInput = {
      date: dateMatch ? dateMatch[1] : 'Next Tuesday',
      timeSlot: timeMatch ? timeMatch[1] : '2:00 PM EST',
      timezone: lowerMsg.includes('london') ? 'Europe/London' : 'America/New_York',
      attendeeEmail: emailMatch ? emailMatch[0] : (lead.extractedFields.email as string) || 'prospect@company.com',
      attendeeName: (lead.extractedFields.name as string) || 'Valued Prospect',
      topic: 'LeadPilot Inbound Sales Agent Demo & Custom Workflow Architecture',
      notes: `Lead score: ${lead.score}/100. Selected package: ${lead.suggestedOffer?.packageName || 'Growth Accelerator'}.`,
    };

    const bookRes = parseAndAutoRepairToolCall<BookSlotInput>('bookSlot', bookingPayload);
    lead.bookedSlot = bookRes.data;
    lead.stage = 'booked';

    toolCalls.push({
      id: `call-book-${Date.now()}`,
      name: 'bookSlot',
      arguments: bookingPayload,
      result: bookRes.data,
      isRepaired: bookRes.isRepaired,
      repairedReason: bookRes.repairedReasons.join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  // Tool 5: handoffToHuman()
  // Triggered when complex procurement, student $0 budget, or high complexity
  if (
    lowerMsg.includes('master services agreement') ||
    lowerMsg.includes('procurement') ||
    lowerMsg.includes('speak to a human') ||
    lowerMsg.includes('call my boss')
  ) {
    const handoffPayload: HandoffToHumanInput = {
      reason: 'Lead requires custom enterprise MSA procurement terms and legal review.',
      priority: 'high',
      summaryForAgent: `Lead from ${lead.extractedFields.company || 'Enterprise'}. Needs custom terms and executive sales engineer follow-up.`,
      routingDepartment: 'Enterprise Solutions & Legal',
    };

    const handoffRes = parseAndAutoRepairToolCall<HandoffToHumanInput>('handoffToHuman', handoffPayload);
    lead.handoffReason = handoffRes.data.reason;
    lead.handoffPriority = handoffRes.data.priority;

    toolCalls.push({
      id: `call-handoff-${Date.now()}`,
      name: 'handoffToHuman',
      arguments: handoffPayload,
      result: handoffRes.data,
      isRepaired: handoffRes.isRepaired,
      repairedReason: handoffRes.repairedReasons.join(', '),
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Compose Grounded, Non-Hallucinated Assistant Reply
  let reply = '';

  if (safety.mustAskVerificationQuestion) {
    reply = safety.enforcedReply!;
  } else if (lead.bookedSlot && toolCalls.some((t) => t.name === 'bookSlot')) {
    reply = `Awesome! I have scheduled your technical demo for **${lead.bookedSlot.date} at ${lead.bookedSlot.timeSlot} (${lead.bookedSlot.timezone})**. Calendar invitations with Zoom links have been sent to **${lead.bookedSlot.attendeeEmail}**. Our solutions engineer will have your ${lead.suggestedOffer?.packageName || 'recommended'} configuration pre-loaded.`;
  } else if (lead.handoffReason && toolCalls.some((t) => t.name === 'handoffToHuman')) {
    reply = `Understood. Given your enterprise requirements regarding procurement and custom agreements, I have escalated your file to our **Enterprise Solutions & Legal Team** (Priority: ${lead.handoffPriority?.toUpperCase()}). A senior solutions engineer will contact you directly within 2 business hours.`;
  } else if (lead.suggestedOffer && (toolCalls.some((t) => t.name === 'suggestOffer') || userMessage.toLowerCase().includes('proposal'))) {
    reply = `Based on your team size and qualification details, I recommend our grounded **${lead.suggestedOffer.packageName}** at **$${lead.suggestedOffer.price.toLocaleString()}/${lead.suggestedOffer.billingCycle === 'annual' ? 'yr' : 'mo'}**.\n\nIncluded Features:\n${lead.suggestedOffer.features.map((f) => `• ${f}`).join('\n')}\n\n${lead.unknowns.length > 0 ? `To finalize your tailored proposal, could you let me know your estimated **${lead.unknowns[0]}**?` : 'Would you like to book a 20-minute live demonstration to review the workflow with a solutions specialist?'}`;
  } else if (lead.unknowns.length > 0) {
    const nextUnknown = lead.unknowns[0];
    const questionMap: Record<string, string> = {
      company: 'What is the name of your company or organization?',
      role: 'What is your current role within the sales or leadership team?',
      teamSize: 'How many sales reps or account executives will be using the qualification platform?',
      budget: 'What approximate monthly or annual budget does your team have allocated for sales automation?',
      timeline: 'What is your target timeline for launching or deploying this solution?',
      decisionMaker: 'Are you the primary decision-maker for evaluating and signing off on software tools?',
    };
    const question = questionMap[nextUnknown] || `Could you clarify your ${nextUnknown}?`;
    reply = `Thanks for sharing that! ${question}`;
  } else {
    reply = `Thank you! I have all key qualification details captured. Our team has matched you with Spacenos's verified solutions. Would you like to review an interactive proposal or pick a time for a live demo?`;
  }

  // Append assistant message
  const assistantMsgRecord: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    role: 'assistant',
    content: reply,
    toolCalls,
    timestamp: new Date().toISOString(),
  };
  convo.messages.push(assistantMsgRecord);
  convo.toolCallsCount += toolCalls.length;

  // Persist to Firestore
  await firestoreDb.saveLead(lead);
  await firestoreDb.saveConversation(convo);

  return {
    reply,
    toolCalls,
    lead,
    conversation: convo,
    unknowns: lead.unknowns,
  };
}

