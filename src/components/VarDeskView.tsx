import React, { useState } from 'react';
import { LEAGUES, type LeagueId } from '../game/rules';
import { VAR_DESK_PRESETS, type VarDeskPreset } from '../game/scenarios';
import { GENERATED_ASSETS } from '../utils/assets';

interface VarDebateResult {
  model: string;
  on_field_agent_view: string;
  head_var_agent_rebuttal: string;
  clear_and_obvious_error: boolean;
  ofr_recommended: boolean;
  final_ruling_call: string;
  disciplinary_card: string;
  restart_type: string;
  law_ref: string;
  law_quote: string;
  confidence: number;
  key_geometry_factors: string[];
}

interface VarDeskViewProps {
  selectedLeague: LeagueId;
  onAppendTelemetry: (msg: string, lawRef: string, conf: number) => void;
}

const DEFAULT_DEBATE_RESULT: VarDebateResult = {
  model: 'gemini-4-argon',
  on_field_agent_view:
    'From pitch level, the defender appeared to challenge for the loose cross inside the penalty area; awarded Penalty Kick + Yellow Card under standard double-jeopardy reduction.',
  head_var_agent_rebuttal:
    'High-frame-rate broadcast angle confirms a two-handed push squarely into the striker’s back with zero possibility or attempt to play the ball while 1v1 with the goalkeeper. Double-jeopardy reduction only applies when the defender genuinely attempts to play the ball.',
  clear_and_obvious_error: true,
  ofr_recommended: true,
  final_ruling_call: 'Overturn Yellow to Direct Red Card + Penalty Kick',
  disciplinary_card: 'Red Card',
  restart_type: 'Penalty Kick',
  law_ref: 'IFAB Law 12 §3 — Sending-off Offences (DOGSO in Penalty Area)',
  law_quote:
    'In all other circumstances (e.g. holding, pulling, pushing, no possibility to play the ball) the offending player must be sent off.',
  confidence: 0.96,
  key_geometry_factors: [
    'Distance to goal: 7.3m (unobstructed central corridor)',
    'Ball proximity to defender boot: 2.1m (zero play on ball)',
    'Contact vector: Two-handed dorsal push at t=18',
  ],
};

