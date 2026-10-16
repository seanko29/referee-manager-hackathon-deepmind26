import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  LEAGUES,
  REFEREE_ARCHETYPES,
  auditIncidentFrames,
  type LeagueId,
  type RefereeArchetypeId,
  type MatchIncident,
} from './src/game/rules.ts';
import { INITIAL_INCIDENTS } from './src/game/scenarios.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IFAB_UNIFIED_CONTEXT_PROMPT = `
[IFAB LAWS OF THE GAME 2025/26 — 1M UNIFIED CONTEXT CACHE]
- Law 5 (The Referee — Advantage §3): The referee allows play to continue when an offence occurs and the non-offending team will benefit from the advantage, and penalises the offence if the anticipated advantage does not ensue at that time or within a few seconds.
- Law 11 (Offside §2): A player in an offside position at the moment the ball is played by a teammate is only penalised on becoming involved in active play by: interfering with play, interfering with an opponent (preventing an opponent from playing the ball by clearly obstructing the opponent's line of vision), or gaining an advantage.
- Law 12 (Fouls and Misconduct §1 — Handling the Ball): It is an offence if a player deliberately touches the ball with their hand/arm, or touches the ball with their hand/arm when it has made their body unnaturally bigger. Exception: If the ball deflects directly from the player's own head or body (including the foot) onto their supporting arm close to the body, it is not a handball offence.
- Law 12 (Fouls and Misconduct §3 — Disciplinary Action / DOGSO & Double Jeopardy):
  * Where a player commits an offence against an opponent within their own penalty area which denies an opponent an obvious goal-scoring opportunity (DOGSO) and the referee awards a penalty kick, the offender is cautioned (Yellow Card) if the offence was an attempt to play the ball or a challenge for the ball.
  * In all other circumstances (e.g. holding, pulling, pushing, tackle from behind with no possibility/attempt to play the ball), the offending player must be sent off (Red Card).
- Law 12 (§3 — Cautions for Unsporting Behaviour / Simulation): A player must be cautioned (Yellow Card) if they attempt to deceive the referee by feigning injury or pretending to have been fouled (simulation).
- VAR Protocol (Clear and Obvious Error): VAR may only intervene in four match-changing situations: (1) Goal / No Goal, (2) Penalty / No Penalty, (3) Direct Red Card (not second yellow), (4) Mistaken Identity.
`;

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  /**
   * 1. Loop 1 Autonomous Incident Generation & Auditor Verification (`DirectorAgent` ⇄ `AuditorAgent`)
   */
  app.post('/api/argon/generate-incident', async (req, res) => {
    const { leagueId = 'k_league_1', archetype = 'var_purist' } = req.body as {
      leagueId?: LeagueId;
      archetype?: RefereeArchetypeId;
    };

    const league = LEAGUES[leagueId] ?? LEAGUES.k_league_1;
    const arch = REFEREE_ARCHETYPES[archetype] ?? REFEREE_ARCHETYPES.var_purist;

    try {
      const ai = getAiClient();

      // Step 1: DirectorAgent + AuditorAgent in a single structured Gemini 4 Argon pass
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `Generate 1 high-stakes football match refereeing incident for ${league.name} (${league.featuredMatch}: ${league.homeTeam} vs ${league.awayTeam}).
Tactical context: ${league.tacticalStyle}
Cultural dissent style: ${league.culturalDissentStyle}
Referee archetype: ${arch.name} — ${arch.promptDirective}

Also include 1 realistic "discarded_draft" log entry showing an initial ambiguous geometry draft (confidence between 0.55 and 0.78) that the AuditorAgent rejected before locking in this verified incident (confidence >= 0.90).`,
        config: {
          systemInstruction: `${IFAB_UNIFIED_CONTEXT_PROMPT}
You are the WHISTLE Multi-Agent Swarm (DirectorAgent + AuditorAgent + DissentAgent). Output strictly valid JSON matching the schema.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              discarded_draft: {
                type: Type.OBJECT,
                properties: {
                  confidence: { type: Type.NUMBER },
                  lawRef: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['confidence', 'lawRef', 'reason'],
              },
              incident: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  minute: { type: Type.INTEGER },
                  score: { type: Type.STRING },
                  situation_summary: { type: Type.STRING },
                  contact_type: {
                    type: Type.STRING,
                    description:
                      'One of: tackle_from_behind_no_ball, late_sliding_tackle, tactical_shirt_pull, simulation_dive, unnatural_handball_in_box, advantage_through_ball_foul',
                  },
                  in_box: { type: Type.BOOLEAN },
                  dogso: { type: Type.BOOLEAN },
                  correct_calls: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Subset of: play_on, foul, advantage, yellow, red, penalty',
                  },
                  primary_law: { type: Type.STRING },
                  law_quote: { type: Type.STRING },
                  var_hint: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  dissent_speaker: { type: Type.STRING },
                  dissent_role: { type: Type.STRING },
                  dissent_sfx: { type: Type.STRING },
                  dissent_line: { type: Type.STRING },
                },
                required: [
                  'title',
                  'minute',
                  'score',
                  'situation_summary',
                  'contact_type',
                  'in_box',
                  'dogso',
                  'correct_calls',
                  'primary_law',
                  'law_quote',
                  'var_hint',
                  'explanation',
                  'confidence',
                  'dissent_speaker',
                  'dissent_role',
                  'dissent_sfx',
                  'dissent_line',
                ],
              },
            },
            required: ['discarded_draft', 'incident'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const genInc = parsed.incident;
      const baseTemplate = INITIAL_INCIDENTS[0];

      const inBox = Boolean(genInc.in_box);
      const contactX = inBox ? 88.0 : 62.0;
      const contactY = 34.0;

      const builtIncident: MatchIncident = {
        id: `inc_argon_${Date.now().toString().slice(-4)}`,
        league: league.name,
        leagueId: league.id,
        title: genInc.title || `${genInc.minute}’ ${league.name} Tactical Review`,
        context: {
          minute: genInc.minute || 84,
          score: genInc.score || '1-1',
          match: league.featuredMatch,
          homeTeam: league.homeTeam,
          awayTeam: league.awayTeam,
          prior_cards: { away_4: 'yellow' },
          situation_summary: genInc.situation_summary,
        },
        frames: baseTemplate.frames.map((f) => {
          if (f.t === 18) {
            return {
              ...f,
              ball: [contactX + 0.8, contactY],
              home: f.home.map((p) => (p.id === 9 ? { ...p, x: contactX, y: contactY } : p)),
              away: f.away.map((p) =>
                p.id === 4 ? { ...p, x: contactX - 0.7, y: contactY + 0.4 } : p
              ),
            };
          }
          return f;
        }),
        contact: {
          frame: 18,
          offender: 'away_4',
          victim: 'home_9',
          type: (genInc.contact_type as MatchIncident['contact']['type']) || 'tackle_from_behind_no_ball',
          in_box: inBox,
          dogso: Boolean(genInc.dogso),
          attempt_at_ball: !genInc.dogso,
        },
        auditor_check: {
          status: 'VERIFIED',
          confidence: Math.max(0.88, Math.min(0.99, Number(genInc.confidence) || 0.94)),
          correct_calls: (genInc.correct_calls || ['red', 'penalty']).filter((c: string) =>
            ['play_on', 'foul', 'advantage', 'yellow', 'red', 'penalty'].includes(c)
          ),
          primary_law: genInc.primary_law,
          law_quote: genInc.law_quote,
          var_hint: genInc.var_hint,
          explanation: genInc.explanation,
        },
        dissent: {
          speaker: genInc.dissent_speaker || `${league.awayTeam} Captain (#4)`,
          role: genInc.dissent_role === 'coach' ? 'coach' : 'captain',
          webtoon_sfx: genInc.dissent_sfx || league.defaultSfx,
          line: genInc.dissent_line,
        },
      };

      // Run Loop 1 physical & legal audit check
      const auditResult = auditIncidentFrames(builtIncident);

      res.json({
        model: 'gemini-4-argon',
        discarded_draft: parsed.discarded_draft,
        audit_verification: auditResult,
        incident: builtIncident,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gemini 4 Argon generation error';
      res.status(500).json({ error: msg });
    }
  });

  /**
   * 2. Standalone Live VAR Desk Debate (`On-Field Ref Agent` vs `Head VAR Agent`)
   * Supports text situation + optional uploaded frame image (`inlineData`)
   */
  app.post('/api/argon/var-desk-debate', async (req, res) => {
    const {
      scenarioText,
      onFieldInitialCall = 'Play On / Undecided',
      leagueId = 'k_league_1',
      imageBase64,
      imageMimeType,
    } = req.body as {
      scenarioText: string;
      onFieldInitialCall?: string;
      leagueId?: LeagueId;
      imageBase64?: string;
      imageMimeType?: string;
    };

    if (!scenarioText || !scenarioText.trim()) {
      res.status(400).json({ error: 'Please provide a match situation description.' });
      return;
    }

    const league = LEAGUES[leagueId] ?? LEAGUES.k_league_1;

    try {
      const ai = getAiClient();
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      if (imageBase64 && imageMimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType,
          },
        });
      }

      parts.push({
        text: `Analyze this controversial football match incident in ${league.name}:
Situation: "${scenarioText}"
On-Field Referee Initial Call: "${onFieldInitialCall}"

Conduct a structured multi-agent VAR Protocol verification between:
1. OnFieldAgent (explaining the real-time pitch-level view and initial decision rationale)
2. HeadVARAgent (performing forensic frame/geometry analysis against the 1M IFAB Laws of the Game context)
3. Final IFAB Ruling Card (whether a Clear and Obvious Error occurred, OFR recommendation, exact IFAB Law citation, verbatim quote <= 25 words, final disciplinary + restart call, and confidence 0.0-1.0).`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: { parts },
        config: {
          systemInstruction: `${IFAB_UNIFIED_CONTEXT_PROMPT}
You are the official WHISTLE Live VAR Desk powered by Gemini 4 Argon. Output strictly valid JSON.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              on_field_agent_view: { type: Type.STRING },
              head_var_agent_rebuttal: { type: Type.STRING },
              clear_and_obvious_error: { type: Type.BOOLEAN },
              ofr_recommended: { type: Type.BOOLEAN },
              final_ruling_call: { type: Type.STRING },
              disciplinary_card: {
                type: Type.STRING,
                description: 'None, Yellow Card, or Red Card',
              },
              restart_type: {
                type: Type.STRING,
                description: 'Penalty Kick, Direct Free Kick, Indirect Free Kick, Drop Ball, Goal, or Play On',
              },
              law_ref: { type: Type.STRING },
              law_quote: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              key_geometry_factors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'on_field_agent_view',
              'head_var_agent_rebuttal',
              'clear_and_obvious_error',
              'ofr_recommended',
              'final_ruling_call',
              'disciplinary_card',
              'restart_type',
              'law_ref',
              'law_quote',
              'confidence',
              'key_geometry_factors',
            ],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json({
        model: 'gemini-4-argon',
        ...data,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'VAR Desk analysis error';
      res.status(500).json({ error: msg });
    }
  });

  /**
   * 3. Gemini 3.8 Flash TTS Voice Dissent Generator (`gemini-3.8-flash-tts`)
   */
  app.post('/api/argon/tts-dissent', async (req, res) => {
    const { text, speaker = 'Captain' } = req.body as { text: string; speaker?: string };
    if (!text) {
      res.status(400).json({ error: 'Missing text for TTS synthesis.' });
      return;
    }

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${speaker}: ${text}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(500).json({ error: 'No audio data returned from TTS model.' });
        return;
      }

      res.json({
        model: 'gemini-3.8-flash-lite-tts',
        audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'TTS generation failed';
      res.status(500).json({ error: msg });
    }
  });

  /**
   * 4. Nano Banana (`gemini-3.1-flash-lite-image`) K-Webtoon Referee ID Badge Generator
   */
  app.post('/api/argon/referee-portrait', async (req, res) => {
    const {
      refereeName = 'Kim Min-jun',
      kitColor = 'neon_yellow',
      leagueName = 'K League 1',
      archetypeName = 'Strict Disciplinarian',
    } = req.body as {
      refereeName?: string;
      kitColor?: RefereeKitColor;
      leagueName?: string;
      archetypeName?: string;
    };

    const kitDesc =
      kitColor === 'cyber_pink'
        ? 'electric magenta pink and black'
        : kitColor === 'classic_black'
        ? 'classic all-black obsidian with gold trim'
        : 'high-visibility neon volt yellow and black';

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: `16-bit retro pixel art chibi soccer referee character "${refereeName}" (${archetypeName} style) standing on a green pixel grass soccer pitch with stadium floodlights and blue sky in the background, wearing a ${kitDesc} FIFA ${leagueName} referee uniform holding a silver whistle and red card, big expressive chibi head with bold black pixel outlines, Football Player Maker mobile game pixel art style, 1:1 avatar, no text or watermarks.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: 'No image returned from Nano Banana model.' });
        return;
      }

      res.json({
        model: 'gemini-3.1-flash-lite-image',
        imageUrl,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Portrait generation failed';
      res.status(500).json({ error: msg });
    }
  });

  /**
   * 5. AssessorAgent Post-Match Executive Critique (`gemini-4-argon`)
   */
  app.post('/api/argon/assessor-critique', async (req, res) => {
    const { refereeName, leagueName, archetypeName, finalRating, evaluations } = req.body;
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `Write a concise, authoritative 3-sentence FIFA/IFAB Match Assessor performance evaluation for Referee ${refereeName} (${archetypeName}) in ${leagueName}.
Final Match Rating: ${finalRating}/10.
Incident Decisions Summary: ${JSON.stringify(evaluations || [])}.
Cite specific IFAB Laws of the Game principles and state why they earned Promotion, Retention, or Relegation.`,
        config: {
          systemInstruction: `${IFAB_UNIFIED_CONTEXT_PROMPT}
You are the Chief IFAB Match Assessor Agent. Be crisp, specific, and authoritative.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({
        model: 'gemini-4-argon',
        critique: response.text || '',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Assessor critique failed';
      res.status(500).json({ error: msg });
    }
  });

  /**
   * 6. Live 1M-Context Legal Reasoning on Player Call (`/api/argon/var-review`)
   * Eliminates "black-box grading" by explaining the exact IFAB legal reasoning for the player's specific call.
   */
  app.post('/api/argon/var-review', async (req, res) => {
    const {
      incidentTitle,
      situationSummary,
      leagueName,
      playerInitialCall,
      playerFinalCall,
      playerTargetLabel,
      expectedTargetLabel,
      expectedCalls,
      primaryLaw,
      verdict,
    } = req.body;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `Match Incident (${leagueName}): "${incidentTitle}" — ${situationSummary}
Player Initial Call: [${playerInitialCall}]
Player Final Call: [${playerFinalCall}] on Target Player [${playerTargetLabel || 'N/A'}]
Ground Truth IFAB Call(s): ${JSON.stringify(expectedCalls)} on True Offender [${expectedTargetLabel || 'N/A'}]
Applicable Law: ${primaryLaw}
Verdict: ${verdict}

In 2 crisp, authoritative sentences (<= 45 words total), explain to the referee WHY their call was ${verdict} under the 200-page IFAB Laws of the Game, explicitly noting if they booked the wrong player or refused VAR correction.`,
        config: {
          systemInstruction: `${IFAB_UNIFIED_CONTEXT_PROMPT}
You are the WHISTLE 1M-Context VAR Legal Reasoning Agent. Never give generic 'Wrong Call' feedback; always explain the exact IFAB rule mechanics.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({
        model: 'gemini-4-argon',
        legalReasoning: response.text || '',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'VAR legal reasoning failed';
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WHISTLE Server listening on http://localhost:${PORT}`);
  });
}

startServer();
