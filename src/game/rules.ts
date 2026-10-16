export type RefereeKitColor = 'neon_yellow' | 'classic_black' | 'cyber_pink';

export type RefereeArchetypeId = 'strict' | 'flow' | 'var_purist';

export type LeagueId =
  | 'k_league_1'
  | 'premier_league'
  | 'laliga'
  | 'bundesliga'
  | 'serie_a'
  | 'ligue_1';

export type CallAction =
  | 'play_on'
  | 'foul'
  | 'advantage'
  | 'yellow'
  | 'red'
  | 'penalty';

export interface PlayerCoord {
  id: number;
  x: number; // 0..105 meters (or normalized 0..100 pitch x)
  y: number; // 0..68 meters
  role?: 'GK' | 'DEF' | 'MID' | 'FWD';
  name?: string;
}

export interface PitchFrame {
  t: number; // 0..30 frame index
  ball: [number, number];
  home: PlayerCoord[];
  away: PlayerCoord[];
}

export interface IncidentContact {
  frame: number;
  offender: string; // e.g., "away_4"
  victim: string; // e.g., "home_9"
  type:
    | 'tackle_from_behind_no_ball'
    | 'late_sliding_tackle'
    | 'tactical_shirt_pull'
    | 'simulation_dive'
    | 'unnatural_handball_in_box'
    | 'shoulder_charge_legal'
    | 'advantage_through_ball_foul';
  in_box: boolean;
  dogso: boolean;
  attempt_at_ball?: boolean;
}

export interface AuditorCheck {
  status: 'VERIFIED' | 'REJECTED';
  confidence: number;
  correct_calls: CallAction[];
  acceptable_secondary_calls?: CallAction[];
  primary_law: string;
  law_quote: string;
  var_hint: string;
  explanation: string;
}

export interface DissentData {
  speaker: string;
  role: 'captain' | 'coach';
  webtoon_sfx: string;
  line: string;
  line_ko?: string;
  line_en?: string;
}

export interface MatchIncident {
  id: string;
  league: string;
  leagueId: LeagueId;
  title: string;
  context: {
    minute: number;
    score: string;
    match: string;
    homeTeam: string;
    awayTeam: string;
    prior_cards: Record<string, 'yellow' | 'red'>;
    situation_summary: string;
  };
  frames: PitchFrame[];
  contact: IncidentContact;
  auditor_check: AuditorCheck;
  dissent: DissentData;
}

export interface DiscardLogEntry {
  id: string;
  timestamp: string;
  agentFrom: 'Director' | 'Auditor' | 'VAR Room' | 'Dissent' | 'Assessor';
  agentTo: 'Director' | 'Auditor' | 'VAR Room' | 'Dissent' | 'Assessor' | 'HUD';
  status: 'REJECTED & REGENERATED' | 'VERIFIED' | 'CACHE_HIT' | 'OFR_TRIGGERED' | 'DEBATE_SYNC';
  confidence: number;
  lawRef: string;
  message: string;
}

export interface CallEvaluationResult {
  incident_id: string;
  player_initial_call: CallAction;
  ofr_required: boolean;
  ofr_triggered?: boolean;
  var_hint: string;
  player_final_call: CallAction;
  verdict:
    | 'CORRECT_INITIAL'
    | 'ACCEPTABLE_FLOW'
    | 'OVERTURNED_CORRECT'
    | 'STOOD_FIRM_CORRECT'
    | 'CLEAR_ERROR_UNCORRECTED'
    | 'INCORRECT_CALL';
  law_ref: string;
  law_quote: string;
  explanation: string;
  rating_delta: number;
  previous_rating?: number;
  new_rating: number;
  player_target_label?: string;
  expected_target_label?: string;
  crowd_heat_delta: number;
  dissent: DissentData;
}

