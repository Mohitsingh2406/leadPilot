'use client';

import React, { useState } from 'react';
import { Lead, PipelineStage } from '@/lib/types';
import {
  X,
  Building,
  User,
  DollarSign,
  Clock,
  Briefcase,
  ShieldCheck,
  AlertOctagon,
  CalendarCheck,
  Sparkles,
  MessageSquare,
  Plus,
  FileText,
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStageChange: (leadId: string, newStage: PipelineStage) => Promise<void>;
  onAddNote: (leadId: string, noteText: string) => Promise<void>;
  onOpenProposal: (leadId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onStageChange,
  onAddNote,
  onOpenProposal,
}) => {
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  if (!isOpen || !lead) return null;

  const fields = lead.extractedFields || {};
  const notes = lead.notes || [];

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      await onAddNote(lead.id, newNote.trim());
      setNewNote('');
    } finally {
      setSubmittingNote(false);
    }
  };

  const stages: PipelineStage[] = ['new', 'qualified', 'proposal_sent', 'booked', 'won', 'lost'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              {String(fields.company || 'LP').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {String(fields.company || 'Unnamed Prospect')}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Score: {lead.score}/100
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Contact: {String(fields.name || 'Anonymous')} • {String(fields.role || 'Sales Lead')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenProposal(lead.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Proposal
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stage Override Selector */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Admin Stage Override
            </div>
            <div className="flex flex-wrap gap-2">
              {stages.map((stg) => {
                const active = lead.stage === stg;
                return (
                  <button
                    key={stg}
                    onClick={() => onStageChange(lead.id, stg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {stg.replace('_', ' ').toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extracted BANT Dimensions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Extracted Qualification Facts
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" /> Contact Name
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {fields.name ? String(fields.name) : 'Pending'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Building className="w-3 h-3" /> Company
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {fields.company ? String(fields.company) : 'Pending'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Briefcase className="w-3 h-3" /> Role
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {fields.role ? String(fields.role) : 'Pending'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3" /> Budget
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  {fields.budget ? String(fields.budget) : 'Pending'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" /> Timeline
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {fields.timeline ? String(fields.timeline) : 'Pending'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3 h-3" /> Decision Maker
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {fields.decisionMaker === true ? 'Verified Yes' : fields.decisionMaker === false ? 'No (Researcher)' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Flags & Grounded Package */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Risk Flags ({lead.riskFlags.length})
              </span>
              {lead.riskFlags.length === 0 ? (
                <span className="text-xs text-slate-500">No security or compliance flags recorded.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {lead.riskFlags.map((rf, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"
                    >
                      <AlertOctagon className="w-3 h-3" />
                      {rf}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Grounded Package
              </span>
              {lead.suggestedOffer ? (
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    {lead.suggestedOffer.packageName} ($
                    {lead.suggestedOffer.price.toLocaleString()}/
                    {lead.suggestedOffer.billingCycle === 'annual' ? 'yr' : 'mo'})
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {lead.suggestedOffer.rationale}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500">Offer not yet suggested.</span>
              )}
            </div>
          </div>

          {/* Booked Slot Info */}
          {lead.bookedSlot && (
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-800/40 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100">
                  Demo Booked: {lead.bookedSlot.date} at {lead.bookedSlot.timeSlot} ({lead.bookedSlot.timezone})
                </div>
                <div className="text-[11px] text-slate-400">
                  Attendee: {lead.bookedSlot.attendeeEmail} {lead.bookedSlot.notes && `• ${lead.bookedSlot.notes}`}
                </div>
              </div>
            </div>
          )}

          {/* Admin Internal Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Admin Internal Notes ({notes.length})
            </h4>

            <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal note or qualification feedback..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-semibold text-indigo-400">{note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-300">{note.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

