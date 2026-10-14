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
} from 'lucide-react';

interface MemorySidebarProps {
  lead: Lead | null;
  onOpenProposal: () => void;
  onReset: () => void;
}

export const MemorySidebar: React.FC<MemorySidebarProps> = ({
  lead,
  onOpenProposal,
  onReset,
}) => {
  if (!lead) {
    return (
      <div className="w-80 h-full border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-center items-center text-center text-slate-500">
        <Brain className="w-10 h-10 mb-2 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium">Conversation Memory Offline</p>
        <p className="text-xs text-slate-600 mt-1">Start a conversation to extract facts and build lead state.</p>
      </div>
    );
  }

  const fields = lead.extractedFields || {};
  const unknowns = lead.unknowns || [];
  const riskFlags = lead.riskFlags || [];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'qualified':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'proposal_sent':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'booked':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'won':
        return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'lost':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="w-88 h-full border-l border-slate-800 bg-slate-900/80 p-4 flex flex-col overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Conversation Memory</h2>
        </div>
        <button
          onClick={onReset}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors px-2 py-0.5 rounded border border-slate-700 bg-slate-800/60"
        >
          New Chat
        </button>
      </div>

      {/* Qualification Meter */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium">Qualification Score</span>
          <span className={`text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${getStageColor(lead.stage)}`}>
            {lead.stage.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-slate-100">{lead.score}</span>
          <span className="text-xs text-slate-500 font-mono">/ 100</span>
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {lead.fitLevel?.toUpperCase() || 'EVALUATING'} FIT
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              lead.score >= 75
                ? 'bg-emerald-500'
                : lead.score >= 50
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, lead.score))}%` }}
          />
        </div>

        {lead.scoreRationale && (
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {lead.scoreRationale}
          </p>
        )}
      </div>

      {/* Risk Flags Alert (if any) */}
      {riskFlags.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            Security & Compliance Flags:
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {riskFlags.map((flag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"
              >
                <ShieldAlert className="w-3 h-3" />
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Facts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Extracted Facts ({Object.keys(fields).filter((k) => fields[k] !== undefined).length})
          </span>
        </div>

        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" /> Contact:
            </span>
            <span className="font-medium text-slate-200">
              {fields.name ? String(fields.name) : <span className="text-slate-600">Pending</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" /> Company:
            </span>
            <span className="font-medium text-slate-200">
              {fields.company ? String(fields.company) : <span className="text-slate-600">Pending</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Role:
            </span>
            <span className="font-medium text-slate-200">
              {fields.role ? String(fields.role) : <span className="text-slate-600">Pending</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UsersIcon className="w-3.5 h-3.5 text-slate-500" /> Team Size:
            </span>
            <span className="font-medium text-slate-200">
              {fields.teamSize !== undefined ? (
                `${fields.teamSize} reps`
              ) : (
                <span className="text-slate-600">Pending</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Budget:
            </span>
            <span className="font-medium text-emerald-400">
              {fields.budget ? String(fields.budget) : <span className="text-slate-600">Pending</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Timeline:
            </span>
            <span className="font-medium text-slate-200">
              {fields.timeline ? String(fields.timeline) : <span className="text-slate-600">Pending</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Decision-Maker:
            </span>
            <span className="font-medium">
              {fields.decisionMaker === true ? (
                <span className="text-emerald-400">Yes (Verified)</span>
              ) : fields.decisionMaker === false ? (
                <span className="text-amber-400">No (Influencer/SDR)</span>
              ) : (
                <span className="text-slate-600">Pending</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Unknowns To Follow Up */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Unknowns to Follow Up ({unknowns.length})
          </span>
        </div>

        {unknowns.length === 0 ? (
          <div className="text-[11px] text-emerald-400/90 bg-emerald-950/20 border border-emerald-800/30 rounded-lg p-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            All core BANT dimensions successfully qualified!
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {unknowns.map((un, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1"
              >
                ? {un}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Offer Grounding Card */}
      {lead.suggestedOffer && (
        <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Grounded Offer Matched
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
              Config Verified
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-100">{lead.suggestedOffer.packageName}</div>
            <div className="text-xs text-purple-400 font-semibold font-mono">
              ${lead.suggestedOffer.price.toLocaleString()} / {lead.suggestedOffer.billingCycle === 'annual' ? 'yr' : 'mo'}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {lead.suggestedOffer.rationale}
          </p>
        </div>
      )}

      {/* Booked Slot Card */}
      {lead.bookedSlot && (
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            Demo Scheduled
          </div>
          <div className="text-xs text-slate-200 font-medium">
            {lead.bookedSlot.date} at {lead.bookedSlot.timeSlot}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Invite: {lead.bookedSlot.attendeeEmail}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 mt-auto">
        <button
          onClick={onOpenProposal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          Generate Grounded Proposal
        </button>
      </div>
    </div>
  );
};

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

