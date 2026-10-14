import { Lead, Conversation, EvalSuite, EvalReport, PipelineStage } from '../types';
import { getFirebaseAdmin } from './firebaseAdmin';

// In-memory persistent backing store across hot-reloads
interface GlobalStoreState {
  leads: Map<string, Lead>;
  conversations: Map<string, Conversation>;
  evalSuites: Map<string, EvalSuite>;
  evalReports: Map<string, EvalReport>;
  initialized: boolean;
}

const globalStore = (globalThis as unknown as { __leadpilot_store?: GlobalStoreState });

if (!globalStore.__leadpilot_store) {
  globalStore.__leadpilot_store = {
    leads: new Map(),
    conversations: new Map(),
    evalSuites: new Map(),
    evalReports: new Map(),
    initialized: false,
  };
}

const memStore = globalStore.__leadpilot_store;

// Seed initial realistic leads if empty
function ensureInitialized() {
  if (memStore.initialized) return;

  const demoLeads: Lead[] = [
    {
      id: 'lead-01',
      conversationId: 'conv-01',
      stage: 'qualified',
      score: 85,
      scoreRationale: 'Strong B2B ICP fit, 12 sales reps, $2k/mo budget, immediate 30-day timeline.',
      fitLevel: 'high',
      extractedFields: {
        name: 'Sarah Lin',
        email: 'sarah.lin@apexcloud.io',
        company: 'Apex Cloud',
        role: 'Head of Sales',
        teamSize: 12,
        budget: '$2,000/mo',
        timeline: 'Within 30 days',
        useCase: 'Automating inbound qualification from demo request forms',
        decisionMaker: true,
      },
      unknowns: [],
      riskFlags: [],
      notes: [
        {
          id: 'note-1',
          author: 'AI Sales Agent',
          text: 'Verified decision-maker authority and budget exceeding Growth tier minimum.',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ],
      suggestedOffer: {
        packageId: 'growth',
        packageName: 'Growth Accelerator',
        pricingTier: 'growth',
        billingCycle: 'monthly',
        price: 1499,
        currency: 'USD',
        features: ['Up to 25 sales seats', '10,000 inbound qualified leads/month', 'CRM Sync'],
        rationale: 'Team of 12 reps fits comfortably within 25 seat limit with budget room.',
        grounded: true,
      },
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'lead-02',
      conversationId: 'conv-02',
      stage: 'proposal_sent',
      score: 92,
      scoreRationale: 'Executive decision maker, 35 reps, $4k/mo budget, high-volume inbound funnel.',
      fitLevel: 'high',
      extractedFields: {
        name: 'David Miller',
        email: 'david.miller@nexuslogistics.com',
        company: 'Nexus Logistics',
        role: 'VP of Growth',
        teamSize: 35,
        budget: '$4,500/mo',
        timeline: 'Q4 deployment',
        useCase: 'Replacing slow SDR response times for global logistics inbound inquiries',
        decisionMaker: true,
      },
      unknowns: [],
      riskFlags: [],
      notes: [
        {
          id: 'note-2',
          author: 'Admin',
          text: 'Proposal generated and emailed to David for Enterprise Scale tier.',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
      suggestedOffer: {
        packageId: 'enterprise',
        packageName: 'Enterprise Scale',
        pricingTier: 'enterprise',
        billingCycle: 'monthly',
        price: 3999,
        currency: 'USD',
        features: ['Unlimited seats', '100,000+ leads', 'Custom AI agent', 'Dedicated CSM'],
        rationale: 'Team size of 35 seats requires Enterprise tier for unlimited users and dedicated SLA.',
        grounded: true,
      },
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'lead-03',
      conversationId: 'conv-03',
      stage: 'booked',
      score: 96,
      scoreRationale: 'Full qualification complete, contract signer, booked solutions architecture demo.',
      fitLevel: 'high',
      extractedFields: {
        name: 'Elena Rostova',
        email: 'elena@fintechglobal.co',
        company: 'FinTech Global',
        role: 'CRO',
        teamSize: 50,
        budget: '$40,000/yr',
        timeline: 'Immediate Q4',
        useCase: 'Enterprise inbound qualification with strict SOC2 audit logging',
        decisionMaker: true,
      },
      unknowns: [],
      riskFlags: ['enterprise_compliance_required'],
      notes: [
        {
          id: 'note-3',
          author: 'AI Sales Agent',
          text: 'Demo scheduled for Friday 2:00 PM EST with Solutions Architect.',
          createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        },
      ],
      suggestedOffer: {
        packageId: 'enterprise',
        packageName: 'Enterprise Scale',
        pricingTier: 'enterprise',
        billingCycle: 'annual',
        price: 39990,
        currency: 'USD',
        features: ['Unlimited seats', 'SOC2 Type II compliance', 'Dedicated CSM', '99.99% SLA'],
        recommendedAddons: ['soc2_package'],
        rationale: 'Annual Enterprise plan meets SOC2 logging and 50+ sales rep requirement.',
        grounded: true,
      },
      bookedSlot: {
        date: '2026-10-18',
        timeSlot: '2:00 PM EST',
        timezone: 'America/New_York',
        attendeeEmail: 'elena@fintechglobal.co',
        attendeeName: 'Elena Rostova',
        notes: 'Review SOC2 report and HubSpot enterprise sync.',
      },
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: 'lead-04',
      conversationId: 'conv-04',
      stage: 'won',
      score: 90,
      scoreRationale: 'Closed annual Growth plan.',
      fitLevel: 'high',
      extractedFields: {
        name: 'Tom Richards',
        email: 'tom@bytecraft.dev',
        company: 'ByteCraft',
        role: 'Founder & CEO',
        teamSize: 8,
        budget: '$15,000/yr',
        timeline: 'Signed',
        useCase: 'Developer SaaS inbound qualification',
        decisionMaker: true,
      },
      unknowns: [],
      riskFlags: [],
      notes: [
        {
          id: 'note-4',
          author: 'Admin',
          text: 'Customer onboarded to Growth Accelerator annual plan ($14,990/yr).',
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'lead-05',
      conversationId: 'conv-05',
      stage: 'new',
      score: 42,
      scoreRationale: 'Inbound chat just initiated; captured company and role, awaiting budget and timeline.',
      fitLevel: 'medium',
      extractedFields: {
        name: 'Marcus Vance',
        company: 'SwiftLogistics',
        role: 'Sales Director',
        teamSize: 15,
      },
      unknowns: ['budget', 'timeline', 'decisionMaker'],
      riskFlags: [],
      notes: [],
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString(),
    },
  ];

  for (const lead of demoLeads) {
    memStore.leads.set(lead.id, lead);
  }

  memStore.initialized = true;
}

// Ensure store is ready
ensureInitialized();

// Firestore / Memory repository API
export const firestoreDb = {
  // --- LEADS ---
  async getLead(id: string): Promise<Lead | null> {
    ensureInitialized();
    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        const snap = await adminDb.collection('leads').doc(id).get();
        if (snap.exists) return snap.data() as Lead;
      } catch (err) {
        console.warn('Firestore fallback on getLead:', err);
      }
    }
    return memStore.leads.get(id) || null;
  },

  async saveLead(lead: Lead): Promise<void> {
    ensureInitialized();
    lead.updatedAt = new Date().toISOString();
    memStore.leads.set(lead.id, lead);

    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        await adminDb.collection('leads').doc(lead.id).set(lead, { merge: true });
      } catch (err) {
        console.warn('Firestore fallback on saveLead:', err);
      }
    }
  },

  async listLeads(): Promise<Lead[]> {
    ensureInitialized();
    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        const snap = await adminDb.collection('leads').get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Lead);
        }
      } catch (err) {
        console.warn('Firestore fallback on listLeads:', err);
      }
    }
    return Array.from(memStore.leads.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async updateLeadStage(
    id: string,
    stage: PipelineStage,
    noteText?: string,
    author: string = 'Admin'
  ): Promise<Lead | null> {
    const lead = await this.getLead(id);
    if (!lead) return null;

    lead.stage = stage;
    if (noteText) {
      lead.notes.unshift({
        id: `note-${Date.now()}`,
        author,
        text: noteText,
        createdAt: new Date().toISOString(),
      });
    }
    await this.saveLead(lead);
    return lead;
  },

  async addLeadNote(id: string, text: string, author: string = 'Admin'): Promise<Lead | null> {
    const lead = await this.getLead(id);
    if (!lead) return null;

    lead.notes.unshift({
      id: `note-${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    });
    await this.saveLead(lead);
    return lead;
  },

  // --- CONVERSATIONS ---
  async getConversation(id: string): Promise<Conversation | null> {
    ensureInitialized();
    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        const snap = await adminDb.collection('conversations').doc(id).get();
        if (snap.exists) return snap.data() as Conversation;
      } catch (err) {
        console.warn('Firestore fallback on getConversation:', err);
      }
    }
    return memStore.conversations.get(id) || null;
  },

  async saveConversation(conversation: Conversation): Promise<void> {
    ensureInitialized();
    conversation.updatedAt = new Date().toISOString();
    memStore.conversations.set(conversation.id, conversation);

    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        await adminDb.collection('conversations').doc(conversation.id).set(conversation, { merge: true });
      } catch (err) {
        console.warn('Firestore fallback on saveConversation:', err);
      }
    }
  },

  // --- EVAL SUITES ---
  async getEvalSuite(id: string): Promise<EvalSuite | null> {
    ensureInitialized();
    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        const snap = await adminDb.collection('eval_suites').doc(id).get();
        if (snap.exists) return snap.data() as EvalSuite;
      } catch (err) {
        console.warn('Firestore fallback on getEvalSuite:', err);
      }
    }
    return memStore.evalSuites.get(id) || null;
  },

  async saveEvalSuite(suite: EvalSuite): Promise<void> {
    ensureInitialized();
    memStore.evalSuites.set(suite.id, suite);

    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        await adminDb.collection('eval_suites').doc(suite.id).set(suite, { merge: true });
      } catch (err) {
        console.warn('Firestore fallback on saveEvalSuite:', err);
      }
    }
  },

  // --- EVAL REPORTS ---
  async getEvalReport(id: string): Promise<EvalReport | null> {
    ensureInitialized();
    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        const snap = await adminDb.collection('eval_reports').doc(id).get();
        if (snap.exists) return snap.data() as EvalReport;
      } catch (err) {
        console.warn('Firestore fallback on getEvalReport:', err);
      }
    }
    return memStore.evalReports.get(id) || null;
  },

  async saveEvalReport(report: EvalReport): Promise<void> {
    ensureInitialized();
    memStore.evalReports.set(report.id, report);

    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        await adminDb.collection('eval_reports').doc(report.id).set(report, { merge: true });
      } catch (err) {
        console.warn('Firestore fallback on saveEvalReport:', err);
      }
    }
  },

  async listEvalReports(): Promise<EvalReport[]> {
    ensureInitialized();
    const { adminDb } = getFirebaseAdmin();
    if (adminDb && process.env.FIREBASE_PROJECT_ID) {
      try {
        const snap = await adminDb.collection('eval_reports').get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as EvalReport);
        }
      } catch (err) {
        console.warn('Firestore fallback on listEvalReports:', err);
      }
    }
    return Array.from(memStore.evalReports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};

