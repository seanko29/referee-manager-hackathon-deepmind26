import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditIncidentFrames,
  evaluateRefereeCall,
  interpolateFrameAtTime,
  compileAssessorReport,
  type MatchIncident,
} from './rules.ts';

const sampleDogsoIncident: MatchIncident = {
  id: 'inc_01',
  league: 'K League 1',
  leagueId: 'k_league_1',
  title: '82’ Derby DOGSO Tackle Inside Box',
  context: {
    minute: 82,
    score: '1-1',
    match: 'Seoul vs Ulsan',
    homeTeam: 'FC SEOUL',
    awayTeam: 'ULSAN HD',
    prior_cards: { away_4: 'yellow' },
    situation_summary:
      'Seoul #9 breaks through 1v1 inside the penalty area; Ulsan Captain #4 slides from behind without playing the ball.',
  },
  frames: [
    {
      t: 0,
      ball: [72, 34],
      home: [{ id: 9, x: 70, y: 34, role: 'FWD', name: 'Iljutcenko' }],
      away: [{ id: 4, x: 75, y: 36, role: 'DEF', name: 'Kim Kee-hee' }],
    },
    {
      t: 18,
      ball: [89, 34],
      home: [{ id: 9, x: 88, y: 34, role: 'FWD', name: 'Iljutcenko' }],
      away: [{ id: 4, x: 87.2, y: 34.4, role: 'DEF', name: 'Kim Kee-hee' }],
    },
    {
      t: 30,
      ball: [93, 35],
      home: [{ id: 9, x: 89.5, y: 34.2, role: 'FWD', name: 'Iljutcenko' }],
      away: [{ id: 4, x: 88.5, y: 34.8, role: 'DEF', name: 'Kim Kee-hee' }],
    },
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
      'VAR Check: Defender made zero attempt to play the ball inside the box while striker was 1v1 with the keeper. Review Law 12 DOGSO criteria.',
    explanation:
      'Because the defender pulled/tackled from behind with no play on the ball, double-jeopardy downgrade does not apply. Red card + Penalty is mandatory.',
  },
  dissent: {
    speaker: 'Ulsan Captain (#4)',
    role: 'captain',
    webtoon_sfx: '삐이이익—!! (WHISTLE!!)',
    line: '심판님! 공 보고 들어갔잖아요! 이게 어떻게 다이렉트 퇴장입니까?! (Ref! I went for the ball! How is that a straight red?!)',
  },
};

test('Loop 1 Auditor verifies valid DOGSO incident with confidence >= 0.85', () => {
  const result = auditIncidentFrames(sampleDogsoIncident);
  assert.equal(result.verified, true);
  assert.equal(result.confidence, 0.95);
});

test('Loop 1 Auditor rejects incident when confidence < 0.85 or contact distance is impossible', () => {
  const lowConfIncident: MatchIncident = {
    ...sampleDogsoIncident,
    auditor_check: {
      ...sampleDogsoIncident.auditor_check,
      confidence: 0.72,
    },
  };
  const res1 = auditIncidentFrames(lowConfIncident);
  assert.equal(res1.verified, false);

  const farContactIncident: MatchIncident = {
    ...sampleDogsoIncident,
    frames: [
      {
        t: 18,
        ball: [89, 34],
        home: [{ id: 9, x: 88, y: 34 }],
        away: [{ id: 4, x: 60, y: 10 }],
      },
    ],
  };
  const res2 = auditIncidentFrames(farContactIncident);
  assert.equal(res2.verified, false);
});

test('Loop 2 VAR OFR matches PRD JSON specification for Yellow -> Red Overturn', () => {
  const evalResult = evaluateRefereeCall({
    incident: sampleDogsoIncident,
    initialCall: 'yellow',
    finalCall: 'red',
    currentRating: 7.5,
    archetype: 'var_purist',
  });

  assert.equal(evalResult.player_initial_call, 'yellow');
  assert.equal(evalResult.ofr_required, true);
  assert.equal(evalResult.player_final_call, 'red');
  assert.equal(evalResult.verdict, 'OVERTURNED_CORRECT');
  assert.equal(evalResult.rating_delta, 6);
  assert.equal(evalResult.new_rating, 8.1);
  assert.equal(evalResult.law_ref, 'IFAB Law 12 §3 — Disciplinary Action (DOGSO)');
});

test('interpolateFrameAtTime smoothly interpolates player & ball coordinates', () => {
  const mid = interpolateFrameAtTime(sampleDogsoIncident.frames, 9);
  assert.equal(mid.t, 9);
  assert.equal(mid.ball[0], 80.5);
  assert.equal(mid.home[0].x, 79);
});

test('compileAssessorReport promotes elite referees with high accuracy and rating >= 8.2', () => {
  const e1 = evaluateRefereeCall({
    incident: sampleDogsoIncident,
    initialCall: 'red',
    currentRating: 8.0,
    archetype: 'strict',
  });
  const report = compileAssessorReport([e1], e1.new_rating);
  assert.equal(report.careerStatus, 'FIFA_ELITE_PROMOTION');
  assert.equal(report.accuracyPercent, 100);
});

test('Play 3 Simulation Dive: Yellow Card to Attacker is CORRECT_INITIAL (+0.6), whereas Defender or Stand Firm is CLEAR_ERROR_UNCORRECTED (-0.9)', () => {
  const diveIncident: MatchIncident = {
    ...sampleDogsoIncident,
    id: 'inc_03',
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
      ...sampleDogsoIncident.auditor_check,
      correct_calls: ['yellow'],
      acceptable_secondary_calls: [],
      primary_law: 'IFAB Law 12 §3 — Cautions for Unsporting Behaviour (Simulation)',
    },
  };

  // 1. Correct call: Yellow Card to Attacker (#11)
  const correctDiveCall = evaluateRefereeCall({
    incident: diveIncident,
    initialCall: 'yellow',
    targetRole: 'attacker',
    currentRating: 7.5,
    archetype: 'var_purist',
  });
  assert.equal(correctDiveCall.verdict, 'CORRECT_INITIAL');
  assert.equal(correctDiveCall.ofr_required, false);
  assert.equal(correctDiveCall.rating_delta, 7);
  assert.equal(correctDiveCall.new_rating, 8.2);

  // 2. Wrong player: Yellow Card to Defender (#19) -> triggers OFR, and Standing Firm gives -0.9 penalty
  const wrongPlayerInitial = evaluateRefereeCall({
    incident: diveIncident,
    initialCall: 'yellow',
    targetRole: 'defender',
    currentRating: 7.5,
    archetype: 'var_purist',
  });
  assert.equal(wrongPlayerInitial.ofr_required, true);

  const stoodFirmWrongPlayer = evaluateRefereeCall({
    incident: diveIncident,
    initialCall: 'yellow',
    finalCall: 'yellow',
    targetRole: 'defender',
    finalTargetRole: 'defender',
    currentRating: 7.5,
    archetype: 'var_purist',
  });
  assert.equal(stoodFirmWrongPlayer.verdict, 'CLEAR_ERROR_UNCORRECTED');
  assert.equal(stoodFirmWrongPlayer.rating_delta, -9);
  assert.equal(stoodFirmWrongPlayer.new_rating, 6.6);
});

