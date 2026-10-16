import type { MatchIncident, DiscardLogEntry, LeagueId } from './rules.ts';

function buildFullSquadFrame(
  t: number,
  ball: [number, number],
  focalHome: { id: number; x: number; y: number; name?: string }[],
  focalAway: { id: number; x: number; y: number; name?: string }[],
  shiftX: number
) {
  const baseHome = [
    { id: 1, x: 6, y: 34, role: 'GK' as const, name: 'Kang H.M.' },
    { id: 2, x: 38 + shiftX * 0.4, y: 12, role: 'DEF' as const, name: 'Choi Jun' },
    { id: 3, x: 35 + shiftX * 0.4, y: 26, role: 'DEF' as const, name: 'Kwon W.K.' },
    { id: 5, x: 35 + shiftX * 0.4, y: 42, role: 'DEF' as const, name: 'Yazan' },
    { id: 15, x: 40 + shiftX * 0.4, y: 56, role: 'DEF' as const, name: 'Kang S.W.' },
    { id: 6, x: 56 + shiftX * 0.6, y: 24, role: 'MID' as const, name: 'Ki S.Y.' },
    { id: 8, x: 58 + shiftX * 0.6, y: 44, role: 'MID' as const, name: 'Lee S.M.' },
    { id: 10, x: 74 + shiftX * 0.8, y: 22, role: 'MID' as const, name: 'Lingard' },
    { id: 7, x: 76 + shiftX * 0.8, y: 50, role: 'FWD' as const, name: 'Willyan' },
    { id: 11, x: 78 + shiftX * 0.7, y: 14, role: 'FWD' as const, name: 'Cho Y.W.' },
  ];

  const baseAway = [
    { id: 21, x: 99, y: 34, role: 'GK' as const, name: 'Jo Hyeon-woo' },
    { id: 13, x: 84 + shiftX * 0.3, y: 14, role: 'DEF' as const, name: 'Lee M.J.' },
    { id: 19, x: 82 + shiftX * 0.3, y: 25, role: 'DEF' as const, name: 'Kim Y.G.' },
    { id: 20, x: 83 + shiftX * 0.3, y: 48, role: 'DEF' as const, name: 'Hwang S.H.' },
    { id: 66, x: 85 + shiftX * 0.3, y: 58, role: 'DEF' as const, name: 'Seol Y.W.' },
    { id: 8, x: 68 + shiftX * 0.5, y: 28, role: 'MID' as const, name: 'Ko S.B.' },
    { id: 14, x: 66 + shiftX * 0.5, y: 41, role: 'MID' as const, name: 'Lee D.G.' },
    { id: 17, x: 62 + shiftX * 0.4, y: 18, role: 'MID' as const, name: 'Ludwigson' },
    { id: 27, x: 63 + shiftX * 0.4, y: 52, role: 'MID' as const, name: 'Um W.S.' },
    { id: 18, x: 50 + shiftX * 0.3, y: 34, role: 'FWD' as const, name: 'Joo M.K.' },
  ];

  const mergedHome = [...baseHome];
  for (const fh of focalHome) {
    const idx = mergedHome.findIndex((p) => p.id === fh.id);
    if (idx >= 0) mergedHome[idx] = { ...mergedHome[idx], ...fh };
    else mergedHome.push({ ...fh, role: 'FWD' });
  }

  const mergedAway = [...baseAway];
  for (const fa of focalAway) {
    const idx = mergedAway.findIndex((p) => p.id === fa.id);
    if (idx >= 0) mergedAway[idx] = { ...mergedAway[idx], ...fa };
    else mergedAway.push({ ...fa, role: 'DEF' });
  }

  return {
    t,
    ball,
    home: mergedHome,
    away: mergedAway,
  };
}

