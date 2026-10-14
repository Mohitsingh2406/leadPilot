'use client';

import React, { useState, useEffect } from 'react';
import { ProposalResult } from '@/lib/types';
import {
  FileText,
  X,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ProposalModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  leadId,
  isOpen,
  onClose,
}) => {
  const [proposal, setProposal] = useState<ProposalResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && leadId) {
      loadProposal(leadId);
    } else {
      setProposal(null);
      setError(null);
    }
  }, [isOpen, leadId]);

  const loadProposal = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/functions/generateProposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate proposal');
      }
      const data: ProposalResult = await res.json();
      setProposal(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!proposal) return;
    navigator.clipboard.writeText(proposal.proposalMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!proposal) return;
    const blob = new Blob([proposal.proposalMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Proposal-${proposal.company || 'Lead'}-${proposal.leadId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Commercial Proposal
                {proposal && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Grounded
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {proposal ? `Generated for ${proposal.company} (${proposal.leadName})` : 'Generating proposal...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {proposal && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Markdown' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-600/40 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .md
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium">Synthesizing grounded proposal from conversation facts...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-400" />
              <div>
                <div className="font-semibold">Error Generating Proposal</div>
                <div className="text-xs text-rose-300/80 mt-1">{error}</div>
              </div>
            </div>
          )}

          {proposal && (
            <>
              {/* Assumptions Strip */}
              {proposal.assumptions && proposal.assumptions.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2.5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Verified Assumptions & Grounding Criteria
                  </h4>
                  <ul className="space-y-1.5">
                    {proposal.assumptions.map((assump, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{assump}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Proposal Document Preview */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 font-sans text-slate-200 space-y-4">
                <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-200 leading-relaxed overflow-x-auto">
                  {proposal.proposalMarkdown}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Grounded in Spacenos Official Pricing Catalog</span>
          <span>Zero Hallucinated Discounts Policy Active</span>
        </div>
      </div>
    </div>
  );
};

