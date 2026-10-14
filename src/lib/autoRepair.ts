import { ZodSchema } from 'zod';
import { ToolName } from './types';
import { toolSchemas } from './schemas';

/**
 * Extracts and cleans raw JSON text from markdown code fences or conversational boilerplate
 */
export function extractCleanJsonString(raw: string): string {
  if (!raw) return '{}';

  let cleaned = raw.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    const lastFence = cleaned.lastIndexOf('```');
    if (lastFence !== -1) {
      cleaned = cleaned.substring(0, lastFence).trim();
    }
  }

  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Repairs common JSON formatting defects:
 * - Trailing commas before closing braces
 * - Single quotes to double quotes for keys and strings
 * - Unquoted keys
 */
export function repairJsonSyntax(input: string): string {
  let s = input;

  // Replace single-quoted property keys with double quotes: { 'foo': -> { "foo":
  s = s.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');

  // Replace unquoted keys: { foo: -> { "foo":
  s = s.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // Replace single-quoted string values: : 'bar' -> : "bar"
  s = s.replace(/:\s*'([^']*)'/g, ': "$1"');

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');

  return s;
}

/**
 * Normalizes snake_case, aliases, and stringified numbers into standard schema fields
 */
export function normalizeToolArguments(toolName: ToolName, args: Record<string, unknown>): {
  normalized: Record<string, unknown>;
  repairedFields: string[];
} {
  const normalized: Record<string, unknown> = { ...args };
  const repairedFields: string[] = [];

  // Alias dictionary for common LLM field variations
  const aliasMap: Record<string, string> = {
    team_size: 'teamSize',
    teamsize: 'teamSize',
    size: 'teamSize',
    use_case: 'useCase',
    usecase: 'useCase',
    pain_points: 'painPoints',
    painpoints: 'painPoints',
    current_tools: 'currentTools',
    decision_maker: 'decisionMaker',
    decisionmaker: 'decisionMaker',
    package_id: 'packageId',
    packageid: 'packageId',
    package_name: 'packageName',
    packagename: 'packageName',
    billing_cycle: 'billingCycle',
    billingcycle: 'billingCycle',
    time_slot: 'timeSlot',
    timeslot: 'timeSlot',
    attendee_email: 'attendeeEmail',
    email_address: 'attendeeEmail',
    attendee_name: 'attendeeName',
    recommended_addons: 'recommendedAddons',
    addons: 'recommendedAddons',
    summary_for_agent: 'summaryForAgent',
    routing_department: 'routingDepartment',
    qualification_stage: 'qualificationStage',
    fit_level: 'fitLevel',
    risk_flags: 'riskFlags',
  };

  for (const [key, val] of Object.entries(args)) {
    const canonicalKey = aliasMap[key.toLowerCase()] || aliasMap[key];
    if (canonicalKey && canonicalKey !== key) {
      normalized[canonicalKey] = val;
      delete normalized[key];
      repairedFields.push(`Remapped '${key}' -> '${canonicalKey}'`);
    }
  }

  // Type coercions
  if (toolName === 'scoreLead') {
    if (typeof normalized.score === 'string') {
      const parsed = parseFloat((normalized.score as string).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        normalized.score = Math.min(100, Math.max(0, parsed));
        repairedFields.push(`Coerced string score to numeric ${normalized.score}`);
      }
    }
    if (!normalized.score && normalized.score !== 0) {
      normalized.score = 50;
      repairedFields.push('Defaulted missing score to 50');
    }
    if (!normalized.qualificationStage) {
      normalized.qualificationStage = 'qualified';
      repairedFields.push("Defaulted missing stage to 'qualified'");
    }
    if (!normalized.fitLevel) {
      normalized.fitLevel = (normalized.score as number) >= 70 ? 'high' : 'medium';
      repairedFields.push(`Derived fitLevel '${normalized.fitLevel}'`);
    }
    if (!normalized.rationale) {
      normalized.rationale = 'Evaluated based on conversation facts.';
    }
  }

  if (toolName === 'suggestOffer') {
    if (typeof normalized.price === 'string') {
      const parsed = parseFloat((normalized.price as string).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        normalized.price = parsed;
        repairedFields.push(`Coerced string price to numeric ${parsed}`);
      }
    }
    if (!normalized.billingCycle) {
      normalized.billingCycle = 'monthly';
      repairedFields.push("Defaulted billingCycle to 'monthly'");
    }
    if (normalized.packageId) {
      const id = String(normalized.packageId).toLowerCase();
      if (id.includes('enterprise')) normalized.packageId = 'enterprise';
      else if (id.includes('growth')) normalized.packageId = 'growth';
      else normalized.packageId = 'starter';
    }
  }

  if (toolName === 'bookSlot') {
    if (!normalized.timezone) {
      normalized.timezone = 'America/New_York';
      repairedFields.push("Set default timezone 'America/New_York'");
    }
    if (!normalized.topic) {
      normalized.topic = 'LeadPilot Platform Demo & Technical Walkthrough';
    }
  }

  return { normalized, repairedFields };
}