export const VarDeskView: React.FC<VarDeskViewProps> = ({
  selectedLeague,
  onAppendTelemetry,
}) => {
  const [scenarioText, setScenarioText] = useState<string>(
    VAR_DESK_PRESETS[0].scenarioText
  );
  const [onFieldCall, setOnFieldCall] = useState<string>(
    VAR_DESK_PRESETS[0].onFieldInitialCall
  );
  const [uploadedFramePreview, setUploadedFramePreview] = useState<string | null>(
    null
  );
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debateResult, setDebateResult] = useState<VarDebateResult>(
    DEFAULT_DEBATE_RESULT
  );

  const handleSelectPreset = (preset: VarDeskPreset) => {
    setScenarioText(preset.scenarioText);
    setOnFieldCall(preset.onFieldInitialCall);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedFramePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioText.trim()) {
      setErrorMsg('Please enter a match controversy situation before running VAR analysis.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const base64Data = uploadedFramePreview
        ? uploadedFramePreview.split(',')[1]
        : undefined;

      const response = await fetch('/api/argon/var-desk-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioText,
          onFieldInitialCall: onFieldCall,
          leagueId: selectedLeague,
          imageBase64: base64Data,
          imageMimeType: uploadedMimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to run VAR Desk debate.');
      }

      setDebateResult(data);
      onAppendTelemetry(
        `VAR Desk Debate completed: ${data.final_ruling_call}`,
        data.law_ref || 'IFAB VAR Protocol',
        Number(data.confidence) || 0.94
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'VAR Desk network error';
      setErrorMsg(`Live Gemini 4 Argon notice: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0B111E]">
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-7 p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-amber-400 mb-1">
                REAL-WORLD VAR DESK · DUAL-AGENT IFAB ARBITRATION
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide text-slate-100 uppercase">
                Live VAR Room Multi-Agent Debate Desk
              </h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Paste any controversial match situation or upload a broadcast freeze-frame. Two specialized{' '}
                <span className="font-mono text-amber-300">gemini-4-argon</span> agents (On-Field Referee vs. Head VAR)
                debate the play against the 200-page IFAB Laws of the Game in 1M unified context.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {VAR_DESK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-3 py-1.5 rounded bg-slate-800/90 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Load: {preset.matchLabel}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-5 relative min-h-[180px] bg-slate-900">
            <img
              src={GENERATED_ASSETS.varRoomBooth}
              alt="Professional football VAR control booth with multi-angle replay monitors"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B111E] via-transparent to-transparent md:bg-gradient-to-r md:from-[#0B111E] md:via-transparent md:to-transparent" />
          </div>
        </div>
      </div>

      {/* Input Form + Multimodal Frame Upload */}
      <form
        onSubmit={handleRunDebate}
        className="p-5 rounded-xl bg-[#0B111E] border border-slate-800 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-3">
            <div>
              <label
                htmlFor="var-scenario-input"
                className="block text-xs font-mono text-slate-300 mb-1.5"
              >
                CONTROVERSIAL MATCH SITUATION DESCRIPTION
              </label>
              <textarea
                id="var-scenario-input"
                rows={3}
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                placeholder="Describe the tackle, handball geometry, offside interference, or penalty box contact..."
                className="w-full rounded-lg bg-[#070B12] border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="var-onfield-call"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  ON-FIELD INITIAL RULING
                </label>
                <input
                  id="var-onfield-call"
                  type="text"
                  value={onFieldCall}
                  onChange={(e) => setOnFieldCall(e.target.value)}
                  className="w-full rounded-lg bg-[#070B12] border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label
                  htmlFor="var-league-context"
                  className="block text-xs font-mono text-slate-300 mb-1"
                >
                  COMPETITION PROTOCOL
                </label>
                <input
                  id="var-league-context"
                  type="text"
                  readOnly
                  value={`${LEAGUES[selectedLeague].name} · IFAB 2025/26`}
                  className="w-full rounded-lg bg-[#070B12]/60 border border-slate-800 px-3 py-2 text-sm text-slate-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Optional Freeze-Frame Upload */}
          <div className="md:col-span-4 flex flex-col justify-between rounded-lg bg-[#070B12] border border-slate-800 p-3.5">
            <div>
              <div className="text-xs font-mono text-slate-300 mb-1">
                MULTIMODAL FREEZE-FRAME (OPTIONAL)
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Upload a match screenshot or broadcast frame for Gemini 4 Argon spatial inspection.
              </p>
              {uploadedFramePreview ? (
                <div className="relative h-24 rounded overflow-hidden border border-slate-700 mb-2">
                  <img
                    src={uploadedFramePreview}
                    alt="Uploaded match freeze frame"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedFramePreview(null)}
                    className="absolute top-1 right-1 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-mono text-rose-400"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="var-frame-file"
                className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                Upload Match Frame
              </label>
              <input
                id="var-frame-file"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAnalyzing ? 'Running Argon Debate...' : 'Run Dual-Agent VAR Debate'}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-200"
          >
            {errorMsg}
          </div>
        )}
      </form>

      {/* Dual-Agent Debate Transcript + Official IFAB Ruling Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Agent 1 vs Agent 2 Debate */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-[#0B111E] border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1.5">
              <span>[ON-FIELD REFEREE AGENT · PITCH PERSPECTIVE]</span>
              <span>INITIAL CALL RATIONALE</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {debateResult.on_field_agent_view}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B111E] border border-amber-500/40">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1.5">
              <span>[HEAD VAR AGENT · 1M IFAB FORENSIC AUDIT]</span>
              <span className="tabular-nums">
                CONFIDENCE {(debateResult.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">
              {debateResult.head_var_agent_rebuttal}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
              <div className="text-[11px] font-mono text-slate-400">
                KEY GEOMETRY &amp; CONTACT VECTORS:
              </div>
              {debateResult.key_geometry_factors.map((factor, idx) => (
                <div key={idx} className="text-xs text-slate-300 font-mono">
                  {idx + 1}. {factor}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Official IFAB Cited Ruling Card */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-[#0F172A] border border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-amber-400 font-semibold">
                OFFICIAL IFAB VAR RULING CARD
              </span>
              <span
                className={
                  debateResult.ofr_recommended
                    ? 'text-rose-400 font-semibold'
                    : 'text-emerald-400 font-semibold'
                }
              >
                {debateResult.ofr_recommended
                  ? 'OFR INTERVENTION REQUIRED'
                  : 'DECISION CONFIRMED'}
              </span>
            </div>

            <h3 className="text-xl font-display font-bold uppercase text-white tracking-wide">
              {debateResult.final_ruling_call}
            </h3>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 rounded-lg bg-[#070B12] border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  DISCIPLINARY SANCTION
                </div>
                <div className="text-sm font-semibold text-amber-300 mt-0.5">
                  {debateResult.disciplinary_card}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#070B12] border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">
                  MATCH RESTART
                </div>
                <div className="text-sm font-semibold text-sky-300 mt-0.5">
                  {debateResult.restart_type}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070B12] border border-slate-800 space-y-1.5">
              <div className="text-xs font-mono font-semibold text-amber-400">
                {debateResult.law_ref}
              </div>
              <blockquote className="text-xs text-slate-300 italic leading-relaxed">
                “{debateResult.law_quote}”
              </blockquote>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ENGINE: {debateResult.model}</span>
            <span className="tabular-nums text-emerald-400">
              VERIFIED · {(debateResult.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
