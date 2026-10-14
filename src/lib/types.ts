export type PipelineStage =
  | 'new'
  | 'qualified'
  | 'proposal_sent'
  | 'booked'
  | 'won'
  | 'lost';

export type ToolName =
  | 'extractLead'
  | 'scoreLead'
  | 'suggestOffer'
  | 'bookSlot'
  | 'handoffToHuman';

export type FitLevel = 'low' | 'medium' | 'high' | 'unqualified';

export type RiskFlag =
  | 'prompt_injection_attempt'
  | 'fake_urgency_detected'
  | 'system_prompt_leak_attempt'
  | 'unauthorized_discount_requested'
  | 'missing_decision_maker'
  | 'budget_mismatch'
  | 'enterprise_compliance_required'
  | 'off_topic_abuse';

export interface ExtractedFields {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  teamSize?: number | string;
  useCase?: string;
  budget?: number | string;
  timeline?: string;
  decisionMaker?: boolean | string;
  painPoints?: string[];
  currentTools?: string[];
  [key: string]: unknown;
}

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SuggestedOffer {
  packageId: 'starter' | 'growth' | 'enterprise';
  packageName: string;
  pricingTier: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  currency: string;
  features: string[];
  recommendedAddons?: string[];
  rationale: string;
  grounded: boolean;
  [key: string]: unknown;
}

export interface BookedSlot {
  date: string;
  timeSlot: string;
  timezone: string;
  attendeeEmail: string;
  attendeeName?: string;
  notes?: string;
  calendarLink?: string;
  [key: string]: unknown;
}

export interface Lead {
  id: string;
  conversationId: string;
  stage: PipelineStage;
  score: number;
  scoreRationale?: string;
  fitLevel?: FitLevel;
  extractedFields: ExtractedFields;
  unknowns: string[];
  riskFlags: RiskFlag[];
  notes: LeadNote[];
  suggestedOffer?: SuggestedOffer;
  bookedSlot?: BookedSlot;
  handoffReason?: string;
  handoffPriority?: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface ToolCallRecord {
  id: string;
  name: ToolName;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  isRepaired?: boolean;
  groundingChecked?: boolean;
  isHallucinated?: boolean;
  repairedReason?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCallRecord[];
  timestamp: string;
}

export interface FactRecord {
  field: string;
  value: string | number | boolean;
  turn: number;
}

export interface Conversation {
  id: string;
  leadId: string;
  messages: Message[];
  toolCallsCount: number;
  extractedFacts: FactRecord[];
  unknownsToFollowUp: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PackagePricingConfig {
  monthly: number;
  annual: number;
  billingOptions: string[];
}

export interface PackageDefinition {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  tagline: string;
  pricing: PackagePricingConfig;
  idealTeamSize: string;
  minBudget: number;
  maxLeadsPerMonth: number;
  features: string[];
  prohibitedClaims: string[];
}

export interface AddonDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
}

export interface GroundedCatalog {
  company: string;
  product: string;
  currency: string;
  version: string;
  discountsAllowed: boolean;
  maxDiscountPercent: number;
  packages: PackageDefinition[];
  addons: AddonDefinition[];
  rules: {
    noUnauthorizedDiscounts: boolean;
    strictTierMatching: boolean;
    requireDecisionMakerCheck: boolean;
    requireBudgetVerification: boolean;
  };
}

export interface EvalTestCase {
  id: string;
  name: string;
  category:
    | 'ideal_enterprise'
    | 'startup_budget'
    | 'agency_growth'
    | 'prompt_injection'
    | 'fake_urgency'
    | 'system_leak'
    | 'haggle_discount'
    | 'ambiguous_lead'
    | 'disqualified'
    | 'technical_buyer'
    | 'non_decision_maker'
    | 'timezone_booking'
    | 'competitor_benchmark'
    | 'soc2_compliance'
    | 'fast_track'
    | 'enterprise_poc'
    | 'stakeholders'
    | 'early_dropoff'
    | 'reengagement'
    | 'unsupported_feature';
  description: string;
  dialogue: string[];
  expectedExtracted: Partial<ExtractedFields>;
  expectedStage: PipelineStage | 'handoff';
  expectedRiskFlags?: RiskFlag[];
  shouldBook?: boolean;
  mustNotContain?: string[];
  recommendedPackage?: 'starter' | 'growth' | 'enterprise';
}

export interface EvalSuite {
  id: string;
  name: string;
  description: string;
  testcases: EvalTestCase[];
  createdAt: string;
}

export interface EvalTestResult {
  testId: string;
  name: string;
  passed: boolean;
  category: string;
  extractionScore: number;
  hallucinated: boolean;
  booked: boolean;
  safetyPassed: boolean;
  extractedFields: ExtractedFields;
  expectedFields: Partial<ExtractedFields>;
  missingOrMismatchFields: string[];
  riskFlags: RiskFlag[];
  logs: string[];
  conversationTranscript: Message[];
}

export interface EvalFailure {
  testId: string;
  name: string;
  reason: string;
  diff?: Record<string, unknown>;
}

export interface EvalReport {
  id: string;
  suiteId: string;
  createdAt: string;
  metrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    extractionAccuracy: number;
    hallucinationCount: number;
    bookingRate: number;
    safetyPassRate: number;
    executionTimeMs: number;
  };
  testResults: EvalTestResult[];
  failures: EvalFailure[];
}

export interface ChatTurnResult {
  reply: string;
  toolCalls: ToolCallRecord[];
  lead: Lead;
  conversation: Conversation;
  unknowns: string[];
}

export interface ProposalResult {
  leadId: string;
  leadName?: string;
  company?: string;
  proposalMarkdown: string;
  assumptions: string[];
  packageDetails: SuggestedOffer;
  createdAt: string;
}

