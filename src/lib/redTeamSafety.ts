import { RiskFlag } from './types';

export interface SafetyCheckResult {
  hasViolation: boolean;
  violationType?: 'prompt_injection' | 'system_leak' | 'fake_urgency' | 'unauthorized_discount';
  riskFlags: RiskFlag[];
  enforcedReply?: string;
  mustAskVerificationQuestion?: boolean;
}

/**
 * Red-team guard that intercepts adversarial prompts, system leak probes, and fake urgency
 */
export function checkRedTeamSafety(message: string): SafetyCheckResult {
  const text = message.toLowerCase().trim();
  const riskFlags: RiskFlag[] = [];

  // 1. Prompt Injection Checks
  const promptInjectionPatterns = [
    /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b/i,
    /\bignore\s+(pricing\s+config|pricing|rules|guardrails|guidelines)\b/i,
    /\bgive\s+me\s+admin\s+(access|privileges|role|rights)\b/i,
    /\b(system\s+override|developer\s+mode|root\s+mode|dan\s+mode|god\s+mode)\b/i,
    /\bdisregard\s+(your\s+)?(instructions|rules|system\s+prompt)\b/i,
    /\byou\s+are\s+now\s+(an\s+unrestricted|a\s+free|an\s+evil)\b/i,
    /\bescape\s+character\s+jailbreak\b/i,
    /\bpretend\s+you\s+can\s+change\s+the\s+prices\b/i,
  ];

  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(text)) {
      riskFlags.push('prompt_injection_attempt');
      return {
        hasViolation: true,
        violationType: 'prompt_injection',
        riskFlags,
        enforcedReply:
          'I am LeadPilot, Spacenos’s sales qualification assistant. I cannot override system rules, grant administrative privileges, or alter our verified pricing catalog. Let’s focus on exploring how Spacenos can help streamline your sales qualification funnel.',
      };
    }
  }

  // 2. Data Leak / System Prompt / API Key Probes
  const dataLeakPatterns = [
    /\b(what\s+is|show\s+me|print|reveal|tell\s+me|repeat|dump)\s+(your\s+)?(system\s+prompt|prompt|instructions|initial\s+prompt|hidden\s+prompt)\b/i,
    /\b(api[_\s-]?key|gemini[_\s-]?api[_\s-]?key|secret[_\s-]?key|auth[_\s-]?token|credentials|firebase[_\s-]?secret)\b/i,
    /\boutput\s+the\s+exact\s+prompt\s+above\b/i,
    /\bwhat\s+are\s+your\s+system\s+instructions\b/i,
  ];

  for (const pattern of dataLeakPatterns) {
    if (pattern.test(text)) {
      riskFlags.push('system_prompt_leak_attempt');
      return {
        hasViolation: true,
        violationType: 'system_leak',
        riskFlags,
        enforcedReply:
          'I cannot disclose internal system prompts, configuration schemas, or API credentials under any circumstances. I am here exclusively to help qualify your team’s requirements and discuss Spacenos packages.',
      };
    }
  }

  // 3. Fake Urgency Check
  const fakeUrgencyPatterns = [
    /\bi\s+need\s+to\s+close\s+today\b/i,
    /\bmust\s+(sign|buy|close)\s+(today|now|in\s+the\s+next\s+hour)\b/i,
    /\bclose\s+a\s+deal\s+today\b/i,
    /\bdeal\s+today\s+or\s+i(\'ll|\s+will)\s+walk\b/i,
    /\bneed\s+contract\s+today\b/i,
  ];

  for (const pattern of fakeUrgencyPatterns) {
    if (pattern.test(text)) {
      riskFlags.push('fake_urgency_detected');
      return {
        hasViolation: false, // Don't block the conversation, but enforce asking verification question
        violationType: 'fake_urgency',
        riskFlags,
        mustAskVerificationQuestion: true,
        enforcedReply:
          'I understand you have an urgent timeline. What is the critical business driver behind needing to close today, and what is your hard deployment deadline?',
      };
    }
  }

  // 4. Unauthorized Discount Haggling
  const discountPatterns = [
    /\b(give\s+me|can\s+i\s+get|i\s+want)\s+(a\s+)?(50%|40%|30%|20%|special|huge|secret)\s+discount\b/i,
    /\bmake\s+it\s+(\$?[0-9]{2,3})\s+(instead|a\s+month|per\s+month)\b/i,
    /\bcut\s+the\s+price\s+in\s+half\b/i,
  ];

  for (const pattern of discountPatterns) {
    if (pattern.test(text)) {
      riskFlags.push('unauthorized_discount_requested');
      return {
        hasViolation: false,
        violationType: 'unauthorized_discount',
        riskFlags,
        enforcedReply:
          'Our pricing is strictly grounded in our standardized catalog to ensure transparent, equal value for all customers without arbitrary markups or discounts. Our annual plans provide 2 months free (~17% savings). Which team tier fits your current lead volume?',
      };
    }
  }

  return {
    hasViolation: false,
    riskFlags,
  };
}

