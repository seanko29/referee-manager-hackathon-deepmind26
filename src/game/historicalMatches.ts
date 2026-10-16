import type { MatchIncident } from './rules.ts';

function buildHistoricalSquadFrame(
  t: number,
  ball: [number, number],
  focalHome: { id: number; x: number; y: number; name?: string }[],
  focalAway: { id: number; x: number; y: number; name?: string }[],
  shiftX: number,
  homeRoster?: { id: number; role: 'GK' | 'DEF' | 'MID' | 'FWD'; name: string }[],
  awayRoster?: { id: number; role: 'GK' | 'DEF' | 'MID' | 'FWD'; name: string }[]
) {
  const defaultHomeCoords = [
    { x: 6, y: 34 },
    { x: 38 + shiftX * 0.4, y: 12 },
    { x: 35 + shiftX * 0.4, y: 26 },
    { x: 35 + shiftX * 0.4, y: 42 },
    { x: 40 + shiftX * 0.4, y: 56 },
    { x: 56 + shiftX * 0.6, y: 24 },
    { x: 58 + shiftX * 0.6, y: 44 },
    { x: 74 + shiftX * 0.8, y: 22 },
    { x: 76 + shiftX * 0.8, y: 50 },
    { x: 78 + shiftX * 0.7, y: 14 },
  ];

  const defaultAwayCoords = [
    { x: 99, y: 34 },
    { x: 84 + shiftX * 0.3, y: 14 },
    { x: 82 + shiftX * 0.3, y: 25 },
    { x: 83 + shiftX * 0.3, y: 48 },
    { x: 85 + shiftX * 0.3, y: 58 },
    { x: 68 + shiftX * 0.5, y: 28 },
    { x: 66 + shiftX * 0.5, y: 41 },
    { x: 62 + shiftX * 0.4, y: 18 },
    { x: 63 + shiftX * 0.4, y: 52 },
    { x: 50 + shiftX * 0.3, y: 34 },
  ];

  const baseHome = (
    homeRoster ?? [
      { id: 1, role: 'GK', name: 'Lee Woon-jae' },
      { id: 22, role: 'DEF', name: 'Song Chong-gug' },
      { id: 20, role: 'DEF', name: 'Hong Myung-bo' },
      { id: 4, role: 'DEF', name: 'Kim Tae-young' },
      { id: 10, role: 'MID', name: 'Lee Young-pyo' },
      { id: 6, role: 'MID', name: 'Yoo Sang-chul' },
      { id: 5, role: 'MID', name: 'Kim Nam-il' },
      { id: 21, role: 'MID', name: 'Park Ji-sung' },
      { id: 9, role: 'FWD', name: 'Seol Ki-hyeon' },
      { id: 19, role: 'FWD', name: 'Ahn Jung-hwan' },
    ]
  ).map((p, idx) => ({
    ...p,
    x: defaultHomeCoords[idx % defaultHomeCoords.length].x,
    y: defaultHomeCoords[idx % defaultHomeCoords.length].y,
  }));

  const baseAway = (
    awayRoster ?? [
      { id: 1, role: 'GK', name: 'Iker Casillas' },
      { id: 5, role: 'DEF', name: 'Carles Puyol' },
      { id: 6, role: 'DEF', name: 'Fernando Hierro' },
      { id: 20, role: 'DEF', name: 'Miguel Angel Nadal' },
      { id: 15, role: 'DEF', name: 'Enrique Romero' },
      { id: 4, role: 'MID', name: 'Ivan Helguera' },
      { id: 8, role: 'MID', name: 'Ruben Baraja' },
      { id: 21, role: 'MID', name: 'Joaquin' },
      { id: 17, role: 'MID', name: 'Valeron' },
      { id: 9, role: 'FWD', name: 'Fernando Morientes' },
    ]
  ).map((p, idx) => ({
    ...p,
    x: defaultAwayCoords[idx % defaultAwayCoords.length].x,
    y: defaultAwayCoords[idx % defaultAwayCoords.length].y,
  }));

  const mergedHome = [...baseHome];
  for (const fh of focalHome) {
    const idx = mergedHome.findIndex((p) => p.id === fh.id);
    if (idx >= 0) mergedHome[idx] = { ...mergedHome[idx], ...fh };
    else mergedHome.push({ ...fh, role: 'FWD', name: fh.name || `#${fh.id}` });
  }

  const mergedAway = [...baseAway];
  for (const fa of focalAway) {
    const idx = mergedAway.findIndex((p) => p.id === fa.id);
    if (idx >= 0) mergedAway[idx] = { ...mergedAway[idx], ...fa };
    else mergedAway.push({ ...fa, role: 'DEF', name: fa.name || `#${fa.id}` });
  }

  return {
    t,
    ball,
    home: mergedHome,
    away: mergedAway,
  };
}

