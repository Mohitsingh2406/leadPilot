'use client';

import React, { useState, useEffect } from 'react';
import { Lead, PipelineStage } from '@/lib/types';
import { LeadDetailModal } from './LeadDetailModal';
import { ProposalModal } from './ProposalModal';
import {
  Kanban,
  User,
  Building,
  Calendar,
  Sparkles,
  AlertOctagon,
  FileText,
  RotateCw,
  MessageSquare,
} from 'lucide-react';

interface StageColumn {
  id: PipelineStage;
  title: string;
  color: string;
  borderColor: string;
}

const STAGE_COLUMNS: StageColumn[] = [
  { id: 'new', title: 'New Inbound', color: 'bg-blue-500/10 text-blue-400', borderColor: 'border-blue-500/20' },
  { id: 'qualified', title: 'Qualified (BANT)', color: 'bg-amber-500/10 text-amber-400', borderColor: 'border-amber-500/20' },
  { id: 'proposal_sent', title: 'Proposal Sent', color: 'bg-purple-500/10 text-purple-400', borderColor: 'border-purple-500/20' },
  { id: 'booked', title: 'Demo Booked', color: 'bg-emerald-500/10 text-emerald-400', borderColor: 'border-emerald-500/20' },
  { id: 'won', title: 'Closed Won', color: 'bg-green-500/20 text-green-300', borderColor: 'border-green-500/30' },
  { id: 'lost', title: 'Closed Lost', color: 'bg-rose-500/10 text-rose-400', borderColor: 'border-rose-500/20' },
];

export const PipelineKanban: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [proposalLeadId, setProposalLeadId] = useState<string | null>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId: string, newStage: PipelineStage) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          noteText: `Admin stage override to ${newStage.toUpperCase()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? data.lead : l))
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(data.lead);
        }
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const handleAddNote = async (leadId: string, noteText: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText, author: 'Admin' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? data.lead : l))
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(data.lead);
        }
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleOpenProposal = (leadId: string) => {
    setProposalLeadId(leadId);
    setProposalModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 p-6 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Sales Pipeline</h1>
            <p className="text-xs text-slate-400">
              Inbound qualification stages: new → qualified → proposal_sent → booked → won/lost
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {STAGE_COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.stage === col.id);

          return (
            <div
              key={col.id}
              className="w-80 shrink-0 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    ({colLeads.length})
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colLeads.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-600 text-xs text-center border border-dashed border-slate-800 rounded-xl p-4">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const fields = lead.extractedFields || {};
                    const hasRisk = lead.riskFlags && lead.riskFlags.length > 0;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setDetailModalOpen(true);
                        }}
                        className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 shadow-sm transition-all hover:shadow-md cursor-pointer space-y-2.5 group"
                      >
                        {/* Company & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-500" />
                              {String(fields.company || 'Inbound Lead')}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-500" />
                              {String(fields.name || 'Anonymous')} {fields.role ? `(${fields.role})` : ''}
                            </div>
                          </div>

                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                            lead.score >= 75
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : lead.score >= 50
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {lead.score}
                          </span>
                        </div>

                        {/* Package / Booked slot info */}
                        {lead.suggestedOffer && (
                          <div className="text-[11px] text-purple-300 bg-purple-950/30 px-2 py-1 rounded border border-purple-800/40 flex items-center gap-1 font-medium">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            {lead.suggestedOffer.packageName} (${lead.suggestedOffer.price.toLocaleString()})
                          </div>
                        )}

                        {lead.bookedSlot && (
                          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/40 flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3 text-emerald-400" />
                            Booked: {lead.bookedSlot.date} {lead.bookedSlot.timeSlot}
                          </div>
                        )}

                        {/* Risk Flags Indicator */}
                        {hasRisk && (
                          <div className="flex flex-wrap gap-1">
                            {lead.riskFlags.map((rf, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"
                              >
                                <AlertOctagon className="w-2.5 h-2.5" />
                                {rf}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer details & quick actions */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {lead.notes?.length || 0} notes
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProposal(lead.id);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Proposal
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail & Stage Override Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedLead(null);
        }}
        onStageChange={handleStageChange}
        onAddNote={handleAddNote}
        onOpenProposal={handleOpenProposal}
      />

      {/* Proposal Modal */}
      <ProposalModal
        leadId={proposalLeadId}
        isOpen={proposalModalOpen}
        onClose={() => {
          setProposalModalOpen(false);
          setProposalLeadId(null);
        }}
      />
    </div>
  );
};