export interface ParseAndValidateResult<T = unknown> {
  success: boolean;
  data: T;
  isRepaired: boolean;
  repairedReasons: string[];
  rawText: string;
  error?: string;
}

/**
 * Universal resilient tool call parser that guarantees valid JSON per schema
 */
export function parseAndAutoRepairToolCall<T = unknown>(
  toolName: ToolName,
  rawInput: string | Record<string, unknown>
): ParseAndValidateResult<T> {
  let isRepaired = false;
  const repairedReasons: string[] = [];
  let parsedObj: Record<string, unknown> = {};
  const rawText = typeof rawInput === 'string' ? rawInput : JSON.stringify(rawInput);

  if (typeof rawInput === 'object' && rawInput !== null) {
    parsedObj = { ...rawInput };
  } else {
    const cleaned = extractCleanJsonString(rawInput);
    if (cleaned !== rawInput.trim()) {
      isRepaired = true;
      repairedReasons.push('Stripped markdown/wrapper text around JSON');
    }

    try {
      parsedObj = JSON.parse(cleaned);
    } catch {
      // First try syntax repair
      const repaired = repairJsonSyntax(cleaned);
      try {
        parsedObj = JSON.parse(repaired);
        isRepaired = true;
        repairedReasons.push('Fixed malformed JSON syntax (quotes/trailing commas)');
      } catch (syntaxErr) {
        // Fallback: create empty object and let normalizer fill schema defaults
        isRepaired = true;
        repairedReasons.push(`Failed JSON.parse: ${(syntaxErr as Error).message}; recovering fallback object`);
        parsedObj = {};
      }
    }
  }

  // Normalize aliases & types
  const { normalized, repairedFields } = normalizeToolArguments(toolName, parsedObj);
  if (repairedFields.length > 0) {
    isRepaired = true;
    repairedReasons.push(...repairedFields);
  }

  // Schema Validation
  const schema: ZodSchema = toolSchemas[toolName];
  const validation = schema.safeParse(normalized);

  if (validation.success) {
    return {
      success: true,
      data: validation.data as T,
      isRepaired,
      repairedReasons,
      rawText,
    };
  } else {
    // Attempt second repair pass based on Zod error issues
    const issues = validation.error.issues;
    const patched = { ...normalized };

    for (const issue of issues) {
      const field = issue.path[0] as string;
      if (issue.code === 'invalid_type') {
        if (issue.expected === 'string' && patched[field] !== undefined) {
          patched[field] = String(patched[field]);
          repairedReasons.push(`String-cast field '${field}'`);
        } else if (issue.expected === 'number' && patched[field] !== undefined) {
          patched[field] = 0;
          repairedReasons.push(`Number-cast field '${field}'`);
        }
      }
    }

    const recheck = schema.safeParse(patched);
    if (recheck.success) {
      return {
        success: true,
        data: recheck.data as T,
        isRepaired: true,
        repairedReasons,
        rawText,
      };
    }

    return {
      success: false,
      data: normalized as T,
      isRepaired,
      repairedReasons,
      rawText,
      error: validation.error.message,
    };
  }
}

