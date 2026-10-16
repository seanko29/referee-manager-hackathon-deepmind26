import React, { useEffect, useRef } from 'react';
import {
  drawChibiPixelCharacter,
  type ChibiHairStyle,
} from './RetroPixelRenderer';
import {
  LEAGUES,
  type LeagueId,
  type RefereeArchetypeId,
  type RefereeKitColor,
} from '../game/rules';

interface RetroRefereeMakerStageProps {
  refereeName: string;
  onChangeName: (name: string) => void;
  kitColor: RefereeKitColor;
  onChangeKitColor: (kit: RefereeKitColor) => void;
  hairStyle: ChibiHairStyle;
  onChangeHairStyle: (hair: ChibiHairStyle) => void;
  hairColor: string;
  onChangeHairColor: (hex: string) => void;
  skinColor: string;
  onChangeSkinColor: (hex: string) => void;
  archetypeId: RefereeArchetypeId;
  onChangeArchetype: (arch: RefereeArchetypeId) => void;
  selectedLeagueId: LeagueId;
  onChangeLeague: (lid: LeagueId) => void;
  portraitUrl: string;
  isGeneratingPortrait: boolean;
  onGeneratePortrait: () => void;
  onStartMatch: () => void;
  onOpenVarDesk: () => void;
}

const ALL_LEAGUE_IDS: LeagueId[] = [
  'k_league_1',
  'premier_league',
  'laliga',
  'bundesliga',
  'serie_a',
  'ligue_1',
];

