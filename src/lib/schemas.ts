import { z } from 'zod';

export const extractLeadSchema = z.object({
  name: z.string().optional().describe('Prospect full name'),
  email: z.string().optional().describe('Prospect work email'),
  company: z.string().optional().describe('Company or organization name'),
  role: z.string().optional().describe('Job title or role within the company'),
  teamSize: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Number of employees or sales reps on the team'),
  useCase: z.string().optional().describe('Primary use case, workflow, or goal'),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .describe('Monthly or annual allocated budget'),
  timeline: z.string().optional().describe('Purchase or deployment timeline (e.g. immediate, 1 month, Q4)'),
  decisionMaker: z
    .union([z.boolean(), z.string()])
    .optional()
    .describe('Whether this prospect has purchase authority or sign-off power'),
  painPoints: z
    .array(z.string())
    .optional()
    .describe('Current bottlenecks or challenges'),
  currentTools: z
    .array(z.string())
    .optional()
    .describe('Existing CRM or sales automation tools in use'),
});

export const scoreLeadSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('Qualification score from 0 to 100 based on BANT framework'),
  qualificationStage: z
    .enum(['new', 'qualified', 'proposal_sent', 'booked', 'won', 'lost'])
    .describe('Current sales pipeline stage'),
  fitLevel: z
    .enum(['low', 'medium', 'high', 'unqualified'])
    .describe('Categorical fit assessment'),
  rationale: z
    .string()
    .describe('Detailed reasoning explaining the score and gaps remaining'),
  riskFlags: z
    .array(z.string())
    .optional()
    .describe('Identified risks or flags e.g. prompt_injection_attempt, budget_mismatch'),
});

export const suggestOfferSchema = z.object({
  packageId: z
    .enum(['starter', 'growth', 'enterprise'])
    .describe('Grounded package ID from Spacenos package catalog'),
  packageName: z.string().describe('Official package name'),
  billingCycle: z
    .enum(['monthly', 'annual'])
    .default('monthly')
    .describe('Billing cycle frequency'),
  price: z
    .number()
    .positive()
    .describe('Official price strictly matching packages.config.json'),
  recommendedAddons: z
    .array(z.string())
    .optional()
    .describe('Optional add-ons strictly from the catalog'),
  rationale: z
    .string()
    .describe('Explanation of why this package matches team size, budget, and volume'),
});

export const bookSlotSchema = z.object({
  date: z.string().describe('Date of demo booking in YYYY-MM-DD or formatted string'),
  timeSlot: z.string().describe('Time of meeting e.g. 10:00 AM, 2:30 PM'),
  timezone: z.string().default('America/New_York').describe('Timezone for the demo'),
  attendeeEmail: z.string().describe('Work email to send the calendar invite'),
  attendeeName: z.string().optional().describe('Name of the attendee'),
  topic: z.string().optional().describe('Specific focus topic for the demo'),
  notes: z.string().optional().describe('Special requirements or context for the sales engineer'),
});

export const handoffToHumanSchema = z.object({
  reason: z.string().describe('Why AI cannot complete self-service qualification or booking'),
  priority: z
    .enum(['low', 'normal', 'high', 'urgent'])
    .default('normal')
    .describe('Priority level for human sales rep notification'),
  summaryForAgent: z
    .string()
    .describe('Executive summary of facts, conversation context, and prospect intent'),
  routingDepartment: z
    .string()
    .optional()
    .describe('Specific department e.g. Enterprise Sales, Solutions Architecture, Security & Legal'),
});

export const toolSchemas = {
  extractLead: extractLeadSchema,
  scoreLead: scoreLeadSchema,
  suggestOffer: suggestOfferSchema,
  bookSlot: bookSlotSchema,
  handoffToHuman: handoffToHumanSchema,
};

export type ExtractLeadInput = z.infer<typeof extractLeadSchema>;
export type ScoreLeadInput = z.infer<typeof scoreLeadSchema>;
export type SuggestOfferInput = z.infer<typeof suggestOfferSchema>;
export type BookSlotInput = z.infer<typeof bookSlotSchema>;
export type HandoffToHumanInput = z.infer<typeof handoffToHumanSchema>;

