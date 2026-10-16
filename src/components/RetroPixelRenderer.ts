// Rounded 2D Chibi Pixel-Art Sprite Renderer (Matching the Cute Chibi Referee in User's Uploaded Screenshot — No Boxy Lego Shapes!)

export type ChibiHairStyle =
  | 'spiky_ahoge'
  | 'buzz_captain'
  | 'messy_shock'
  | 'red_cap'
  | 'ponytail';

export type ChibiPose =
  | 'victory'
  | 'shock_head_grab'
  | 'captain_protest'
  | 'wave_appeal'
  | 'referee_whistle'
  | 'referee_yellow'
  | 'referee_red'
  | 'running'
  | 'fallen'
  | 'handball_block'
  | 'shot_follow_through'
  | 'sliding_tackle'
  | 'shirt_pull_grab'
  | 'theatrical_dive'
  | 'goalkeeper_ready';

export interface ChibiDrawOptions {
  x: number;
  y: number; // ground feet Y position
  scale?: number;
  shirtColor: string;
  shortsColor: string;
  socksColor?: string;
  skinColor?: string;
  hairColor?: string;
  hairStyle?: ChibiHairStyle;
  pose?: ChibiPose;
  animPhase?: number;
  hasCaptainBand?: boolean;
  jerseyNumber?: number | string;
  label?: string;
  speechBubble?: string;
  bubbleOffsetX?: number;
  bubbleOffsetY?: number;
  isReferee?: boolean;
  isGoalkeeper?: boolean;
  gloveColor?: string;
}

function drawRoundedCapsule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke = '#09090B',
  lineWidth = 2.6
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (lineWidth > 0) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawCirclePart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  stroke = '#09090B',
  lineWidth = 2.5
) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (lineWidth > 0) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

/**
 * Draws a crisp 16-bit Soccer Ball on the pitch
 */
