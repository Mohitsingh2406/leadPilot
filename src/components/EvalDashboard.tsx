'use client';

import React, { useState } from 'react';
import { EvalReport, EvalTestResult } from '@/lib/types';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CalendarCheck,
  Search,
  ChevronRight,
  Bot,
  User,
} from 'lucide-react';

export const EvalDashboard: React.FC = () => {
  const [report, setReport] = useState<EvalReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'safety' | 'booking' | 'passed' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [selectedTest, setSelectedTest] = useState<EvalTestResult | null>(null);

  const runSuite = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/functions/runEvalSuite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suiteId: 'default_suite' }),
      });
      if (!res.ok) {
        throw new Error('Failed to run eval suite');
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const testResults = report?.testResults || [];

  const filteredTests = testResults.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.testId.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'passed') return t.passed;
    if (filter === 'failed') return !t.passed;
    if (filter === 'safety') {
      return (
        t.category === 'prompt_injection' ||
        t.category === 'system_leak' ||
        t.category === 'fake_urgency' ||
        t.category === 'haggle_discount'
      );
    }
    if (filter === 'booking') return t.booked;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Eval Harness & Benchmark Suite
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                20 Scenarios
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Evaluates BANT extraction accuracy, catalog grounding compliance, red-team defenses, and demo bookings.
            </p>
          </div>
        </div>

        <button
          onClick={runSuite}
          disabled={running}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          {running ? 'Executing 20 Canned Conversations...' : 'Run 20-Scenario Eval Suite'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Error running eval suite: {error}</span>
        </div>
      )}

      {/* Metrics Cards Bar */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Extraction Accuracy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="text-xs font-medium text-slate-400">Extraction Accuracy</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {report.metrics.extractionAccuracy}%
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">BANT Fields</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${report.metrics.extractionAccuracy}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Hallucination Count */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="text-xs font-medium text-slate-400">Hallucination Count</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${report.metrics.hallucinationCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {report.metrics.hallucinationCount}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium font-mono">
                {report.metrics.hallucinationCount === 0 ? '100% Grounded' : 'Discounts Found'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Zero unauthorized discounts allowed
            </div>
          </div>

          {/* Metric 3: Booking Rate */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="text-xs font-medium text-slate-400">Booking Rate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">
                {report.metrics.bookingRate}%
              </span>
              <span className="text-[11px] text-slate-400">Qualified Bookings</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${report.metrics.bookingRate}%` }}
              />
            </div>
          </div>

          {/* Metric 4: Safety & Red-Team Pass Rate */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="text-xs font-medium text-slate-400">Red-Team Pass Rate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-400">
                {report.metrics.safetyPassRate}%
              </span>
              <span className="text-[11px] text-indigo-300 font-mono">Injections Blocked</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Prompt injections & data leaks resisted
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(['all', 'safety', 'booking', 'passed', 'failed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === mode
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mode === 'all' ? 'All (20 Scenarios)' : mode}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios or category..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Test Cases Table */}
        <div className="flex-1 overflow-y-auto">
          {!report && !running ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <FlaskConical className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-medium">Ready to run the 20-scenario eval harness.</p>
              <button
                onClick={runSuite}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                Click to Execute Suite
              </button>
            </div>
          ) : running ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium">
                Running 20 multi-turn test scripts through strict tool validation and grounding...
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-3 pl-4">ID</th>
                  <th className="p-3">Scenario Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Extraction</th>
                  <th className="p-3">Grounding</th>
                  <th className="p-3">Booking</th>
                  <th className="p-3">Safety Pass</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTests.map((t) => (
                  <tr
                    key={t.testId}
                    onClick={() => setSelectedTest(t)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="p-3 pl-4 font-mono font-medium text-indigo-400">{t.testId}</td>
                    <td className="p-3 font-medium text-slate-100">{t.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[11px] border border-slate-700/60">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      <span
                        className={
                          t.extractionScore >= 90
                            ? 'text-emerald-400'
                            : t.extractionScore >= 70
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {t.extractionScore}%
                      </span>
                    </td>
                    <td className="p-3">
                      {!t.hallucinated ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Grounded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Hallucination
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {t.booked ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          Booked
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {t.safetyPassed ? (
                        <span className="flex items-center gap-1 text-indigo-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Protected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Breached
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          t.passed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4">
                      <button className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-auto font-medium">
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Test Case Inspection Drawer / Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {selectedTest.testId}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{selectedTest.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: <span className="text-slate-300 font-mono">{selectedTest.category}</span> • Extraction: {selectedTest.extractionScore}%
                </p>
              </div>

              <button
                onClick={() => setSelectedTest(null)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Extracted vs Expected Diff */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Extracted Facts vs Expected Benchmark
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                      Actual Extracted Fields:
                    </div>
                    <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre-wrap">
                      {JSON.stringify(selectedTest.extractedFields, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                      Expected Benchmark Fields:
                    </div>
                    <pre className="text-xs font-mono text-indigo-300/90 whitespace-pre-wrap">
                      {JSON.stringify(selectedTest.expectedFields, null, 2)}
                    </pre>
                  </div>
                </div>

                {selectedTest.missingOrMismatchFields.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Discrepancies:
                    </div>
                    {selectedTest.missingOrMismatchFields.map((d, i) => (
                      <div key={i}>• {d}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Execution Transcript */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Conversation Transcript & Tool Invocations
                </h4>
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {selectedTest.conversationTranscript.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-xs space-y-1.5 ${
                        msg.role === 'user'
                          ? 'bg-indigo-950/40 border border-indigo-800/40 text-indigo-100'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        {msg.role === 'user' ? (
                          <>
                            <User className="w-3 h-3 text-indigo-400" />
                            Prospect Utterance
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-violet-400" />
                            AI Sales Agent
                          </>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <div className="text-[10px] text-slate-400 font-mono font-semibold">
                            Strict Tools Invoked:
                          </div>
                          {msg.toolCalls.map((tc, j) => (
                            <div
                              key={j}
                              className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400"
                            >
                              {tc.name}(): {JSON.stringify(tc.result)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

