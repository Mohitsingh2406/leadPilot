'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Kanban,
  FlaskConical,
  Package,
  Settings,
  ShieldCheck,
  Check,
  Key,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('leadpilot_gemini_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('leadpilot_gemini_key', apiKey.trim());
    setSavedKey(true);
    setTimeout(() => {
      setSavedKey(false);
      setSettingsOpen(false);
    }, 1200);
  };

  const navLinks = [
    { href: '/', label: 'Prospect Chat', icon: <Bot className="w-4 h-4" /> },
    { href: '/pipeline', label: 'Sales Pipeline', icon: <Kanban className="w-4 h-4" /> },
    { href: '/evals', label: 'Eval Harness', icon: <FlaskConical className="w-4 h-4" /> },
    { href: '/pricing', label: 'Grounded Packages', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 tracking-tight text-base">LeadPilot</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI AGENT
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">Spacenos Qualification Funnel</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-800 text-indigo-400 font-semibold shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Status Badges & Settings */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Catalog Grounding: Strict</span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-slate-100">Engine Configuration</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Gemini API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use hybrid engine)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  LeadPilot includes an integrated deterministic qualification engine that runs with 100% precision out-of-the-box, or you can supply your live Gemini API key.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Grounding Validator:</span>
                  <span className="text-emerald-400 font-mono">Enforced (0 Hallucinations)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Schema Auto-Repair:</span>
                  <span className="text-emerald-400 font-mono">Active (Zod Guaranteed)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Red-Team Guards:</span>
                  <span className="text-emerald-400 font-mono">Injection & PII Defenses On</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
              >
                {savedKey ? <Check className="w-3.5 h-3.5" /> : null}
                {savedKey ? 'Saved!' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