export function drawPixelSoccerBall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius = 11,
  rotation = 0
) {
  ctx.save();
  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius - 1, radius * 0.95, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball body
  drawCirclePart(ctx, cx, cy, radius, '#FFFFFF', '#09090B', 2.4);

  // Shaded lower rim
  ctx.fillStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.arc(cx + 1, cy + 2, radius - 3, 0.15, Math.PI - 0.15);
  ctx.fill();

  // Pentagon patches rotating with ball motion
  ctx.fillStyle = '#09090B';
  const ox = Math.cos(rotation) * 2.5;
  const oy = Math.sin(rotation) * 2.5;
  ctx.beginPath();
  ctx.arc(cx + ox, cy + oy, radius * 0.32, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const ang = rotation + (i * Math.PI) / 2;
    const px = cx + Math.cos(ang) * (radius * 0.68);
    const py = cy + Math.sin(ang) * (radius * 0.68);
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws an adorable, rounded 2D Chibi Character matching User's Uploaded Image
 */
export function drawChibiPixelCharacter(
  ctx: CanvasRenderingContext2D,
  opts: ChibiDrawOptions
) {
  const {
    x,
    y,
    scale = 1,
    shirtColor,
    shortsColor,
    socksColor = '#111827',
    skinColor = '#F7C59F',
    hairColor = '#18181B',
    hairStyle = 'spiky_ahoge',
    pose = 'running',
    animPhase = 0,
    hasCaptainBand = false,
    jerseyNumber,
    label,
    speechBubble,
    bubbleOffsetX = 0,
    bubbleOffsetY = 0,
    isReferee = false,
    isGoalkeeper = false,
    gloveColor = '#A3E635',
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const stride = pose === 'running' ? Math.sin(animPhase * 7) * 6 : 0;
  const bounce =
    pose === 'running'
      ? Math.abs(Math.cos(animPhase * 7)) * -3.5
      : Math.sin(animPhase * 3.5) * -1.8;

  // Helper to draw oversized Padded Goalkeeper Glove with wrist strap & finger ribs
  const drawKeeperGlove = (gx: number, gy: number, side: 'left' | 'right') => {
    const dir = side === 'left' ? -1 : 1;
    // Black wrist strap cuff
    drawRoundedCapsule(ctx, gx - 5, gy - 4, 10, 6, 2, '#09090B', '#09090B', 1.8);
    // White wrist band detail
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(gx - 3.5, gy - 2.5, 7, 2);
    // Oversized padded latex glove palm (16x14)
    drawRoundedCapsule(
      ctx,
      gx - 8 + dir * 2,
      gy - 11,
      16,
      14,
      6,
      gloveColor,
      '#09090B',
      2.4
    );
    // White latex backhand / finger grip ribs
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(gx - 5 + dir * 2, gy - 9, 3, 6);
    ctx.fillRect(gx - 0.5 + dir * 2, gy - 9.5, 3, 6.5);
    ctx.fillRect(gx + 4 + dir * 2, gy - 8.5, 2.5, 5.5);
    // Thumb pad sticking inward
    drawCirclePart(ctx, gx - dir * 5, gy - 2, 4, gloveColor, '#09090B', 2);
  };

  // 1. Ground Shadow Oval (Always stays flat & horizontal on the grass!)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  const shadowRx =
    pose === 'sliding_tackle' || pose === 'fallen' || pose === 'theatrical_dive'
      ? 28
      : isGoalkeeper
      ? 24
      : 21;
  ctx.ellipse(pose === 'sliding_tackle' ? 6 : 0, 0, shadowRx, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner save for vertical drop/leap (ZERO diagonal whole-body rotation so characters never tilt diagonally!)
  ctx.save();
  if (pose === 'fallen') {
    // Drop slightly as ankle is clipped & body pitches forward
    ctx.translate(2, 9);
  } else if (pose === 'sliding_tackle') {
    // Drop hips right onto the turf for a real ground slide tackle!
    ctx.translate(0, 12);
  } else if (pose === 'theatrical_dive') {
    // Leap forward mid-air with legs kicked back (no diagonal head tilt!)
    ctx.translate(4, -5);
  }

  // Body part horizontal/vertical offsets so sliding_tackle leans BACK while lunging legs forward,
  // and fallen (tripped) sweeps legs BACK while pitching torso & head FORWARD!
  const shortsShiftX =
    pose === 'sliding_tackle' ? -10 : pose === 'fallen' ? 2 : 0;
  const shortsShiftY =
    pose === 'sliding_tackle' ? 4 : pose === 'fallen' ? 3 : 0;
  const torsoShiftX =
    pose === 'sliding_tackle'
      ? -17
      : pose === 'fallen'
      ? 11
      : pose === 'theatrical_dive'
      ? 8
      : 0;
  const torsoShiftY =
    pose === 'sliding_tackle'
      ? 6
      : pose === 'fallen'
      ? 5
      : pose === 'theatrical_dive'
      ? 3
      : 0;
  const headShiftX =
    pose === 'sliding_tackle'
      ? -23
      : pose === 'fallen'
      ? 18
      : pose === 'theatrical_dive'
      ? 14
      : 0;
  const headShiftY =
    pose === 'sliding_tackle'
      ? 8
      : pose === 'fallen'
      ? 8
      : pose === 'theatrical_dive'
      ? 4
      : 0;

  // 2. Cute Rounded Chibi Legs, Socks & Cleats
  const drawLeg = (lx: number, legOffset: number) => {
    drawRoundedCapsule(ctx, lx - 5, -18 + legOffset, 10, 11, 4, skinColor);
    if (isGoalkeeper) {
      // Goalkeeper dark knee-pad band
      ctx.fillStyle = '#09090B';
      ctx.fillRect(lx - 4.8, -15 + legOffset, 9.6, 3.5);
    }
    drawRoundedCapsule(ctx, lx - 5.2, -11 + legOffset, 10.4, 8, 3, socksColor);
    drawRoundedCapsule(
      ctx,
      lx - (lx < 0 ? 7.5 : 4.5),
      -5.5 + legOffset,
      12.5,
      6,
      3,
      '#111827'
    );
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(lx - 2, -4.5 + legOffset, 2, 3);
    ctx.fillRect(lx + 1, -4.5 + legOffset, 2, 3);
  };

  if (pose === 'sliding_tackle') {
    // TRUE FOOTBALL SLIDE TACKLE MOTION (Body leans back at x=-17 while BOTH legs lunge forward +x toward opponent's ankle!):
    // 1) Dynamic white speed streaks & flying turf blades behind and under the slide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-44, -8);
    ctx.lineTo(-14, -8);
    ctx.moveTo(-38, -3);
    ctx.lineTo(18, -3);
    ctx.moveTo(-48, -14);
    ctx.lineTo(-24, -14);
    ctx.stroke();
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(38, -22, 4, 4);
    ctx.fillRect(46, -15, 3.5, 3.5);

    // 2) Bottom support leg bent underneath the hip pointing FORWARD (NO left leg split!)
    drawRoundedCapsule(ctx, -6, -12, 16, 8.5, 4, skinColor);
    drawRoundedCapsule(ctx, 6, -12, 11, 8, 3, socksColor);
    drawRoundedCapsule(ctx, 14, -14, 8, 10, 3, '#111827');

    // 3) Lead tackling leg shooting FAR FORWARD (+48px) into opponent's ankle!
    drawRoundedCapsule(ctx, 2, -19, 22, 9.5, 4, skinColor);
    drawRoundedCapsule(ctx, 20, -19.5, 18, 10, 3.5, socksColor);
    // Raised cleats/boot lunging at the ankle
    drawRoundedCapsule(ctx, 35, -25, 11, 15, 3, '#111827');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(45, -23, 3, 3);
    ctx.fillRect(45, -16, 3, 3);
  } else if (pose === 'fallen') {
    // TRUE TRIPPED MOTION (Ankle clipped from behind -> BOTH legs swept BACKWARD off the turf while torso & arms pitch FORWARD!):
    // 1) Upper swept-back leg kicked up in the air behind (-x)
    drawRoundedCapsule(ctx, -24, -24, 16, 9, 4, skinColor);
    drawRoundedCapsule(ctx, -33, -26, 12, 8.5, 3, socksColor);
    drawRoundedCapsule(ctx, -40, -30, 9, 12, 3, '#111827');

    // 2) Lower clipped leg swept backward off the grass (-x)
    drawRoundedCapsule(ctx, -16, -15, 16, 9, 4, skinColor);
    drawRoundedCapsule(ctx, -26, -16, 12, 8.5, 3, socksColor);
    drawRoundedCapsule(ctx, -33, -20, 9, 12, 3, '#111827');

    // 3) Bright Yellow/Red Ankle Clip Impact Starburst right on the tripped back ankle!
    ctx.save();
    ctx.translate(-30, -18);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, 9 + Math.sin(animPhase * 18) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (pose === 'theatrical_dive') {
    // ZERO-CONTACT SWAN DIVE (Both legs arched back in mid-air while arms fly up!):
    drawRoundedCapsule(ctx, -25, -18, 15, 9, 4, skinColor);
    drawRoundedCapsule(ctx, -33, -20, 11, 8.5, 3, socksColor);
    drawRoundedCapsule(ctx, -39, -24, 8, 12, 3, '#111827');

    drawRoundedCapsule(ctx, -18, -10, 15, 9, 4, skinColor);
    drawRoundedCapsule(ctx, -26, -11, 11, 8.5, 3, socksColor);
    drawRoundedCapsule(ctx, -32, -15, 8, 12, 3, '#111827');
  } else if (pose === 'shot_follow_through') {
    // Planted left leg + high kicking right leg follow-through (standing upright!)
    drawLeg(-8, 0);
    ctx.save();
    ctx.translate(8, -18);
    ctx.rotate(-0.65);
    drawLeg(0, 18);
    ctx.restore();
  } else if (pose === 'goalkeeper_ready' || isGoalkeeper) {
    // Wide athletic goalkeeper crouch stance on the goal line
    const keeperHop = Math.abs(Math.sin(animPhase * 5)) * -1.8;
    drawLeg(-10.5, keeperHop);
    drawLeg(10.5, keeperHop);
  } else {
    drawLeg(-8, stride);
    drawLeg(8, -stride);
  }

  // 3. Rounded Shorts (shifted with hip position)
  drawRoundedCapsule(
    ctx,
    -14 + shortsShiftX,
    -27 + bounce + shortsShiftY,
    28,
    12,
    5,
    shortsColor
  );
  if (isGoalkeeper) {
    // Padded goalkeeper hip protection stripes on shorts
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-13.5 + shortsShiftX, -25 + bounce + shortsShiftY, 3, 7);
    ctx.fillRect(10.5 + shortsShiftX, -25 + bounce + shortsShiftY, 3, 7);
  }
  ctx.beginPath();
  ctx.moveTo(shortsShiftX, -22 + bounce + shortsShiftY);
  ctx.lineTo(shortsShiftX, -16 + bounce + shortsShiftY);
  ctx.strokeStyle = '#09090B';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 4. Rounded Chibi Torso / Uniform Jersey (Leans BACK on slide tackle, pitches FORWARD when tripped!)
  drawRoundedCapsule(
    ctx,
    -15 + torsoShiftX,
    -47 + bounce + torsoShiftY,
    30,
    22,
    7,
    shirtColor
  );

  // Goalkeeper Padded Jersey Pattern (Dark Shoulder Pads + Chest Grip Chevrons)
  if (isGoalkeeper) {
    ctx.fillStyle = '#09090B';
    ctx.fillRect(-14 + torsoShiftX, -46 + bounce + torsoShiftY, 6, 4);
    ctx.fillRect(8 + torsoShiftX, -46 + bounce + torsoShiftY, 6, 4);
    ctx.fillStyle = 'rgba(9, 9, 11, 0.25)';
    ctx.fillRect(-11 + torsoShiftX, -39 + bounce + torsoShiftY, 22, 2.5);
    ctx.fillRect(-11 + torsoShiftX, -33 + bounce + torsoShiftY, 22, 2.5);
  }

  // Polo Collar
  ctx.fillStyle = isReferee || isGoalkeeper ? '#111827' : '#FFFFFF';
  ctx.strokeStyle = '#09090B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8 + torsoShiftX, -47 + bounce + torsoShiftY);
  ctx.lineTo(torsoShiftX, -40 + bounce + torsoShiftY);
  ctx.lineTo(8 + torsoShiftX, -47 + bounce + torsoShiftY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Referee Chest Pocket Badges or Player Jersey Number
  if (isReferee) {
    drawRoundedCapsule(
      ctx,
      -10 + torsoShiftX,
      -40 + bounce + torsoShiftY,
      7,
      8,
      2,
      '#FFFFFF',
      '#09090B',
      1.6
    );
    drawRoundedCapsule(
      ctx,
      3 + torsoShiftX,
      -40 + bounce + torsoShiftY,
      7,
      8,
      2,
      '#FFFFFF',
      '#09090B',
      1.6
    );
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(4.5 + torsoShiftX, -36 + bounce + torsoShiftY, 4, 3);
  } else if (jerseyNumber !== undefined) {
    ctx.fillStyle =
      shirtColor === '#FACC15' ||
      shirtColor === '#A3E635' ||
      shirtColor === '#F59E0B' ||
      shirtColor === '#06B6D4' ||
      shirtColor === '#4ADE80'
        ? '#09090B'
        : '#FFFFFF';
    ctx.font = '900 10px "Silkscreen", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(jerseyNumber), torsoShiftX, -31 + bounce + torsoShiftY);
  }

  // 5. Expressive Rounded Chibi Arms & Hands
  if (
    pose === 'referee_whistle' ||
    pose === 'referee_yellow' ||
    pose === 'referee_red'
  ) {
    // Left Arm bent up bringing silver whistle to mouth
    drawRoundedCapsule(ctx, -22, -46 + bounce, 10, 13, 5, shirtColor);
    drawRoundedCapsule(ctx, -16, -53 + bounce, 11, 9, 4, skinColor);
    // Silver Whistle at mouth
    drawRoundedCapsule(ctx, -6, -55 + bounce, 9, 6, 2.5, '#E2E8F0', '#09090B', 2);

    // Right Arm raised holding Red or Yellow Card high
    drawRoundedCapsule(ctx, 13, -52 + bounce, 10, 14, 5, shirtColor);
    drawCirclePart(ctx, 21, -56 + bounce, 5, skinColor);
    const cardHex = pose === 'referee_yellow' ? '#FACC15' : '#EF4444';
    drawRoundedCapsule(ctx, 15, -76 + bounce, 13, 18, 2.5, cardHex, '#09090B', 2.4);
  } else if (pose === 'goalkeeper_ready' || isGoalkeeper) {
    // GOALKEEPER READY STANCE: Long padded goalkeeper sleeves spread wide + Oversized Latex Keeper Gloves!
    const gkWave = Math.sin(animPhase * 5) * 2.5;
    // Left long-sleeve keeper arm spread out with black elbow pad
    drawRoundedCapsule(ctx, -26, -46 + bounce + gkWave, 13, 10, 4.5, shirtColor);
    ctx.fillStyle = '#09090B';
    ctx.fillRect(-23, -44 + bounce + gkWave, 4, 6);
    drawKeeperGlove(-30, -40 + bounce + gkWave, 'left');

    // Right long-sleeve keeper arm spread out with black elbow pad
    drawRoundedCapsule(ctx, 13, -46 + bounce - gkWave, 13, 10, 4.5, shirtColor);
    ctx.fillStyle = '#09090B';
    ctx.fillRect(19, -44 + bounce - gkWave, 4, 6);
    drawKeeperGlove(30, -40 + bounce - gkWave, 'right');
  } else if (pose === 'sliding_tackle') {
    // SLIDE TACKLE ARMS: Left hand planted back on the grass supporting the slide, right arm counter-balancing forward!
    drawRoundedCapsule(ctx, -36, -34 + bounce, 12, 16, 4.5, shirtColor);
    drawCirclePart(ctx, -35, -16 + bounce, 5, skinColor);

    drawRoundedCapsule(ctx, -3, -43 + bounce, 14, 9, 4.5, shirtColor);
    if (hasCaptainBand) {
      drawRoundedCapsule(ctx, 1, -43 + bounce, 6, 9, 1.5, '#FACC15', '#09090B', 1.5);
    }
    drawCirclePart(ctx, 13, -40 + bounce, 5, skinColor);
  } else if (pose === 'fallen') {
    // TRIPPED FLAILING ARMS: Both arms thrown wide forward/up as the player stumbles from the ankle clip!
    drawRoundedCapsule(ctx, -12, -46 + bounce, 13, 9, 4.5, shirtColor);
    drawCirclePart(ctx, -16, -44 + bounce, 5, skinColor);

    drawRoundedCapsule(ctx, 22, -44 + bounce, 15, 9, 4.5, shirtColor);
    drawCirclePart(ctx, 39, -41 + bounce, 5.5, skinColor);
  } else if (pose === 'handball_block') {
    // HANDBALL POSE: Defender extends left arm 95° straight out horizontally to block the shot!
    drawRoundedCapsule(ctx, -38, -45 + bounce, 25, 9, 4.5, shirtColor);
    drawRoundedCapsule(ctx, -46, -46 + bounce, 12, 11, 5, skinColor);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-42, -41 + bounce, 12 + Math.sin(animPhase * 15) * 3, 0, Math.PI * 2);
    ctx.stroke();
    drawRoundedCapsule(ctx, 14, -45 + bounce, 18, 9, 4.5, shirtColor);
    drawCirclePart(ctx, 33, -41 + bounce, 5.5, skinColor);
  } else if (pose === 'shirt_pull_grab') {
    // TACTICAL SHIRT PULL POSE: Both arms stretched straight out to the left grabbing red jersey fabric
    drawRoundedCapsule(ctx, -34, -44 + bounce, 21, 8.5, 4, shirtColor);
    drawCirclePart(ctx, -35, -40 + bounce, 5, skinColor);
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-36, -42 + bounce);
    ctx.lineTo(-48, -38 + bounce);
    ctx.lineTo(-48, -45 + bounce);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawRoundedCapsule(ctx, 13, -43 + bounce, 8.5, 12, 4, shirtColor);
    drawCirclePart(ctx, 18, -31 + bounce, 4.5, skinColor);
  } else if (pose === 'shock_head_grab') {
    // Both arms clutching head in shock
    drawRoundedCapsule(ctx, -23, -54 + bounce, 9, 14, 4, shirtColor);
    drawRoundedCapsule(ctx, -25, -72 + bounce, 8, 19, 4, skinColor);
    drawRoundedCapsule(ctx, 14, -54 + bounce, 9, 14, 4, shirtColor);
    drawRoundedCapsule(ctx, 17, -72 + bounce, 8, 19, 4, skinColor);
  } else if (pose === 'victory' || pose === 'theatrical_dive') {
    // Both arms raised high
    drawRoundedCapsule(ctx, -23 + torsoShiftX, -54 + bounce + torsoShiftY, 9, 13, 4, shirtColor);
    drawCirclePart(ctx, -20 + torsoShiftX, -58 + bounce + torsoShiftY, 5.5, skinColor);
    drawRoundedCapsule(ctx, 14 + torsoShiftX, -54 + bounce + torsoShiftY, 9, 13, 4, shirtColor);
    drawCirclePart(ctx, 20 + torsoShiftX, -58 + bounce + torsoShiftY, 5.5, skinColor);
  } else if (
    pose === 'captain_protest' ||
    pose === 'wave_appeal' ||
    pose === 'shot_follow_through'
  ) {
    // Left arm at side, right arm raised appealing
    drawRoundedCapsule(ctx, -22, -43 + bounce, 8, 13, 4, shirtColor);
    drawCirclePart(ctx, -18, -29 + bounce, 4.5, skinColor);

    drawRoundedCapsule(ctx, 14, -51 + bounce, 9, 13, 4, shirtColor);
    if (hasCaptainBand) {
      drawRoundedCapsule(ctx, 14, -46 + bounce, 9, 5, 1.5, '#FACC15', '#09090B', 1.5);
    }
    drawCirclePart(ctx, 20, -56 + bounce, 5, skinColor);
  } else {
    // Natural swinging running arms
    const armSwing = stride * 0.75;
    drawRoundedCapsule(ctx, -22, -44 + bounce - armSwing, 8.5, 12, 4, shirtColor);
    drawCirclePart(ctx, -18, -31 + bounce - armSwing, 4.5, skinColor);

    drawRoundedCapsule(ctx, 13.5, -44 + bounce + armSwing, 8.5, 12, 4, shirtColor);
    if (hasCaptainBand) {
      drawRoundedCapsule(
        ctx,
        13.5,
        -41 + bounce + armSwing,
        8.5,
        4.5,
        1.5,
        '#FACC15',
        '#09090B',
        1.5
      );
    }
    drawCirclePart(ctx, 18, -31 + bounce + armSwing, 4.5, skinColor);
  }

  // 6. Adorable Rounded Chibi Head & Ears (Shifted with headShiftX/headShiftY for lunge/trip motion!)
  ctx.save();
  ctx.translate(headShiftX, headShiftY);
  const headCenterY = -66 + bounce;

  // Rounded Ears
  drawCirclePart(ctx, -19, headCenterY + 3, 5, skinColor);
  drawCirclePart(ctx, 19, headCenterY + 3, 5, skinColor);

  // Smooth Rounded Chibi Head
  drawRoundedCapsule(ctx, -18.5, headCenterY - 17, 37, 34, 15, skinColor);

  // Soft rosy cheek blushes
  if (pose !== 'shock_head_grab') {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-11, headCenterY + 6, 3.8, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(11, headCenterY + 6, 3.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Pale blue shock gradient on forehead
    ctx.fillStyle = 'rgba(71, 85, 105, 0.55)';
    ctx.beginPath();
    ctx.roundRect(-16, headCenterY - 11, 32, 13, 6);
    ctx.fill();
  }

  // 7. Expressive Chibi Eyes, Eyebrows & Mouth
  if (pose === 'fallen' || pose === 'theatrical_dive') {
    // TRIPPED / TUMBLING EXPRESSION: Wincing "> <" eyes + shouting "O" mouth + flying sweat drops!
    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    // Left ">" eye
    ctx.moveTo(-12, headCenterY - 3);
    ctx.lineTo(-6, headCenterY + 1);
    ctx.lineTo(-12, headCenterY + 5);
    // Right "<" eye
    ctx.moveTo(12, headCenterY - 3);
    ctx.lineTo(6, headCenterY + 1);
    ctx.lineTo(12, headCenterY + 5);
    ctx.stroke();

    // Wide shouting "O" mouth
    drawCirclePart(ctx, 0, headCenterY + 8, 4.5, '#991B1B', '#09090B', 2);

    // Flying sweat droplets
    drawCirclePart(ctx, 23, headCenterY - 8, 3, '#38BDF8', '#09090B', 1.5);
  } else if (pose === 'sliding_tackle') {
    // FIERCE SLIDE TACKLE EXPRESSION: Angled determined eyebrows + focused eyes + clenched teeth!
    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-13, headCenterY - 6);
    ctx.lineTo(-4, headCenterY - 2.5);
    ctx.moveTo(13, headCenterY - 6);
    ctx.lineTo(4, headCenterY - 2.5);
    ctx.stroke();

    drawRoundedCapsule(ctx, -11.5, headCenterY - 1.5, 7, 7, 3, '#09090B', '#09090B', 1);
    drawRoundedCapsule(ctx, 4.5, headCenterY - 1.5, 7, 7, 3, '#09090B', '#09090B', 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-9, headCenterY + 0.5, 1.8, 0, Math.PI * 2);
    ctx.arc(7, headCenterY + 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Clenched tackling grin/grit
    drawRoundedCapsule(ctx, -6, headCenterY + 7, 12, 4.5, 2, '#FFFFFF', '#09090B', 2);
  } else if (pose === 'victory' || pose === 'wave_appeal') {
    // Happy curved "^ ^" anime eyes
    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(-8.5, headCenterY + 1, 4.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8.5, headCenterY + 1, 4.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Cheerful open smile
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(0, headCenterY + 7, 5, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else if (pose === 'shock_head_grab') {
    // Wide shocked white eyes + gritted teeth
    drawCirclePart(ctx, -8, headCenterY, 4.8, '#FFFFFF', '#09090B', 2);
    drawCirclePart(ctx, 8, headCenterY, 4.8, '#FFFFFF', '#09090B', 2);
    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.arc(-8, headCenterY, 1.8, 0, Math.PI * 2);
    ctx.arc(8, headCenterY, 1.8, 0, Math.PI * 2);
    ctx.fill();

    drawRoundedCapsule(ctx, -7, headCenterY + 7, 14, 5.5, 2, '#FFFFFF', '#09090B', 2);
  } else {
    // Confident Chibi Anime Eyes with White Sparkle Catchlights (Matching User's Uploaded Referee Image!)
    // Bold eyebrows
    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-13, headCenterY - 5);
    ctx.lineTo(-4, headCenterY - 3.5);
    ctx.moveTo(13, headCenterY - 5);
    ctx.lineTo(4, headCenterY - 3.5);
    ctx.stroke();

    // Rounded dark eyes
    drawRoundedCapsule(ctx, -12, headCenterY - 2, 7.5, 7.5, 3.5, '#09090B', '#09090B', 1);
    drawRoundedCapsule(ctx, 4.5, headCenterY - 2, 7.5, 7.5, 3.5, '#09090B', '#09090B', 1);

    // Cute white eye sparkle catchlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-9.5, headCenterY + 0.5, 2, 0, Math.PI * 2);
    ctx.arc(7, headCenterY + 0.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cute nose dot & confident smile
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-1, headCenterY + 3.5, 2, 2);

    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, headCenterY + 7, 4, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // 8. 5 Distinct, Unmistakable Chibi Hairstyles (Spiky, Buzz, Messy, Cap, Pony)
  ctx.fillStyle = hairColor;
  ctx.strokeStyle = '#09090B';
  ctx.lineWidth = 2.6;

  if (hairStyle === 'red_cap') {
    // STYLE 4: PRO CAP — Curved red/dark baseball cap dome + bold forward visor brim + white front badge
    drawRoundedCapsule(ctx, -20, headCenterY - 23, 40, 16, 8, '#DC2626', '#09090B', 2.6);
    // Forward visor brim sticking out prominently
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.moveTo(-16, headCenterY - 10);
    ctx.quadraticCurveTo(8, headCenterY - 14, 29, headCenterY - 7);
    ctx.quadraticCurveTo(12, headCenterY - 4, -16, headCenterY - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // White referee emblem on cap front
    drawRoundedCapsule(ctx, -7, headCenterY - 20, 14, 6, 2, '#FFFFFF', '#09090B', 1.8);
    // Top cap button
    drawCirclePart(ctx, 0, headCenterY - 24, 3, '#FFFFFF', '#09090B', 1.8);
  } else if (hairStyle === 'buzz_captain') {
    // STYLE 2: BUZZ CUT + ATHLETIC SWEATBAND — Close-cropped military fade + crisp white/gold headband
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(0, headCenterY - 5, 19.2, Math.PI * 1.04, Math.PI * 1.96);
    ctx.lineTo(18, headCenterY - 9);
    ctx.lineTo(-18, headCenterY - 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Buzz stubble texture dots
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let bx = -12; bx <= 12; bx += 6) {
      ctx.fillRect(bx, headCenterY - 18, 2.5, 2.5);
    }

    // Crisp White & Gold Pro Athletic Headband across forehead
    drawRoundedCapsule(ctx, -19.5, headCenterY - 12, 39, 6.5, 3, '#FFFFFF', '#09090B', 2.2);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-17, headCenterY - 10, 34, 2.5);
  } else if (hairStyle === 'messy_shock') {
    // STYLE 3: MESSY / WILD CURLY AFRO-PERM — Big fluffy cloud puffs on top and sides + wavy bangs
    const puffs = [
      { px: -16, py: headCenterY - 10, r: 9.5 },
      { px: 16, py: headCenterY - 10, r: 9.5 },
      { px: -11, py: headCenterY - 20, r: 10.5 },
      { px: 11, py: headCenterY - 20, r: 10.5 },
      { px: 0, py: headCenterY - 23, r: 11.5 },
      { px: -6, py: headCenterY - 13, r: 8.5 },
      { px: 6, py: headCenterY - 13, r: 8.5 },
    ];
    for (const pf of puffs) {
      drawCirclePart(ctx, pf.px, pf.py, pf.r, hairColor, '#09090B', 2.4);
    }
    // Fill inner hair core so no internal seams show
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.ellipse(0, headCenterY - 16, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Curly lock highlight spirals
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-8, headCenterY - 19, 4, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, headCenterY - 18, 4, 0.4, Math.PI * 1.6);
    ctx.stroke();
  } else if (hairStyle === 'ponytail') {
    // STYLE 5: HIGH PONYTAIL — Sleek parted bangs + bright scrunchy tie + long flowing ponytail plume on right
    // Flowing rear ponytail plume
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(12, headCenterY - 18);
    ctx.quadraticCurveTo(32, headCenterY - 26, 33, headCenterY - 6);
    ctx.quadraticCurveTo(34, headCenterY + 6, 22, headCenterY + 4);
    ctx.quadraticCurveTo(21, headCenterY - 8, 12, headCenterY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bright gold/red hair scrunchy tie
    drawCirclePart(ctx, 15, headCenterY - 16, 5, '#F43F5E', '#09090B', 2.2);

    // Sleek rounded crown + side-swept bangs
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(0, headCenterY - 5, 20, Math.PI * 0.95, Math.PI * 2.05);
    ctx.quadraticCurveTo(10, headCenterY - 4, 0, headCenterY - 10);
    ctx.quadraticCurveTo(-10, headCenterY - 4, -19, headCenterY - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hair sheen arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-5, headCenterY - 13, 9, Math.PI * 1.15, Math.PI * 1.65);
    ctx.stroke();
  } else {
    // STYLE 1: SPIKY (`spiky_ahoge`) — Bold 5-Point Anime Spikes shooting upward + jagged front bangs
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(-19, headCenterY - 6);
    // Left side spike
    ctx.lineTo(-26, headCenterY - 16);
    ctx.lineTo(-16, headCenterY - 19);
    // Upper-left tall spike
    ctx.lineTo(-19, headCenterY - 31);
    ctx.lineTo(-7, headCenterY - 23);
    // Center hero ahoge mega-spike
    ctx.lineTo(1, headCenterY - 36);
    ctx.lineTo(8, headCenterY - 23);
    // Upper-right tall spike
    ctx.lineTo(21, headCenterY - 30);
    ctx.lineTo(16, headCenterY - 18);
    // Right side spike
    ctx.lineTo(26, headCenterY - 14);
    ctx.lineTo(19, headCenterY - 5);
    // Jagged front bangs across forehead
    ctx.lineTo(10, headCenterY - 9);
    ctx.lineTo(4, headCenterY - 4);
    ctx.lineTo(-2, headCenterY - 10);
    ctx.lineTo(-9, headCenterY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle hair sheen highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, headCenterY - 18);
    ctx.lineTo(0, headCenterY - 26);
    ctx.lineTo(5, headCenterY - 17);
    ctx.stroke();
  }

  // Restore head shift transform
  ctx.restore();

  // Restore inner body transform so Speech Bubble & Name Tag are ALWAYS 100% horizontal!
  ctx.restore();

  // 9. Optional Speech Bubble above character (Always Horizontal + Supports Non-Overlapping Offsets!)
  if (speechBubble) {
    ctx.font = '800 11px "Noto Sans KR", sans-serif';
    const tw = Math.max(58, ctx.measureText(speechBubble).width + 16);
    const bx = bubbleOffsetX;
    const by = headCenterY - 48 + bubbleOffsetY;
    drawRoundedCapsule(
      ctx,
      bx - tw / 2,
      by,
      tw,
      20,
      6,
      '#FFFBEB',
      '#09090B',
      2.2
    );
    ctx.fillStyle = '#09090B';
    ctx.textAlign = 'center';
    ctx.fillText(speechBubble, bx, by + 14);
  }

  // 10. Optional Name Tag below feet (Always Horizontal!)
  if (label) {
    ctx.font = '800 10px "Noto Sans KR", sans-serif';
    const lw = Math.max(46, ctx.measureText(label).width + 12);
    drawRoundedCapsule(ctx, -lw / 2, 4, lw, 15, 4, 'rgba(9, 9, 11, 0.85)', '#09090B', 1.5);
    ctx.fillStyle = isReferee ? '#A3E635' : '#FEF08A';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 15);
  }

  ctx.restore();
}
