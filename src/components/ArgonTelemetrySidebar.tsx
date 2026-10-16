import React from 'react';
import type { DiscardLogEntry } from '../game/rules';

interface ArgonTelemetrySidebarProps {
  logs: DiscardLogEntry[];
  activeAgents: Record<'Director' | 'Auditor' | 'VAR Room' | 'Dissent' | 'Assessor', string>;
  isGeneratingIncident: boolean;
  onTriggerArgonLoop1: () => void;
}

const AGENT_NODES: Array<{
  key: 'Director' | 'Auditor' | 'VAR Room' | 'Dissent' | 'Assessor';
  model: string;
  role: string;
}> = [
  { key: 'Director', model: 'gemini-4-argon', role: '2D Coordinate & Contact Synthesis' },
  { key: 'Auditor', model: 'gemini-4-argon (HIGH)', role: 'Loop 1 IFAB Plausibility Gate' },
  { key: 'VAR Room', model: 'gemini-4-argon', role: 'Loop 2 Clear & Obvious Error OFR' },
  { key: 'Dissent', model: 'flash + tts + banana', role: 'K-Webtoon Cut-In & Voice Backlash' },
  { key: 'Assessor', model: 'gemini-4-argon', role: 'Post-Match Promotion/Relegation Audit' },
];

export const ArgonTelemetrySidebar: React.FC<ArgonTelemetrySidebarProps> = ({
  logs,
  activeAgents,
  isGeneratingIncident,
  onTriggerArgonLoop1,
}) => {
  return (
    <aside
      aria-label="Argon Multi-Agent Telemetry"
      className="w-full lg:w-[30%] lg:min-w-[340px] lg:max-w-[440px] bg-[#080D16] border-t lg:border-t-0 lg:border-l border-slate-800/90 flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/90 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-display font-bold tracking-wider uppercase text-slate-100">
            Argon Multi-Agent Telemetry
          </h2>
          <p className="text-[11px] font-mono text-slate-400">
            1M Unified Context · IFAB Laws 1–17 Cached
          </p>
        </div>
        <span className="text-[11px] font-mono text-amber-400 tabular-nums">
          CONF ≥ 0.85
        </span>
      </div>

      {/* 5 Sub-Agent Live Badges */}
      <div className="p-3 border-b border-slate-800/80 grid grid-cols-1 gap-1.5">
        {AGENT_NODES.map((node) => {
          const stateText = activeAgents[node.key] || 'STANDBY';
          const isBusy = stateText === 'ACTIVE' || stateText === 'VERIFYING';
          return (
            <div
              key={node.key}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-xs ${
                isBusy
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                  : 'bg-[#0B121F] border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-slate-100 shrink-0">
                  [{node.key}]
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {node.role}
                </span>
              </div>
              <span className="font-mono text-[10px] text-sky-400 shrink-0 ml-2">
                {stateText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Loop 1 Action Trigger for Judges */}
      <div className="px-3 py-2.5 bg-[#0B121F] border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-300 leading-tight">
          Test live <span className="font-mono text-amber-300">Director / Auditor</span> Loop 1 generation &amp; discard gate:
        </div>
        <button
          type="button"
          onClick={onTriggerArgonLoop1}
          disabled={isGeneratingIncident}
          className="px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isGeneratingIncident ? 'Auditing...' : 'Synthesize Incident'}
        </button>
      </div>

      {/* Verification Loop Discard & Audit Log */}
      <div className="px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>VERIFICATION LOOP DISCARD LOG</span>
        <span className="tabular-nums">{logs.length} EVENTS</span>
      </div>

      <div
        data-testid="telemetry-log-list"
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[540px] lg:max-h-none font-mono text-xs"
      >
        {logs.map((entry) => {
          const isRejected = entry.status === 'REJECTED & REGENERATED';
          const isOfr = entry.status === 'OFR_TRIGGERED';
          const isVerified = entry.status === 'VERIFIED';

          return (
            <div
              key={entry.id}
              className={`p-2.5 rounded border leading-relaxed ${
                isRejected
                  ? 'bg-rose-950/35 border-rose-800/60 text-rose-200'
                  : isOfr
                  ? 'bg-amber-950/40 border-amber-700/70 text-amber-200'
                  : isVerified
                  ? 'bg-emerald-950/25 border-emerald-800/50 text-emerald-200'
                  : 'bg-[#0C1424] border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[10px] opacity-85 mb-1">
                <span>
                  [{entry.agentFrom} → {entry.agentTo}] · {entry.timestamp}
                </span>
                <span className="tabular-nums font-semibold">
                  conf={entry.confidence.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1">
                <span
                  className={
                    isRejected
                      ? 'text-rose-400'
                      : isOfr
                      ? 'text-amber-400'
                      : isVerified
                      ? 'text-emerald-400'
                      : 'text-sky-400'
                  }
                >
                  [{entry.status}]
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-200 truncate">{entry.lawRef}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-snug">
                {entry.message}
              </p>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