export interface LeagueConfig {
  id: LeagueId;
  name: string;
  countryCode: string;
  shortTag: string;
  featuredMatch: string;
  homeTeam: string;
  awayTeam: string;
  homeColor: string;
  awayColor: string;
  scorebugBg: string;
  scorebugAccent: string;
  scorebugText: string;
  physicalityTolerance: 'Low' | 'Medium' | 'High';
  tacticalStyle: string;
  culturalDissentStyle: string;
  defaultSfx: string;
}

export interface ArchetypeConfig {
  id: RefereeArchetypeId;
  name: string;
  subtitle: string;
  description: string;
  foulBonusDelta: number;
  advantageBonusDelta: number;
  extraVarHints: number;
  promptDirective: string;
}

export const REFEREE_ARCHETYPES: Record<RefereeArchetypeId, ArchetypeConfig> = {
  strict: {
    id: 'strict',
    name: 'Strict Disciplinarian',
    subtitle: 'Zero tolerance for tactical fouls & dissent',
    description: 'High authority, lower foul threshold, +0.2 rating bonus on accurate Yellow/Red disciplinary calls.',
    foulBonusDelta: 0.2,
    advantageBonusDelta: 0,
    extraVarHints: 0,
    promptDirective:
      'Referee enforces strict IFAB Law 12 thresholds. Penalize tactical shirt pulls and reckless challenges immediately with cards.',
  },
  flow: {
    id: 'flow',
    name: 'Flow & Advantage',
    subtitle: 'High tempo & physical contact tolerance',
    description: 'Allows upper-body duels to play on, +0.3 rating bonus on well-timed Advantage & Play On calls.',
    foulBonusDelta: 0,
    advantageBonusDelta: 0.3,
    extraVarHints: 0,
    promptDirective:
      'Referee prioritizes match tempo and IFAB Law 5 Advantage clause. Reward continuous attacking transitions unless a clear foul occurs.',
  },
  var_purist: {
    id: 'var_purist',
    name: 'VAR Protocol Purist',
    subtitle: 'Forensic IFAB geometry & frame precision',
    description: '+1 extra pre-call VAR tactical geometry hint per match and reduced penalty on On-Field Review overturns.',
    foulBonusDelta: 0.1,
    advantageBonusDelta: 0.1,
    extraVarHints: 1,
    promptDirective:
      'Referee adheres strictly to IFAB VAR Protocol — Clear and Obvious Error threshold and forensic penalty-box contact frames.',
  },
};