export const INITIAL_INCIDENTS: MatchIncident[] = [
  {
    id: 'inc_01',
    league: 'K League 1',
    leagueId: 'k_league_1',
    title: 'Play 1 (18’ · 0-0) · 1v1 Breakaway Challenge Inside the Box',
    context: {
      minute: 18,
      score: '0-0',
      match: 'Seoul vs Ulsan',
      homeTeam: 'FC SEOUL',
      awayTeam: 'ULSAN HD',
      prior_cards: { away_4: 'yellow' },
      situation_summary:
        '18th Minute (0-0): Seoul striker #9 breaks through 1v1 against the goalkeeper inside the penalty box! Ulsan defender #4 lunges from behind and clips his ankle with zero attempt to play the ball.',
    },
    frames: [
      buildFullSquadFrame(
        0,
        [74.2, 34],
        [{ id: 9, x: 73.0, y: 34.0, name: 'Iljutcenko (#9)' }],
        [{ id: 4, x: 68.5, y: 34.0, name: 'Ulsan Capt (#4)' }],
        0
      ),
      buildFullSquadFrame(
        10,
        [82.5, 34],
        [{ id: 9, x: 81.5, y: 34.0, name: 'Iljutcenko (#9)' }],
        [{ id: 4, x: 79.0, y: 34.0, name: 'Ulsan Capt (#4)' }],
        4
      ),
      buildFullSquadFrame(
        18,
        [88.8, 34],
        [{ id: 9, x: 88.0, y: 34.0, name: 'Iljutcenko (#9)' }],
        [{ id: 4, x: 87.2, y: 34.1, name: 'Ulsan Capt (#4)' }],
        8
      ),
      buildFullSquadFrame(
        24,
        [91.5, 34.4],
        [{ id: 9, x: 88.5, y: 34.0, name: 'Iljutcenko (#9)' }],
        [{ id: 4, x: 87.4, y: 34.1, name: 'Ulsan Capt (#4)' }],
        8
      ),
      buildFullSquadFrame(
        30,
        [93.4, 34.6],
        [{ id: 9, x: 88.5, y: 34.0, name: 'Iljutcenko (#9)' }],
        [{ id: 4, x: 87.4, y: 34.1, name: 'Ulsan Capt (#4)' }],
        8
      ),
    ],
    contact: {
      frame: 18,
      offender: 'away_4',
      victim: 'home_9',
      type: 'tackle_from_behind_no_ball',
      in_box: true,
      dogso: true,
      attempt_at_ball: false,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.95,
      correct_calls: ['red', 'penalty'],
      primary_law: 'IFAB Law 12 §3 — Disciplinary Action (DOGSO)',
      law_quote:
        'Denying an obvious goal-scoring opportunity inside the penalty area without attempting to play the ball results in a red card.',
      var_hint:
        '💡 VAR Hint: Defender #4 made zero attempt to play the ball while denying an obvious goal-scoring opportunity (DOGSO) inside the box. Double-jeopardy downgrade does NOT apply — issue a [RED CARD] or [PENALTY KICK]!',
      explanation:
        'Because the tackle from behind made no genuine attempt to play the ball inside the penalty area, double-jeopardy mitigation does not apply under IFAB Law 12 §3. Correct call: Red Card + Penalty Kick.',
    },
    dissent: {
      speaker: 'Ulsan Captain (#4)',
      role: 'captain',
      webtoon_sfx: 'TWEET—!! (WHISTLE!!)',
      line: 'Ref! I went for the ball! How on earth is that a straight red card and a penalty?!',
    },
  },
  {
    id: 'inc_02',
    league: 'K League 1',
    leagueId: 'k_league_1',
    title: 'Play 2 (37’ · 1-0) · Midfield Collision on 3v2 Counter-Attack',
    context: {
      minute: 37,
      score: '1-0',
      match: 'Seoul vs Ulsan',
      homeTeam: 'FC SEOUL',
      awayTeam: 'ULSAN HD',
      prior_cards: {},
      situation_summary:
        '37th Minute (1-0 Lead): Ulsan #8 clips Seoul #10 at the halfway line, but the loose ball rolls directly to sprinting winger #7 with a wide-open 3v2 counter-attack!',
    },
    frames: [
      buildFullSquadFrame(
        0,
        [52, 34],
        [
          { id: 10, x: 51, y: 34, name: 'Lingard (#10)' },
          { id: 7, x: 58, y: 46, name: 'Willyan (#7)' },
        ],
        [{ id: 8, x: 53.5, y: 35.5, name: 'Ko S.B. (#8)' }],
        -4
      ),
      buildFullSquadFrame(
        14,
        [57.5, 36.2],
        [
          { id: 10, x: 56.8, y: 35.8, name: 'Lingard (#10)' },
          { id: 7, x: 65, y: 43, name: 'Willyan (#7)' },
        ],
        [{ id: 8, x: 57.1, y: 36.4, name: 'Ko S.B. (#8)' }],
        0
      ),
      buildFullSquadFrame(
        30,
        [76, 41],
        [
          { id: 10, x: 59, y: 36, name: 'Lingard (#10)' },
          { id: 7, x: 75.5, y: 41, name: 'Willyan (#7)' },
        ],
        [{ id: 8, x: 60, y: 37, name: 'Ko S.B. (#8)' }],
        6
      ),
    ],
    contact: {
      frame: 14,
      offender: 'away_8',
      victim: 'home_10',
      type: 'advantage_through_ball_foul',
      in_box: false,
      dogso: false,
      attempt_at_ball: true,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.92,
      correct_calls: ['advantage'],
      acceptable_secondary_calls: ['play_on', 'foul'],
      primary_law: 'IFAB Law 5 §3 — Powers and Duties (Advantage)',
      law_quote:
        'The referee allows play to continue when an offence occurs and the non-offending team will benefit from the advantage.',
      var_hint:
        '💡 VAR Hint: Stopping play right now kills a dangerous 3v2 breakaway for the fouled team! Signal [1: PLAY ON / ADVANTAGE] to let the attack continue!',
      explanation:
        'Under IFAB Law 5 §3, because the non-offending team retains possession in a promising 3v2 counter-attack, signaling Advantage is the optimal elite refereeing decision.',
    },
    dissent: {
      speaker: 'FC Seoul Head Coach',
      role: 'coach',
      webtoon_sfx: 'PLAY ON—!! (ADVANTAGE!!)',
      line: 'Ref!! If you blow the whistle there, you kill our 3v2 breakaway! Let the advantage play on!',
    },
  },
  {
    id: 'inc_03',
    league: 'K League 1',
    leagueId: 'k_league_1',
    title: 'Play 3 (58’ · 1-2) · Penalty Box Appeal After Tackle Attempt',
    context: {
      minute: 58,
      score: '1-2',
      match: 'Seoul vs Ulsan',
      homeTeam: 'FC SEOUL',
      awayTeam: 'ULSAN HD',
      prior_cards: {},
      situation_summary:
        '58th Minute (1-2): Defender #19 pulls his boot back 1.4 meters away, yet attacker #11 launches himself into the air without any physical contact and screams for a penalty kick!',
    },
    frames: [
      buildFullSquadFrame(
        0,
        [81, 20],
        [{ id: 11, x: 80, y: 20, name: 'Cho Y.W. (#11)' }],
        [{ id: 19, x: 85, y: 23, name: 'Kim Y.G. (#19)' }],
        4
      ),
      buildFullSquadFrame(
        16,
        [87.5, 23.5],
        [{ id: 11, x: 86.8, y: 23.2, name: 'Cho Y.W. (#11)' }],
        [{ id: 19, x: 88.2, y: 24.4, name: 'Kim Y.G. (#19)' }],
        7
      ),
      buildFullSquadFrame(
        30,
        [91, 25],
        [{ id: 11, x: 88.5, y: 23.8, name: 'Cho Y.W. (#11)' }],
        [{ id: 19, x: 89.2, y: 25.0, name: 'Kim Y.G. (#19)' }],
        8
      ),
    ],
    contact: {
      frame: 16,
      offender: 'home_11',
      victim: 'away_19',
      type: 'simulation_dive',
      in_box: true,
      dogso: false,
      attempt_at_ball: true,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.91,
      correct_calls: ['yellow'],
      acceptable_secondary_calls: [],
      primary_law: 'IFAB Law 12 §3 — Cautions for Unsporting Behaviour (Simulation)',
      law_quote:
        'A player must be cautioned for unsporting behaviour if they attempt to deceive the referee by feigning injury or pretending to have been fouled (simulation).',
      var_hint:
        '💡 VAR Hint: Clear 1.4m air gap between Defender #19 and Attacker #11! Attacker #11 dived to deceive the referee — select [Target: Attacker #11] and show [3: YELLOW CARD] for simulation!',
      explanation:
        'Zero physical contact occurred. Under IFAB Law 12 §3, attempting to deceive the referee by feigning a foul inside the penalty area requires a mandatory Yellow Card to the diving attacker (#11).',
    },
    dissent: {
      speaker: 'Ulsan Head Coach',
      role: 'coach',
      webtoon_sfx: 'OUTRAGE—!! (TOUCHLINE FURY!!)',
      line: 'He never touched him! That is a blatant dive in the box — book him for simulation, Ref!',
    },
  },
  {
    id: 'inc_04',
    league: 'K League 1',
    leagueId: 'k_league_1',
    title: 'Play 4 (76’ · 2-3) · Blocked Equalizer Shot Inside the Box',
    context: {
      minute: 76,
      score: '2-3',
      match: 'Seoul vs Ulsan',
      homeTeam: 'FC SEOUL',
      awayTeam: 'ULSAN HD',
      prior_cards: {},
      situation_summary:
        '76th Minute (2-3): A curling equalizer shot heads toward the top corner! Ulsan defender #20 extends his arm 95 degrees away from his torso, blocking the shot with his hand inside the box!',
    },
    frames: [
      buildFullSquadFrame(
        0,
        [82, 38],
        [{ id: 10, x: 81.5, y: 38, name: 'Lingard (#10)' }],
        [{ id: 20, x: 88.5, y: 36, name: 'Hwang S.H. (#20)' }],
        6
      ),
      buildFullSquadFrame(
        15,
        [88.4, 36.1],
        [{ id: 10, x: 83.0, y: 37.5, name: 'Lingard (#10)' }],
        [{ id: 20, x: 88.5, y: 36.0, name: 'Hwang S.H. (#20)' }],
        7
      ),
      buildFullSquadFrame(
        30,
        [85.0, 42.0],
        [{ id: 10, x: 83.5, y: 37.2, name: 'Lingard (#10)' }],
        [{ id: 20, x: 88.8, y: 36.2, name: 'Hwang S.H. (#20)' }],
        7
      ),
    ],
    contact: {
      frame: 15,
      offender: 'away_20',
      victim: 'home_10',
      type: 'unnatural_handball_in_box',
      in_box: true,
      dogso: false,
      attempt_at_ball: false,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.94,
      correct_calls: ['penalty', 'yellow'],
      primary_law: 'IFAB Law 12 §1 — Handling the Ball (Unnatural Bigger Body)',
      law_quote:
        'It is an offence if a player touches the ball with their hand/arm when it has made their body unnaturally bigger and is not a consequence of justifiable body movement.',
      var_hint:
        '💡 VAR Hint: Defender #20 extended his arm horizontally at shoulder height, making his body unnaturally bigger to block a shot on target. Award [5: PENALTY KICK] or [3: YELLOW CARD]!',
      explanation:
        'Under IFAB Law 12 §1, blocking a goal-bound shot with an arm extended at 95° unnaturally enlarges the body silhouette inside the penalty box. Correct call: Penalty Kick + Yellow Card.',
    },
    dissent: {
      speaker: 'FC Seoul Captain (#10)',
      role: 'captain',
      webtoon_sfx: 'HANDBALL—!! (APPEAL!!)',
      line: 'His arm was stretched wide open like a goalkeeper! That shot was going in — clear penalty, Ref!',
    },
  },
  {
    id: 'inc_05',
    league: 'K League 1',
    leagueId: 'k_league_1',
    title: 'Play 5 (86’ · 3-3) · Flank Breakaway Jersey Challenge at 86’',
    context: {
      minute: 86,
      score: '3-3',
      match: 'Seoul vs Ulsan',
      homeTeam: 'FC SEOUL',
      awayTeam: 'ULSAN HD',
      prior_cards: {},
      situation_summary:
        '86th Minute (3-3 Thriller): Winger #7 sprints past his marker down the flank, and defender #13 grabs a handful of his jersey with both hands to stop the promising attack (SPA)!',
    },
    frames: [
      buildFullSquadFrame(
        0,
        [62, 52],
        [{ id: 7, x: 61, y: 52, name: 'Willyan (#7)' }],
        [{ id: 13, x: 63, y: 50, name: 'Lee M.J. (#13)' }],
        2
      ),
      buildFullSquadFrame(
        16,
        [72, 50],
        [{ id: 7, x: 71.2, y: 50.2, name: 'Willyan (#7)' }],
        [{ id: 13, x: 70.5, y: 49.6, name: 'Lee M.J. (#13)' }],
        5
      ),
      buildFullSquadFrame(
        30,
        [75, 51],
        [{ id: 7, x: 73, y: 50.8, name: 'Willyan (#7)' }],
        [{ id: 13, x: 72.2, y: 50.2, name: 'Lee M.J. (#13)' }],
        6
      ),
    ],
    contact: {
      frame: 16,
      offender: 'away_13',
      victim: 'home_7',
      type: 'tactical_shirt_pull_spa',
      in_box: false,
      dogso: false,
      attempt_at_ball: false,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.93,
      correct_calls: ['yellow', 'foul'],
      primary_law: 'IFAB Law 12 §3 — Stopping a Promising Attack (SPA)',
      law_quote:
        'Where a player commits an offence against an opponent which interferes with or stops a promising attack, the player is cautioned (Yellow Card).',
      var_hint:
        '💡 VAR Hint: Deliberate shirt-pulling with zero attempt at the ball to break up a wing counter-attack (SPA). Issue [3: YELLOW CARD] or [2: BLOW WHISTLE (FOUL)]!',
      explanation:
        'Deliberately holding a player’s shirt to stop a promising attack (SPA) requires a direct free kick and a mandatory Yellow Card under IFAB Law 12 §3.',
    },
    dissent: {
      speaker: 'Ulsan Defender (#13)',
      role: 'captain',
      webtoon_sfx: 'TWEET—!! (YELLOW CARD!!)',
      line: 'Come on Ref, I barely tugged his sleeve! A yellow card for a tiny tactical foul in midfield?!',
    },
  },
];

