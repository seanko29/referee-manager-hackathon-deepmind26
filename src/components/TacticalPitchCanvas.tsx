import React, { useEffect, useRef, useState } from 'react';
import {
  interpolateFrameAtTime,
  type MatchIncident,
  type LeagueConfig,
  type CallAction,
  type RefereeKitColor,
} from '../game/rules';
import {
  drawChibiPixelCharacter,
  drawPixelSoccerBall,
  type ChibiHairStyle,
  type ChibiPose,
} from './RetroPixelRenderer';

interface TacticalPitchCanvasProps {
  incident: MatchIncident;
  league: LeagueConfig;
  currentTime: number; // 0..30
  isPlaying: boolean;
  playbackSpeed: number; // 0.5 | 1.0 | 1.5 | 2.0
  showVarGeometry: boolean;
  refereeRating?: number;
  crowdHeat?: number;
  activeCallCard?: CallAction | null;
  fullScreen?: boolean;
  refereeName?: string;
  kitColor?: RefereeKitColor;
  hairStyle?: ChibiHairStyle;
  hairColor?: string;
  skinColor?: string;
  isOpenPlayPhase?: boolean;
  liveMatchMinute?: number;
  onTimeChange: (t: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleVarGeometry: () => void;
}

type FmCameraMode = 'overview' | 'follow_ball' | 'free_roam';

export const TacticalPitchCanvas: React.FC<TacticalPitchCanvasProps> = ({
  incident,
  league,
  currentTime,
  isPlaying,
  playbackSpeed,
  showVarGeometry,
  refereeRating = 7.5,
  crowdHeat = 62,
  activeCallCard = null,
  fullScreen = false,
  refereeName = 'Min-jun Kim',
  kitColor = 'neon_yellow',
  hairStyle = 'spiky_ahoge',
  hairColor = '#111827',
  skinColor = '#F5C6A5',
  isOpenPlayPhase = false,
  liveMatchMinute,
  onTimeChange,
  onTogglePlay,
  onSpeedChange,
  onToggleVarGeometry,
}) => {
  const [camMode, setCamMode] = useState<FmCameraMode>('overview');
  const [camZoom, setCamZoom] = useState<number>(1.0);
  const [showCloseUpInset, setShowCloseUpInset] = useState<boolean>(true);
  const [isCamSpeedCollapsed, setIsCamSpeedCollapsed] = useState<boolean>(false);
  const [isMetersCollapsed, setIsMetersCollapsed] = useState<boolean>(false);
  const [staminaPercent, setStaminaPercent] = useState<number>(92);

  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Internal 60fps simulation time so we DO NOT spam React state 60 times/sec!
  const internalTimeRef = useRef<number>(currentTime);
  useEffect(() => {
    internalTimeRef.current = currentTime;
  }, [currentTime, incident.id]);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef(playbackSpeed);
  speedRef.current = playbackSpeed;

  const activeCallRef = useRef(activeCallCard);
  activeCallRef.current = activeCallCard;

  const showVarRef = useRef(showVarGeometry);
  showVarRef.current = showVarGeometry;

  const camModeRef = useRef(camMode);
  camModeRef.current = camMode;

  const camZoomRef = useRef(camZoom);
  camZoomRef.current = camZoom;

  // Free-roam camera pan offset (in canvas pixels) + drag state
  const camPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStateRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  // Referee manual movement offset via smooth 60fps WASD / Arrow keys OR Click-to-Run target!
  const refManualOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const refTargetPxRef = useRef<{ x: number; y: number } | null>(null);
  const isOpenPlayRef = useRef<boolean>(isOpenPlayPhase);
  isOpenPlayRef.current = isOpenPlayPhase;

  useEffect(() => {
    refManualOffset.current = { dx: 0, dy: 0 };
    refTargetPxRef.current = null;
    camPanRef.current = { x: 0, y: 0 };
  }, [incident.id]);

  // Smooth 60fps WASD / Arrow keys to directly control the Referee on the pitch
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (
        k === 'w' ||
        k === 'a' ||
        k === 's' ||
        k === 'd' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        pressedKeysRef.current.add(k);
        refTargetPxRef.current = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const refKitHex =
    kitColor === 'cyber_pink'
      ? '#F43F5E'
      : kitColor === 'classic_black'
      ? '#1E293B'
      : '#A3E635';

  // ===========================================================================
  // REAL-TIME 60FPS FM CHIBI PIXEL MATCH ENGINE (WITH FREE CAMERA PAN & ZOOM!)
  // ===========================================================================
  useEffect(() => {
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTs = performance.now();
    const startClock = lastTs;

    const renderPixelMatch = (now: number) => {
      rafId = requestAnimationFrame(renderPixelMatch);
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const realSec = (now - startClock) / 1000;

      // Advance match simulation time smoothly: upright sprint approach (t=6..15.5, ~1.2s) -> last-moment slide tackle & trip (t=15.5..30, ~2.5s)!
      if (isPlayingRef.current) {
        if (internalTimeRef.current < 6) {
          internalTimeRef.current = 6;
        }
        const nextT = internalTimeRef.current + dt * 7.2 * speedRef.current;
        internalTimeRef.current = nextT >= 30 ? 6 : nextT;
      }

      const t = internalTimeRef.current;
      const frame = interpolateFrameAtTime(incident.frames, t);
      const contactSnapshot = interpolateFrameAtTime(
        incident.frames,
        incident.contact.frame
      );

      const w = canvas.width;
      const h = canvas.height;

      const pitchLeft = 56;
      const pitchRight = w - 56;
      const pitchTop = 92;
      const pitchBottom = h - 32;
      const pitchW = pitchRight - pitchLeft;
      const pitchH = pitchBottom - pitchTop;

      const toPxX = (xm: number) => pitchLeft + (xm / 105) * pitchW;
      const toPxY = (ym: number) => pitchTop + (ym / 68) * pitchH;

      const ballPxX = toPxX(frame.ball[0]);
      const ballPxY = toPxY(frame.ball[1]);

      // Clear background
      ctx.fillStyle = '#2A5C1E';
      ctx.fillRect(0, 0, w, h);

      // Apply FM Camera Transform (Overview / Follow Ball / Free Roam + Zoom!)
      ctx.save();
      const zoom = camZoomRef.current;
      const mode = camModeRef.current;

      if (mode === 'follow_ball') {
        const targetZoom = Math.max(1.35, zoom);
        ctx.translate(w / 2, h / 2);
        ctx.scale(targetZoom, targetZoom);
        ctx.translate(-ballPxX + camPanRef.current.x * 0.4, -ballPxY + camPanRef.current.y * 0.4);
      } else {
        ctx.translate(w / 2 + camPanRef.current.x, h / 2 + camPanRef.current.y);
        ctx.scale(zoom, zoom);
        ctx.translate(-w / 2, -h / 2);
      }

      // 1. Stadium Top Rim (Crowd + Advertising Boards)
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-200, -120, w + 400, 204);

      const crowdPalette = ['#EF4444', '#FACC15', '#38BDF8', '#4ADE80', '#F97316', '#FFFFFF'];
      for (let cy = 12; cy < 62; cy += 10) {
        for (let cx = 16; cx < w - 16; cx += 14) {
          ctx.fillStyle = crowdPalette[(cx * 5 + cy * 11) % crowdPalette.length];
          const jump = Math.floor(realSec * 5 + cx) % 2 === 0 ? -2 : 0;
          ctx.fillRect(cx, cy + jump, 8, 7);
        }
      }

      // LED Advertising Board
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 66, w, 20);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(4, 69, w - 8, 14);
      ctx.fillStyle = '#FEF08A';
      ctx.font = '700 11px "Silkscreen", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `★ WHISTLE FM LIVE ENGINE · ${league.name.toUpperCase()} · DRAG TO PAN / WHEEL TO ZOOM ★`,
        w / 2,
        80
      );

      // 2. Striped Mowed Grass Pitch
      const numStripes = 12;
      for (let i = 0; i < numStripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#559E32' : '#4D922C';
        ctx.fillRect(
          pitchLeft + (i * pitchW) / numStripes,
          pitchTop,
          pitchW / numStripes + 1,
          pitchH
        );
      }

      // Grass Tufts ("^" pattern)
      ctx.fillStyle = '#3B751E';
      for (let gy = pitchTop + 18; gy < pitchBottom - 12; gy += 36) {
        for (let gx = pitchLeft + 24; gx < pitchRight - 24; gx += 52) {
          const shift = gy % 72 === 0 ? 22 : 0;
          ctx.fillRect(gx + shift, gy, 4, 4);
          ctx.fillRect(gx + shift + 4, gy - 4, 4, 4);
          ctx.fillRect(gx + shift + 8, gy, 4, 4);
        }
      }

      // 3. Crisp White Pitch Lines
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(pitchLeft, pitchTop, pitchW, pitchH);

      const midX = pitchLeft + pitchW / 2;
      const midY = pitchTop + pitchH / 2;
      ctx.beginPath();
      ctx.moveTo(midX, pitchTop);
      ctx.lineTo(midX, pitchBottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(midX, midY, 54, 0, Math.PI * 2);
      ctx.stroke();

      const boxW = pitchW * 0.165;
      const boxH = pitchH * 0.56;
      const boxTop = midY - boxH / 2;
      ctx.strokeRect(pitchLeft, boxTop, boxW, boxH);
      ctx.strokeRect(pitchRight - boxW, boxTop, boxW, boxH);

      const sixW = pitchW * 0.06;
      const sixH = pitchH * 0.28;
      ctx.strokeRect(pitchLeft, midY - sixH / 2, sixW, sixH);
      ctx.strokeRect(pitchRight - sixW, midY - sixH / 2, sixW, sixH);

      // Left & Right Goal Frames + White Mesh Nets behind the Goalkeepers
      const goalDepth = 18;
      const goalH = pitchH * 0.16;
      const goalTop = midY - goalH / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(pitchLeft - goalDepth, goalTop, goalDepth, goalH);
      ctx.fillRect(pitchRight, goalTop, goalDepth, goalH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      for (let gy = goalTop + 6; gy < goalTop + goalH; gy += 6) {
        ctx.beginPath();
        ctx.moveTo(pitchLeft - goalDepth, gy);
        ctx.lineTo(pitchLeft, gy);
        ctx.moveTo(pitchRight, gy);
        ctx.lineTo(pitchRight + goalDepth, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(pitchLeft - goalDepth, goalTop, goalDepth, goalH);
      ctx.strokeRect(pitchRight, goalTop, goalDepth, goalH);
      ctx.restore();

      const [offSide, offIdStr] = incident.contact.offender.split('_');
      const [vicSide, vicIdStr] = incident.contact.victim.split('_');
      const offId = Number(offIdStr);
      const vicId = Number(vicIdStr);

      // Classify exact play choreography so live pitch & Close-Up Cam match the play description 100%!
      const cType = (incident.contact.type || '').toLowerCase();
      const titleLower = (incident.title || '').toLowerCase();
      const isHandball =
        cType.includes('handball') ||
        titleLower.includes('handball') ||
        incident.id === 'inc_04';
      const isSimulationDive =
        cType.includes('simulation') ||
        cType.includes('dive') ||
        titleLower.includes('dive') ||
        incident.id === 'inc_03';
      const isAdvantagePlay =
        cType.includes('advantage') ||
        titleLower.includes('advantage') ||
        incident.id === 'inc_02';
      const isShirtPull =
        cType.includes('shirt_pull') ||
        cType.includes('spa') ||
        titleLower.includes('shirt pull') ||
        incident.id === 'inc_05';

      // Upright running approach first (t < contact.frame - 2.0), then LAST-MOMENT SLIDE TACKLE / ACTION at contact!
      const isNearContact = isHandball
        ? true
        : t >= incident.contact.frame - 2.2;
      const isAfterContact = isHandball
        ? true
        : t >= incident.contact.frame - 1.2;

      const focalVictim = (vicSide === 'home' ? frame.home : frame.away).find(
        (p) => p.id === vicId
      );
      const focalOffender = (offSide === 'home' ? frame.home : frame.away).find(
        (p) => p.id === offId
      );

      if (showVarRef.current && (focalVictim || focalOffender)) {
        const targetEntity = isHandball && focalOffender ? focalOffender : focalVictim || focalOffender!;
        const vx = toPxX(targetEntity.x);
        const vy = toPxY(targetEntity.y);
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vx, pitchTop);
        ctx.lineTo(vx, pitchBottom);
        ctx.stroke();
        ctx.restore();

        if (isNearContact) {
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(vx, vy, 18 + Math.sin(realSec * 12) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Play-Specific Tactical Visuals on the Pitch (Shot Line / Hand Block / 1.4m Dive Gap / 3v2 Pass / Shirt Pull)
      if (focalVictim && focalOffender && isAfterContact) {
        const vx = toPxX(focalVictim.x);
        const vy = toPxY(focalVictim.y);
        const ox = toPxX(focalOffender.x);
        const oy = toPxY(focalOffender.y);

        ctx.save();
        if (isHandball) {
          // Shot trajectory line from Shooter (#10) to Defender (#20)'s outstretched 95° hand!
          const handX = ox - 23;
          const handY = oy - 24;
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(vx + 7, vy - 10);
          ctx.lineTo(handX, handY);
          ctx.lineTo(ox - 12, oy + 18);
          ctx.stroke();
          ctx.setLineDash([]);

          // Pulsing Red/Gold Handball Impact Starburst on #20's outstretched hand
          ctx.fillStyle = 'rgba(239, 68, 68, 0.38)';
          ctx.beginPath();
          ctx.arc(handX, handY, 12 + Math.sin(realSec * 14) * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (isSimulationDive) {
          // 1.4m Zero-Contact Gap Line between Diver (#11) and Defender (#19)
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(ox, oy - 14);
          ctx.lineTo(vx, vy - 14);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (isAdvantagePlay) {
          // 3v2 Counter-Attack Through-Ball Line to Winger #7
          const winger7 = frame.home.find((p) => p.id === 7);
          if (winger7) {
            const wx = toPxX(winger7.x);
            const wy = toPxY(winger7.y);
            ctx.setLineDash([7, 4]);
            ctx.strokeStyle = '#A3E635';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(vx, vy - 8);
            ctx.lineTo(wx, wy - 8);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else if (isShirtPull) {
          // Stretched red jersey tug line between Defender (#13) and Winger (#7)
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(ox, oy - 22);
          ctx.lineTo(vx, vy - 22);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Render All 22 Rounded 2D Chibi Players + 1 Chibi Referee (Proportionally Scaled to Pitch!)
      interface RenderableEntity {
        y: number;
        draw: () => void;
      }
      const entities: RenderableEntity[] = [];

      for (const p of frame.home) {
        const isGoalkeeper = p.role === 'GK' || p.id === 1;
        const isVictim = vicSide === 'home' && p.id === vicId;
        const isOffender = offSide === 'home' && p.id === offId;
        const roamX =
          !isVictim && !isOffender && !isGoalkeeper
            ? Math.sin(realSec * (2.2 * speedRef.current) + p.id * 1.7) * 6.5
            : 0;
        const roamY =
          !isVictim && !isOffender
            ? Math.cos(realSec * (1.9 * speedRef.current) + p.id * 2.1) *
              (isGoalkeeper ? 3.5 : 5.0)
            : 0;

        // Lock focal player at contact spot once the tackle happens so they NEVER glide diagonally while fallen!
        const contactHomeP = contactSnapshot.home.find((hp) => hp.id === p.id) ?? p;
        const baseX =
          (isVictim || isOffender) && isNearContact && !isAdvantagePlay
            ? contactHomeP.x
            : p.x;
        const baseY =
          (isVictim || isOffender) && isNearContact && !isAdvantagePlay
            ? contactHomeP.y
            : p.y;

        // Separate Attacker to the right (+18px) at contact so Defender's lunging slide boot hits his swept-back ankle cleanly!
        const contactSepX =
          isVictim && isNearContact && !isHandball && !isAdvantagePlay
            ? 18 + Math.max(0, Math.sin(realSec * 6) * 2)
            : 0;

        const px = toPxX(baseX) + roamX + contactSepX;
        const py = toPxY(baseY) + roamY;

        let pose: ChibiPose = isGoalkeeper ? 'goalkeeper_ready' : 'running';
        let bubble: string | undefined;
        let bOffX = 0;
        let bOffY = 0;

        if (isHandball) {
          // PLAY 4 (HANDBALL): Shooter (#10) stays STANDING in shooting follow-through — NEVER falls down!
          if (isVictim && isAfterContact) {
            pose = 'shot_follow_through';
            bubble = 'HANDBALL!! 95° Arm block!!';
            bOffX = -32;
            bOffY = -12;
          } else if (p.id === 9 && isAfterContact) {
            pose = 'wave_appeal';
            bubble = 'Penalty! Blocked with his hand!';
          }
        } else if (isSimulationDive) {
          // PLAY 3 (SIMULATION DIVE): Attacker (#11) sprints upright, then at the last moment dives with zero contact!
          if (isOffender && isAfterContact) {
            pose = 'theatrical_dive';
            bubble = 'PENALTY!! Ref, he tripped me!!';
            bOffX = -36;
            bOffY = -18;
          }
        } else if (isAdvantagePlay) {
          // PLAY 2 (ADVANTAGE): #10 is tripped at midfield after releasing the through-ball to #7 sprinting away on 3v2!
          if (isVictim && isAfterContact) {
            pose = 'fallen';
            bubble = 'Clipped me! Play on — #7 is in 3v2!';
            bOffY = -18;
          } else if (p.id === 7 && isAfterContact) {
            pose = 'running';
            bubble = 'Through on goal 3v2! Advantage!!';
          }
        } else if (isShirtPull) {
          // PLAY 5 (SHIRT PULL): Winger #7 stays upright struggling against the two-handed shirt grab!
          if (isVictim && isAfterContact) {
            pose = 'wave_appeal';
            bubble = 'He’s pulling my shirt, Ref!!';
            bOffX = 36;
            bOffY = -16;
          }
        } else {
          // PLAY 1 (DOGSO 1v1 BOX TAKEDOWN): Striker #9 sprints upright into the box, then gets tripped at the last moment!
          if (isVictim && isAfterContact) {
            pose = 'fallen';
            bubble = 'My ankle! 1v1 takedown!!';
            bOffX = 48;
            bOffY = -22;
          } else if (isOffender && isNearContact) {
            pose = 'sliding_tackle';
            bubble = 'What?! No way!';
          }
        }

        entities.push({
          y: py,
          draw: () =>
            drawChibiPixelCharacter(ctx, {
              x: px,
              y: py,
              scale: isVictim || isOffender ? 0.60 : isGoalkeeper ? 0.56 : 0.48,
              shirtColor: isGoalkeeper ? '#F59E0B' : league.homeColor || '#DC2626',
              shortsColor: '#111827',
              socksColor: isGoalkeeper ? '#F59E0B' : league.homeColor || '#DC2626',
              hairColor: '#18181B',
              hairStyle: isGoalkeeper
                ? 'buzz_captain'
                : p.id % 2 === 0
                ? 'spiky_ahoge'
                : 'messy_shock',
              pose,
              animPhase: realSec * speedRef.current + p.id * 0.4,
              jerseyNumber: p.id,
              isGoalkeeper,
              gloveColor: '#A3E635',
              label: isGoalkeeper
                ? `GK #${p.id}`
                : isVictim || isOffender || (isAdvantagePlay && p.id === 7)
                ? `#${p.id}`
                : undefined,
              speechBubble: bubble,
              bubbleOffsetX: bOffX,
              bubbleOffsetY: bOffY,
            }),
        });
      }

      for (const p of frame.away) {
        const isGoalkeeper = p.role === 'GK' || p.id === 21 || p.id === 1;
        const isVictim = vicSide === 'away' && p.id === vicId;
        const isOffender = offSide === 'away' && p.id === offId;
        const roamX =
          !isVictim && !isOffender && !isGoalkeeper
            ? Math.cos(realSec * (2.1 * speedRef.current) + p.id * 1.3) * 6.5
            : 0;
        const roamY =
          !isVictim && !isOffender
            ? Math.sin(realSec * (2.3 * speedRef.current) + p.id * 1.9) *
              (isGoalkeeper ? 3.5 : 5.0)
            : 0;

        // Lock focal Defender at the tackle spot once he lunges into the slide tackle so he NEVER glides diagonally!
        const contactAwayP = contactSnapshot.away.find((ap) => ap.id === p.id) ?? p;
        const baseX =
          (isVictim || isOffender) && isNearContact && !isAdvantagePlay
            ? contactAwayP.x
            : p.x;
        const baseY =
          (isVictim || isOffender) && isNearContact && !isAdvantagePlay
            ? contactAwayP.y
            : p.y;

        // Position Defender to the left of Striker at the moment of the slide tackle so his extended leg lunges into the ankle!
        const contactSepX =
          isOffender && isNearContact && !isHandball && !isSimulationDive && !isAdvantagePlay
            ? -19 + Math.sin(realSec * 6) * 2.5
            : 0;

        const px = toPxX(baseX) + roamX + contactSepX;
        const py = toPxY(baseY) + roamY;

        let pose: ChibiPose = isGoalkeeper ? 'goalkeeper_ready' : 'running';
        let bubble: string | undefined;
        let bOffX = 0;
        let bOffY = 0;

        if (isHandball) {
          // PLAY 4 (HANDBALL): Defender #20 extends his arm 95° horizontally to block the shot!
          if (isOffender && isAfterContact) {
            pose = 'handball_block';
            bubble = 'Ball to hand! Hit my arm!';
            bOffX = 36;
            bOffY = -12;
          }
        } else if (isSimulationDive) {
          // PLAY 3 (SIMULATION DIVE): Defender #19 stands upright 1.4m away pointing at the diver!
          if (isVictim && isAfterContact) {
            pose = 'captain_protest';
            bubble = 'Zero contact! He dived 1.4m away!';
            bOffX = 42;
            bOffY = 4;
          }
        } else if (isAdvantagePlay) {
          // PLAY 2 (ADVANTAGE): Midfielder #8 lunges at #10 in midfield at the last moment
          if (isOffender && isNearContact) {
            pose = 'sliding_tackle';
            bubble = 'Tactical clip in midfield!';
            bOffX = -38;
          }
        } else if (isShirtPull) {
          // PLAY 5 (SHIRT PULL): Defender #13 grabs #7's shirt with both hands at contact!
          if (isOffender && isNearContact) {
            pose = 'shirt_pull_grab';
            bubble = 'Just a tiny tug on his sleeve!';
            bOffX = -42;
            bOffY = 4;
          }
        } else {
          // PLAY 1 (DOGSO TAKEDOWN): Defender #4 sprints upright, then lunges into a horizontal leg slide tackle at the last moment!
          if (isOffender && isNearContact) {
            pose = 'sliding_tackle';
            bubble = isAfterContact ? 'I tried to reach the ball, Ref!!' : undefined;
            bOffX = -52;
            bOffY = 2;
          } else if (isVictim && isAfterContact) {
            pose = 'fallen';
            bubble = 'Argh!';
          }
        }

        entities.push({
          y: py,
          draw: () =>
            drawChibiPixelCharacter(ctx, {
              x: px,
              y: py,
              scale: isVictim || isOffender ? 0.60 : isGoalkeeper ? 0.56 : 0.48,
              shirtColor: isGoalkeeper ? '#06B6D4' : '#1E293B',
              shortsColor: isGoalkeeper ? '#09090B' : '#FFFFFF',
              socksColor: isGoalkeeper ? '#06B6D4' : '#1E3A8A',
              skinColor: p.id === 4 || p.id === 8 ? '#C68652' : '#F7C59F',
              hairColor: '#18181B',
              hairStyle: isGoalkeeper
                ? 'red_cap'
                : p.id === 4 || p.id === 8
                ? 'buzz_captain'
                : 'spiky_ahoge',
              hasCaptainBand: p.id === 4 || p.id === 8,
              pose,
              animPhase: realSec * speedRef.current + p.id * 0.5,
              jerseyNumber: p.id,
              isGoalkeeper,
              gloveColor: '#FACC15',
              label: isGoalkeeper
                ? `GK #${p.id}`
                : isVictim || isOffender
                ? `#${p.id}`
                : undefined,
              speechBubble: bubble,
              bubbleOffsetX: bOffX,
              bubbleOffsetY: bOffY,
            }),
        });
      }

      // 60FPS Direct Referee Control: WASD / Arrow Keys OR Click-to-Run on the Pitch!
      const defaultRefX = toPxX(frame.ball[0] - 8.5);
      const defaultRefY = toPxY(frame.ball[1] + 8.5);
      const moveSpeed = 210 * dt;
      let isRefSprinting = false;

      const keys = pressedKeysRef.current;
      if (keys.has('w') || keys.has('arrowup')) {
        refManualOffset.current.dy -= moveSpeed;
        isRefSprinting = true;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        refManualOffset.current.dy += moveSpeed;
        isRefSprinting = true;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        refManualOffset.current.dx -= moveSpeed;
        isRefSprinting = true;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        refManualOffset.current.dx += moveSpeed;
        isRefSprinting = true;
      }

      if (refTargetPxRef.current) {
        const curX = defaultRefX + refManualOffset.current.dx;
        const curY = defaultRefY + refManualOffset.current.dy;
        const tdx = refTargetPxRef.current.x - curX;
        const tdy = refTargetPxRef.current.y - curY;
        const dist = Math.hypot(tdx, tdy);
        if (dist > 4) {
          refManualOffset.current.dx += (tdx / dist) * moveSpeed;
          refManualOffset.current.dy += (tdy / dist) * moveSpeed;
          isRefSprinting = true;
        } else {
          refTargetPxRef.current = null;
        }
      }

      const refBaseX = Math.max(
        pitchLeft + 18,
        Math.min(pitchRight - 18, defaultRefX + refManualOffset.current.dx)
      );
      const refBaseY = Math.max(
        pitchTop + 24,
        Math.min(pitchBottom - 12, defaultRefY + refManualOffset.current.dy)
      );

      // Draw Click-to-Run Target Ring if active
      if (refTargetPxRef.current) {
        ctx.save();
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(
          refTargetPxRef.current.x,
          refTargetPxRef.current.y,
          12 + Math.sin(realSec * 10) * 3,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      // Compute Referee Sightline Distance (in meters) to the Ball / Foul!
      const refDistMeters = Number(
        (
          Math.hypot(refBaseX - ballPxX, refBaseY - ballPxY) /
          (pitchW / 105)
        ).toFixed(1)
      );
      const isGoodSightline = refDistMeters <= 16;

      // Subtle dashed Sightline connecting Your Referee to the Ball/Incident
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isGoodSightline
        ? 'rgba(163, 230, 53, 0.75)'
        : 'rgba(248, 113, 113, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(refBaseX, refBaseY - 16);
      ctx.lineTo(ballPxX, ballPxY);
      ctx.stroke();
      ctx.restore();

      const call = activeCallRef.current;
      let refPose: ChibiPose = isRefSprinting
        ? 'running'
        : isAfterContact && !isOpenPlayRef.current
        ? 'referee_whistle'
        : 'running';
      let refBubble = isOpenPlayRef.current
        ? `🏃 ${refDistMeters}m · OPEN PLAY`
        : isRefSprinting
        ? `🏃 ${refDistMeters}m (${isGoodSightline ? 'GOOD ANGLE' : 'MOVE CLOSER!'})`
        : isAfterContact
        ? `WHISTLE—!! (${refDistMeters}m)`
        : undefined;
      if (call === 'red') {
        refPose = 'referee_red';
        refBubble = '🟥 RED CARD — OFF!!';
      } else if (call === 'yellow') {
        refPose = 'referee_yellow';
        refBubble = '🟨 YELLOW CARD!!';
      } else if (call === 'foul' || call === 'penalty') {
        refPose = 'referee_whistle';
        refBubble = call === 'penalty' ? '🎯 PENALTY KICK!!' : 'WHISTLE · FREE KICK!!';
      } else if (call === 'advantage' || call === 'play_on') {
        refPose = 'victory';
        refBubble = '👋 PLAY ON — ADVANTAGE!!';
      }

      entities.push({
        y: refBaseY,
        draw: () =>
          drawChibiPixelCharacter(ctx, {
            x: refBaseX,
            y: refBaseY,
            scale: 0.60,
            shirtColor: refKitHex,
            shortsColor: '#111827',
            socksColor: '#111827',
            skinColor,
            hairColor,
            hairStyle,
            pose: refPose,
            animPhase: realSec * speedRef.current * (isRefSprinting ? 1.8 : 1.2),
            label: `YOU (${refereeName}) · ${refDistMeters}m`,
            speechBubble: refBubble,
            bubbleOffsetX: -24,
            bubbleOffsetY: 4,
            isReferee: true,
          }),
      });

      entities.sort((a, b) => a.y - b.y);
      for (const ent of entities) {
        ent.draw();
      }

      // On Handball, animate the ball flying from Shooter #10 straight into Defender #20's outstretched hand and deflecting!
      let renderedBallX = ballPxX;
      let renderedBallY = ballPxY;
      if (isOpenPlayRef.current) {
        // Open-play continuous passing across midfield between incidents!
        renderedBallX = midX + Math.sin(realSec * 2.4) * (pitchW * 0.24);
        renderedBallY = midY + Math.cos(realSec * 3.1) * (pitchH * 0.26);
      } else if (isHandball && focalVictim && focalOffender) {
        const vx = toPxX(focalVictim.x) + 7;
        const vy = toPxY(focalVictim.y) - 10;
        const handX = toPxX(focalOffender.x) - 23;
        const handY = toPxY(focalOffender.y) - 24;
        const deflectX = toPxX(focalOffender.x) - 12;
        const deflectY = toPxY(focalOffender.y) + 18;
        const cycle = (realSec * Math.max(0.6, speedRef.current)) % 1;
        if (cycle < 0.65) {
          const p = cycle / 0.65;
          renderedBallX = vx + (handX - vx) * p;
          renderedBallY = vy + (handY - vy) * p;
        } else {
          const p = (cycle - 0.65) / 0.35;
          renderedBallX = handX + (deflectX - handX) * p;
          renderedBallY = handY + (deflectY - handY) * p;
        }
      }

      drawPixelSoccerBall(ctx, renderedBallX, renderedBallY, 7.5, realSec * 6 * speedRef.current);

      ctx.restore();

      // =======================================================================
      // 5. SCREEN-SPACE CLOSE-UP CHIBI ACTION INSET (Positioned above Left Goal so GK #1 is 100% visible!)
      // =======================================================================
      if (showCloseUpInset) {
        const boxW = 352;
        const boxH = 150;
        const boxX = 16;
        const boxY = 104;

        ctx.save();
        ctx.fillStyle = '#09090B';
        ctx.fillRect(boxX - 4, boxY - 4, boxW + 8, boxH + 8);

        ctx.fillStyle = '#559E32';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#3F7E21';
        for (let gy = boxY + 26; gy < boxY + boxH - 12; gy += 32) {
          for (let gx = boxX + 18; gx < boxX + boxW - 18; gx += 46) {
            ctx.fillRect(gx, gy, 4, 4);
            ctx.fillRect(gx + 4, gy - 4, 4, 4);
            ctx.fillRect(gx + 8, gy, 4, 4);
          }
        }

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + 38);
        ctx.lineTo(boxX + 220, boxY + 38);
        ctx.lineTo(boxX + 280, boxY + 4);
        ctx.stroke();

        const closeUpTitle = isHandball
          ? `🔍 HANDBALL CLOSE-UP CAM · #${offId} 95° ARM BLOCK`
          : isSimulationDive
          ? `🔍 SIMULATION CLOSE-UP CAM · 1.4m ZERO CONTACT`
          : isAdvantagePlay
          ? `🔍 ADVANTAGE CLOSE-UP CAM · 3v2 THROUGH-BALL`
          : isShirtPull
          ? `🔍 TACTICAL PULL CLOSE-UP CAM · #${offId} SHIRT GRAB`
          : `🔍 DOGSO CLOSE-UP CAM · #${offId} SLIDE FROM BEHIND`;

        ctx.fillStyle = '#09090B';
        ctx.fillRect(boxX + 8, boxY + 5, boxW - 16, 24);
        ctx.fillStyle = '#FFFBEB';
        ctx.fillRect(boxX + 11, boxY + 8, boxW - 22, 18);
        ctx.fillStyle = '#1E1B4B';
        ctx.font = '800 10.5px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(closeUpTitle, boxX + 16, boxY + 21);

        const groundY = boxY + boxH - 18;

        if (isHandball) {
          // HANDBALL CLOSE-UP: Shooter #10 fires shot -> Ball hits Defender #20's 95° outstretched arm!
          drawChibiPixelCharacter(ctx, {
            x: boxX + 68,
            y: groundY,
            scale: 0.95,
            shirtColor: '#DC2626',
            shortsColor: '#18181B',
            socksColor: '#DC2626',
            skinColor: '#F7C59F',
            hairColor: '#09090B',
            hairStyle: 'spiky_ahoge',
            pose: 'shot_follow_through',
            animPhase: realSec,
            jerseyNumber: vicId,
            label: `#${vicId} SHOT`,
          });

          // Shot trajectory line to #20's outstretched hand
          const defX = boxX + 218;
          const handHitX = defX - 38;
          const handHitY = groundY - 38;
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(boxX + 86, groundY - 18);
          ctx.lineTo(handHitX, handHitY);
          ctx.stroke();
          ctx.setLineDash([]);

          drawChibiPixelCharacter(ctx, {
            x: defX,
            y: groundY,
            scale: 0.95,
            shirtColor: '#1E293B',
            shortsColor: '#FFFFFF',
            socksColor: '#1E3A8A',
            skinColor: '#F7C59F',
            hairColor: '#111827',
            hairStyle: 'spiky_ahoge',
            pose: 'handball_block',
            animPhase: realSec,
            jerseyNumber: offId,
            label: `#${offId} (95° ARM)`,
          });

          // Soccer ball striking right on #20's outstretched hand!
          drawPixelSoccerBall(ctx, handHitX, handHitY, 10, realSec * 5);
        } else if (isSimulationDive) {
          // SIMULATION CLOSE-UP: Defender #19 stands 1.4m back while #11 swan-dives mid-air!
          drawChibiPixelCharacter(ctx, {
            x: boxX + 72,
            y: groundY,
            scale: 0.95,
            shirtColor: '#1E293B',
            shortsColor: '#FFFFFF',
            socksColor: '#1E3A8A',
            skinColor: '#F7C59F',
            hairColor: '#111827',
            hairStyle: 'buzz_captain',
            pose: 'captain_protest',
            animPhase: realSec,
            jerseyNumber: vicId,
            label: `#${vicId} (NO TOUCH)`,
          });

          // 1.4m ruler
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(boxX + 98, groundY - 30);
          ctx.lineTo(boxX + 206, groundY - 30);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#FEF08A';
          ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('1.4m NO CONTACT', boxX + 152, groundY - 36);

          drawChibiPixelCharacter(ctx, {
            x: boxX + 232,
            y: groundY,
            scale: 0.95,
            shirtColor: '#DC2626',
            shortsColor: '#18181B',
            socksColor: '#DC2626',
            skinColor: '#F7C59F',
            hairColor: '#09090B',
            hairStyle: 'messy_shock',
            pose: 'theatrical_dive',
            animPhase: realSec,
            jerseyNumber: offId,
            label: `#${offId} DIVE!`,
          });

          drawPixelSoccerBall(ctx, boxX + 152, groundY - 10, 10, realSec * 2);
        } else if (isAdvantagePlay) {
          // ADVANTAGE CLOSE-UP: #8 lunges in and trips #10, while the loose ball rolls to #7 sprinting on a 3v2 breakaway!
          const advLunge = Math.sin(realSec * 6) * 4;
          drawChibiPixelCharacter(ctx, {
            x: boxX + 76 + advLunge,
            y: groundY,
            scale: 0.92,
            shirtColor: '#1E293B',
            shortsColor: '#FFFFFF',
            socksColor: '#1E3A8A',
            skinColor: '#C68652',
            hairColor: '#111827',
            hairStyle: 'buzz_captain',
            pose: 'sliding_tackle',
            animPhase: realSec,
            jerseyNumber: offId,
            label: `#${offId} TACKLE`,
          });

          drawChibiPixelCharacter(ctx, {
            x: boxX + 152,
            y: groundY,
            scale: 0.92,
            shirtColor: '#DC2626',
            shortsColor: '#18181B',
            socksColor: '#DC2626',
            skinColor: '#F7C59F',
            hairColor: '#09090B',
            hairStyle: 'spiky_ahoge',
            pose: 'fallen',
            animPhase: realSec,
            jerseyNumber: vicId,
            label: `#${vicId} TRIPPED`,
          });

          const wingerRunX = boxX + 232 + ((realSec * 16) % 16);
          drawChibiPixelCharacter(ctx, {
            x: wingerRunX,
            y: groundY,
            scale: 0.94,
            shirtColor: '#DC2626',
            shortsColor: '#18181B',
            socksColor: '#DC2626',
            skinColor: '#F7C59F',
            hairColor: '#09090B',
            hairStyle: 'messy_shock',
            pose: 'running',
            animPhase: realSec * 1.5,
            jerseyNumber: 7,
            label: `#7 3v2 RUN!`,
          });

          drawPixelSoccerBall(ctx, wingerRunX - 20, groundY - 9, 9.5, realSec * 5);
        } else if (isShirtPull) {
          // SHIRT PULL CLOSE-UP: #7 sprinting while #13 grabs his red shirt with both hands!
          drawChibiPixelCharacter(ctx, {
            x: boxX + 108,
            y: groundY,
            scale: 0.95,
            shirtColor: '#DC2626',
            shortsColor: '#18181B',
            socksColor: '#DC2626',
            skinColor: '#F7C59F',
            hairColor: '#09090B',
            hairStyle: 'spiky_ahoge',
            pose: 'wave_appeal',
            animPhase: realSec,
            jerseyNumber: vicId,
            label: `#${vicId} PULLED`,
          });

          drawChibiPixelCharacter(ctx, {
            x: boxX + 204,
            y: groundY,
            scale: 0.95,
            shirtColor: '#1E293B',
            shortsColor: '#FFFFFF',
            socksColor: '#1E3A8A',
            skinColor: '#F7C59F',
            hairColor: '#111827',
            hairStyle: 'buzz_captain',
            pose: 'shirt_pull_grab',
            animPhase: realSec,
            jerseyNumber: offId,
            label: `#${offId} GRAB`,
          });

          drawPixelSoccerBall(ctx, boxX + 64, groundY - 10, 10, realSec * 3);
        } else {
          // PLAY 1 DOGSO CLOSE-UP: Continuous slow-motion replay of #4 lunging into #9's ankle and tripping #9 forward!
          const closeCycle = (realSec * Math.max(0.6, speedRef.current) * 0.55) % 1;
          const isCloseTackle = isNearContact || closeCycle >= 0.22;
          const slideProgress = isCloseTackle
            ? Math.min(1, (closeCycle >= 0.22 ? (closeCycle - 0.22) / 0.25 : 1))
            : closeCycle / 0.22;
          const lungeOsc = isCloseTackle ? Math.sin(realSec * 7) * 3.5 : 0;

          const defCloseX = isCloseTackle
            ? boxX + 88 + slideProgress * 20 + lungeOsc
            : boxX + 54 + slideProgress * 32;
          const attCloseX = isCloseTackle
            ? boxX + 180 + slideProgress * 8 + Math.max(0, lungeOsc * 0.6)
            : boxX + 138 + slideProgress * 38;

          drawChibiPixelCharacter(ctx, {
            x: defCloseX,
            y: groundY,
            scale: 0.95,
            shirtColor: '#1E293B',
            shortsColor: '#FFFFFF',
            socksColor: '#1E3A8A',
            skinColor: '#C68652',
            hairColor: '#111827',
            hairStyle: 'buzz_captain',
            hasCaptainBand: true,
            pose: isCloseTackle ? 'sliding_tackle' : 'running',
            animPhase: realSec,
            jerseyNumber: offId,
            label: isCloseTackle ? `#${offId} SLIDE TACKLE!` : `#${offId} CHASING`,
          });

          drawChibiPixelCharacter(ctx, {
            x: attCloseX,
            y: groundY,
            scale: 0.95,
            shirtColor: '#DC2626',
            shortsColor: '#18181B',
            socksColor: '#DC2626',
            skinColor: '#F7C59F',
            hairColor: '#09090B',
            hairStyle: 'messy_shock',
            pose: isCloseTackle ? 'fallen' : 'running',
            animPhase: realSec,
            jerseyNumber: vicId,
            label: isCloseTackle ? `#${vicId} TRIPPED!` : `#${vicId} 1v1 RUN`,
          });

          drawPixelSoccerBall(
            ctx,
            isCloseTackle ? boxX + 248 : attCloseX + 22,
            groundY - 10,
            10,
            realSec * 4
          );
        }

        // Your Custom Chibi Referee on the right of the Close-Up Cam
        drawChibiPixelCharacter(ctx, {
          x: boxX + 324,
          y: groundY,
          scale: 0.95,
          shirtColor: refKitHex,
          shortsColor: '#09090B',
          socksColor: '#09090B',
          skinColor,
          hairColor,
          hairStyle,
          pose:
            call === 'red'
              ? 'referee_red'
              : call === 'yellow'
              ? 'referee_yellow'
              : 'referee_whistle',
          animPhase: realSec,
          isReferee: true,
        });

        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(renderPixelMatch);
    return () => cancelAnimationFrame(rafId);
  }, [
    incident,
    league,
    refereeName,
    refKitHex,
    hairStyle,
    hairColor,
    skinColor,
    showCloseUpInset,
  ]);

  const respectPercent = Math.min(100, Math.max(15, Math.round(refereeRating * 10)));
  const stressPercent = Math.min(100, Math.max(10, crowdHeat));

  return (
    <div
      className={
        fullScreen
          ? 'relative w-full h-full overflow-hidden bg-[#2b5b26] select-none'
          : 'flex flex-col bg-[#2b5b26] border-4 border-[#09090B] rounded-xl overflow-hidden select-none'
      }
    >
      {/* Interactive FM Pitch Canvas: Double-Click to Run Referee to Spot, Drag to Pan, Wheel to Zoom! */}
      <div
        className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onDoubleClick={(e) => {
          const canvas = pixelCanvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
          const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;
          refTargetPxRef.current = { x: cx, y: cy };
          setStaminaPercent((s) => Math.max(45, s - 2));
        }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).tagName === 'BUTTON') return;
          dragStateRef.current = {
            active: true,
            lastX: e.clientX,
            lastY: e.clientY,
          };
        }}
        onPointerMove={(e) => {
          if (!dragStateRef.current.active) return;
          const dx = e.clientX - dragStateRef.current.lastX;
          const dy = e.clientY - dragStateRef.current.lastY;
          dragStateRef.current.lastX = e.clientX;
          dragStateRef.current.lastY = e.clientY;
          camPanRef.current.x = Math.max(-380, Math.min(380, camPanRef.current.x + dx));
          camPanRef.current.y = Math.max(-240, Math.min(240, camPanRef.current.y + dy));
        }}
        onPointerUp={() => {
          dragStateRef.current.active = false;
        }}
        onPointerLeave={() => {
          dragStateRef.current.active = false;
        }}
        onWheel={(e) => {
          setCamZoom((z) =>
            Number(Math.max(0.85, Math.min(2.2, z - e.deltaY * 0.001)).toFixed(2))
          );
        }}
      >
        <canvas
          ref={pixelCanvasRef}
          data-testid="tactical-pitch-canvas"
          width={1280}
          height={720}
          className="w-full h-full object-fill block pixelated"
        />

        {/* Top-Left Collapsible FM Camera, Zoom & Speed (0.5x / 1x / 1.5x / 2x) Controls with [-] / [+] Toggle */}
        <div className="absolute top-14 left-3 z-10 flex flex-col items-start gap-1.5">
          {isCamSpeedCollapsed ? (
            <div className="flex items-center gap-1 bg-[#FFFBEB]/95 border-3 border-[#09090B] shadow-[0_3px_0_#09090B] rounded-lg px-2 py-1 whitespace-nowrap">
              <button
                type="button"
                data-testid="cam-speed-toggle-btn"
                aria-label="Expand Camera, Zoom, and Speed Controls"
                onClick={() => setIsCamSpeedCollapsed(false)}
                className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-[#09090B] font-extrabold text-[10px] border-2 border-[#09090B] cursor-pointer flex items-center gap-1"
              >
                <span className="font-mono font-black">[+]</span>
                <span>🎥 CAM · 🔍 ZOOM · ⏩ {playbackSpeed}x</span>
              </button>
              <button
                type="button"
                data-testid="closeup-cam-toggle-btn"
                onClick={() => setShowCloseUpInset((s) => !s)}
                className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] border-2 border-[#09090B] cursor-pointer ${
                  showCloseUpInset
                    ? 'bg-amber-300 text-[#09090B]'
                    : 'bg-white text-slate-700'
                }`}
              >
                {showCloseUpInset ? '[-] Close-Up' : '[+] Close-Up'}
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFBEB]/95 border-3 border-[#09090B] shadow-[0_3px_0_#09090B] rounded-lg px-2 py-1 space-y-1 whitespace-nowrap">
              {/* Row 1: FM Camera Roam Modes, Zoom & [-] Collapse Toggle */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-extrabold text-[#1E1B4B]">
                    🎥 CAM:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCamMode('overview');
                      setCamZoom(1.0);
                      camPanRef.current = { x: 0, y: 0 };
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer ${
                      camMode === 'overview'
                        ? 'bg-amber-400 text-[#09090B]'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    🏟️ Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCamMode('follow_ball');
                      setCamZoom(1.45);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer ${
                      camMode === 'follow_ball'
                        ? 'bg-amber-400 text-[#09090B]'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    ⚽ Follow Ball
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom In"
                    onClick={() =>
                      setCamZoom((z) => Math.min(2.2, Number((z + 0.25).toFixed(2))))
                    }
                    className="px-1.5 py-0.5 rounded bg-sky-300 text-[#09090B] text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer"
                  >
                    🔍+
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom Out"
                    onClick={() =>
                      setCamZoom((z) => Math.max(0.85, Number((z - 0.25).toFixed(2))))
                    }
                    className="px-1.5 py-0.5 rounded bg-sky-300 text-[#09090B] text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer"
                  >
                    🔎-
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="cam-speed-toggle-btn"
                  aria-label="Collapse Camera, Zoom, and Speed Controls"
                  title="Hide Camera, Zoom & Speed Controls (-)"
                  onClick={() => setIsCamSpeedCollapsed(true)}
                  className="px-1.5 py-0.5 rounded bg-rose-500 hover:bg-rose-400 text-white font-mono text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer"
                >
                  [-]
                </button>
              </div>

              {/* Row 2: Match Speed Selector (0.5x / 1.0x / 1.5x / 2.0x) + Play/Pause + Close-Up Toggle */}
              <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-[#09090B]/15">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-extrabold text-[#1E1B4B]">
                    ⏩ SPEED:
                  </span>
                  {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onSpeedChange(spd)}
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold border-2 border-[#09090B] cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-emerald-400 text-[#09090B]'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className="px-1.5 py-0.5 rounded bg-white text-[#09090B] font-extrabold text-[10px] border-2 border-[#09090B] cursor-pointer"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid="snap-ref-to-ball-btn"
                    title="Snap your Referee back next to the ball (or move with WASD / Arrow Keys / Double-Click)"
                    onClick={() => {
                      refManualOffset.current = { dx: 0, dy: 0 };
                      refTargetPxRef.current = null;
                    }}
                    className="px-1.5 py-0.5 rounded bg-lime-400 hover:bg-lime-300 text-[#09090B] font-extrabold text-[10px] border-2 border-[#09090B] cursor-pointer"
                  >
                    🏃 Ref WASD
                  </button>
                  <button
                    type="button"
                    data-testid="closeup-cam-toggle-btn"
                    onClick={() => setShowCloseUpInset((s) => !s)}
                    className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] border-2 border-[#09090B] cursor-pointer ${
                      showCloseUpInset
                        ? 'bg-amber-300 text-[#09090B]'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    {showCloseUpInset ? '[-] Close-Up' : '[+] Close-Up'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Collapsible Retro Pixel Status Meters (STAMINA / RESPECT / STRESS) with [-] / [+] Toggle */}
        <div
          aria-label="Referee Stamina Respect Stress Meters"
          className="absolute top-14 right-3 z-10 flex flex-col items-end space-y-1"
        >
          {isMetersCollapsed ? (
            <button
              type="button"
              data-testid="status-meters-toggle-btn"
              onClick={() => setIsMetersCollapsed(false)}
              className="px-2 py-1 rounded-lg bg-[#FFFBEB]/95 border-3 border-[#09090B] shadow-[0_3px_0_#09090B] text-[10px] font-extrabold text-[#09090B] cursor-pointer flex items-center gap-1"
            >
              <span className="font-mono font-black">[+]</span>
              <span>⚡ Stats ({respectPercent}%)</span>
            </button>
          ) : (
            <div className="w-40 sm:w-44 space-y-1">
              <div className="flex items-center justify-between bg-[#181825] text-white border-2 border-[#09090B] rounded-md px-2 py-0.5">
                <span className="text-[9px] font-extrabold tracking-wide text-amber-300">
                  ⚡ REF METERS
                </span>
                <button
                  type="button"
                  data-testid="status-meters-toggle-btn"
                  onClick={() => setIsMetersCollapsed(true)}
                  className="px-1 rounded bg-rose-500 hover:bg-rose-400 text-white font-mono text-[9px] font-extrabold cursor-pointer"
                >
                  [-]
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FFFBEB] border-3 border-[#09090B] shadow-[0_3px_0_#09090B] rounded-lg px-2 py-0.5">
                <span className="w-4 h-4 rounded bg-emerald-500 border border-[#09090B] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  ⚡
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-[#09090B] leading-none mb-0.5">
                    <span>STAMINA</span>
                    <span className="font-mono tabular-nums">{staminaPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 border border-[#09090B] rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 origin-left"
                      style={{ transform: `scaleX(${staminaPercent / 100})` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FFFBEB] border-3 border-[#09090B] shadow-[0_3px_0_#09090B] rounded-lg px-2 py-0.5">
                <span className="w-4 h-4 rounded bg-rose-500 border border-[#09090B] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  ★
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-[#09090B] leading-none mb-0.5">
                    <span>RESPECT</span>
                    <span className="font-mono tabular-nums">{respectPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 border border-[#09090B] rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-rose-500 origin-left"
                      style={{ transform: `scaleX(${respectPercent / 100})` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#FFFBEB] border-3 border-[#09090B] shadow-[0_3px_0_#09090B] rounded-lg px-2 py-0.5">
                <span className="w-4 h-4 rounded bg-sky-500 border border-[#09090B] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  !
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-[#09090B] leading-none mb-0.5">
                    <span>STRESS</span>
                    <span className="font-mono tabular-nums">{stressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 border border-[#09090B] rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-sky-500 origin-left"
                      style={{ transform: `scaleX(${stressPercent / 100})` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