export const LEAGUES: Record<LeagueId, LeagueConfig> = {
  k_league_1: {
    id: 'k_league_1',
    name: 'K League 1',
    countryCode: 'KR',
    shortTag: 'KLEAGUE',
    featuredMatch: 'FC Seoul vs Ulsan HD',
    homeTeam: 'FC SEOUL',
    awayTeam: 'ULSAN HD',
    homeColor: '#DC2626',
    awayColor: '#1D4ED8',
    scorebugBg: '#0B1528',
    scorebugAccent: '#E11D48',
    scorebugText: '#F8FAFC',
    physicalityTolerance: 'Medium',
    tacticalStyle: 'Intense late-game derby transitions, relentless pressing, high-drama penalty box duels.',
    culturalDissentStyle: 'Passionate Korean touchline managers and captains ("심판님! 공 보고 들어갔잖아요!").',
    defaultSfx: 'TWEET—!! (WHISTLE!!)',
  },
  premier_league: {
    id: 'premier_league',
    name: 'Premier League',
    countryCode: 'GB-ENG',
    shortTag: 'EPL',
    featuredMatch: 'Arsenal vs Man City',
    homeTeam: 'ARSENAL',
    awayTeam: 'MAN CITY',
    homeColor: '#EF4444',
    awayColor: '#38BDF8',
    scorebugBg: '#2E0836',
    scorebugAccent: '#00FF85',
    scorebugText: '#FFFFFF',
    physicalityTolerance: 'High',
    tacticalStyle: 'End-to-end high tempo, high physical contact threshold ("Let it flow"), shoulder-to-shoulder duels.',
    culturalDissentStyle: 'Sarcastic British player banter & incredulous touchline disbelief ("You having a laugh, ref?!").',
    defaultSfx: 'SHREEEEK—!! (FULL BLAST!!)',
  },
  laliga: {
    id: 'laliga',
    name: 'LaLiga EA Sports',
    countryCode: 'ES',
    shortTag: 'LALIGA',
    featuredMatch: 'Real Madrid vs Barcelona',
    homeTeam: 'R. MADRID',
    awayTeam: 'BARCELONA',
    homeColor: '#F8FAFC',
    awayColor: '#A855F7',
    scorebugBg: '#111111',
    scorebugAccent: '#FF4B44',
    scorebugText: '#FFFFFF',
    physicalityTolerance: 'Low',
    tacticalStyle: 'Technical buildup, intricate box combinations, frequent penalty-box simulation (diving) vs. tripping checks.',
    culturalDissentStyle: 'Expressive Spanish gestures encircling the referee ("¡Pero si no le toco, árbitro!").',
    defaultSfx: '¡PIIIIII—!! (SILBATO!!)',
  },
  bundesliga: {
    id: 'bundesliga',
    name: 'Bundesliga',
    countryCode: 'DE',
    shortTag: 'BULI',
    featuredMatch: 'Bayern vs Leverkusen',
    homeTeam: 'BAYERN',
    awayTeam: 'LEVERKUSEN',
    homeColor: '#DC2626',
    awayColor: '#F59E0B',
    scorebugBg: '#18181B',
    scorebugAccent: '#D20515',
    scorebugText: '#FFFFFF',
    physicalityTolerance: 'High',
    tacticalStyle: 'High defensive lines, vertical counter-attacks, razor-tight Offside + DOGSO checks.',
    culturalDissentStyle: 'Direct German tactical protest demanding calibrated VAR line verification ("Schiri, schau dir die Linie an!").',
    defaultSfx: 'PFIIIIFF—!! (ABPFIFF!!)',
  },
  serie_a: {
    id: 'serie_a',
    name: 'Serie A Enilive',
    countryCode: 'IT',
    shortTag: 'SERIE A',
    featuredMatch: 'Inter vs Juventus',
    homeTeam: 'INTER',
    awayTeam: 'JUVENTUS',
    homeColor: '#2563EB',
    awayColor: '#E2E8F0',
    scorebugBg: '#061A40',
    scorebugAccent: '#FBBF24',
    scorebugText: '#FFFFFF',
    physicalityTolerance: 'Medium',
    tacticalStyle: 'Tactical shirt-pulling on set pieces, complex unnatural silhouette handball geometry in the box.',
    culturalDissentStyle: 'Theatrical Italian touchline coaching drama with clasped hands ("Ma come fai a dare rigore?!").',
    defaultSfx: 'FIIIISCHIO—!! (RIGORE?!)',
  },
  ligue_1: {
    id: 'ligue_1',
    name: 'Ligue 1 McDonald’s',
    countryCode: 'FR',
    shortTag: 'LIGUE 1',
    featuredMatch: 'PSG vs Marseille',
    homeTeam: 'PARIS SG',
    awayTeam: 'MARSEILLE',
    homeColor: '#1E3A8A',
    awayTeamColor: '#38BDF8',
    awayColor: '#38BDF8',
    scorebugBg: '#091024',
    scorebugAccent: '#CDF600',
    scorebugText: '#FFFFFF',
    physicalityTolerance: 'Medium',
    tacticalStyle: 'Explosive 1v1 wingers, late sliding tackle severity checks (reckless vs excessive force).',
    culturalDissentStyle: 'Fiery French Classique touchline confrontation ("C’est jamais rouge ça, monsieur l’arbitre !").',
    defaultSfx: 'COUP DE SIFFLET—!!',
  } as LeagueConfig & { awayTeamColor?: string },
};