export interface HistoricalMatchPreset {
  id: string;
  shortLabel: string;
  fullTitle: string;
  competitionTag: string;
  dateVenue: string;
  fotmobMatchId: string;
  homeTeam: string;
  awayTeam: string;
  summary: string;
  incidents: MatchIncident[];
}

/**
 * 1. 2002 FIFA WORLD CUP QUARTER-FINAL: SOUTH KOREA vs. SPAIN (Gwangju, June 22, 2002)
 */
const KOREA_SPAIN_2002_INCIDENTS: MatchIncident[] = [
  {
    id: 'hist_2002_esp_1',
    league: '2002 World Cup QF',
    leagueId: 'k_league_1',
    title: 'Play 1 (27’ · 0-0) · Ahn Jung-hwan (#19) 1v1 Box Breakaway vs. Hierro (#6)',
    context: {
      minute: 27,
      score: '0-0 (2002 WC QF)',
      match: '2002 World Cup QF: South Korea vs. Spain',
      homeTeam: 'SOUTH KOREA',
      awayTeam: 'SPAIN',
      prior_cards: {},
      situation_summary:
        '27th Minute (Gwangju World Cup Stadium): Ahn Jung-hwan (#19) spins past the Spanish backline inside the penalty box! Spain captain Fernando Hierro (#6) lunges in from behind and clips Ahn’s trailing ankle with zero chance of playing the ball.',
    },
    frames: [
      buildHistoricalSquadFrame(0, [68, 34], [{ id: 19, x: 67, y: 34, name: 'Ahn J.H.' }], [{ id: 6, x: 62, y: 35, name: 'Hierro' }], -6),
      buildHistoricalSquadFrame(10, [79, 34], [{ id: 19, x: 78, y: 34, name: 'Ahn J.H.' }], [{ id: 6, x: 75, y: 34.5, name: 'Hierro' }], 0),
      buildHistoricalSquadFrame(18, [88.5, 34], [{ id: 19, x: 88, y: 34, name: 'Ahn J.H.' }], [{ id: 6, x: 87.3, y: 34.3, name: 'Hierro' }], 6),
      buildHistoricalSquadFrame(30, [91.5, 35], [{ id: 19, x: 89.2, y: 34.2, name: 'Ahn J.H.' }], [{ id: 6, x: 88.2, y: 34.5, name: 'Hierro' }], 8),
    ],
    contact: {
      frame: 18,
      offender: 'away_6',
      victim: 'home_19',
      type: 'tackle_from_behind_no_ball',
      in_box: true,
      dogso: true,
      attempt_at_ball: false,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.96,
      correct_calls: ['red', 'penalty'],
      primary_law: 'IFAB Law 12 §3 — DOGSO Inside Penalty Box (No Attempt at Ball)',
      law_quote:
        'Where a player denies an obvious goal-scoring opportunity inside the penalty area with no attempt to play the ball, the player must be sent off (Red Card).',
      var_hint: 'Inspect whether Hierro (#6) made any attempt at the ball or clipped #19 from behind.',
      explanation:
        'Hierro (#6) lunged from behind inside the box with zero chance to play the ball, denying Ahn Jung-hwan (#19) a 1v1 shot. Correct call: Red Card + Penalty Kick.',
    },
    dissent: {
      speaker: 'Fernando Hierro (#6, Spain Captain)',
      role: 'captain',
      webtoon_sfx: '¡ÁRBITRO! (WHISTLE!!)',
      line: 'Ref! This is a World Cup Quarter-Final! We went shoulder to shoulder—how can you give a straight red card?!',
    },
  },
  {
    id: 'hist_2002_esp_2',
    league: '2002 World Cup QF',
    leagueId: 'k_league_1',
    title: 'Play 2 (50’ · 0-0) · Park Ji-sung (#21) Midfield Foul & 3v2 Counter to Seol (#7)',
    context: {
      minute: 50,
      score: '0-0 (2002 WC QF)',
      match: '2002 World Cup QF: South Korea vs. Spain',
      homeTeam: 'SOUTH KOREA',
      awayTeam: 'SPAIN',
      prior_cards: {},
      situation_summary:
        '50th Minute (0-0): Spain midfielder Baraja (#8) trips Park Ji-sung (#21) at the center circle, but as Park falls, the loose ball rolls straight to Seol Ki-hyeon (#7) sprinting wide open on a 3v2 Red Devils counter-attack!',
    },
    frames: [
      buildHistoricalSquadFrame(0, [48, 34], [{ id: 10, x: 47, y: 34, name: 'Park J.S.' }, { id: 7, x: 54, y: 46, name: 'Seol K.H.' }], [{ id: 8, x: 46, y: 36, name: 'Baraja' }], -8),
      buildHistoricalSquadFrame(10, [54, 34], [{ id: 10, x: 53, y: 34, name: 'Park J.S.' }, { id: 7, x: 62, y: 45, name: 'Seol K.H.' }], [{ id: 8, x: 52, y: 35, name: 'Baraja' }], -3),
      buildHistoricalSquadFrame(18, [60, 36], [{ id: 10, x: 58, y: 34, name: 'Park J.S.' }, { id: 7, x: 67, y: 43, name: 'Seol K.H.' }], [{ id: 8, x: 57.5, y: 34.4, name: 'Baraja' }], 2),
      buildHistoricalSquadFrame(30, [79, 41], [{ id: 10, x: 59, y: 34, name: 'Park J.S.' }, { id: 7, x: 78, y: 41, name: 'Seol K.H.' }], [{ id: 8, x: 61, y: 35, name: 'Baraja' }], 10),
    ],
    contact: {
      frame: 18,
      offender: 'away_8',
      victim: 'home_10',
      type: 'advantage_through_ball_foul',
      in_box: false,
      dogso: false,
      attempt_at_ball: true,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.94,
      correct_calls: ['advantage', 'play_on'],
      primary_law: 'IFAB Law 5 §3 — Advantage on Promising 3v2 Counter-Attack',
      law_quote:
        'The referee allows play to continue when an offence occurs and the non-offending team will benefit from the advantage.',
      var_hint: 'Watch winger #7 receiving the ball in open space—stopping play kills Korea’s 3v2 break!',
      explanation:
        'Blowing the whistle stops South Korea’s 3v2 breakaway! Under Law 5 §3, waving Play On / Advantage is the textbook World Cup referee decision.',
    },
    dissent: {
      speaker: 'Guus Hiddink (South Korea Head Coach)',
      role: 'coach',
      webtoon_sfx: 'UPPERCUT—!! (ROAR!!)',
      line: 'Ref!! Seol Ki-hyeon was clean through 3-on-2! Why blow the whistle when we had the advantage?!',
    },
  },
  {
    id: 'hist_2002_esp_3',
    league: '2002 World Cup QF',
    leagueId: 'k_league_1',
    title: 'Play 3 (74’ · 0-0) · Box Challenge Between Kim Tae-young (#19) & Diver (#11)',
    context: {
      minute: 74,
      score: '0-0 (2002 WC QF)',
      match: '2002 World Cup QF: South Korea vs. Spain',
      homeTeam: 'SOUTH KOREA',
      awayTeam: 'SPAIN',
      prior_cards: {},
      situation_summary:
        '74th Minute (0-0): Forward #11 bursts into the penalty area. Defender #19 plants his foot and pulls back 1.4 meters away with zero physical contact, yet #11 throws both arms up in a dramatic swan dive demanding a penalty!',
    },
    frames: [
      buildHistoricalSquadFrame(0, [74, 26], [{ id: 11, x: 73, y: 26, name: 'Forward #11' }], [{ id: 19, x: 78, y: 28, name: 'Defender #19' }], -2),
      buildHistoricalSquadFrame(10, [81, 27], [{ id: 11, x: 80, y: 27, name: 'Forward #11' }], [{ id: 19, x: 83, y: 28.5, name: 'Defender #19' }], 2),
      buildHistoricalSquadFrame(18, [86, 27], [{ id: 11, x: 85, y: 27, name: 'Forward #11' }], [{ id: 19, x: 86.2, y: 28.1, name: 'Defender #19' }], 5),
      buildHistoricalSquadFrame(30, [90, 26], [{ id: 11, x: 86.5, y: 26.5, name: 'Forward #11' }], [{ id: 19, x: 86.8, y: 28.4, name: 'Defender #19' }], 6),
    ],
    contact: {
      frame: 18,
      offender: 'home_11',
      victim: 'away_19',
      type: 'simulation_dive',
      in_box: true,
      dogso: false,
      attempt_at_ball: true,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.95,
      correct_calls: ['yellow', 'foul'],
      primary_law: 'IFAB Law 12 §3 — Cautions for Unsporting Behaviour (Simulation / Dive)',
      law_quote:
        'A player must be cautioned (Yellow Card) if they attempt to deceive the referee by feigning injury or pretending to have been fouled (simulation).',
      var_hint: 'Check the Close-Up Cam gap: there is a 1.4m gap with zero contact—who is trying to deceive you?',
      explanation:
        'Close-Up Cam confirms a 1.4m gap with zero contact! Forward #11 dived inside the box and must be cautioned with a Yellow Card for simulation.',
    },
    dissent: {
      speaker: 'José Antonio Camacho (Spain Head Coach)',
      role: 'coach',
      webtoon_sfx: '¡PENALTI! (GASP!!)',
      line: 'Check the replay monitor, Referee! Look at the gap between their boots before you point to the spot!',
    },
  },
  {
    id: 'hist_2002_esp_4',
    league: '2002 World Cup QF',
    leagueId: 'k_league_1',
    title: 'Play 4 (92’ ET · 0-0) · Golden Goal Box Shot & Outstretched Arm Block (#20)',
    context: {
      minute: 92,
      score: '0-0 ET (2002 WC QF)',
      match: '2002 World Cup QF: South Korea vs. Spain',
      homeTeam: 'SOUTH KOREA',
      awayTeam: 'SPAIN',
      prior_cards: {},
      situation_summary:
        '92nd Minute Extra Time (0-0): During Sudden-Death Golden Goal Extra Time, shooter #10 fires a curling strike toward the corner inside the penalty box! Defender #20 extends his arm 95° horizontally away from his torso and blocks the ball with his hand!',
    },
    frames: [
      buildHistoricalSquadFrame(0, [74, 38], [{ id: 10, x: 73, y: 38, name: 'Shooter #10' }], [{ id: 20, x: 82, y: 36, name: 'Nadal #20' }], 0),
      buildHistoricalSquadFrame(10, [80, 36], [{ id: 10, x: 78, y: 37, name: 'Shooter #10' }], [{ id: 20, x: 85, y: 35, name: 'Nadal #20' }], 3),
      buildHistoricalSquadFrame(18, [86.5, 35], [{ id: 10, x: 81, y: 36, name: 'Shooter #10' }], [{ id: 20, x: 86.8, y: 35, name: 'Nadal #20' }], 5),
      buildHistoricalSquadFrame(30, [84, 39], [{ id: 10, x: 82, y: 36, name: 'Shooter #10' }], [{ id: 20, x: 87, y: 35, name: 'Nadal #20' }], 5),
    ],
    contact: {
      frame: 18,
      offender: 'away_20',
      victim: 'home_10',
      type: 'unnatural_handball_in_box',
      in_box: true,
      dogso: false,
      attempt_at_ball: false,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.93,
      correct_calls: ['penalty', 'yellow'],
      primary_law: 'IFAB Law 12 §1 — Handling the Ball (Unnaturally Bigger Silhouette)',
      law_quote:
        'It is an offence if a player touches the ball with their hand/arm when it has made their body unnaturally bigger.',
      var_hint: 'Look at Defender #20’s arm angle in the Close-Up Cam (95° horizontal extension blocking a shot on goal).',
      explanation:
        'Defender #20 extended his arm 95° away from his torso inside the penalty box to block a goal-bound shot. Correct call: Penalty Kick (+ Yellow Card).',
    },
    dissent: {
      speaker: 'Hong Myung-bo (#20, South Korea Captain)',
      role: 'captain',
      webtoon_sfx: 'DAE—HAN—MIN—GUK!!',
      line: 'Referee! His arm was stretched all the way out at 90 degrees blocking a Golden Goal shot inside the box!!',
    },
  },
  {
    id: 'hist_2002_esp_5',
    league: '2002 World Cup QF',
    leagueId: 'k_league_1',
    title: 'Play 5 (119’ ET · 0-0) · Final Minute Counter-Attack Tactical Shirt Pull (#13 on #7)',
    context: {
      minute: 119,
      score: '0-0 ET (2002 WC QF)',
      match: '2002 World Cup QF: South Korea vs. Spain',
      homeTeam: 'SOUTH KOREA',
      awayTeam: 'SPAIN',
      prior_cards: {},
      situation_summary:
        '119th Minute (Seconds Before the 2002 Penalty Shootout!): Winger #7 sprints past Defender #13 along the right touchline on a final breakaway. Beaten for pace, #13 grabs a fistful of #7’s red jersey with both hands and drags him back!',
    },
    frames: [
      buildHistoricalSquadFrame(0, [58, 48], [{ id: 7, x: 57, y: 48, name: 'Seol K.H.' }], [{ id: 13, x: 55, y: 49, name: 'Defender #13' }], -4),
      buildHistoricalSquadFrame(10, [66, 48], [{ id: 7, x: 65, y: 48, name: 'Seol K.H.' }], [{ id: 13, x: 63.5, y: 48.5, name: 'Defender #13' }], 0),
      buildHistoricalSquadFrame(18, [72, 48], [{ id: 7, x: 71, y: 48, name: 'Seol K.H.' }], [{ id: 13, x: 70.2, y: 48.3, name: 'Defender #13' }], 3),
      buildHistoricalSquadFrame(30, [73, 49], [{ id: 7, x: 71.5, y: 48.5, name: 'Seol K.H.' }], [{ id: 13, x: 70.8, y: 48.5, name: 'Defender #13' }], 4),
    ],
    contact: {
      frame: 18,
      offender: 'away_13',
      victim: 'home_7',
      type: 'tactical_shirt_pull',
      in_box: false,
      dogso: false,
      attempt_at_ball: false,
    },
    auditor_check: {
      status: 'VERIFIED',
      confidence: 0.95,
      correct_calls: ['yellow', 'foul'],
      primary_law: 'IFAB Law 12 §3 — Stopping a Promising Attack (SPA Tactical Shirt Pull)',
      law_quote:
        'A player must be cautioned for unsporting behaviour if they hold an opponent to interfere with or stop a promising attack.',
      var_hint: 'Defender #13 grabbed Winger #7’s jersey outside the box with cover defenders still inside—SPA Yellow Card!',
      explanation:
        'Defender #13 deliberately held #7’s shirt to stop a promising wing attack outside the box. Correct call: Yellow Card + Direct Free Kick on Defender #13.',
    },
    dissent: {
      speaker: 'Joaquín (#21, Spain Winger)',
      role: 'captain',
      webtoon_sfx: 'TWEET—!! (120’ FULL TIME!)',
      line: 'It was just a tactical tug at midfield, Ref! Don’t send anyone off right before penalties!',
    },
  },
];