export const INITIAL_DISCARD_LOG: DiscardLogEntry[] = [
  {
    id: 'log_init_0',
    timestamp: '19:15:58.104',
    agentFrom: 'Auditor',
    agentTo: 'Director',
    status: 'CACHE_HIT',
    confidence: 1.0,
    lawRef: 'IFAB 2025/26 Full Corpus (208p)',
    message: '1M Unified Context Cache warm: Laws 1–17 + VAR Protocol v4 loaded (0ms retrieval overhead).',
  },
  {
    id: 'log_init_1',
    timestamp: '19:16:01.412',
    agentFrom: 'Auditor',
    agentTo: 'Director',
    status: 'REJECTED & REGENERATED',
    confidence: 0.62,
    lawRef: 'IFAB Law 12 §3 (DOGSO)',
    message:
      'Rejected Draft inc_01_a: Covering defender away_19 at (89.1, 33.8) creates ambiguous 2v1 angle (conf=0.62 < 0.85). Regenerating with isolated 1v1 corridor.',
  },
  {
    id: 'log_init_2',
    timestamp: '19:16:02.890',
    agentFrom: 'Auditor',
    agentTo: 'HUD',
    status: 'VERIFIED',
    confidence: 0.95,
    lawRef: 'IFAB Law 12 §3 (DOGSO)',
    message:
      'Verified inc_01 (Seoul vs Ulsan 82’): Tackle from behind at t=18 inside box, zero ball play. Ground truth locked: [red, penalty].',
  },
  {
    id: 'log_init_3',
    timestamp: '19:16:04.115',
    agentFrom: 'Auditor',
    agentTo: 'Director',
    status: 'REJECTED & REGENERATED',
    confidence: 0.71,
    lawRef: 'IFAB Law 12 §3 (Simulation)',
    message:
      'Rejected Draft inc_03_a: Contact distance 0.25m at t=16 creates grazing-boot ambiguity (conf=0.71 < 0.85). Regenerating with clear 1.4m air gap.',
  },
  {
    id: 'log_init_4',
    timestamp: '19:16:05.340',
    agentFrom: 'Auditor',
    agentTo: 'HUD',
    status: 'VERIFIED',
    confidence: 0.91,
    lawRef: 'IFAB Law 12 §3 (Simulation)',
    message:
      'Verified inc_03 (75’ Box Dive): Zero physical contact confirmed at t=16. Ground truth locked: [yellow].',
  },
];