export const CALL_ACTION_LABELS: Record<CallAction, { label: string; shortKey: string; badge: string }> = {
  play_on: { label: 'Play On', shortKey: '1', badge: 'NO FOUL' },
  foul: { label: 'Foul (Free Kick)', shortKey: '2', badge: 'DIRECT FK' },
  advantage: { label: 'Advantage', shortKey: '3', badge: 'LAW 5 ADV' },
  yellow: { label: 'Yellow Card', shortKey: '4', badge: 'CAUTION' },
  red: { label: 'Red Card', shortKey: '5', badge: 'SENDING OFF' },
  penalty: { label: 'Penalty Kick', shortKey: '6', badge: 'SPOT KICK' },
};

/**
 * Verification Loop 1 — Autonomous Audit of DirectorAgent Incident Frames & IFAB Law Plausibility
 * Rejects any incident where confidence < 0.85 or contact geometry contradicts the claimed ruling.
 */
export function auditIncidentFrames(incident: MatchIncident): {
  verified: boolean;
  confidence: number;
  reason: string;
} {
  const { frames, contact, auditor_check } = incident;
  if (!frames || frames.length === 0) {
    return {
      verified: false,
      confidence: 0.0,
      reason: 'REJECTED: Incident contains zero coordinate frames.',
    };
  }

  // Locate the frame closest to contact.frame
  const targetFrame = frames.reduce((prev, curr) =>
    Math.abs(curr.t - contact.frame) < Math.abs(prev.t - contact.frame) ? curr : prev
  );

  const [offSide, offIdStr] = contact.offender.split('_');
  const [vicSide, vicIdStr] = contact.victim.split('_');
  const offId = Number(offIdStr);
  const vicId = Number(vicIdStr);

  const offenderList = offSide === 'home' ? targetFrame.home : targetFrame.away;
  const victimList = vicSide === 'home' ? targetFrame.home : targetFrame.away;

  const offender = offenderList.find((p) => p.id === offId);
  const victim = victimList.find((p) => p.id === vicId);

  if (!offender || !victim) {
    return {
      verified: false,
      confidence: 0.45,
      reason: `REJECTED: Offender (${contact.offender}) or Victim (${contact.victim}) missing at contact frame t=${contact.frame}.`,
    };
  }

  // Check Euclidean proximity at contact frame (pitch scale 0..105 x 0..68)
  const dist = Math.hypot(offender.x - victim.x, offender.y - victim.y);
  if (dist > 7.5) {
    return {
      verified: false,
      confidence: 0.58,
      reason: `REJECTED: Contact distance (${dist.toFixed(1)}m) at t=${contact.frame} exceeds physical tackle radius.`,
    };
  }

  // Check Penalty Box consistency (Attacking box is x >= 83.5 or x <= 16.5, y between 13.8 and 54.2)
  const victimInBox =
    (victim.x >= 83.0 || victim.x <= 17.0) && victim.y >= 13.5 && victim.y <= 54.5;
  if (contact.in_box !== victimInBox) {
    return {
      verified: false,
      confidence: 0.68,
      reason: `REJECTED: Penalty area boundary mismatch at (${victim.x.toFixed(1)}, ${victim.y.toFixed(1)}).`,
    };
  }

  if (auditor_check.confidence < 0.85) {
    return {
      verified: false,
      confidence: auditor_check.confidence,
      reason: `REJECTED: Auditor confidence ${auditor_check.confidence.toFixed(2)} below 0.85 IFAB threshold.`,
    };
  }

  return {
    verified: true,
    confidence: auditor_check.confidence,
    reason: `VERIFIED (conf=${auditor_check.confidence.toFixed(2)}): Physical contact (${dist.toFixed(1)}m) & ${auditor_check.primary_law} validated.`,
  };
}

/**
 * Verification Loop 2 — Evaluates Player's Initial Call & Optional On-Field Review (OFR) Final Call
 */
