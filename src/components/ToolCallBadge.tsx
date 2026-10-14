'use client';

import React, { useState } from 'react';
import { ToolCallRecord } from '@/lib/types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Calendar,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface ToolCallBadgeProps {
  toolCall: ToolCallRecord;
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);

  const getToolMeta = (name: string) => {
    switch (name) {
      case 'extractLead':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-sky-400" />,
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          badge: 'EXTRACT',
        };
      case 'scoreLead':
        return {
          icon: <Layers className="w-3.5 h-3.5 text-amber-400" />,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          badge: 'SCORE',
        };
      case 'suggestOffer':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          badge: 'OFFER (GROUNDED)',
        };
      case 'bookSlot':
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          badge: 'BOOK SLOT',
        };
      case 'handoffToHuman':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />,
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          badge: 'HUMAN HANDOFF',
        };
      default:
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-slate-400" />,
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          badge: name,
        };
    }
  };

  const meta = getToolMeta(toolCall.name);

  return (
    <div className="mt-2 text-xs font-mono rounded-lg border border-slate-800 bg-slate-900/80 overflow-hidden shadow-sm">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${meta.color}`}>
            {meta.icon}
            {meta.badge}
          </span>
          <span className="text-slate-300 font-medium">{toolCall.name}()</span>
          {toolCall.isRepaired && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded text-[10px]">
              Auto-Repaired
            </span>
          )}
          {toolCall.groundingChecked && (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[10px]">
              Catalog Grounded
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] text-slate-500">
            {new Date(toolCall.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {expanded && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
          {toolCall.repairedReason && (
            <div className="flex items-start gap-1.5 text-amber-400/90 bg-amber-950/30 p-2 rounded border border-amber-800/40 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Auto-Repair Notice: </span>
                {toolCall.repairedReason}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Typed Schema Output:
            </div>
            <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400/90 overflow-x-auto">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Raw Input Arguments:
            </div>
            <pre className="p-2 rounded bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-400 overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