/**
 * 2. 2002 FIFA WORLD CUP ROUND OF 16: SOUTH KOREA vs. ITALY (Daejeon, June 18, 2002)
 */
const KOREA_ITALY_2002_INCIDENTS: MatchIncident[] = KOREA_SPAIN_2002_INCIDENTS.map((inc, idx) => {
  const titles = [
    'Play 1 (4’ · 0-0) · Panucci (#6) Box Takedown on Seol Ki-hyeon (#19)',
    'Play 2 (42’ · 0-1) · Park Ji-sung (#10) Midfield Trip & 3v2 Counter to Seol (#7)',
    'Play 3 (103’ ET · 1-1) · Francesco Totti (#11) vs. Song Chong-gug (#19) Box Dive Check',
    'Play 4 (88’ · 0-1) · Italy Defender (#20) 95° Outstretched Arm Block Inside the Box',
    'Play 5 (115’ ET · 1-1) · Gattuso (#13) Two-Handed Shirt Pull on Lee Chun-soo (#7)',
  ];
  const summaries = [
    '4th Minute (Daejeon World Cup Stadium): Italian defender Christian Panucci (#6) hauls down South Korea forward (#19) inside the penalty box with zero attempt to play the ball!',
    '42nd Minute (0-1): Park Ji-sung (#10) is clipped at midfield, but the loose ball rolls straight to Seol Ki-hyeon (#7) breaking into space on a 3v2 counter-attack!',
    '103rd Minute Golden Goal Extra Time (1-1): Italy #11 bursts into the box as Song Chong-gug (#19) pulls back 1.4m away—#11 launches into a dramatic dive looking for a penalty!',
    '88th Minute (0-1): South Korea fires a fierce equalizer attempt inside the box that hits Defender #20’s 95° horizontally outstretched arm!',
    '115th Minute Extra Time (1-1): Moments before Ahn Jung-hwan’s Golden Goal header, Italy #13 grabs Winger #7’s red shirt with both hands on the counter-attack!',
  ];
  const speakers = [
    'Paolo Maldini (#3, Italy Captain)',
    'Guus Hiddink (South Korea Head Coach)',
    'Giovanni Trapattoni (Italy Head Coach)',
    'Ahn Jung-hwan (#19, South Korea Forward)',
    'Francesco Totti (#10, Italy Playmaker)',
  ];
  return {
    ...inc,
    id: `hist_2002_ita_${idx + 1}`,
    league: '2002 World Cup R16',
    title: titles[idx],
    context: {
      ...inc.context,
      match: '2002 World Cup R16: South Korea vs. Italy',
      homeTeam: 'SOUTH KOREA',
      awayTeam: 'ITALY',
      score: idx === 0 ? '0-0' : idx === 1 || idx === 3 ? '0-1' : '1-1 ET',
      situation_summary: summaries[idx],
    },
    dissent: {
      ...inc.dissent,
      speaker: speakers[idx],
    },
  };
});