export interface VarDeskPreset {
  id: string;
  title: string;
  league: LeagueId;
  matchLabel: string;
  scenarioText: string;
  onFieldInitialCall: string;
}

export const VAR_DESK_PRESETS: VarDeskPreset[] = [
  {
    id: 'preset_dogso_push',
    title: 'K League Derby 88’ — Two-Handed Push in Box Without Ball Attempt',
    league: 'k_league_1',
    matchLabel: 'FC Seoul vs Ulsan HD (88’)',
    scenarioText:
      'Striker controls a cross 8 yards from goal with only the goalkeeper to beat. Center-back shoves him squarely in the back with both hands, making zero attempt to play the ball. On-field referee awards a Penalty Kick and shows a Yellow Card citing double jeopardy.',
    onFieldInitialCall: 'Penalty Kick + Yellow Card (Double Jeopardy assumed)',
  },
  {
    id: 'preset_ricochet_handball',
    title: 'Serie A 90+2’ — Deflected Thigh-to-Arm Contact Inside Penalty Area',
    league: 'serie_a',
    matchLabel: 'Inter vs Juventus (90+2’)',
    scenarioText:
      'Defender slides to block a cross inside the box. The ball strikes his own supporting thigh first and deflects upward onto his trailing hand, which is close to his body used for ground support.',
    onFieldInitialCall: 'Penalty Kick for Handball',
  },
  {
    id: 'preset_offside_gk_line',
    title: 'Bundesliga 71’ — Attacker Obstructing Goalkeeper Line of Vision',
    league: 'bundesliga',
    matchLabel: 'Bayern vs Leverkusen (71’)',
    scenarioText:
      'Midfielder shoots from 20 meters and scores. Teammate #9 is standing 1.5 meters in front of the goalkeeper in an offside position directly in the keeper’s line of vision and ducks under the ball without touching it.',
    onFieldInitialCall: 'Goal Awarded (No touch by #9)',
  },
];
