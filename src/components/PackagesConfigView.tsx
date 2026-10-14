'use client';

import React, { useState, useEffect } from 'react';
import { GroundedCatalog } from '@/lib/types';
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Building2,
  PlusCircle,
} from 'lucide-react';

export const PackagesConfigView: React.FC = () => {
  const [config, setConfig] = useState<GroundedCatalog | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error(err));
  }, []);

  const handleCopyJson = () => {
    if (!config) return;
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Loading grounded catalog...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Grounded Packages & Pricing Catalog
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Hallucination Policy
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              The AI Sales Agent is restricted strictly to these verified packages and prices from `packages.config.json`.
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied JSON' : 'Export packages.config.json'}
        </button>
      </div>

      {/* Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {config.packages.map((pkg) => {
          const isGrowth = pkg.id === 'growth';
          return (
            <div
              key={pkg.id}
              className={`rounded-2xl p-6 flex flex-col relative transition-all ${
                isGrowth
                  ? 'bg-slate-900/90 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isGrowth && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[11px] font-bold text-white shadow-sm uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {pkg.id === 'starter' && <Zap className="w-4 h-4 text-sky-400" />}
                  {pkg.id === 'growth' && <Sparkles className="w-4 h-4 text-indigo-400" />}
                  {pkg.id === 'enterprise' && <Building2 className="w-4 h-4 text-purple-400" />}
                  <h3 className="text-base font-bold text-slate-100">{pkg.name}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                  {pkg.tagline}
                </p>
              </div>

              {/* Pricing */}
              <div className="py-3 my-2 border-y border-slate-800/80">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-100">
                    ${pkg.pricing.monthly}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  or ${pkg.pricing.annual.toLocaleString()} / year (2 months free)
                </div>
              </div>

              {/* Scope Limits */}
              <div className="py-2 space-y-1 text-xs text-slate-300 font-medium">
                <div>
                  <span className="text-slate-500">Target Team: </span>
                  {pkg.idealTeamSize}
                </div>
                <div>
                  <span className="text-slate-500">Volume Cap: </span>
                  {pkg.maxLeadsPerMonth.toLocaleString()} inbound leads/mo
                </div>
              </div>

              {/* Features List */}
              <div className="pt-4 mt-2 space-y-2.5 flex-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Features Included:
                </div>
                {pkg.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Add-ons */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-indigo-400" />
          Verified Catalog Add-Ons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {config.addons.map((addon) => (
            <div
              key={addon.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-slate-200">{addon.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                  +${addon.monthlyPrice}/mo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {addon.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grounding Rules Specification */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Autonomous Grounding Rule Enforcement
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The AI Sales Agent executes runtime validation against this exact schema before suggesting any offer or booking a slot.
          If an adversary or prompter demands an unauthorized discount (e.g. &apos;Make Growth $750&apos;), the grounding validator immediately flags the attempt, rejects the hallucinated price, and re-grounds the proposal to official Spacenos catalog pricing.
        </p>
      </div>
    </div>
  );
};