export function evaluateRefereeCall(
  paramsOrIncident:
    | {
        incident: MatchIncident;
        initialCall: CallAction;
        finalCall?: CallAction | null;
        currentRating: number;
        archetype: RefereeArchetypeId;
        targetRole?: 'attacker' | 'defender';
        finalTargetRole?: 'attacker' | 'defender';
      }
    | MatchIncident,
  posInitialCall?: CallAction,
  posFinalCall?: CallAction | null,
  posCurrentRating?: number,
  posArchetype?: RefereeArchetypeId
): CallEvaluationResult {
  const incident: MatchIncident =
    'incident' in paramsOrIncident ? paramsOrIncident.incident : paramsOrIncident;
  const initialCall: CallAction =
    'incident' in paramsOrIncident
      ? paramsOrIncident.initialCall
      : (posInitialCall ?? 'play_on');
  const finalCall: CallAction | undefined =
    'incident' in paramsOrIncident
      ? (paramsOrIncident.finalCall ?? undefined)
      : (posFinalCall ?? undefined);
  const currentRating: number =
    'incident' in paramsOrIncident
      ? paramsOrIncident.currentRating
      : (posCurrentRating ?? 7.5);
  const archetype: RefereeArchetypeId =
    'incident' in paramsOrIncident
      ? paramsOrIncident.archetype
      : (posArchetype ?? 'var_purist');
  const targetRole: 'attacker' | 'defender' | undefined =
    'incident' in paramsOrIncident ? paramsOrIncident.targetRole : undefined;
  const finalTargetRole: 'attacker' | 'defender' | undefined =
    'incident' in paramsOrIncident
      ? (paramsOrIncident.finalTargetRole ?? paramsOrIncident.targetRole)
      : undefined;

  const { auditor_check, dissent } = incident;
  const archConfig = REFEREE_ARCHETYPES[archetype];

  // Determine which side actually committed the offence:
  // If offender starts with 'home_', the attacker (Home team) is the offender (e.g. Play 3 Simulation Dive by #11).
  // Otherwise, the defender (Away team) is the offender (e.g. Play 1 #4, Play 2 #8, Play 4 #20, Play 5 #13).
  const trueOffenderRole: 'attacker' | 'defender' =
    incident.contact.offender.startsWith('home_') ? 'attacker' : 'defender';
  const offenderNum = incident.contact.offender.split('_')[1] || '?';
  const victimNum = incident.contact.victim.split('_')[1] || '?';

  const requiresTargetCheck = (c: CallAction) =>
    c === 'yellow' || c === 'red' || c === 'foul';

  const isInitialWrongTarget =
    targetRole !== undefined &&
    requiresTargetCheck(initialCall) &&
    targetRole !== trueOffenderRole;

  const matchesCallList = (list: CallAction[] | undefined, call: CallAction) => {
    if (!list) return false;
    if (list.includes(call)) return true;
    if (
      (call === 'play_on' || call === 'advantage') &&
      (list.includes('play_on') || list.includes('advantage'))
    ) {
      return true;
    }
    return false;
  };

  const isInitialPrimaryCorrect =
    !isInitialWrongTarget && matchesCallList(auditor_check.correct_calls, initialCall);
  const isInitialSecondaryAcceptable =
    !isInitialWrongTarget &&
    matchesCallList(auditor_check.acceptable_secondary_calls, initialCall);

  // Determine if On-Field Review (OFR) is required under IFAB VAR Protocol:
  // Trigger VAR OFR whenever the initial call or target player is incorrect so the referee can test Overturn vs Stand Firm!
  const ofrRequired = !isInitialPrimaryCorrect && !isInitialSecondaryAcceptable;

  const effectiveFinalCall = finalCall ?? initialCall;
  const isFinalWrongTarget =
    finalTargetRole !== undefined &&
    requiresTargetCheck(effectiveFinalCall) &&
    finalTargetRole !== trueOffenderRole;

  const isFinalPrimaryCorrect =
    !isFinalWrongTarget && matchesCallList(auditor_check.correct_calls, effectiveFinalCall);
  const isFinalSecondaryAcceptable =
    !isFinalWrongTarget &&
    matchesCallList(auditor_check.acceptable_secondary_calls, effectiveFinalCall);

  let verdict: CallEvaluationResult['verdict'] = 'INCORRECT_CALL';
  let ratingDelta = 0;
  let crowdHeatDelta = 0;
  let explanationText = auditor_check.explanation;

  if (isInitialPrimaryCorrect && (!finalCall || finalCall === initialCall)) {
    verdict = finalCall ? 'STOOD_FIRM_CORRECT' : 'CORRECT_INITIAL';
    ratingDelta = 0.6;
    if (
      (initialCall === 'yellow' || initialCall === 'red') &&
      archConfig.foulBonusDelta > 0
    ) {
      ratingDelta += archConfig.foulBonusDelta;
    }
    if (
      (initialCall === 'advantage' || initialCall === 'play_on') &&
      archConfig.advantageBonusDelta > 0
    ) {
      ratingDelta += archConfig.advantageBonusDelta;
    }
    crowdHeatDelta = -8;
    explanationText = `✅ SPOT-ON CALL! You correctly penalized the true offender (${
      trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`
    }) with [${CALL_ACTION_LABELS[effectiveFinalCall].label}]. ${auditor_check.explanation}`;
  } else if (isInitialSecondaryAcceptable && (!finalCall || finalCall === initialCall)) {
    verdict = 'ACCEPTABLE_FLOW';
    ratingDelta = 0.3 + archConfig.advantageBonusDelta;
    crowdHeatDelta = -4;
    explanationText = `👍 ACCEPTABLE CALL: ${auditor_check.explanation}`;
  } else if (ofrRequired && finalCall && isFinalPrimaryCorrect) {
    verdict = 'OVERTURNED_CORRECT';
    ratingDelta = 0.6;
    crowdHeatDelta = 12;
    explanationText = `🔄 OVERTURNED VIA VAR MONITOR: Your initial on-field call was an error, but you correctly overturned it at the monitor to [${CALL_ACTION_LABELS[effectiveFinalCall].label}] on ${
      trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`
    }. ${auditor_check.explanation}`;
  } else if (ofrRequired && finalCall && isFinalSecondaryAcceptable) {
    verdict = 'OVERTURNED_CORRECT';
    ratingDelta = 0.3;
    crowdHeatDelta = 10;
  } else if (ofrRequired && !isFinalPrimaryCorrect) {
    verdict = 'CLEAR_ERROR_UNCORRECTED';
    ratingDelta = -0.9;
    crowdHeatDelta = 28;
    if (isFinalWrongTarget) {
      explanationText = `❌ WRONG PLAYER BOOKED (-0.9 RATING PENALTY)! You penalized innocent ${
        finalTargetRole === 'attacker' ? `Attacker #${victimNum}` : `Defender #${victimNum}`
      } instead of the actual offender (${
        trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`
      })! ${auditor_check.explanation}`;
    } else {
      explanationText = `❌ SEVERE ERROR — IGNORED VAR MONITOR (-0.9 RATING PENALTY)! You stood firm with [${CALL_ACTION_LABELS[effectiveFinalCall].label}] despite clear video evidence requiring [${auditor_check.correct_calls
        .map((c) => CALL_ACTION_LABELS[c].label)
        .join(' or ')}] against ${
        trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`
      }. ${auditor_check.explanation}`;
    }
  } else {
    verdict = 'INCORRECT_CALL';
    ratingDelta = -0.6;
    crowdHeatDelta = 18;
    if (isFinalWrongTarget) {
      explanationText = `❌ WRONG PLAYER PENALIZED (-0.6 RATING PENALTY)! You targeted innocent ${
        finalTargetRole === 'attacker' ? `Attacker #${victimNum}` : `Defender #${victimNum}`
      }, whereas the offence was committed by ${
        trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`
      }. ${auditor_check.explanation}`;
    } else {
      explanationText = `❌ WRONG DECISION (-0.6 RATING PENALTY)! Your call [${CALL_ACTION_LABELS[effectiveFinalCall].label}] violated ${auditor_check.primary_law}. Required call: [${auditor_check.correct_calls
        .map((c) => CALL_ACTION_LABELS[c].label)
        .join(' or ')}]. ${auditor_check.explanation}`;
    }
  }

  // Clamp rating between 1.0 and 10.0
  const newRating = Number(
    Math.min(10.0, Math.max(1.0, currentRating + ratingDelta)).toFixed(1)
  );

  // Convert ratingDelta to integer scale (+6 for +0.6, -9 for -0.9) to match exact PRD schema
  const prdScaleDelta = Math.round(ratingDelta * 10);

  const dynamicVarHint = isInitialWrongTarget
    ? `📺 VAR ALERT — WRONG PLAYER TARGETED! You penalized innocent ${
        targetRole === 'attacker' ? `Attacker #${victimNum}` : `Defender #${victimNum}`
      }! The actual offence was committed by ${
        trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`
      }. ${auditor_check.var_hint}`
    : auditor_check.var_hint;

  const expectedTargetLabel =
    trueOffenderRole === 'attacker' ? `Attacker #${offenderNum}` : `Defender #${offenderNum}`;
  const activeRole = finalTargetRole ?? targetRole ?? trueOffenderRole;
  const playerTargetLabel =
    activeRole === trueOffenderRole
      ? expectedTargetLabel
      : activeRole === 'attacker'
      ? `Attacker #${victimNum}`
      : `Defender #${victimNum}`;

  return {
    incident_id: incident.id,
    player_initial_call: initialCall,
    ofr_required: ofrRequired,
    ofr_triggered: ofrRequired,
    var_hint: dynamicVarHint,
    player_final_call: effectiveFinalCall,
    verdict,
    law_ref: auditor_check.primary_law,
    law_quote: auditor_check.law_quote,
    explanation: explanationText,
    rating_delta: prdScaleDelta,
    previous_rating: Number(currentRating.toFixed(1)),
    new_rating: newRating,
    player_target_label: playerTargetLabel,
    expected_target_label: expectedTargetLabel,
    crowd_heat_delta: crowdHeatDelta,
    dissent,
  };
}