/**
 * 3. 2022 FIFA WORLD CUP FINAL: ARGENTINA vs. FRANCE (Lusail, Dec 18, 2022)
 */
const ARGENTINA_FRANCE_2022_INCIDENTS: MatchIncident[] = KOREA_SPAIN_2002_INCIDENTS.map((inc, idx) => {
  const titles = [
    'Play 1 (21’ · 0-0) · Di María (#19) 1v1 Box Breakaway Clipped From Behind (#6)',
    'Play 2 (36’ · 1-0) · Messi (#10) Midfield Trip & 3v2 Counter-Attack to Mac Allister (#7)',
    'Play 3 (87’ · 2-2) · Marcus Thuram (#11) Penalty Box Dive Check vs. Otamendi (#19)',
    'Play 4 (116’ ET · 3-2) · Mbappé (#10) Shot Blocked by Outstretched 95° Arm (#20) in Box',
    'Play 5 (95’ · 2-2) · Midfield Counter-Attack Two-Handed Jersey Pull (#13 on #7)',
  ];
  const summaries = [
    '21st Minute (Lusail Final): Ángel Di María (#19) beats his marker on the left side of the box and is clipped from behind on the trailing ankle with no touch on the ball!',
    '36th Minute (1-0): Messi (#10) is clipped at midfield while flicking a through-ball to #7 on a blistering 3v2 Argentina counter-attack!',
    '87th Minute (2-2): Forward #11 darts into the penalty area; Defender #19 pulls his leg back 1.4m away with zero contact, yet #11 dives looking for a late World Cup Final penalty!',
    '116th Minute Extra Time (3-2): A thunderous shot from the edge of the area strikes Defender #20’s 95° outstretched arm inside the penalty box!',
    '95th Minute (2-2): Winger #7 breaks down the flank on a counter-attack and is hauled back by a two-handed shirt grab from Defender #13!',
  ];
  const speakers = [
    'Hugo Lloris (France Captain)',
    'Lionel Scaloni (Argentina Head Coach)',
    'Didier Deschamps (France Head Coach)',
    'Kylian Mbappé (#10, France Forward)',
    'Lionel Messi (#10, Argentina Captain)',
  ];
  return {
    ...inc,
    id: `hist_2022_wc_${idx + 1}`,
    league: '2022 World Cup Final',
    title: titles[idx],
    context: {
      ...inc.context,
      match: '2022 World Cup Final: Argentina vs. France',
      homeTeam: 'ARGENTINA',
      awayTeam: 'FRANCE',
      score: idx === 0 ? '0-0' : idx === 1 ? '1-0' : idx === 3 ? '3-2 ET' : '2-2',
      situation_summary: summaries[idx],
    },
    dissent: {
      ...inc.dissent,
      speaker: speakers[idx],
    },
  };
});

