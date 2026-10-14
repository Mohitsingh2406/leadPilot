'use client';

import React from 'react';
import { Lead } from '@/lib/types';
import {
  Brain,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  FileText,
  CalendarCheck,
  Building,
  User,
  DollarSign,
  Clock,
  Briefcase,
  AlertOctagon,
  Users,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface MemorySidebarProps {
  lead: Lead | null;
  onOpenProposal: () => void;
  onReset: () => void;
  onSelectSampleLead?: () => void;
}

export const MemorySidebar: React.FC<MemorySidebarProps> = ({
  lead,
  onOpenProposal,
  onReset,
}) => {
  const fields = lead?.extractedFields || {};
  const unknowns = lead?.unknowns || ['company', 'role', 'teamSize', 'budget', 'timeline', 'decisionMaker'];
  const riskFlags = lead?.riskFlags || [];
  const score = lead?.score || 0;
  const stage = lead?.stage || 'new';

  const getStageMeta = (stg: string) => {
    switch (stg) {
      case 'new':
        return { label: 'New Inbound', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'qualified':
        return { label: 'Qualified (BANT)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'proposal_sent':
        return { label: 'Proposal Sent', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'booked':
        return { label: 'Demo Booked', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'won':
        return { label: 'Closed Won', color: 'bg-green-500/20 text-green-300 border-green-500/40' };
      case 'lost':
        return { label: 'Closed Lost', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: stg, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  const stageMeta = getStageMeta(stage);

  return (
    <aside className="w-96 h-full shrink-0 border-l border-slate-800/80 bg-slate-950/90 backdrop-blur-xl flex flex-col overflow-hidden shadow-2xl z-20">
      {/* Sidebar Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Memory Cockpit
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Real-time BANT Extraction State</span>
          </div>
        </div>

        {lead && (
          <button
            onClick={onReset}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main Scrollable Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Qualification Score Gauge Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 glow-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Qualification Score
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stageMeta.color}`}>
              {stageMeta.label}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-50 tracking-tight">
                {score}
              </span>
              <span className="text-xs font-mono text-slate-500">/100</span>
            </div>

            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {lead?.fitLevel ? `${lead.fitLevel.toUpperCase()} FIT` : 'EVALUATING'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 75
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 glow-emerald'
                  : score >= 50
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500 glow-brand'
              }`}
              style={{ width: `${Math.max(5, score)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
            {lead?.scoreRationale ||
              'Awaiting initial prospect replies to evaluate budget, authority, volume, and timeline.'}
          </p>
        </div>

        {/* Risk / Red-Team Violations Alert Banner */}
        {riskFlags.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-2">
            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              Security / Grounding Flags ({riskFlags.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {riskFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Facts Matrix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified BANT Facts
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {Object.keys(fields).filter((k) => fields[k] !== undefined).length} / 6 Captured
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* Contact & Company */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Contact:
              </span>
              <span className="font-semibold text-slate-200">
                {fields.name ? String(fields.name) : <span className="text-slate-600 font-normal">Pending...</span>}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                Company:
              </span>
              <span className="font-semibold text-slate-200">
                {fields.company ? String(fields.company) : <span className="text-slate-600 font-normal">Pending...</span>}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Role:
              </span>
              <span className="font-semibold text-slate-200">
                {fields.role ? String(fields.role) : <span className="text-slate-600 font-normal">Pending...</span>}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Team Seats:
              </span>
              <span className="font-semibold text-slate-200">
                {fields.teamSize !== undefined ? (
                  `${fields.teamSize} sales reps`
                ) : (
                  <span className="text-slate-600 font-normal">Pending...</span>
                )}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Budget:
              </span>
              <span className="font-semibold text-emerald-400 font-mono">
                {fields.budget ? String(fields.budget) : <span className="text-slate-600 font-normal font-sans">Pending...</span>}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Timeline:
              </span>
              <span className="font-semibold text-slate-200">
                {fields.timeline ? String(fields.timeline) : <span className="text-slate-600 font-normal">Pending...</span>}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Decision-Maker:
              </span>
              <span className="font-semibold">
                {fields.decisionMaker === true ? (
                  <span className="text-emerald-400 font-mono">Yes (Signoff)</span>
                ) : fields.decisionMaker === false ? (
                  <span className="text-amber-400 font-mono">No (Researcher)</span>
                ) : (
                  <span className="text-slate-600 font-normal">Pending...</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Unknowns to Follow Up */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Active Unknowns ({unknowns.length})
            </span>
          </div>

          {unknowns.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full BANT qualified! Ready for proposal & booking.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {unknowns.map((un, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1"
                >
                  <span className="text-amber-400 font-bold">?</span> {un}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Grounded Offer */}
        {lead?.suggestedOffer && (
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 glow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Grounded Offer
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Grounded
              </span>
            </div>

            <div>
              <div className="text-sm font-extrabold text-slate-100">
                {lead.suggestedOffer.packageName}
              </div>
              <div className="text-xs font-mono font-bold text-purple-400 mt-0.5">
                ${lead.suggestedOffer.price.toLocaleString()} / {lead.suggestedOffer.billingCycle === 'annual' ? 'yr' : 'mo'}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lead.suggestedOffer.rationale}
            </p>
          </div>
        )}

        {/* Demo Booking Confirmation Card */}
        {lead?.bookedSlot && (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                Demo Scheduled
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Confirmed
              </span>
            </div>
            <div className="text-xs font-bold text-slate-200">
              {lead.bookedSlot.date} at {lead.bookedSlot.timeSlot}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Invite: {lead.bookedSlot.attendeeEmail}
            </div>
          </div>
        )}

        {/* Funnel Progress Steps */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" /> Qualification Pipeline
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className={`flex items-center gap-2 ${stage !== 'new' ? 'text-emerald-400' : 'text-indigo-400 font-bold'}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>1. Inbound Arrival & Welcome</span>
            </div>
            <div className={`flex items-center gap-2 ${['qualified', 'proposal_sent', 'booked', 'won'].includes(stage) ? 'text-emerald-400' : 'text-slate-500'}`}>
              {['qualified', 'proposal_sent', 'booked', 'won'].includes(stage) ? <CheckCircle2 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              <span>2. BANT Extraction & Scoring</span>
            </div>
            <div className={`flex items-center gap-2 ${['proposal_sent', 'booked', 'won'].includes(stage) ? 'text-emerald-400' : 'text-slate-500'}`}>
              {['proposal_sent', 'booked', 'won'].includes(stage) ? <CheckCircle2 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              <span>3. Grounded Package Matching</span>
            </div>
            <div className={`flex items-center gap-2 ${['booked', 'won'].includes(stage) ? 'text-emerald-400' : 'text-slate-500'}`}>
              {['booked', 'won'].includes(stage) ? <CheckCircle2 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              <span>4. Technical Demo Booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950 shrink-0">
        <button
          onClick={onOpenProposal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          Generate Grounded Proposal
        </button>
      </div>
    </aside>
  );
};