/**
 * Interpolates 2D pitch coordinates at any fractional frame time t (0..30)
 */
export function interpolateFrameAtTime(frames: PitchFrame[], t: number): PitchFrame {
  if (frames.length === 0) {
    return { t: 0, ball: [52.5, 34], home: [], away: [] };
  }
  if (frames.length === 1 || t <= frames[0].t) {
    return frames[0];
  }
  const last = frames[frames.length - 1];
  if (t >= last.t) {
    return last;
  }

  let prev = frames[0];
  let next = last;
  for (let i = 0; i < frames.length - 1; i++) {
    if (t >= frames[i].t && t <= frames[i + 1].t) {
      prev = frames[i];
      next = frames[i + 1];
      break;
    }
  }

  const span = next.t - prev.t;
  const alpha = span > 0 ? (t - prev.t) / span : 0;

  const lerp = (a: number, b: number) => a + (b - a) * alpha;

  const ball: [number, number] = [
    Number(lerp(prev.ball[0], next.ball[0]).toFixed(2)),
    Number(lerp(prev.ball[1], next.ball[1]).toFixed(2)),
  ];

  const home = prev.home.map((p) => {
    const np = next.home.find((x) => x.id === p.id) ?? p;
    return {
      ...p,
      x: Number(lerp(p.x, np.x).toFixed(2)),
      y: Number(lerp(p.y, np.y).toFixed(2)),
    };
  });

  const away = prev.away.map((p) => {
    const np = next.away.find((x) => x.id === p.id) ?? p;
    return {
      ...p,
      x: Number(lerp(p.x, np.x).toFixed(2)),
      y: Number(lerp(p.y, np.y).toFixed(2)),
    };
  });

  return { t, ball, home, away };
}