export const HISTORICAL_MATCH_PRESETS: HistoricalMatchPreset[] = [
  {
    id: 'wc2002_kor_esp',
    shortLabel: '🇰🇷🇪🇸 2002 WC: Korea vs Spain',
    fullTitle: '2002 FIFA World Cup Quarter-Final: South Korea vs. Spain',
    competitionTag: '2002 WORLD CUP QF',
    dateVenue: 'June 22, 2002 · Gwangju World Cup Stadium',
    fotmobMatchId: 'fotmob-2002-wc-qf-kor-esp',
    homeTeam: 'SOUTH KOREA',
    awayTeam: 'SPAIN',
    summary:
      'Step into the boots of the referee for the legendary 2002 World Cup Quarter-Final in Gwangju (0-0 AET, 5-3 PEN)—featuring Ahn Jung-hwan, Park Ji-sung, Hong Myung-bo, Joaquín, Morientes, and Hierro!',
    incidents: KOREA_SPAIN_2002_INCIDENTS,
  },
  {
    id: 'wc2002_kor_ita',
    shortLabel: '🇰🇷🇮🇹 2002 WC: Korea vs Italy',
    fullTitle: '2002 FIFA World Cup Round of 16: South Korea vs. Italy',
    competitionTag: '2002 WORLD CUP R16',
    dateVenue: 'June 18, 2002 · Daejeon World Cup Stadium',
    fotmobMatchId: 'fotmob-2002-wc-r16-kor-ita',
    homeTeam: 'SOUTH KOREA',
    awayTeam: 'ITALY',
    summary:
      'Officiate the iconic 2002 Round of 16 thriller in Daejeon (2-1 Golden Goal)—early box penalty check, Totti’s extra-time simulation dive check, and Golden Goal chaos!',
    incidents: KOREA_ITALY_2002_INCIDENTS,
  },
  {
    id: 'wc2022_arg_fra',
    shortLabel: '🇦🇷🇫🇷 2022 WC Final: ARG vs FRA',
    fullTitle: '2022 FIFA World Cup Final: Argentina vs. France',
    competitionTag: '2022 WORLD CUP FINAL',
    dateVenue: 'December 18, 2022 · Lusail Stadium',
    fotmobMatchId: 'fotmob-2022-wc-final-arg-fra',
    homeTeam: 'ARGENTINA',
    awayTeam: 'FRANCE',
    summary:
      'Referee the greatest World Cup Final in history (3-3 AET)—Di María’s 1v1 box clip, Argentina’s 3v2 counter-attack, Thuram’s 87th-minute simulation dive, and the 116th-minute extra-time handball penalty!',
    incidents: ARGENTINA_FRANCE_2022_INCIDENTS,
  },
];