export const RetroRefereeMakerStage: React.FC<RetroRefereeMakerStageProps> = ({
  refereeName,
  onChangeName,
  kitColor,
  onChangeKitColor,
  hairStyle,
  onChangeHairStyle,
  hairColor,
  onChangeHairColor,
  skinColor,
  onChangeSkinColor,
  archetypeId,
  onChangeArchetype,
  selectedLeagueId,
  onChangeLeague,
  portraitUrl,
  isGeneratingPortrait,
  onGeneratePortrait,
  onStartMatch,
  onOpenVarDesk,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const kitHex =
    kitColor === 'cyber_pink'
      ? '#F43F5E'
      : kitColor === 'classic_black'
      ? '#1E293B'
      : '#A3E635';

  const hairStyleLabelMap: Record<ChibiHairStyle, string> = {
    spiky_ahoge: 'Spiky Anime',
    buzz_captain: 'Buzz + Band',
    messy_shock: 'Messy Curly',
    red_cap: 'Pro Red Cap',
    ponytail: 'High Ponytail',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const startTs = performance.now();

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      const t = (now - startTs) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Bright Pixel Blue Sky (Matching Image 2 "FOOTBALL PLAYER MAKER")
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(0, 0, w, 195);

      // Pixel Clouds drifting gently
      const drawCloud = (cx: number, cy: number, cw: number) => {
        ctx.fillStyle = '#FFFBEB';
        ctx.fillRect(cx, cy, cw, 18);
        ctx.fillRect(cx + 12, cy - 10, cw - 24, 12);
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(cx, cy + 14, cw, 4);
      };
      drawCloud(((40 + t * 8) % (w + 120)) - 60, 42, 92);
      drawCloud(((w - 140 + t * 5) % (w + 120)) - 60, 56, 110);

      // 2. Left Stadium Floodlight Tower (Matching Image 2!)
      ctx.fillStyle = '#09090B';
      ctx.fillRect(24, 68, 16, 120);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(27, 70, 10, 116);
      // Floodlight Lamp Grid
      ctx.fillStyle = '#09090B';
      ctx.fillRect(10, 40, 44, 30);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#FEF08A' : '#FFFFFF';
          ctx.fillRect(14 + c * 9, 44 + r * 8, 7, 6);
        }
      }

      // 3. Stadium Grandstands & Pixel Crowd in Background
      ctx.fillStyle = '#64748B';
      ctx.fillRect(60, 118, w - 120, 75);
      ctx.strokeStyle = '#09090B';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 118, w - 120, 75);

      // Pixel Crowd Dots
      const crowdCols = ['#EF4444', '#FACC15', '#3B82F6', '#22C55E', '#F97316', '#FFFFFF'];
      for (let py = 126; py < 178; py += 9) {
        for (let px = 76; px < w - 76; px += 11) {
          ctx.fillStyle = crowdCols[(px * 3 + py * 7) % crowdCols.length];
          ctx.fillRect(px, py + ((Math.floor(t * 4 + px) % 2) * 2), 6, 6);
        }
      }

      // 4. Pixel Grass Turf (Bottom half of canvas, matching Image 1 & Image 2!)
      ctx.fillStyle = '#559E32';
      ctx.fillRect(0, 185, w, h - 185);

      // White Touchline Wall
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 180, w, 12);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 183, w, 6);

      // Darker Green Pixel Grass Tufts ("^" pattern from Image 1 & 2)
      ctx.fillStyle = '#3F7E21';
      for (let gy = 205; gy < h - 10; gy += 28) {
        for (let gx = 20; gx < w - 20; gx += 44) {
          const offset = (gy % 56 === 0 ? 18 : 0);
          ctx.fillRect(gx + offset, gy, 4, 4);
          ctx.fillRect(gx + offset + 4, gy - 3, 4, 4);
          ctx.fillRect(gx + offset + 8, gy, 4, 4);
        }
      }

      // 5. Golden 3-Star Pixel Crest Shield at Top Center (Matching Image 2!)
      const cx = w / 2;
      ctx.fillStyle = '#09090B';
      ctx.fillRect(cx - 42, 8, 84, 58);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(cx - 38, 12, 76, 50);
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(cx - 32, 18, 64, 38);
      // 3 Gold Stars
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(cx - 22, 22, 8, 8);
      ctx.fillRect(cx - 4, 19, 8, 8);
      ctx.fillRect(cx + 14, 22, 8, 8);

      // 6. Back Row of 5 Cheerful Chibi Pixel Cast Characters (Matching Image 2!)
      const backY = 238;
      // Left-1: Red Cap Coach
      drawChibiPixelCharacter(ctx, {
        x: cx - 190,
        y: backY,
        scale: 0.92,
        shirtColor: '#94A3B8',
        shortsColor: '#1E293B',
        hairStyle: 'red_cap',
        pose: 'victory',
        animPhase: t + 0.4,
      });
      // Left-2: Veteran Assessor
      drawChibiPixelCharacter(ctx, {
        x: cx - 98,
        y: backY - 4,
        scale: 0.92,
        shirtColor: '#334155',
        shortsColor: '#0F172A',
        hairColor: '#94A3B8',
        hairStyle: 'buzz_captain',
        pose: 'wave_appeal',
        animPhase: t + 1.1,
      });
      // Center-Back: Passionate Manager in Red Shirt
      drawChibiPixelCharacter(ctx, {
        x: cx,
        y: backY - 6,
        scale: 0.94,
        shirtColor: '#DC2626',
        shortsColor: '#1E293B',
        hairColor: '#09090B',
        hairStyle: 'buzz_captain',
        pose: 'victory',
        animPhase: t + 2.0,
      });
      // Right-2: Home Striker
      drawChibiPixelCharacter(ctx, {
        x: cx + 98,
        y: backY - 4,
        scale: 0.92,
        shirtColor: '#15803D',
        shortsColor: '#FFFFFF',
        hairColor: '#111827',
        hairStyle: 'spiky_ahoge',
        pose: 'wave_appeal',
        animPhase: t + 0.8,
      });
      // Right-1: Assistant Referee
      drawChibiPixelCharacter(ctx, {
        x: cx + 190,
        y: backY,
        scale: 0.92,
        shirtColor: '#7C3AED',
        shortsColor: '#1E1B4B',
        hairColor: '#451A03',
        hairStyle: 'ponytail',
        pose: 'victory',
        animPhase: t + 1.6,
      });

      // 7. Middle Row of 4 Players (Captain with Yellow Armband, Training Bib Player, Tracksuit)
      const midY = 286;
      drawChibiPixelCharacter(ctx, {
        x: cx - 155,
        y: midY,
        scale: 1.0,
        shirtColor: '#1E3A8A',
        shortsColor: '#FFFFFF',
        skinColor: '#C68652',
        hairColor: '#111827',
        hairStyle: 'buzz_captain',
        hasCaptainBand: true,
        pose: 'captain_protest',
        animPhase: t + 0.5,
      });
      drawChibiPixelCharacter(ctx, {
        x: cx - 78,
        y: midY + 4,
        scale: 1.0,
        shirtColor: '#A3E635',
        shortsColor: '#FFFFFF',
        hairColor: '#78350F',
        hairStyle: 'spiky_ahoge',
        pose: 'victory',
        animPhase: t + 1.2,
      });
      drawChibiPixelCharacter(ctx, {
        x: cx + 82,
        y: midY + 4,
        scale: 1.0,
        shirtColor: '#1E293B',
        shortsColor: '#334155',
        hairColor: '#78350F',
        hairStyle: 'ponytail',
        pose: 'wave_appeal',
        animPhase: t + 1.8,
      });
      drawChibiPixelCharacter(ctx, {
        x: cx + 158,
        y: midY,
        scale: 1.0,
        shirtColor: '#18181B',
        shortsColor: '#18181B',
        hairColor: '#111827',
        hairStyle: 'spiky_ahoge',
        pose: 'running',
        animPhase: t,
      });

      // Golden Spotlight Ring under Center Custom Referee Hero
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, 348, 42, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 8. FRONT & CENTER: YOUR CUSTOM CHIBI PIXEL REFEREE HERO!
      drawChibiPixelCharacter(ctx, {
        x: cx,
        y: 348,
        scale: 1.52,
        shirtColor: kitHex,
        shortsColor: '#111827',
        socksColor: '#111827',
        skinColor,
        hairColor,
        hairStyle,
        pose: 'referee_yellow',
        animPhase: t,
        isReferee: true,
        label: `REF ${refereeName || 'M. KIM'} (${hairStyleLabelMap[hairStyle]})`,
      });

      // 9. Also render the Zoomed-In Close-Up Chibi Avatar Preview Card on the right!
      const avCanvas = avatarCanvasRef.current;
      if (avCanvas) {
        const actx = avCanvas.getContext('2d');
        if (actx) {
          const aw = avCanvas.width;
          const ah = avCanvas.height;
          actx.clearRect(0, 0, aw, ah);
          actx.fillStyle = '#38BDF8';
          actx.fillRect(0, 0, aw, ah * 0.68);
          actx.fillStyle = '#559E32';
          actx.fillRect(0, ah * 0.68, aw, ah * 0.32);
          actx.fillStyle = '#FFFFFF';
          actx.fillRect(0, ah * 0.68, aw, 3);

          drawChibiPixelCharacter(actx, {
            x: aw / 2,
            y: ah - 14,
            scale: 1.42,
            shirtColor: kitHex,
            shortsColor: '#111827',
            socksColor: '#111827',
            skinColor,
            hairColor,
            hairStyle,
            pose: 'referee_yellow',
            animPhase: t,
            isReferee: true,
          });
        }
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [refereeName, kitHex, hairStyle, hairColor, skinColor]);

  const currentLeague = LEAGUES[selectedLeagueId];

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-[#181825] flex flex-col items-center justify-start pt-14 pb-4 px-3 sm:px-6">
      <div className="w-full max-w-4xl rounded-xl overflow-hidden border-4 border-[#09090B] shadow-[0_8px_0_#09090B] bg-[#38BDF8]">
        {/* Top Pixel Stage Canvas + Arcade Logo Overlay */}
        <div className="relative w-full">
          <canvas
            ref={canvasRef}
            width={680}
            height={368}
            className="w-full h-[290px] sm:h-[340px] object-cover block pixelated"
          />

          {/* Arcade Pixel Title Lockup right over the upper sky */}
          <div className="pointer-events-none absolute top-12 inset-x-0 flex flex-col items-center text-center px-2">
            <div
              className="font-display font-black text-2xl sm:text-4xl tracking-wider uppercase text-amber-300"
              style={{
                textShadow:
                  '3px 3px 0 #09090B, -2px -2px 0 #09090B, 2px -2px 0 #09090B, -2px 2px 0 #09090B, 0 5px 0 #92400E',
              }}
            >
              FOOTBALL
            </div>
            <div
              className="font-display font-black text-xl sm:text-3xl tracking-wider uppercase text-sky-100 -mt-1"
              style={{
                textShadow:
                  '3px 3px 0 #09090B, -2px -2px 0 #09090B, 2px -2px 0 #09090B, -2px 2px 0 #09090B, 0 5px 0 #1E3A8A',
              }}
            >
              REFEREE MAKER
            </div>
            <div className="mt-1 px-4 py-0.5 bg-rose-600 border-2 border-[#09090B] shadow-[0_3px_0_#09090B] text-white font-bold text-xs sm:text-sm">
              WHISTLE RETRO AI · GEMINI 4 ARGON SIMULATOR
            </div>
          </div>
        </div>

        {/* Bottom Cream Retro Pixel Customizer Box */}
        <div className="p-4 sm:p-5 bg-[#FFFBEB] text-[#1E1B4B] border-t-4 border-[#09090B] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: Character Appearance Controls */}
            <div className="md:col-span-8 space-y-3">
              {/* Row 1: Referee Name + Hairstyle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="referee-name-input"
                    className="block text-xs font-extrabold text-[#1E1B4B] mb-1"
                  >
                    1. REFEREE NAME
                  </label>
                  <input
                    id="referee-name-input"
                    type="text"
                    value={refereeName}
                    onChange={(e) => onChangeName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-white border-2 border-[#09090B] text-sm font-bold text-[#09090B]"
                  />
                </div>

                <div>
                  <div className="text-xs font-extrabold text-[#1E1B4B] mb-1 flex items-center justify-between">
                    <span>2. CHIBI HAIRSTYLE</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-300 text-[#09090B] text-[10px] border border-[#09090B]">
                      {hairStyleLabelMap[hairStyle]}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {(
                      [
                        { id: 'spiky_ahoge', label: 'Spiky' },
                        { id: 'buzz_captain', label: 'Buzz' },
                        { id: 'messy_shock', label: 'Messy' },
                        { id: 'red_cap', label: 'Cap' },
                        { id: 'ponytail', label: 'Pony' },
                      ] as const
                    ).map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => onChangeHairStyle(h.id)}
                        className={`py-1.5 px-1 rounded text-[11px] font-extrabold border-2 border-[#09090B] cursor-pointer ${
                          hairStyle === h.id
                            ? 'bg-amber-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                            : 'bg-white text-slate-700 hover:bg-amber-100'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Uniform Color + Hair/Skin Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="text-xs font-extrabold text-[#1E1B4B] mb-1">
                    3. REFEREE KIT COLOR
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'neon_yellow', label: 'Volt Yellow', bg: 'bg-lime-400' },
                        { id: 'classic_black', label: 'Pro Black', bg: 'bg-slate-800 text-white' },
                        { id: 'cyber_pink', label: 'Retro Coral', bg: 'bg-rose-500 text-white' },
                      ] as const
                    ).map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => onChangeKitColor(k.id)}
                        className={`py-1.5 px-2 rounded text-xs font-extrabold border-2 border-[#09090B] cursor-pointer ${
                          kitColor === k.id
                            ? `${k.bg} ring-2 ring-[#09090B] shadow-[0_2px_0_#09090B]`
                            : 'bg-white text-slate-700'
                        }`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold text-[#1E1B4B] mb-1">
                    4. HAIR &amp; SKIN TONE
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      '#111827',
                      '#78350F',
                      '#FACC15',
                      '#DC2626',
                    ].map((hc) => (
                      <button
                        key={hc}
                        type="button"
                        onClick={() => onChangeHairColor(hc)}
                        aria-label={`Hair color ${hc}`}
                        style={{ backgroundColor: hc }}
                        className={`w-7 h-7 rounded border-2 border-[#09090B] cursor-pointer ${
                          hairColor === hc ? 'ring-2 ring-amber-500 scale-110' : ''
                        }`}
                      />
                    ))}
                    <span className="text-slate-400 font-bold">|</span>
                    {[
                      '#F5C6A5',
                      '#E6A972',
                      '#B87A4B',
                    ].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => onChangeSkinColor(sc)}
                        aria-label={`Skin tone ${sc}`}
                        style={{ backgroundColor: sc }}
                        className={`w-7 h-7 rounded-full border-2 border-[#09090B] cursor-pointer ${
                          skinColor === sc ? 'ring-2 ring-amber-500 scale-110' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: League & Referee Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="text-xs font-extrabold text-[#1E1B4B] mb-1">
                    5. SELECT LEAGUE ({currentLeague.featuredMatch})
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {ALL_LEAGUE_IDS.map((lid) => {
                      const lg = LEAGUES[lid];
                      return (
                        <button
                          key={lid}
                          type="button"
                          onClick={() => onChangeLeague(lid)}
                          className={`py-1 px-1.5 rounded text-[11px] font-extrabold border-2 border-[#09090B] truncate cursor-pointer ${
                            selectedLeagueId === lid
                              ? 'bg-sky-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                              : 'bg-white text-slate-700'
                          }`}
                        >
                          {lg.shortTag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold text-[#1E1B4B] mb-1">
                    6. OFFICIATING STYLE
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'strict', label: 'Strict' },
                        { id: 'flow', label: 'Let It Flow' },
                        { id: 'var_purist', label: 'VAR Purist' },
                      ] as const
                    ).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onChangeArchetype(a.id)}
                        className={`py-1 px-1.5 rounded text-[11px] font-extrabold border-2 border-[#09090B] truncate cursor-pointer ${
                          archetypeId === a.id
                            ? 'bg-emerald-400 text-[#09090B] shadow-[0_2px_0_#09090B]'
                            : 'bg-white text-slate-700'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: LIVE Close-Up Chibi Preview + Nano Banana AI Pixel Portrait */}
            <div className="md:col-span-4 flex flex-col items-center justify-between p-3 rounded-xl bg-white border-3 border-[#09090B] shadow-[0_4px_0_#09090B]">
              <div className="text-[11px] font-extrabold text-[#1E1B4B] mb-1.5 text-center">
                👀 LIVE CHIBI PREVIEW ({hairStyleLabelMap[hairStyle]})
              </div>
              <div className="flex items-center gap-2">
                <canvas
                  ref={avatarCanvasRef}
                  width={126}
                  height={146}
                  data-testid="chibi-closeup-preview"
                  className="w-28 h-28 rounded-lg border-3 border-[#09090B] pixelated"
                />
                <img
                  src={portraitUrl}
                  alt={`Pixel Referee ${refereeName}`}
                  referrerPolicy="no-referrer"
                  className="w-24 h-28 rounded-lg object-cover border-3 border-[#09090B] pixelated"
                />
              </div>
              <button
                type="button"
                onClick={onGeneratePortrait}
                disabled={isGeneratingPortrait}
                className="mt-2 w-full py-1.5 px-2 rounded bg-sky-300 hover:bg-sky-200 disabled:opacity-50 text-[#09090B] font-extrabold text-xs border-2 border-[#09090B] shadow-[0_2px_0_#09090B] cursor-pointer"
              >
                {isGeneratingPortrait
                  ? 'Generating Pixel Art...'
                  : '✨ Regenerate AI Pixel Badge'}
              </button>
            </div>
          </div>

          {/* Giant Retro Arcade START MATCH Button Bar */}
          <div className="pt-2 border-t-2 border-amber-300 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStartMatch}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#09090B] font-extrabold text-lg sm:text-xl tracking-wide retro-btn cursor-pointer text-center"
            >
              ⚽ START LIVE FM MATCH (ENTER PITCH)
            </button>
            <button
              type="button"
              onClick={onOpenVarDesk}
              className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs retro-btn cursor-pointer whitespace-nowrap"
            >
              🖥️ Live VAR Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
