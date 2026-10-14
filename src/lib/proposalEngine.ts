import { firestoreDb } from './db/firestoreStore';
import { ProposalResult } from './types';
import { matchGroundedPackage, getPackagesConfig } from '../config/packages';

export async function generateProposalForLead(leadId: string): Promise<ProposalResult> {
  const lead = await firestoreDb.getLead(leadId);
  if (!lead) {
    throw new Error(`Lead with ID '${leadId}' not found.`);
  }

  const config = getPackagesConfig();
  const fields = lead.extractedFields || {};
  const companyName = fields.company ? String(fields.company) : 'Valued Partner';
  const contactName = fields.name ? String(fields.name) : 'Sales Leader';
  const teamSize = fields.teamSize ? String(fields.teamSize) : '5-15';
  const timeline = fields.timeline ? String(fields.timeline) : '30-45 days';
  const useCase = fields.useCase
    ? String(fields.useCase)
    : 'Automating high-conversion inbound sales qualification and instant meeting scheduling';

  // Selected grounded offer or match best package
  let offer = lead.suggestedOffer;
  if (!offer) {
    const matched = matchGroundedPackage(
      fields.budget,
      fields.teamSize,
      lead.riskFlags.includes('enterprise_compliance_required')
    );
    offer = {
      packageId: matched.id,
      packageName: matched.name,
      pricingTier: matched.id,
      billingCycle: 'monthly',
      price: matched.pricing.monthly,
      currency: config.currency,
      features: matched.features,
      recommendedAddons: [],
      rationale: `Matched ${matched.name} based on ${teamSize} sales reps and stated requirements.`,
      grounded: true,
    };
    lead.suggestedOffer = offer;
  }

  // Update lead stage to proposal_sent if currently qualified
  if (lead.stage === 'qualified' || lead.stage === 'new') {
    lead.stage = 'proposal_sent';
    await firestoreDb.saveLead(lead);
  }

  const assumptions: string[] = [
    `Lead volume remains within the verified tier allowance of up to ${offer.packageId === 'starter' ? '1,000' : offer.packageId === 'growth' ? '10,000' : '100,000+'} inbound leads per month.`,
    `Standard API and OAuth integrations are supported for supported CRM vendors (HubSpot, Salesforce, Pipedrive).`,
    `Target deployment timeline of ${timeline} is supported by Spacenos rapid onboarding sprints.`,
    `Pricing is strictly locked to Spacenos Catalog v${config.version}; no unauthorized discounts or speculative tiers have been applied.`,
    `Attendee sign-off will be provided by an authorized purchasing officer before deployment.`,
  ];

  const proposalMarkdown = `
# 🚀 Commercial Proposal: LeadPilot AI Sales System

**Client Organization:** ${companyName}  
**Prepared For:** ${contactName} (${fields.role || 'Sales Leadership'})  
**Prepared By:** Spacenos Enterprise Sales Solutions  
**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  
**Proposal Reference:** PROP-${lead.id.toUpperCase()}  
**Status:** Grounded & Verified  

---

## 1. Executive Summary
${companyName} is deploying modern AI sales automation to eliminate SDR qualification bottlenecks, capture high-intent inbound visitors 24/7, and route qualified prospects directly into sales reps' calendars.

**Primary Objective:**  
> "${useCase}"

LeadPilot replaces manual email tag and static forms with a structured, intelligent conversational layer that qualifies BANT dimensions in real-time, adheres strictly to grounded product configurations, and books qualified demos on autopilot.

---

## 2. Solution Scope & Architecture

| Parameter | Details |
| :--- | :--- |
| **Organization** | ${companyName} |
| **Sales Team Size** | ${teamSize} Sales Representatives / Users |
| **Recommended Package** | **${offer.packageName}** |
| **Billing Cycle** | ${offer.billingCycle === 'annual' ? 'Annual (2 Months Free)' : 'Monthly'} |
| **Lead Qualification Score** | **${lead.score}/100** (${lead.fitLevel?.toUpperCase() || 'HIGH'} ICP FIT) |
| **Calendar Booking Integration** | Google Calendar & Calendly Sync |

### Key Platform Capabilities Included:
${offer.features.map((f) => `- **${f}**`).join('\n')}

${
  offer.recommendedAddons && offer.recommendedAddons.length > 0
    ? `\n### Recommended Architectural Add-ons:\n${offer.recommendedAddons.map((a) => `- Official Add-on: **${a.toUpperCase()}**`).join('\n')}`
    : ''
}

---

## 3. Commercial Investment (Grounded Pricing)

In strict accordance with Spacenos's verified pricing policy:

- **Package:** ${offer.packageName}
- **Subscription Fee:** **$${offer.price.toLocaleString()} ${config.currency} / ${offer.billingCycle === 'annual' ? 'year' : 'month'}**
- **Authorized Discount:** **$0.00** *(Strict Catalog Policy: Standardized transparent pricing across all clients)*
${
  offer.billingCycle === 'annual'
    ? `- **Annual Incentive Applied:** 2 months complimentary included in upfront annual agreement.`
    : `- **Annual Upgrade Option:** $${(offer.price * 10).toLocaleString()} ${config.currency}/yr (Save $${(offer.price * 2).toLocaleString()}/year)`
}

---

## 4. Implementation Assumptions & SLA

1. **Volume SLA:** Monthly inbound qualification capacity guaranteed per package limits.
2. **Security & Data Isolation:** All prospect conversations and PII are sandboxed and encrypted at rest using AES-256 and TLS 1.3 in transit.
3. **Onboarding Support:** Dedicated technical setup session with a Spacenos Solutions Engineer.
4. **CRM Handshake:** Bi-directional sync for lead status, contact fields, and qualification notes.

---

## 5. Next Steps
${
  lead.bookedSlot
    ? `✅ **Your technical demo is already scheduled:**  
**Date:** ${lead.bookedSlot.date}  
**Time:** ${lead.bookedSlot.timeSlot} (${lead.bookedSlot.timezone})  
**Calendar Invite Sent To:** \`${lead.bookedSlot.attendeeEmail}\``
    : `To proceed, confirm this proposal or click below to schedule your technical onboarding demonstration with our engineering team.`
}

---
*Authorized by Spacenos Enterprise Sales Governance • Grounded Catalog v${config.version}*
`.trim();

  return {
    leadId: lead.id,
    leadName: contactName,
    company: companyName,
    proposalMarkdown,
    assumptions,
    packageDetails: offer,
    createdAt: new Date().toISOString(),
  };
}

