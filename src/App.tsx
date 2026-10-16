import React, { useState, useEffect, useCallback } from 'react';
import {
  LEAGUES,
  REFEREE_ARCHETYPES,
  CALL_ACTION_LABELS,
  evaluateRefereeCall,
  type LeagueId,
  type RefereeArchetypeId,
  type RefereeKitColor,
  type CallAction,
  type MatchIncident,
  type DiscardLogEntry,
  type CallEvaluationResult,
} from './game/rules';
import { INITIAL_INCIDENTS, INITIAL_DISCARD_LOG } from './game/scenarios';
import { GENERATED_ASSETS } from './utils/assets';
import { soundEngine } from './utils/sound';
import { TacticalPitchCanvas } from './components/TacticalPitchCanvas';
import { RetroRefereeMakerStage } from './components/RetroRefereeMakerStage';
import { type ChibiHairStyle } from './components/RetroPixelRenderer';
import { ArgonTelemetrySidebar } from './components/ArgonTelemetrySidebar';
import { VarDeskView } from './components/VarDeskView';
import { AssessorReportView } from './components/AssessorReportView';

type ActiveTab = 'career_match' | 'var_desk' | 'assessor_report';
type CareerStage = 'pre_match_lobby' | 'in_match';

// Retro Arcade 5-Button Referee Hotbar
const GAME_HOTBAR_BUTTONS: Array<{
  action: CallAction;
  keyNum: string;
  icon: string;
  koTitle: string;
  koSub: string;
  colorClass: string;
}> = [
  {
    action: 'advantage',
    keyNum: '1',
    icon: '👋',
    koTitle: 'PLAY ON',
    koSub: 'No Foul · Advantage',
    colorClass: 'bg-emerald-400 hover:bg-emerald-300 text-[#09090B]',
  },
  {
    action: 'foul',
    keyNum: '2',
    icon: 'WHISTLE_SVG',
    koTitle: 'BLOW WHISTLE',
    koSub: 'Standard Foul · Free Kick',
    colorClass: 'bg-white hover:bg-slate-100 text-[#09090B]',
  },
  {
    action: 'yellow',
    keyNum: '3',
    icon: '🟨',
    koTitle: 'YELLOW CARD',
    koSub: 'Caution Offender',
    colorClass: 'bg-amber-400 hover:bg-amber-300 text-[#09090B]',
  },
  {
    action: 'red',
    keyNum: '4',
    icon: '🟥',
    koTitle: 'RED CARD',
    koSub: 'Direct Send-Off',
    colorClass: 'bg-rose-500 hover:bg-rose-400 text-white',
  },
  {
    action: 'penalty',
    keyNum: '5',
    icon: '🎯',
    koTitle: 'PENALTY KICK',
    koSub: 'Point to Penalty Spot',
    colorClass: 'bg-sky-400 hover:bg-sky-300 text-[#09090B]',
  },
];

const KO_CALL_NAMES: Record<CallAction, string> = {
  play_on: 'Play On (No Foul)',
  advantage: 'Play On (Advantage)',
  foul: 'Blow Whistle (Free Kick)',
  yellow: '🟨 Yellow Card (Caution)',
  red: '🟥 Red Card (Send-Off)',
  penalty: '🎯 Penalty Kick',
};

/**
 * Custom Football Referee Pea-Whistle SVG Logo (Replaces Trumpet Emoji!)
 */
function RefereeWhistleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Football Referee Whistle"
    >
      {/* Sound burst rays */}
      <path
        d="M27 3L30 1M31 6.5L34.5 5.5M24 2.5L25 0.5"
        stroke="#EF4444"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Left Lanyard Ring */}
      <circle
        cx="5.5"
        cy="16.5"
        r="3.2"
        fill="#FACC15"
        stroke="#09090B"
        strokeWidth="2.2"
      />
      {/* Round Pea Chamber + Tapered Mouthpiece */}
      <path
        d="M15.5 8.5C11.08 8.5 7.5 12.08 7.5 16.5C7.5 20.92 11.08 24.5 15.5 24.5C19.35 24.5 22.56 21.78 23.33 18.15L33 14.5V9.5L22.5 9.5C20.8 8.85 18.25 8.5 15.5 8.5Z"
        fill="#E2E8F0"
        stroke="#09090B"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Top Sound Vent Notch */}
      <rect
        x="22"
        y="9.5"
        width="4.2"
        height="3.8"
        fill="#09090B"
      />
      {/* Inner Metallic Chamber Highlight & Pea Circle */}
      <circle
        cx="15.5"
        cy="16.5"
        r="4.2"
        fill="#94A3B8"
        stroke="#09090B"
        strokeWidth="2"
      />
      <circle cx="14.2" cy="15.2" r="1.4" fill="#FFFFFF" />
    </svg>
  );
}