export interface AssessorSummaryReport {
  finalRating: number;
  accuracyPercent: number;
  initialAccuracyPercent: number;
  ofrCount: number;
  ofrSuccessCount: number;
  consistencyScore: number;
  careerStatus: 'FIFA_ELITE_PROMOTION' | 'FIRST_DIVISION_RETENTION' | 'RELEGATION_WARNING';
  careerBadgeText: string;
  headlineSummary: string;
}

export function compileAssessorReport(
  evaluations: CallEvaluationResult[],
  finalRating: number
): AssessorSummaryReport {
  if (evaluations.length === 0) {
    return {
      finalRating,
      accuracyPercent: 100,
      initialAccuracyPercent: 100,
      ofrCount: 0,
      ofrSuccessCount: 0,
      consistencyScore: 92,
      careerStatus: 'FIRST_DIVISION_RETENTION',
      careerBadgeText: 'MATCH IN PROGRESS — AWAITING FULL-TIME WHISTLE',
      headlineSummary: 'Complete match incidents to generate your official IFAB Assessor Report.',
    };
  }

  const finalCorrect = evaluations.filter(
    (e) =>
      e.verdict === 'CORRECT_INITIAL' ||
      e.verdict === 'ACCEPTABLE_FLOW' ||
      e.verdict === 'OVERTURNED_CORRECT' ||
      e.verdict === 'STOOD_FIRM_CORRECT'
  ).length;

  const initialCorrect = evaluations.filter(
    (e) =>
      e.verdict === 'CORRECT_INITIAL' ||
      e.verdict === 'ACCEPTABLE_FLOW' ||
      e.verdict === 'STOOD_FIRM_CORRECT'
  ).length;

  const ofrEvents = evaluations.filter((e) => e.ofr_required);
  const ofrSuccess = ofrEvents.filter((e) => e.verdict === 'OVERTURNED_CORRECT').length;

  const accuracyPercent = Math.round((finalCorrect / evaluations.length) * 100);
  const initialAccuracyPercent = Math.round((initialCorrect / evaluations.length) * 100);
  const consistencyScore = Math.min(
    100,
    Math.max(40, Math.round(accuracyPercent * 0.7 + initialAccuracyPercent * 0.3))
  );

  let careerStatus: AssessorSummaryReport['careerStatus'] = 'FIRST_DIVISION_RETENTION';
  let careerBadgeText = 'FIRST DIVISION RETENTION — SOLID AUTHORITY';
  let headlineSummary =
    'Maintained match control under intense supporter pressure and applied VAR protocols effectively.';

  if (finalRating >= 8.2 && accuracyPercent >= 80) {
    careerStatus = 'FIFA_ELITE_PROMOTION';
    careerBadgeText = 'PROMOTED TO FIFA INTERNATIONAL ELITE PANEL';
    headlineSummary =
      'Clinical command of IFAB Laws of the Game. Decisive penalty-box governance and flawless VAR collaboration.';
  } else if (finalRating < 6.8 || accuracyPercent < 60) {
    careerStatus = 'RELEGATION_WARNING';
    careerBadgeText = 'DEMOTED TO K LEAGUE 2 / CHALLENGER PANEL';
    headlineSummary =
      'Critical Clear and Obvious Errors in high-leverage moments compromised match integrity.';
  }

  return {
    finalRating,
    accuracyPercent,
    initialAccuracyPercent,
    ofrCount: ofrEvents.length,
    ofrSuccessCount: ofrSuccess,
    consistencyScore,
    careerStatus,
    careerBadgeText,
    headlineSummary,
  };
}