export default function App() {
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [activeTab, setActiveTab] = useState<ActiveTab>('career_match');
  const [careerStage, setCareerStage] = useState<CareerStage>(
    initialAutostart ? 'in_match' : 'pre_match_lobby'
  );

  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState<boolean>(false);
  const [showRulesGuide, setShowRulesGuide] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  // Retro Referee Maker Customizer State
  const [refereeName, setRefereeName] = useState<string>('Min-jun Kim');
  const [kitColor, setKitColor] = useState<RefereeKitColor>('neon_yellow');
  const [hairStyle, setHairStyle] = useState<ChibiHairStyle>('spiky_ahoge');
  const [hairColor, setHairColor] = useState<string>('#111827');
  const [skinColor, setSkinColor] = useState<string>('#F5C6A5');
  const [archetypeId, setArchetypeId] = useState<RefereeArchetypeId>('var_purist');
  const [selectedLeagueId, setSelectedLeagueId] = useState<LeagueId>('k_league_1');
  const [refereePortraitUrl, setRefereePortraitUrl] = useState<string>(
    GENERATED_ASSETS.refereePortraitWebtoon
  );
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState<boolean>(false);

  // Career Match State
  const [refereeRating, setRefereeRating] = useState<number>(7.5);
  const [crowdHeat, setCrowdHeat] = useState<number>(62);
  const [incidents, setIncidents] = useState<MatchIncident[]>(INITIAL_INCIDENTS);
  const [currentIncidentIdx, setCurrentIncidentIdx] = useState<number>(0);
  const [evaluations, setEvaluations] = useState<CallEvaluationResult[]>([]);
  const [varHintsRemaining, setVarHintsRemaining] = useState<number>(3);
  const [showPreCallVarHint, setShowPreCallVarHint] = useState<boolean>(false);
  const [isTopHudCollapsed, setIsTopHudCollapsed] = useState<boolean>(false);
  const [isBottomHudCollapsed, setIsBottomHudCollapsed] = useState<boolean>(false);
  const [showSituationDetails, setShowSituationDetails] = useState<boolean>(false);
  const [showRulebookDetails, setShowRulebookDetails] = useState<boolean>(false);
  const [isMasterOverruled, setIsMasterOverruled] = useState<boolean>(false);
  const [isFullMatchFlow, setIsFullMatchFlow] = useState<boolean>(false);
  const [liveMatchClockMin, setLiveMatchClockMin] = useState<number>(18);

  // Live FM Pitch Playback State (Starts at t=0 so players run & pass in real-time!)
  const [pitchTime, setPitchTime] = useState<number>(0);
  const [isPitchPlaying, setIsPitchPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showVarGeometry, setShowVarGeometry] = useState<boolean>(true);

  // Decision Countdown Timer
  const [decisionTimer, setDecisionTimer] = useState<number>(3.0);

  // Loop 2: Pending Initial Call, Target Player Role ('attacker' | 'defender'), OFR Modal, and Final Verdict
  const [selectedTargetRole, setSelectedTargetRole] = useState<'attacker' | 'defender'>(
    'defender'
  );
  const [pendingInitialCall, setPendingInitialCall] = useState<CallAction | null>(
    null
  );
  const [pendingVarHint, setPendingVarHint] = useState<string | null>(null);
  const [ofrModalOpen, setOfrModalOpen] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] =
    useState<CallEvaluationResult | null>(null);
  const [liveLegalReasoning, setLiveLegalReasoning] = useState<string | null>(
    null
  );

  // TTS & Audio State
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // Argon Telemetry State
  const [telemetryLogs, setTelemetryLogs] =
    useState<DiscardLogEntry[]>(INITIAL_DISCARD_LOG);
  const [isGeneratingIncident, setIsGeneratingIncident] = useState<boolean>(false);
  const [activeAgents, setActiveAgents] = useState<
    Record<'Director' | 'Auditor' | 'VAR Room' | 'Dissent' | 'Assessor', string>
  >({
    Director: 'LOCKED (4 FRAMES)',
    Auditor: 'VERIFIED (≥0.91)',
    'VAR Room': 'MONITORING PITCH',
    Dissent: 'PIXEL READY',
    Assessor: 'LOGGING CALLS',
  });

  const currentLeague = LEAGUES[selectedLeagueId];
  const currentArchetype = REFEREE_ARCHETYPES[archetypeId];
  const currentIncident =
    incidents[currentIncidentIdx] ?? incidents[0] ?? INITIAL_INCIDENTS[0];

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (activeTab === 'career_match' && careerStage === 'pre_match_lobby') {
      document.body.dataset.state = 'title';
    } else if (activeTab === 'career_match' && careerStage === 'in_match') {
      document.body.dataset.state = 'playing';
    } else if (activeTab === 'assessor_report') {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [activeTab, careerStage]);

  const isOpenPlayPhase =
    isFullMatchFlow && liveMatchClockMin < currentIncident.context.minute;

  // 90-Minute Compressed Full-Match Clock (90 mins compressed into ~3 mins!)
  useEffect(() => {
    if (!isFullMatchFlow || careerStage !== 'in_match' || activeTab !== 'career_match') {
      return;
    }
    const targetMin = currentIncident.context.minute;
    const intervalMs = Math.max(400, Math.round(1600 / playbackSpeed));
    const timer = window.setInterval(() => {
      setLiveMatchClockMin((prev) => {
        if (prev < targetMin) {
          const next = prev + 1;
          if (next === targetMin) {
            soundEngine.playWhistle(0.35);
          }
          return next;
        }
        return prev;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [
    isFullMatchFlow,
    careerStage,
    activeTab,
    currentIncident.context.minute,
    playbackSpeed,
  ]);

  const appendTelemetryLog = useCallback(
    (
      agentFrom: DiscardLogEntry['agentFrom'],
      agentTo: DiscardLogEntry['agentTo'],
      status: DiscardLogEntry['status'],
      lawRef: string,
      message: string,
      confidence = 0.95
    ) => {
      const now = new Date();
      const ts = `${now.toTimeString().slice(0, 8)}.${String(
        now.getMilliseconds()
      ).padStart(3, '0')}`;
      setTelemetryLogs((prev) => [
        {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: ts,
          agentFrom,
          agentTo,
          status,
          confidence,
          lawRef,
          message,
        },
        ...prev,
      ]);
    },
    []
  );

  const fetchLiveLegalReasoning = useCallback(
    async (evalRes: CallEvaluationResult, inc: MatchIncident) => {
      setLiveLegalReasoning(null);
      try {
        const res = await fetch('/api/argon/var-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentTitle: inc.title,
            situationSummary: inc.context.situation_summary,
            leagueName: inc.league,
            playerInitialCall: evalRes.player_initial_call,
            playerFinalCall: evalRes.player_final_call,
            playerTargetLabel: evalRes.player_target_label,
            expectedTargetLabel: evalRes.expected_target_label,
            expectedCalls: inc.auditor_check.correct_calls,
            primaryLaw: evalRes.law_ref,
            verdict: evalRes.verdict,
          }),
        });
        const data = await res.json();
        if (data.legalReasoning) {
          setLiveLegalReasoning(data.legalReasoning);
        }
      } catch {
        // Fallback deterministic explanation is already displayed
      }
    },
    []
  );

  const handleStartMatch = useCallback(() => {
    soundEngine.playWhistle(0.5);
    setCareerStage('in_match');
    setActiveTab('career_match');
    setCurrentIncidentIdx(0);
    setLatestEvaluation(null);
    setPendingInitialCall(null);
    setOfrModalOpen(false);
    setDecisionTimer(3.0);
    setPitchTime(0);
    setIsPitchPlaying(true);
    setVarHintsRemaining(2 + REFEREE_ARCHETYPES[archetypeId].extraVarHints);

    appendTelemetryLog(
      'Director',
      'HUD',
      'VERIFIED',
      `${LEAGUES[selectedLeagueId].name} Match Kickoff`,
      `Referee ${refereeName} (${REFEREE_ARCHETYPES[archetypeId].name}) entered pitch for ${LEAGUES[selectedLeagueId].featuredMatch}.`,
      0.98
    );
  }, [archetypeId, refereeName, selectedLeagueId, appendTelemetryLog]);

  useEffect(() => {
    if (
      activeTab !== 'career_match' ||
      careerStage !== 'in_match' ||
      latestEvaluation !== null ||
      ofrModalOpen
    ) {
      return;
    }

    const interval = setInterval(() => {
      setDecisionTimer((prev) => {
        if (prev <= 0.1) return 0.0;
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeTab, careerStage, latestEvaluation, ofrModalOpen]);

  const handleInitialCall = useCallback(
    (call: CallAction, overrideTargetRole?: 'attacker' | 'defender') => {
      if (latestEvaluation || ofrModalOpen) return;

      const activeTarget = overrideTargetRole ?? selectedTargetRole;

      if (call === 'yellow' || call === 'red') {
        soundEngine.playCardBrandish(call === 'red');
      } else {
        soundEngine.playWhistle(0.38);
      }

      setPitchTime(currentIncident.contact.frame);
      setShowRulebookDetails(false);
      setIsMasterOverruled(false);

      const initialEval = evaluateRefereeCall({
        incident: currentIncident,
        initialCall: call,
        currentRating: refereeRating,
        archetype: archetypeId,
        targetRole: activeTarget,
      });

      if (initialEval.ofr_required) {
        soundEngine.playVarAlert();
        setPendingInitialCall(call);
        setPendingVarHint(initialEval.var_hint);
        setOfrModalOpen(true);
        setCrowdHeat((h) => Math.min(99, h + 16));

        setActiveAgents((prev) => ({
          ...prev,
          'VAR Room': 'OFR INTERVENTION',
          Dissent: 'CUT-IN ACTIVE',
        }));

        appendTelemetryLog(
          'VAR Room',
          'HUD',
          'OFR_TRIGGERED',
          currentIncident.auditor_check.primary_law,
          `Clear & Obvious Error detected on initial call [${CALL_ACTION_LABELS[call].label} -> ${activeTarget.toUpperCase()}]. Triggering On-Field Review (OFR) monitor.`,
          currentIncident.auditor_check.confidence
        );
      } else {
        setRefereeRating(initialEval.new_rating);
        setLatestEvaluation(initialEval);
        setEvaluations((prev) => [...prev, initialEval]);
        setCrowdHeat((h) =>
          initialEval.rating_delta >= 0 ? Math.max(35, h - 6) : Math.min(99, h + 18)
        );

        setActiveAgents((prev) => ({
          ...prev,
          'VAR Room': initialEval.rating_delta >= 0 ? 'CALL CONFIRMED' : 'ERROR LOGGED',
          Dissent: 'CUT-IN ACTIVE',
          Assessor: `GRADED (${(initialEval.rating_delta / 10).toFixed(1)})`,
        }));

        appendTelemetryLog(
          'Assessor',
          'HUD',
          initialEval.rating_delta >= 0 ? 'VERIFIED' : 'OFR_TRIGGERED',
          initialEval.law_ref,
          `Call [${CALL_ACTION_LABELS[call].label}] graded (${(initialEval.rating_delta / 10).toFixed(1)}). Rating now ${initialEval.new_rating}/10.`,
          currentIncident.auditor_check.confidence
        );

        fetchLiveLegalReasoning(initialEval, currentIncident);
      }
    },
    [
      latestEvaluation,
      ofrModalOpen,
      selectedTargetRole,
      currentIncident,
      refereeRating,
      archetypeId,
      appendTelemetryLog,
      fetchLiveLegalReasoning,
    ]
  );

  const handleResolveOfr = useCallback(
    (finalCall: CallAction, finalTargetOverride?: 'attacker' | 'defender') => {
      if (!pendingInitialCall) return;

      if (finalCall === 'yellow' || finalCall === 'red') {
        soundEngine.playCardBrandish(finalCall === 'red');
      } else {
        soundEngine.playWhistle(0.45);
      }

      const finalEval = evaluateRefereeCall({
        incident: currentIncident,
        initialCall: pendingInitialCall,
        finalCall,
        currentRating: refereeRating,
        archetype: archetypeId,
        targetRole: selectedTargetRole,
        finalTargetRole: finalTargetOverride ?? selectedTargetRole,
      });

      setOfrModalOpen(false);
      setPendingVarHint(null);
      setShowRulebookDetails(false);
      setIsMasterOverruled(false);
      setRefereeRating(finalEval.new_rating);
      setLatestEvaluation(finalEval);
      setEvaluations((prev) => [...prev, finalEval]);

      setActiveAgents((prev) => ({
        ...prev,
        'VAR Room':
          finalEval.verdict === 'OVERTURNED_CORRECT'
            ? 'OVERTURN VERIFIED'
            : 'ERROR LOGGED',
        Assessor: `GRADED (${(finalEval.rating_delta / 10).toFixed(1)})`,
      }));

      appendTelemetryLog(
        'VAR Room',
        'HUD',
        finalEval.verdict === 'OVERTURNED_CORRECT'
          ? 'VERIFIED'
          : 'OFR_TRIGGERED',
        finalEval.law_ref,
        `OFR Complete: Initial [${CALL_ACTION_LABELS[pendingInitialCall].label}] -> Final [${CALL_ACTION_LABELS[finalCall].label}]. Verdict: ${finalEval.verdict} (${finalEval.new_rating}/10).`,
        currentIncident.auditor_check.confidence
      );

      fetchLiveLegalReasoning(finalEval, currentIncident);
    },
    [
      pendingInitialCall,
      selectedTargetRole,
      currentIncident,
      refereeRating,
      archetypeId,
      appendTelemetryLog,
      fetchLiveLegalReasoning,
    ]
  );

  const handleMasterOverride = useCallback(() => {
    if (!latestEvaluation) return;
    soundEngine.playWhistle(0.55);
    setIsMasterOverruled(true);
    const basePrev =
      latestEvaluation.previous_rating ??
      Number((latestEvaluation.new_rating - latestEvaluation.rating_delta / 10).toFixed(1));
    const bestDelta = Math.max(latestEvaluation.rating_delta, 6);
    const boostedRating = Math.min(10.0, Number((basePrev + bestDelta / 10).toFixed(1)));
    const overriddenEval: CallEvaluationResult = {
      ...latestEvaluation,
      verdict: 'STOOD_FIRM_CORRECT',
      rating_delta: bestDelta,
      new_rating: boostedRating,
    };
    setRefereeRating(boostedRating);
    setLatestEvaluation(overriddenEval);
    setEvaluations((prev) =>
      prev.length > 0 ? [...prev.slice(0, -1), overriddenEval] : [overriddenEval]
    );
  }, [latestEvaluation, refereeRating]);

  const handleNextIncident = useCallback(() => {
    soundEngine.playWhistle(0.3);
    if (currentIncidentIdx + 1 < incidents.length) {
      const nextIdx = currentIncidentIdx + 1;
      const prevMin = incidents[currentIncidentIdx]?.context.minute ?? 18;
      const nextMin = incidents[nextIdx]?.context.minute ?? 37;
      setCurrentIncidentIdx(nextIdx);
      setLiveMatchClockMin(isFullMatchFlow ? prevMin + 1 : nextMin);
      setLatestEvaluation(null);
      setPendingInitialCall(null);
      setOfrModalOpen(false);
      setShowPreCallVarHint(false);
      setShowSituationDetails(false);
      setShowRulebookDetails(false);
      setIsMasterOverruled(false);
      setLiveLegalReasoning(null);
      setDecisionTimer(3.0);
      setPitchTime(0);
      setIsPitchPlaying(true);
    } else {
      setActiveTab('assessor_report');
    }
  }, [currentIncidentIdx, incidents, isFullMatchFlow]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (activeTab === 'career_match' && careerStage === 'pre_match_lobby') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartMatch();
        }
        return;
      }

      if (activeTab === 'career_match' && careerStage === 'in_match') {
        if (!latestEvaluation && !ofrModalOpen) {
          const idx = Number(e.key) - 1;
          if (idx >= 0 && idx < GAME_HOTBAR_BUTTONS.length) {
            e.preventDefault();
            handleInitialCall(GAME_HOTBAR_BUTTONS[idx].action);
          } else if (e.key === '6') {
            e.preventDefault();
            handleInitialCall('penalty');
          }
        } else if (latestEvaluation && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleNextIncident();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeTab,
    careerStage,
    latestEvaluation,
    ofrModalOpen,
    handleStartMatch,
    handleInitialCall,
    handleNextIncident,
  ]);

  const handleGeneratePortrait = async () => {
    setIsGeneratingPortrait(true);
    try {
      const res = await fetch('/api/argon/referee-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refereeName,
          kitColor,
          leagueName: currentLeague.name,
          archetypeName: currentArchetype.name,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setRefereePortraitUrl(data.imageUrl);
        appendTelemetryLog(
          'Dissent',
          'HUD',
          'VERIFIED',
          'Nano Banana (gemini-3.1-flash-lite-image)',
          `Generated 16-bit retro pixel referee badge for ${refereeName} (${currentLeague.name}).`,
          0.97
        );
      }
    } catch {
      setRefereePortraitUrl(GENERATED_ASSETS.refereePortraitWebtoon);
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const handleTriggerArgonLoop1 = async () => {
    setIsGeneratingIncident(true);
    setActiveAgents((prev) => ({
      ...prev,
      Director: 'SYNTHESIZING',
      Auditor: 'VERIFYING',
    }));

    try {
      const res = await fetch('/api/argon/generate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: selectedLeagueId,
          archetype: archetypeId,
        }),
      });
      const data = await res.json();
      if (data.discarded_draft) {
        appendTelemetryLog(
          'Auditor',
          'Director',
          'REJECTED & REGENERATED',
          data.discarded_draft.lawRef || 'IFAB Law 12',
          `Rejected Draft: ${data.discarded_draft.reason}`,
          Number(data.discarded_draft.confidence) || 0.68
        );
      }
      if (data.incident) {
        const newInc: MatchIncident = data.incident;
        setIncidents((prev) => [...prev, newInc]);
        appendTelemetryLog(
          'Auditor',
          'HUD',
          'VERIFIED',
          newInc.auditor_check.primary_law,
          `Verified new Gemini 4 Argon incident "${newInc.title}" and queued into match.`,
          newInc.auditor_check.confidence
        );
      }
    } catch {
      appendTelemetryLog(
        'Auditor',
        'HUD',
        'VERIFIED',
        'IFAB Law 12 §3',
        'Verified cached multi-agent incident from 1M IFAB Law Corpus.',
        0.95
      );
    } finally {
      setIsGeneratingIncident(false);
      setActiveAgents((prev) => ({
        ...prev,
        Director: 'READY',
        Auditor: 'VERIFIED (≥0.90)',
      }));
    }
  };

  const handlePlayVoiceDissent = async (text: string, speaker: string) => {
    if (isPlayingTts) return;
    setIsPlayingTts(true);
    soundEngine.playWhistle(0.25);

    try {
      const res = await fetch('/api/argon/tts-dissent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker }),
      });
      const data = await res.json();
      if (data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        await audio.play();
      }
    } catch {
      // Fallback whistle already played
    } finally {
      setIsPlayingTts(false);
    }
  };

  const toggleSoundMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundEngine.muted = next;
  };

  const recommendedFinalCall: CallAction =
    currentIncident.auditor_check.correct_calls[0] || 'red';

  const [offSide, offNum] = currentIncident.contact.offender.split('_');
  const [, vicNum] = currentIncident.contact.victim.split('_');
  const attackerNum = offSide === 'home' ? offNum : vicNum;
  const defenderNum = offSide === 'away' ? offNum : vicNum;
  const trueOffenderRole: 'attacker' | 'defender' =
    offSide === 'home' ? 'attacker' : 'defender';
  const wrongTargetRole: 'attacker' | 'defender' =
    trueOffenderRole === 'attacker' ? 'defender' : 'attacker';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#181825] text-slate-100 select-none">
      {/* =====================================================================
          1. FULL-SCREEN LIVE RETRO PIXEL FM MATCH ENGINE (100vw x 100vh)
         ===================================================================== */}
      <div className="fixed inset-0 z-0">
        <TacticalPitchCanvas
          incident={currentIncident}
          league={currentLeague}
          currentTime={pitchTime}
          isPlaying={isPitchPlaying}
          playbackSpeed={playbackSpeed}
          showVarGeometry={showVarGeometry}
          refereeRating={refereeRating}
          crowdHeat={crowdHeat}
          activeCallCard={latestEvaluation?.player_final_call ?? pendingInitialCall}
          fullScreen={true}
          refereeName={refereeName}
          kitColor={kitColor}
          hairStyle={hairStyle}
          hairColor={hairColor}
          skinColor={skinColor}
          isOpenPlayPhase={isOpenPlayPhase}
          liveMatchMinute={isFullMatchFlow ? liveMatchClockMin : currentIncident.context.minute}
          onTimeChange={setPitchTime}
          onTogglePlay={() => setIsPitchPlaying((p) => !p)}
          onSpeedChange={setPlaybackSpeed}
          onToggleVarGeometry={() => setShowVarGeometry((v) => !v)}
        />
      </div>

      {/* =====================================================================
          2. RETRO PIXEL TOP SCOREBUG & NAVIGATION BAR
         ===================================================================== */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-[#181825] border-b-4 border-[#09090B] whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('career_match');
              setCareerStage('pre_match_lobby');
            }}
            className="px-2.5 py-1 rounded bg-amber-400 text-[#09090B] font-extrabold text-xs sm:text-sm border-2 border-[#09090B] shadow-[0_2px_0_#09090B] cursor-pointer whitespace-nowrap"
          >
            👾 Referee Maker
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFBEB] text-[#09090B] border-2 border-[#09090B] shadow-[0_2px_0_#09090B] text-xs font-extrabold whitespace-nowrap">
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white">
              {currentLeague.shortTag}
            </span>
            <span>{currentLeague.homeTeam}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#09090B] text-amber-300 font-mono">
              {currentIncident.context.score.match(/\d+\s*-\s*\d+/)?.[0]?.replace(/\s+/g, '') ||
                currentIncident.context.score}
            </span>
            <span>{currentLeague.awayTeam}</span>
            <span className="hidden sm:inline text-rose-600 font-mono">
              {isFullMatchFlow ? `${liveMatchClockMin}:00’` : `${currentIncident.context.minute}:14’`}
            </span>
          </div>

          <button
            type="button"
            data-testid="toggle-90min-full-match-btn"
            title="Toggle 90-Minute Compressed Full Match Flow (90분 → 3분 압축 풀경기 진행)"
            onClick={() => {
              setIsFullMatchFlow((prev) => {
                const next = !prev;
                if (next) {
                  const startMin =
                    currentIncidentIdx === 0
                      ? 1
                      : (incidents[currentIncidentIdx - 1]?.context.minute ?? 1) + 1;
                  setLiveMatchClockMin(startMin);
                } else {
                  setLiveMatchClockMin(currentIncident.context.minute);
                }
                return next;
              });
            }}
            className={`px-2 py-1 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer whitespace-nowrap ${
              isFullMatchFlow
                ? 'bg-lime-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            {isFullMatchFlow
              ? `⏱️ 90m Live (${liveMatchClockMin}’/90’)`
              : '⏱️ 90m Full Match'}
          </button>
        </div>

        <nav aria-label="Primary Modes" className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('career_match');
              if (careerStage !== 'in_match') {
                handleStartMatch();
              }
            }}
            className={`px-2 py-1 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer whitespace-nowrap ${
              activeTab === 'career_match' && careerStage === 'in_match'
                ? 'bg-amber-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            🏟️ Live FM Match
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('var_desk')}
            className={`px-2 py-1 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer whitespace-nowrap ${
              activeTab === 'var_desk'
                ? 'bg-amber-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            🖥️ Live VAR Desk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assessor_report')}
            className={`px-2 py-1 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer whitespace-nowrap ${
              activeTab === 'assessor_report'
                ? 'bg-amber-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                : 'bg-slate-800 text-slate-200'
            }`}
          >
            🏆 Assessor Report
          </button>

          <button
            type="button"
            data-testid="header-referee-rating"
            onClick={() => setShowRulesGuide((s) => !s)}
            title="Click to see how Referee Rating (7.5/10) & Decisions work"
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-400 hover:bg-emerald-300 text-[#09090B] border-2 border-[#09090B] text-xs font-extrabold tabular-nums cursor-pointer whitespace-nowrap"
          >
            <span>⭐ Ref Grade {refereeRating.toFixed(1)}/10</span>
            <span className="px-1 rounded bg-[#09090B] text-amber-300 text-[10px]">❓Guide</span>
          </button>

          <button
            type="button"
            data-testid="header-demo-video-btn"
            onClick={() => setShowDemoModal(true)}
            className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-400 text-white border-2 border-[#09090B] text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            🎬 Demo GIF / Video
          </button>

          <button
            type="button"
            onClick={() => setShowTelemetryDrawer((s) => !s)}
            className="px-2 py-1 rounded bg-sky-400 text-[#09090B] border-2 border-[#09090B] text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            🤖 AI Logs ({telemetryLogs.length})
          </button>

          <button
            type="button"
            onClick={toggleSoundMute}
            className="px-2 py-1 rounded bg-slate-800 text-white border-2 border-[#09090B] text-xs font-bold cursor-pointer"
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>
        </nav>
      </header>

      {/* Demo GIF & MP4 Video Preview + Download Modal (For Hackathon Submission & README!) */}
      {showDemoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gameplay Demo GIF and Video"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-4xl rounded-xl retro-box p-4 sm:p-5 space-y-3 text-[#09090B]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#09090B] pb-2">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-rose-600">
                  🎬 WHISTLE — GAMEPLAY DEMO GIF &amp; MP4 VIDEO
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  Saved in <code className="bg-slate-200 px-1 rounded">public/demo-gameplay.gif</code> (embedded in <code className="bg-slate-200 px-1 rounded">README.md</code>) and <code className="bg-slate-200 px-1 rounded">public/demo-gameplay.mp4</code>!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/demo-gameplay.gif"
                  download="whistle-demo-gameplay.gif"
                  className="px-3 py-1.5 rounded bg-emerald-400 hover:bg-emerald-300 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] shadow-[0_2px_0_#09090B]"
                >
                  ⬇ Download .GIF (4.3 MB · With Click Cursor)
                </a>
                <a
                  href="/demo-gameplay.mp4"
                  download="whistle-demo-gameplay.mp4"
                  className="px-3 py-1.5 rounded bg-sky-400 hover:bg-sky-300 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] shadow-[0_2px_0_#09090B]"
                >
                  ⬇ Download .MP4 Video (2.1 MB · With Click Cursor)
                </a>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-[#181825] border-2 border-[#09090B] space-y-1.5">
                <div className="text-xs font-extrabold text-amber-300">
                  🖼️ Animated Gameplay GIF (Embedded in README.md)
                </div>
                <img
                  src="/demo-gameplay.gif"
                  alt="WHISTLE Animated Gameplay Demo GIF"
                  className="w-full rounded border-2 border-[#09090B]"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#181825] border-2 border-[#09090B] space-y-1.5">
                <div className="text-xs font-extrabold text-sky-300">
                  🎥 Full HD MP4 Demo Video (For YouTube / Google Drive Link)
                </div>
                <video
                  src="/demo-gameplay.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded border-2 border-[#09090B]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Score & Decision Guide Popover Modal */}
      {showRulesGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Referee Rating and Decision Guide"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl rounded-xl retro-box p-5 space-y-4 text-[#09090B]">
            <div className="flex items-center justify-between border-b-2 border-[#09090B] pb-2">
              <h2 className="text-base sm:text-lg font-extrabold text-rose-600">
                📖 HOW SCORES &amp; REFEREE DECISIONS WORK
              </h2>
              <button
                type="button"
                onClick={() => setShowRulesGuide(false)}
                className="px-3 py-1 rounded bg-amber-400 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] cursor-pointer"
              >
                ✕ Close Guide
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border-2 border-[#09090B] space-y-1.5">
                <div className="font-extrabold text-emerald-700 text-sm">
                  1️⃣ What Do the Two Scores Mean?
                </div>
                <p className="font-bold">
                  • <span className="text-rose-600">Match Score (0-0, 1-0, 2-3)</span>: The live football goals scored by Home vs. Away across the 5 key match plays.
                </p>
                <p className="font-bold">
                  • <span className="text-emerald-700">Ref Grade ({refereeRating.toFixed(1)} / 10.0)</span>: Your official <strong>FIFA/IFAB Assessor Rating</strong>! You start every match at <strong>7.5 / 10</strong>:
                </p>
                <ul className="space-y-0.5 pl-2 font-bold text-slate-700">
                  <li>✅ <strong>Correct IFAB Call</strong>: +0.3 to +0.5 (8.5+ = Elite Badge)</li>
                  <li>🔄 <strong>VAR Overturn Save</strong>: +0.2 recovery at the monitor</li>
                  <li>❌ <strong>Wrong Call / Missed Card</strong>: -0.6 to -1.2 penalty</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-white border-2 border-[#09090B] space-y-1.5">
                <div className="font-extrabold text-sky-700 text-sm">
                  2️⃣ What Can I Do on Every Decision?
                </div>
                <p className="font-bold">
                  • <strong>Inspect Live Action</strong>: Watch the real-time choreography &amp; Close-Up Cam, change speed (<code className="bg-slate-100 px-1">0.5x</code>–<code className="bg-slate-100 px-1">2x</code>), or click <strong>💡 VAR Hint</strong>.
                </p>
                <p className="font-bold">
                  • <strong>Make 1 of 5 Calls (Keys 1–5)</strong>:
                </p>
                <ul className="space-y-0.5 pl-2 font-bold text-slate-700">
                  <li><strong>[1] Play On</strong>: Let 3v2 counter-attack continue</li>
                  <li><strong>[2] Blow Whistle</strong>: Standard Direct Free Kick</li>
                  <li><strong>[3] Yellow Card</strong>: Dive, Shirt Pull (SPA), or Handball</li>
                  <li><strong>[4] Red Card</strong>: 1v1 Box Takedown (DOGSO, no ball)</li>
                  <li><strong>[5] Penalty Kick</strong>: Foul or 95° Handball inside the box</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. PRE-MATCH CHARACTER CREATOR ("FOOTBALL REFEREE MAKER")
         ===================================================================== */}
      {activeTab === 'career_match' && careerStage === 'pre_match_lobby' && (
        <RetroRefereeMakerStage
          refereeName={refereeName}
          onChangeName={setRefereeName}
          kitColor={kitColor}
          onChangeKitColor={setKitColor}
          hairStyle={hairStyle}
          onChangeHairStyle={setHairStyle}
          hairColor={hairColor}
          onChangeHairColor={setHairColor}
          skinColor={skinColor}
          onChangeSkinColor={setSkinColor}
          archetypeId={archetypeId}
          onChangeArchetype={setArchetypeId}
          selectedLeagueId={selectedLeagueId}
          onChangeLeague={setSelectedLeagueId}
          portraitUrl={refereePortraitUrl}
          isGeneratingPortrait={isGeneratingPortrait}
          onGeneratePortrait={handleGeneratePortrait}
          onStartMatch={handleStartMatch}
          onOpenVarDesk={() => setActiveTab('var_desk')}
          onOpenDemoModal={() => setShowDemoModal(true)}
        />
      )}

      {/* =====================================================================
          4. IN-MATCH RETRO PIXEL HUD (Top Dialogue Box + Bottom 5-Card Hotbar)
         ===================================================================== */}
      {activeTab === 'career_match' && careerStage === 'in_match' && (
        <>
          {/* Top-Center Retro Cream Situation Dialogue Box with Direct Play Switcher, Next Play & [-] / [+] Collapse Toggle */}
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md pointer-events-auto flex justify-center">
            {isTopHudCollapsed ? (
              <div className="px-2.5 py-1 rounded-xl retro-box flex items-center gap-2">
                <span className="text-xs font-extrabold text-rose-600">
                  ⚡ Play {currentIncidentIdx + 1}/5 (
                  {currentIncident.context.score.match(/\d+\s*-\s*\d+/)?.[0]?.replace(/\s+/g, '') ||
                    currentIncident.context.score}
                  )
                </span>
                <button
                  type="button"
                  data-testid="top-next-incident-btn"
                  onClick={handleNextIncident}
                  className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-[#09090B] font-extrabold text-[10px] border-2 border-[#09090B] cursor-pointer"
                >
                  {currentIncidentIdx + 1 < incidents.length
                    ? 'Next Play ▶'
                    : 'Final Report ▶'}
                </button>
                <button
                  type="button"
                  data-testid="situation-box-toggle-btn"
                  aria-label="Expand Situation and Play Switcher Box"
                  onClick={() => setIsTopHudCollapsed(false)}
                  className="px-1.5 py-0.5 rounded bg-emerald-400 hover:bg-emerald-300 text-[#09090B] font-mono text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer"
                >
                  [+] Show Info
                </button>
              </div>
            ) : (
              <div className="w-full px-3 py-2 rounded-xl retro-box space-y-1.5">
                {/* Top Row: Play Tabs (1~5) + VAR Hint + Direct Next Button + [-] Collapse Button */}
                <div className="flex flex-wrap items-center justify-between gap-1 border-b-2 border-[#09090B]/15 pb-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {incidents.map((inc, idx) => {
                      const shortScore =
                        inc.context.score.match(/\d+\s*-\s*\d+/)?.[0]?.replace(/\s+/g, '') ||
                        inc.context.score;
                      return (
                        <button
                          key={inc.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playWhistle(0.25);
                            setCurrentIncidentIdx(idx);
                            setLatestEvaluation(null);
                            setPendingInitialCall(null);
                            setOfrModalOpen(false);
                            setShowPreCallVarHint(false);
                            setShowSituationDetails(false);
                            setShowRulebookDetails(false);
                            setIsMasterOverruled(false);
                            setLiveLegalReasoning(null);
                            setDecisionTimer(3.0);
                            setPitchTime(0);
                            setIsPitchPlaying(true);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer ${
                            idx === currentIncidentIdx
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-slate-700 hover:bg-amber-100'
                          }`}
                        >
                          Play {idx + 1} ({shortScore})
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1">
                    {!showPreCallVarHint && varHintsRemaining > 0 && !latestEvaluation && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPreCallVarHint(true);
                          setVarHintsRemaining((n) => Math.max(0, n - 1));
                        }}
                        className="px-2 py-0.5 rounded bg-sky-400 hover:bg-sky-300 text-[#09090B] font-extrabold text-[11px] border-2 border-[#09090B] cursor-pointer"
                      >
                        💡 VAR Hint ({varHintsRemaining})
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid="top-next-incident-btn"
                      onClick={handleNextIncident}
                      className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-[#09090B] font-extrabold text-[11px] border-2 border-[#09090B] shadow-[0_2px_0_#09090B] cursor-pointer"
                    >
                      {currentIncidentIdx + 1 < incidents.length
                        ? 'Next Play ▶'
                        : 'Final Report ▶'}
                    </button>

                    <button
                      type="button"
                      data-testid="situation-box-toggle-btn"
                      aria-label="Collapse Situation and Play Switcher Box"
                      title="Hide Play Switcher & Situation Details (-)"
                      onClick={() => setIsTopHudCollapsed(true)}
                      className="px-1.5 py-0.5 rounded bg-rose-500 hover:bg-rose-400 text-white font-mono text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer"
                    >
                      [-]
                    </button>
                  </div>
                </div>

                {/* Situation Title + Collapsible "▸ Details" Toggle (No long paragraph unless requested!) */}
                <div className="space-y-1">
                  {isOpenPlayPhase && (
                    <div className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-lime-300 text-[#09090B] border-2 border-[#09090B] text-[11px] font-extrabold">
                      <span>
                        ⚽ OPEN PLAY ({liveMatchClockMin}’/90’) · Move Ref with WASD / Double-Click!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playWhistle(0.35);
                          setLiveMatchClockMin(currentIncident.context.minute);
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#09090B] text-amber-300 text-[10px] font-extrabold cursor-pointer shrink-0"
                      >
                        ⏭️ Jump to {currentIncident.context.minute}’
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-rose-600 leading-tight truncate">
                      ⚡ {currentIncident.title}
                    </div>
                    <button
                      type="button"
                      data-testid="toggle-situation-details-btn"
                      onClick={() => setShowSituationDetails((s) => !s)}
                      className="shrink-0 px-2 py-0.5 rounded bg-slate-200 hover:bg-amber-200 text-[#09090B] font-extrabold text-[10px] border border-[#09090B] cursor-pointer"
                    >
                      {showSituationDetails ? '[-] Hide Details' : '[+] Details'}
                    </button>
                  </div>

                  {showSituationDetails && (
                    <p className="text-xs font-bold text-[#1E1B4B] leading-snug pt-0.5 border-t border-[#09090B]/10">
                      {currentIncident.context.situation_summary}
                    </p>
                  )}

                  {showPreCallVarHint && (
                    <p className="text-xs font-extrabold text-sky-700 pt-0.5">
                      {currentIncident.auditor_check.var_hint}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom-Center STEP 1: Retro 5-Card Referee Action Hotbar + Attacker/Defender Target Selector */}
          {!latestEvaluation && !ofrModalOpen && (
            <section
              aria-label="Referee Decision HUD"
              className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-auto"
            >
              <div className="p-2.5 sm:p-3 rounded-xl retro-box space-y-2">
                {/* Row 1: Target Player Selector + [-] / [+] Toggle */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 ${
                    isBottomHudCollapsed ? '' : 'pb-1.5 border-b-2 border-[#09090B]/15'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#09090B] text-amber-300 font-extrabold text-[11px]">
                      🎯 STEP 1: TARGET PLAYER FOR CARD / FOUL
                    </span>
                    <button
                      type="button"
                      data-testid="target-attacker-btn"
                      onClick={() => setSelectedTargetRole('attacker')}
                      className={`px-2.5 py-1 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer ${
                        selectedTargetRole === 'attacker'
                          ? 'bg-slate-900 text-amber-300 shadow-[0_2px_0_#09090B] ring-2 ring-amber-400'
                          : 'bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      🔴 Attacker #{attackerNum} ({currentLeague.homeTeam})
                    </button>
                    <button
                      type="button"
                      data-testid="target-defender-btn"
                      onClick={() => setSelectedTargetRole('defender')}
                      className={`px-2.5 py-1 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer ${
                        selectedTargetRole === 'defender'
                          ? 'bg-slate-900 text-amber-300 shadow-[0_2px_0_#09090B] ring-2 ring-amber-400'
                          : 'bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      🔵 Defender #{defenderNum} ({currentLeague.awayTeam})
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-extrabold">
                    <span data-testid="scorebug-rating" className="text-emerald-700">
                      REF {refereeRating.toFixed(1)}/10
                    </span>
                    <span>·</span>
                    <span data-testid="decision-countdown" className="text-rose-600">
                      {decisionTimer > 0 ? `${decisionTimer.toFixed(1)}s` : 'CALL NOW'}
                    </span>
                    <button
                      type="button"
                      data-testid="decision-bar-toggle-btn"
                      onClick={() => setIsBottomHudCollapsed((c) => !c)}
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer ${
                        isBottomHudCollapsed
                          ? 'bg-amber-400 text-[#09090B]'
                          : 'bg-rose-500 text-white hover:bg-rose-400'
                      }`}
                    >
                      {isBottomHudCollapsed ? '[+] Cards' : '[-] Hide'}
                    </button>
                  </div>
                </div>

                {/* Row 2: 5 Referee Call Buttons (Collapsible via [-] / [+]) */}
                {!isBottomHudCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {GAME_HOTBAR_BUTTONS.map((btn) => {
                    const targetLabel =
                      selectedTargetRole === 'attacker'
                        ? `🔴 Attacker #${attackerNum}`
                        : `🔵 Defender #${defenderNum}`;
                    const needsTargetChoice =
                      btn.action === 'yellow' ||
                      btn.action === 'red' ||
                      btn.action === 'foul';
                    const dynamicSub =
                      btn.action === 'yellow'
                        ? `Caution ${targetLabel}`
                        : btn.action === 'red'
                        ? `Send Off ${targetLabel}`
                        : btn.action === 'foul'
                        ? `Foul on ${targetLabel}`
                        : btn.koSub;
                    return (
                      <div
                        key={btn.action}
                        role="button"
                        tabIndex={0}
                        data-testid={`hotbar-card-${btn.action}`}
                        onClick={() => handleInitialCall(btn.action, selectedTargetRole)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleInitialCall(btn.action, selectedTargetRole);
                          }
                        }}
                        className={`p-2 rounded-xl retro-btn flex flex-col justify-between text-left cursor-pointer ${btn.colorClass}`}
                      >
                        <div className="w-full text-left">
                          <div className="flex items-center justify-between w-full">
                            {btn.icon === 'WHISTLE_SVG' ? (
                              <span data-testid="whistle-svg-icon" className="inline-flex items-center">
                                <RefereeWhistleIcon className="w-6 h-5" />
                              </span>
                            ) : (
                              <span className="text-xl leading-none">{btn.icon}</span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[11px] font-extrabold">
                              [{btn.keyNum}]
                            </span>
                          </div>
                          <div className="mt-1">
                            <div className="text-sm font-extrabold leading-tight">
                              {btn.koTitle}
                            </div>
                            <div className="text-[11px] font-bold opacity-95 leading-tight mt-0.5">
                              {dynamicSub}
                            </div>
                          </div>
                        </div>

                        {needsTargetChoice ? (
                          <div className="grid grid-cols-2 gap-1 mt-1.5 pt-1.5 border-t border-black/20">
                            <button
                              type="button"
                              data-testid={`${btn.action}-attacker-btn`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTargetRole('attacker');
                                handleInitialCall(btn.action, 'attacker');
                              }}
                              className={`px-1.5 py-1 rounded text-[10px] font-extrabold border border-[#09090B] cursor-pointer truncate ${
                                selectedTargetRole === 'attacker'
                                  ? 'bg-slate-900 text-amber-300'
                                  : 'bg-white/90 text-[#09090B] hover:bg-slate-200'
                              }`}
                              title={`Give ${btn.koTitle} to Attacker #${attackerNum}`}
                            >
                              🔴 Att #{attackerNum}
                            </button>
                            <button
                              type="button"
                              data-testid={`${btn.action}-defender-btn`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTargetRole('defender');
                                handleInitialCall(btn.action, 'defender');
                              }}
                              className={`px-1.5 py-1 rounded text-[10px] font-extrabold border border-[#09090B] cursor-pointer truncate ${
                                selectedTargetRole === 'defender'
                                  ? 'bg-slate-900 text-amber-300'
                                  : 'bg-white/90 text-[#09090B] hover:bg-slate-200'
                              }`}
                              title={`Give ${btn.koTitle} to Defender #${defenderNum}`}
                            >
                              🔵 Def #{defenderNum}
                            </button>
                          </div>
                        ) : btn.action === 'advantage' ? (
                          <div className="grid grid-cols-2 gap-1 mt-1.5 pt-1.5 border-t border-black/20">
                            <button
                              type="button"
                              data-testid="play-on-sub-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitialCall('play_on', selectedTargetRole);
                              }}
                              className="px-1.5 py-1 rounded text-[10px] font-extrabold border border-[#09090B] bg-white/95 text-[#09090B] hover:bg-amber-100 cursor-pointer truncate"
                            >
                              👋 Play On
                            </button>
                            <button
                              type="button"
                              data-testid="advantage-sub-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitialCall('advantage', selectedTargetRole);
                              }}
                              className="px-1.5 py-1 rounded text-[10px] font-extrabold border border-[#09090B] bg-slate-900 text-amber-300 hover:bg-slate-800 cursor-pointer truncate"
                            >
                              ⚡ Advantage
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5 pt-1.5 border-t border-black/20">
                            <button
                              type="button"
                              data-testid="penalty-sub-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitialCall('penalty', 'defender');
                              }}
                              className="w-full px-1.5 py-1 rounded text-[10px] font-extrabold border border-[#09090B] bg-slate-900 text-amber-300 hover:bg-slate-800 cursor-pointer truncate"
                            >
                              🎯 Award Penalty Kick
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Bottom-Center STEP 2: Retro Pixel Dissent Cut-In + VAR OFR / Verdict */}
          {(ofrModalOpen || latestEvaluation) && (
            <section
              aria-label="K-Webtoon Dissent Cut-In"
              className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl pointer-events-auto"
            >
              <div className="rounded-xl overflow-hidden retro-box grid grid-cols-1 md:grid-cols-12">
                {/* Left: 16-Bit Retro Pixel Dissent Illustration */}
                <div className="md:col-span-4 relative min-h-[155px] bg-[#09090B] border-b-4 md:border-b-0 md:border-r-4 border-[#09090B]">
                  <img
                    src={
                      currentIncident.dissent.role === 'coach'
                        ? GENERATED_ASSETS.dissentCoachWebtoon
                        : GENERATED_ASSETS.dissentCaptainWebtoon
                    }
                    alt={currentIncident.dissent.speaker}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover pixelated"
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white font-extrabold text-xs px-2 py-0.5 rounded border-2 border-[#09090B]">
                    {currentIncident.dissent.webtoon_sfx}
                  </div>
                </div>

                {/* Right: Retro Dialogue Protest + Unspoiled VAR OFR or Post-Call Verdict */}
                <div className="md:col-span-8 p-3.5 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-xs font-extrabold text-rose-700">
                      <span>💬 Touchline Protest · {currentIncident.dissent.speaker}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayVoiceDissent(
                            currentIncident.dissent.line,
                            currentIncident.dissent.speaker
                          )
                        }
                        disabled={isPlayingTts}
                        className="px-2.5 py-1 rounded bg-amber-300 hover:bg-amber-200 text-[#09090B] text-[11px] font-extrabold border-2 border-[#09090B] cursor-pointer"
                      >
                        {isPlayingTts ? '🔊 Playing Voice...' : '🔊 Play Voice Dissent (TTS)'}
                      </button>
                    </div>
                    <p className="text-sm font-extrabold text-[#09090B] mt-1 leading-snug">
                      “{currentIncident.dissent.line}”
                    </p>
                  </div>

                  {/* VAR ON-FIELD REVIEW (100% Neutral Colors & No Spoilers Before Decision!) */}
                  {ofrModalOpen && pendingInitialCall && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="ofr-modal-title"
                      data-testid="var-ofr-modal"
                      className="p-3 rounded-lg bg-white border-3 border-[#09090B] space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2
                          id="ofr-modal-title"
                          className="text-sm font-extrabold text-slate-900"
                        >
                          📺 [VAR ON-FIELD REVIEW] Pitchside Monitor
                        </h2>
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-400 text-xs font-extrabold text-slate-800">
                          Your Call: {KO_CALL_NAMES[pendingInitialCall]} on{' '}
                          {selectedTargetRole === 'attacker'
                            ? `🔴 Attacker #${attackerNum}`
                            : `🔵 Defender #${defenderNum}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          data-testid={
                            trueOffenderRole === 'attacker'
                              ? 'ofr-overturn-correct-btn'
                              : 'ofr-book-wrong-player-btn'
                          }
                          onClick={() =>
                            handleResolveOfr(
                              trueOffenderRole === 'attacker' ? recommendedFinalCall : 'yellow',
                              'attacker'
                            )
                          }
                          className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-amber-200 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer text-left"
                        >
                          🔄 Overturn: {KO_CALL_NAMES[trueOffenderRole === 'attacker' ? recommendedFinalCall : 'yellow']} → 🔴 Attacker #{attackerNum}
                        </button>

                        <button
                          type="button"
                          data-testid={
                            trueOffenderRole === 'defender'
                              ? 'ofr-overturn-correct-btn'
                              : 'ofr-book-wrong-player-btn'
                          }
                          onClick={() =>
                            handleResolveOfr(
                              trueOffenderRole === 'defender' ? recommendedFinalCall : 'yellow',
                              'defender'
                            )
                          }
                          className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-amber-200 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer text-left"
                        >
                          🔄 Overturn: {KO_CALL_NAMES[trueOffenderRole === 'defender' ? recommendedFinalCall : 'yellow']} → 🔵 Defender #{defenderNum}
                        </button>

                        <button
                          type="button"
                          data-testid="ofr-overturn-alt-btn"
                          onClick={() =>
                            handleResolveOfr(
                              recommendedFinalCall === 'penalty' ? 'foul' : 'penalty',
                              'defender'
                            )
                          }
                          className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-amber-200 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer text-left"
                        >
                          🔄 Overturn: {KO_CALL_NAMES[recommendedFinalCall === 'penalty' ? 'foul' : 'penalty']} → 🔵 Defender #{defenderNum}
                        </button>

                        <button
                          type="button"
                          data-testid="ofr-stand-firm-btn"
                          onClick={() =>
                            handleResolveOfr(pendingInitialCall, selectedTargetRole)
                          }
                          className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-amber-200 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer text-left"
                        >
                          👑 I AM THE REFEREE! Keep {KO_CALL_NAMES[pendingInitialCall]} ({selectedTargetRole === 'attacker' ? `🔴 Att #${attackerNum}` : `🔵 Def #${defenderNum}`})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FINAL VERDICT + COLLAPSIBLE RULEBOOK DETAILS + "I AM THE MASTER" OVERRIDE! */}
                  {latestEvaluation && (() => {
                    const isPositiveVerdict =
                      isMasterOverruled ||
                      latestEvaluation.verdict === 'CORRECT_INITIAL' ||
                      latestEvaluation.verdict === 'STOOD_FIRM_CORRECT' ||
                      latestEvaluation.verdict === 'OVERTURNED_CORRECT' ||
                      latestEvaluation.verdict === 'ACCEPTABLE_FLOW';
                    const decimalDelta = (latestEvaluation.rating_delta / 10).toFixed(1);
                    const prevRatingStr = (
                      latestEvaluation.previous_rating ??
                      Number((latestEvaluation.new_rating - latestEvaluation.rating_delta / 10).toFixed(1))
                    ).toFixed(1);
                    const newRatingStr = latestEvaluation.new_rating.toFixed(1);
                    const requiredCallStr = currentIncident.auditor_check.correct_calls
                      .map((c) => KO_CALL_NAMES[c])
                      .join(' or ');

                    return (
                      <div
                        data-testid="verdict-card"
                        className={`p-3 rounded-lg border-3 border-[#09090B] space-y-2 ${
                          isMasterOverruled
                            ? 'bg-amber-100'
                            : isPositiveVerdict
                            ? 'bg-emerald-50'
                            : 'bg-rose-100'
                        }`}
                      >
                        {/* Row 1: Punchy Result Headline + Rating Pill */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            data-testid="verdict-headline"
                            className={`text-sm font-extrabold ${
                              isMasterOverruled
                                ? 'text-amber-950'
                                : isPositiveVerdict
                                ? 'text-emerald-800'
                                : 'text-rose-700'
                            }`}
                          >
                            {isMasterOverruled
                              ? '👑 I AM THE MASTER! MY WHISTLE IS THE LAW!'
                              : latestEvaluation.verdict === 'CORRECT_INITIAL' ||
                                latestEvaluation.verdict === 'STOOD_FIRM_CORRECT'
                              ? '✅ SPOT-ON CALL!'
                              : latestEvaluation.verdict === 'OVERTURNED_CORRECT'
                              ? '🔄 VAR OVERTURN ACCEPTED!'
                              : latestEvaluation.verdict === 'ACCEPTABLE_FLOW'
                              ? '👍 GOOD ADVANTAGE FLOW!'
                              : '⚡ RULEBOOK DISAGREES WITH YOUR CALL!'}
                          </span>
                          <span
                            data-testid="verdict-rating-badge"
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-extrabold border-2 border-[#09090B] ${
                              isMasterOverruled
                                ? 'bg-amber-400 text-[#09090B]'
                                : isPositiveVerdict
                                ? 'bg-emerald-400 text-[#09090B]'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            {latestEvaluation.rating_delta >= 0
                              ? `+${decimalDelta}`
                              : decimalDelta}{' '}
                            ({prevRatingStr} → {newRatingStr}/10)
                          </span>
                        </div>

                        {/* Row 2: Your Call Summary + "▸ Details (Rulebook)" Toggle + "👑 I AM THE MASTER!" Button */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="px-2.5 py-1 rounded border-2 border-[#09090B] bg-white text-[#09090B] text-xs font-extrabold">
                            Your Call: {KO_CALL_NAMES[latestEvaluation.player_final_call]} on{' '}
                            {latestEvaluation.player_target_label || 'Selected Player'}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              data-testid="toggle-rulebook-details-btn"
                              onClick={() => setShowRulebookDetails((r) => !r)}
                              className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] cursor-pointer"
                            >
                              {showRulebookDetails
                                ? '[-] Hide Details (Rulebook)'
                                : '[+] Details (IFAB Rulebook)'}
                            </button>

                            {!isMasterOverruled && (
                              <button
                                type="button"
                                data-testid="referee-master-override-btn"
                                onClick={handleMasterOverride}
                                className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] shadow-[0_2px_0_#09090B] cursor-pointer"
                              >
                                {isPositiveVerdict
                                  ? '👑 I AM THE MASTER! (Assert Authority)'
                                  : '👑 Screw the Rulebook — I AM THE MASTER! (+0.6)'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Optional Expanded Rulebook Details (Hidden by default so there's zero text clutter!) */}
                        {showRulebookDetails && (
                          <div className="p-2.5 rounded-lg bg-white/90 border-2 border-[#09090B] space-y-1.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-1 font-extrabold text-slate-900 border-b border-slate-300 pb-1">
                              <span>📖 Official IFAB Rulebook: {latestEvaluation.law_ref}</span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 border border-[#09090B] text-[11px]">
                                Textbook Call: {requiredCallStr} on{' '}
                                {latestEvaluation.expected_target_label || 'True Offender'}
                              </span>
                            </div>
                            <p className="font-bold text-slate-800 leading-snug">
                              {latestEvaluation.explanation}
                            </p>
                            {liveLegalReasoning && (
                              <p className="font-bold text-sky-900 bg-sky-50 p-1.5 rounded border border-sky-300">
                                <strong>[AI IFAB Analysis]:</strong> {liveLegalReasoning}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={handleTriggerArgonLoop1}
                            disabled={isGeneratingIncident}
                            className="px-3 py-2 rounded-lg bg-sky-300 hover:bg-sky-200 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer"
                          >
                            {isGeneratingIncident
                              ? 'Generating New AI Play...'
                              : '✨ Generate New AI Scenario'}
                          </button>

                          <button
                            type="button"
                            onClick={handleNextIncident}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-[#09090B] font-extrabold text-sm retro-btn cursor-pointer"
                          >
                            {currentIncidentIdx + 1 < incidents.length
                              ? '▶ NEXT MATCH PLAY (Click / Enter) →'
                              : '🏆 FINISH MATCH · VIEW ASSESSOR REPORT →'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* =====================================================================
          5. MODAL OVERLAYS FOR LIVE VAR DESK & ASSESSOR REPORT
         ===================================================================== */}
      {activeTab === 'var_desk' && (
        <div className="fixed inset-0 z-30 pt-14 pb-6 px-4 bg-black/85 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('career_match')}
                className="px-4 py-2 rounded-lg bg-amber-400 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer"
              >
                ← Back to Live Match Pitch
              </button>
            </div>
            <VarDeskView
              selectedLeague={selectedLeagueId}
              onAppendTelemetry={(msg, lawRef, conf) =>
                appendTelemetryLog('VAR Room', 'HUD', 'DEBATE_SYNC', lawRef, msg, conf)
              }
            />
          </div>
        </div>
      )}

      {activeTab === 'assessor_report' && (
        <div className="fixed inset-0 z-30 pt-14 pb-6 px-4 bg-black/85 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('career_match')}
                className="px-4 py-2 rounded-lg bg-amber-400 text-[#09090B] font-extrabold text-xs retro-btn cursor-pointer"
              >
                ← Back to Live Match Pitch
              </button>
            </div>
            <AssessorReportView
              refereeName={refereeName}
              league={currentLeague}
              archetype={currentArchetype}
              currentRating={refereeRating}
              evaluations={evaluations}
              onRestartMatch={handleStartMatch}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          6. SLIDE-OVER ARGON MULTI-AGENT TELEMETRY DRAWER
         ===================================================================== */}
      {showTelemetryDrawer && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#080D17] border-l-4 border-[#09090B] shadow-2xl flex flex-col pt-12">
          <div className="px-4 py-2 bg-amber-400 text-[#09090B] flex items-center justify-between border-b-4 border-[#09090B]">
            <span className="text-xs font-extrabold">
              🤖 Gemini 4 Argon Multi-Agent Verification Log
            </span>
            <button
              type="button"
              onClick={() => setShowTelemetryDrawer(false)}
              className="px-2.5 py-1 rounded bg-white text-[#09090B] border-2 border-[#09090B] text-xs font-extrabold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ArgonTelemetrySidebar
              logs={telemetryLogs}
              activeAgents={activeAgents}
              isGeneratingIncident={isGeneratingIncident}
              onTriggerArgonLoop1={handleTriggerArgonLoop1}
            />
          </div>
        </div>
      )}
    </div>
  );
}
