// Procedural spritesheets drawn to an offscreen canvas, exported as PNG data URLs
// that KAPLAY's loadSprite consumes like any other image URL.
//
// These are built once at module init and reused for the rest of the session.

const FRAME = 32;

function newCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

/**
 * 4x4 walk spritesheet for South-Park-style Jesus.
 * Rows: 0=down, 1=up, 2=left, 3=right. 4 walk frames per row.
 */
export function buildJesusWalkDataURL(): string {
  const [canvas, ctx] = newCanvas(FRAME * 4, FRAME * 4);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.save();
      ctx.translate(col * FRAME, row * FRAME);
      const legOffset = col === 1 ? -1 : col === 3 ? 1 : 0;
      const bodyBob = col === 1 || col === 3 ? -1 : 0;
      if (row === 0) drawJesusFront(ctx, legOffset, bodyBob);
      else if (row === 1) drawJesusBack(ctx, legOffset, bodyBob);
      else drawJesusSide(ctx, legOffset, bodyBob, row === 3);
      ctx.restore();
    }
  }

  return canvas.toDataURL("image/png");
}

function drawHalo(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffe066";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(16, 4, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawJesusFront(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
): void {
  drawHalo(ctx);

  // Hair back (shoulder length)
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(6, 8, 20, 12);
  ctx.fillRect(7, 19, 18, 2);

  // Head
  ctx.fillStyle = "#f0c9a4";
  ctx.fillRect(10, 9, 12, 10);

  // Hair front bangs
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(10, 8, 12, 3);

  // Eyes
  ctx.fillStyle = "#000";
  ctx.fillRect(12, 13, 2, 2);
  ctx.fillRect(18, 13, 2, 2);

  // Beard
  ctx.fillStyle = "#5a3d28";
  ctx.fillRect(10, 16, 12, 5);
  ctx.fillRect(11, 21, 10, 2);

  // Robe body
  ctx.fillStyle = "#f4f0e0";
  ctx.fillRect(8, 20 + bodyBob, 16, 9 - bodyBob);

  // Red sash
  ctx.fillStyle = "#b02020";
  ctx.fillRect(8, 23 + bodyBob, 16, 2);

  // Sleeves (same as robe, slight edge)
  ctx.fillStyle = "#e0d8b8";
  ctx.fillRect(7, 22 + bodyBob, 2, 5);
  ctx.fillRect(23, 22 + bodyBob, 2, 5);

  // Feet / sandals
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(10 + legOffset, 29, 4, 3);
  ctx.fillRect(18 - legOffset, 29, 4, 3);
}

function drawJesusBack(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
): void {
  drawHalo(ctx);

  // Hair covering the back of the head
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(8, 8, 16, 14);
  ctx.fillRect(9, 22, 14, 2);

  // Robe body (back view — no sash visible from this angle)
  ctx.fillStyle = "#f4f0e0";
  ctx.fillRect(8, 20 + bodyBob, 16, 9 - bodyBob);

  // Sleeves
  ctx.fillStyle = "#e0d8b8";
  ctx.fillRect(7, 22 + bodyBob, 2, 5);
  ctx.fillRect(23, 22 + bodyBob, 2, 5);

  // Feet
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(10 + legOffset, 29, 4, 3);
  ctx.fillRect(18 - legOffset, 29, 4, 3);
}

function drawJesusSide(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
  facingRight: boolean,
): void {
  // Draw left-facing, flip horizontally for right-facing
  if (facingRight) {
    ctx.translate(FRAME, 0);
    ctx.scale(-1, 1);
  }

  drawHalo(ctx);

  // Hair cascade on back of head
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(13, 8, 12, 14);

  // Head profile
  ctx.fillStyle = "#f0c9a4";
  ctx.fillRect(9, 10, 10, 9);

  // Hair bangs
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(9, 8, 10, 3);

  // Eye (single, profile view)
  ctx.fillStyle = "#000";
  ctx.fillRect(11, 13, 2, 2);

  // Beard profile
  ctx.fillStyle = "#5a3d28";
  ctx.fillRect(10, 17, 8, 5);

  // Robe
  ctx.fillStyle = "#f4f0e0";
  ctx.fillRect(9, 20 + bodyBob, 14, 9 - bodyBob);

  // Red sash (diagonal suggestion — single band)
  ctx.fillStyle = "#b02020";
  ctx.fillRect(9, 23 + bodyBob, 14, 2);

  // Feet
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(11 + legOffset, 29, 4, 3);
  ctx.fillRect(17 - legOffset, 29, 4, 3);
}

/**
 * 4x4 walk spritesheet for the Crazy Cat Lady.
 * Rows: 0=down, 1=up, 2=left, 3=right. 4 walk frames per row.
 */
export function buildCatLadyWalkDataURL(): string {
  const [canvas, ctx] = newCanvas(FRAME * 4, FRAME * 4);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.save();
      ctx.translate(col * FRAME, row * FRAME);
      const legOffset = col === 1 ? -1 : col === 3 ? 1 : 0;
      const bodyBob = col === 1 || col === 3 ? -1 : 0;
      if (row === 0) drawCatLadyFront(ctx, legOffset, bodyBob);
      else if (row === 1) drawCatLadyBack(ctx, legOffset, bodyBob);
      else drawCatLadySide(ctx, legOffset, bodyBob, row === 3);
      ctx.restore();
    }
  }

  return canvas.toDataURL("image/png");
}

function drawShoulderCat(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Tiny orange tabby clinging to the shoulder
  ctx.fillStyle = "#d68828";
  ctx.fillRect(x, y, 4, 3);
  ctx.fillRect(x, y - 1, 1, 1); // left ear
  ctx.fillRect(x + 3, y - 1, 1, 1); // right ear
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 1, y + 1, 1, 1); // eye
  ctx.fillRect(x + 2, y + 1, 1, 1); // eye
}

function drawCatLadyFront(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
): void {
  // Hair (gray bun)
  ctx.fillStyle = "#bababa";
  ctx.fillRect(10, 6, 12, 5);
  ctx.fillRect(13, 4, 6, 3); // bun
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(14, 5, 4, 1); // bun highlight

  // Head
  ctx.fillStyle = "#f0c9a4";
  ctx.fillRect(11, 10, 10, 9);

  // Glasses
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(11, 13, 4, 3);
  ctx.fillRect(17, 13, 4, 3);
  ctx.fillRect(15, 14, 2, 1); // bridge
  ctx.fillStyle = "#cfe7ff";
  ctx.fillRect(12, 14, 2, 1);
  ctx.fillRect(18, 14, 2, 1);

  // Mouth
  ctx.fillStyle = "#8a4a4a";
  ctx.fillRect(14, 18, 4, 1);

  // Cardigan / body (pink)
  ctx.fillStyle = "#d87ca0";
  ctx.fillRect(8, 20 + bodyBob, 16, 9 - bodyBob);

  // Cardigan edge (darker pink)
  ctx.fillStyle = "#a6537a";
  ctx.fillRect(15, 20 + bodyBob, 2, 9 - bodyBob);

  // Sleeves
  ctx.fillStyle = "#c06080";
  ctx.fillRect(7, 22 + bodyBob, 2, 5);
  ctx.fillRect(23, 22 + bodyBob, 2, 5);

  // Shoulder cat
  drawShoulderCat(ctx, 23, 20 + bodyBob);

  // Slippers
  ctx.fillStyle = "#6a4a3a";
  ctx.fillRect(10 + legOffset, 29, 4, 3);
  ctx.fillRect(18 - legOffset, 29, 4, 3);
}

function drawCatLadyBack(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
): void {
  // Hair covering the whole back of the head
  ctx.fillStyle = "#bababa";
  ctx.fillRect(9, 6, 14, 14);
  ctx.fillRect(13, 4, 6, 3); // bun
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(14, 5, 4, 1);

  // Cardigan back
  ctx.fillStyle = "#d87ca0";
  ctx.fillRect(8, 20 + bodyBob, 16, 9 - bodyBob);

  // Sleeves
  ctx.fillStyle = "#c06080";
  ctx.fillRect(7, 22 + bodyBob, 2, 5);
  ctx.fillRect(23, 22 + bodyBob, 2, 5);

  // Shoulder cat (back view — just a lump)
  ctx.fillStyle = "#d68828";
  ctx.fillRect(8, 20 + bodyBob, 3, 3);

  // Slippers
  ctx.fillStyle = "#6a4a3a";
  ctx.fillRect(10 + legOffset, 29, 4, 3);
  ctx.fillRect(18 - legOffset, 29, 4, 3);
}

function drawCatLadySide(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
  facingRight: boolean,
): void {
  if (facingRight) {
    ctx.translate(FRAME, 0);
    ctx.scale(-1, 1);
  }

  // Hair (profile view — bun at back)
  ctx.fillStyle = "#bababa";
  ctx.fillRect(11, 6, 12, 13);
  ctx.fillRect(17, 4, 6, 3); // bun at back
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(18, 5, 4, 1);

  // Face profile
  ctx.fillStyle = "#f0c9a4";
  ctx.fillRect(9, 10, 9, 9);

  // Glasses (single lens from profile)
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(10, 13, 4, 3);
  ctx.fillStyle = "#cfe7ff";
  ctx.fillRect(11, 14, 2, 1);

  // Cardigan body
  ctx.fillStyle = "#d87ca0";
  ctx.fillRect(9, 20 + bodyBob, 14, 9 - bodyBob);

  // Darker cardigan edge
  ctx.fillStyle = "#a6537a";
  ctx.fillRect(9, 20 + bodyBob, 2, 9 - bodyBob);

  // Shoulder cat
  drawShoulderCat(ctx, 15, 20 + bodyBob);

  // Slippers
  ctx.fillStyle = "#6a4a3a";
  ctx.fillRect(11 + legOffset, 29, 4, 3);
  ctx.fillRect(17 - legOffset, 29, 4, 3);
}

/** 10x10 red laser dot with glow halo. */
export function buildLaserDotDataURL(): string {
  const [canvas, ctx] = newCanvas(10, 10);

  // Outer glow
  const grad = ctx.createRadialGradient(5, 5, 0, 5, 5, 5);
  grad.addColorStop(0, "rgba(255, 80, 80, 1)");
  grad.addColorStop(0.35, "rgba(255, 40, 40, 0.75)");
  grad.addColorStop(1, "rgba(255, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 10, 10);

  // Hot core
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(4, 4, 2, 2);

  return canvas.toDataURL("image/png");
}

/** 12x12 icy shard with a white core. */
export function buildFrostboltDataURL(): string {
  const [canvas, ctx] = newCanvas(12, 12);
  // Outer glow
  const grad = ctx.createRadialGradient(6, 6, 1, 6, 6, 6);
  grad.addColorStop(0, "rgba(240, 250, 255, 1)");
  grad.addColorStop(0.5, "rgba(120, 200, 255, 0.9)");
  grad.addColorStop(1, "rgba(50, 120, 220, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 12, 12);
  // Diamond shard
  ctx.fillStyle = "#dff4ff";
  ctx.beginPath();
  ctx.moveTo(6, 1);
  ctx.lineTo(10, 6);
  ctx.lineTo(6, 11);
  ctx.lineTo(2, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(5, 4, 2, 4);
  return canvas.toDataURL("image/png");
}

/** 28x28 sickly green cloud with darker blotches. */
export function buildPoisonCloudDataURL(): string {
  const [canvas, ctx] = newCanvas(28, 28);
  const grad = ctx.createRadialGradient(14, 14, 2, 14, 14, 14);
  grad.addColorStop(0, "rgba(180, 240, 120, 0.9)");
  grad.addColorStop(0.6, "rgba(80, 180, 60, 0.7)");
  grad.addColorStop(1, "rgba(40, 90, 30, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 28, 28);
  // Darker blotches
  ctx.fillStyle = "rgba(40, 90, 30, 0.55)";
  ctx.beginPath(); ctx.ellipse(10, 16, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(19, 11, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(16, 19, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
  // Tiny skull hint
  ctx.fillStyle = "rgba(240, 250, 200, 0.5)";
  ctx.fillRect(13, 12, 2, 2);
  ctx.fillRect(12, 15, 1, 1);
  ctx.fillRect(15, 15, 1, 1);
  return canvas.toDataURL("image/png");
}

/** 20x6 crossbow bolt — brown shaft, gray tip, pale fletching. */
export function buildCrossbowBoltDataURL(): string {
  const [canvas, ctx] = newCanvas(20, 6);
  // Shaft
  ctx.fillStyle = "#8a5a2a";
  ctx.fillRect(3, 2, 13, 2);
  ctx.fillStyle = "#6a4018";
  ctx.fillRect(3, 3, 13, 1);
  // Tip
  ctx.fillStyle = "#b8bcc4";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(20, 3);
  ctx.lineTo(16, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e4e8ee";
  ctx.fillRect(17, 2, 2, 2);
  // Fletching
  ctx.fillStyle = "#e8e0c8";
  ctx.fillRect(0, 1, 3, 4);
  ctx.fillStyle = "#a8906a";
  ctx.fillRect(0, 2, 3, 2);
  return canvas.toDataURL("image/png");
}

/** 14x14 yellow lightning bolt. */
export function buildChainBoltDataURL(): string {
  const [canvas, ctx] = newCanvas(14, 14);
  // Glow halo
  const grad = ctx.createRadialGradient(7, 7, 1, 7, 7, 7);
  grad.addColorStop(0, "rgba(255, 255, 200, 1)");
  grad.addColorStop(0.5, "rgba(255, 220, 60, 0.7)");
  grad.addColorStop(1, "rgba(255, 180, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 14, 14);
  // Zigzag bolt
  ctx.fillStyle = "#fff3a8";
  ctx.beginPath();
  ctx.moveTo(8, 1);
  ctx.lineTo(4, 7);
  ctx.lineTo(7, 7);
  ctx.lineTo(5, 13);
  ctx.lineTo(10, 6);
  ctx.lineTo(7, 6);
  ctx.lineTo(9, 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffaa00";
  ctx.lineWidth = 1;
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

/** 32x8 golden beam, single frame. */
export function buildHolyBeamDataURL(): string {
  const [canvas, ctx] = newCanvas(32, 8);

  // Soft core
  const grad = ctx.createLinearGradient(0, 0, 32, 0);
  grad.addColorStop(0, "rgba(255, 255, 200, 0.0)");
  grad.addColorStop(0.2, "rgba(255, 245, 180, 1)");
  grad.addColorStop(0.5, "rgba(255, 255, 230, 1)");
  grad.addColorStop(0.8, "rgba(255, 245, 180, 1)");
  grad.addColorStop(1, "rgba(255, 255, 200, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 2, 32, 4);

  // Bright center stripe
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(2, 3, 28, 2);

  return canvas.toDataURL("image/png");
}

/** 48x32 Flying-V electric guitar the player "wields" after the Judas Priest evolution. */
export function buildGuitarDataURL(): string {
  const [canvas, ctx] = newCanvas(48, 32);

  // Body — flying V silhouette (two diagonal wings meeting at a center point).
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(22, 22);
  ctx.lineTo(12, 28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, 26);
  ctx.lineTo(22, 10);
  ctx.lineTo(12, 4);
  ctx.closePath();
  ctx.fill();

  // Body highlights — crimson pinstripe
  ctx.strokeStyle = "#c41a1a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(7, 8);
  ctx.lineTo(20, 17);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, 24);
  ctx.lineTo(20, 15);
  ctx.stroke();

  // Neck
  ctx.fillStyle = "#1a1208";
  ctx.fillRect(22, 14, 18, 4);

  // Fret marks
  ctx.fillStyle = "#e0e0e0";
  for (let x = 25; x < 39; x += 3) {
    ctx.fillRect(x, 14, 1, 4);
  }

  // Headstock
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(40, 12, 6, 8);
  // Tuning pegs (little dots)
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(41, 13, 1, 1);
  ctx.fillRect(44, 13, 1, 1);
  ctx.fillRect(41, 18, 1, 1);
  ctx.fillRect(44, 18, 1, 1);

  // Strings — faint lines across the neck
  ctx.strokeStyle = "rgba(220, 220, 220, 0.55)";
  ctx.lineWidth = 0.5;
  for (let y = 15; y <= 17; y++) {
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(42, y);
    ctx.stroke();
  }

  // Bridge glint
  ctx.fillStyle = "#c41a1a";
  ctx.fillRect(20, 14, 2, 4);

  return canvas.toDataURL("image/png");
}

/** 24x8 jagged lightning shockwave for Judas Priest power-chord projectiles. */
export function buildShockwaveDataURL(): string {
  const [canvas, ctx] = newCanvas(24, 8);

  // Outer glow (soft red)
  ctx.fillStyle = "rgba(255, 60, 60, 0.35)";
  ctx.fillRect(0, 2, 24, 4);

  // White-hot jagged bolt
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(5, 2);
  ctx.lineTo(10, 5);
  ctx.lineTo(15, 3);
  ctx.lineTo(20, 5);
  ctx.lineTo(24, 4);
  ctx.stroke();

  // Yellow hot center
  ctx.strokeStyle = "#ffe066";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(5, 2);
  ctx.lineTo(10, 5);
  ctx.lineTo(15, 3);
  ctx.lineTo(20, 5);
  ctx.lineTo(24, 4);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

/**
 * 4x4 walk spritesheet for SpongeBob SquarePants.
 * Rows: 0=down, 1=up, 2=left, 3=right. 4 walk frames per row.
 */
export function buildSpongebobWalkDataURL(): string {
  const [canvas, ctx] = newCanvas(FRAME * 4, FRAME * 4);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.save();
      ctx.translate(col * FRAME, row * FRAME);
      const legOffset = col === 1 ? -1 : col === 3 ? 1 : 0;
      const bodyBob = col === 1 || col === 3 ? -1 : 0;
      if (row === 0) drawSpongebobFront(ctx, legOffset, bodyBob);
      else if (row === 1) drawSpongebobBack(ctx, legOffset, bodyBob);
      else drawSpongebobSide(ctx, legOffset, bodyBob, row === 3);
      ctx.restore();
    }
  }

  return canvas.toDataURL("image/png");
}

function drawSpongebobBody(ctx: CanvasRenderingContext2D, bodyBob: number): void {
  // Yellow square sponge body
  ctx.fillStyle = "#f7d23a";
  ctx.fillRect(7, 3 + bodyBob, 18, 21 - bodyBob);
  // Darker yellow edges for definition
  ctx.fillStyle = "#c9a820";
  ctx.fillRect(7, 3 + bodyBob, 18, 1);
  ctx.fillRect(7, 23, 18, 1);
  ctx.fillRect(7, 3 + bodyBob, 1, 21 - bodyBob);
  ctx.fillRect(24, 3 + bodyBob, 1, 21 - bodyBob);
  // Sponge holes
  ctx.fillStyle = "#d8b428";
  ctx.fillRect(9, 6 + bodyBob, 2, 2);
  ctx.fillRect(14, 8 + bodyBob, 2, 2);
  ctx.fillRect(20, 6 + bodyBob, 2, 2);
  ctx.fillRect(11, 12 + bodyBob, 2, 2);
  ctx.fillRect(18, 13 + bodyBob, 2, 2);
  ctx.fillRect(9, 18, 2, 2);
  ctx.fillRect(15, 20, 2, 2);
  ctx.fillRect(20, 19, 2, 2);
}

function drawSpongebobOutfit(ctx: CanvasRenderingContext2D): void {
  // White shirt collar strip
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(8, 20, 16, 2);
  // Red tie knot
  ctx.fillStyle = "#c81818";
  ctx.fillRect(14, 21, 4, 3);
  // Brown pants (at the very bottom of the body)
  ctx.fillStyle = "#6a4a20";
  ctx.fillRect(7, 24, 18, 3);
  // Belt line
  ctx.fillStyle = "#4a2f14";
  ctx.fillRect(7, 24, 18, 1);
}

function drawSpongebobLegs(ctx: CanvasRenderingContext2D, legOffset: number): void {
  // White socks
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(10 + legOffset, 27, 3, 2);
  ctx.fillRect(19 - legOffset, 27, 3, 2);
  // Red and blue stripe socks
  ctx.fillStyle = "#c81818";
  ctx.fillRect(10 + legOffset, 27, 3, 1);
  ctx.fillRect(19 - legOffset, 27, 3, 1);
  // Black shoes
  ctx.fillStyle = "#111111";
  ctx.fillRect(10 + legOffset, 29, 4, 3);
  ctx.fillRect(18 - legOffset, 29, 4, 3);
}

function drawSpongebobFront(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
): void {
  drawSpongebobBody(ctx, bodyBob);

  // Big round eyes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(10, 9 + bodyBob, 5, 5);
  ctx.fillRect(17, 9 + bodyBob, 5, 5);
  // Eye outlines
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(10, 9 + bodyBob, 5, 1);
  ctx.fillRect(10, 13 + bodyBob, 5, 1);
  ctx.fillRect(10, 9 + bodyBob, 1, 5);
  ctx.fillRect(14, 9 + bodyBob, 1, 5);
  ctx.fillRect(17, 9 + bodyBob, 5, 1);
  ctx.fillRect(17, 13 + bodyBob, 5, 1);
  ctx.fillRect(17, 9 + bodyBob, 1, 5);
  ctx.fillRect(21, 9 + bodyBob, 1, 5);
  // Blue irises
  ctx.fillStyle = "#4a90c8";
  ctx.fillRect(12, 11 + bodyBob, 2, 2);
  ctx.fillRect(19, 11 + bodyBob, 2, 2);
  // Black pupils
  ctx.fillStyle = "#111111";
  ctx.fillRect(12, 12 + bodyBob, 1, 1);
  ctx.fillRect(19, 12 + bodyBob, 1, 1);

  // Rosy cheeks
  ctx.fillStyle = "rgba(230, 80, 80, 0.5)";
  ctx.fillRect(9, 15 + bodyBob, 2, 2);
  ctx.fillRect(21, 15 + bodyBob, 2, 2);

  // Goofy toothy smile
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(12, 17 + bodyBob, 8, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(14, 17 + bodyBob, 2, 2); // two front teeth
  ctx.fillRect(16, 17 + bodyBob, 2, 2);

  drawSpongebobOutfit(ctx);
  drawSpongebobLegs(ctx, legOffset);
}

function drawSpongebobBack(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
): void {
  drawSpongebobBody(ctx, bodyBob);
  drawSpongebobOutfit(ctx);
  drawSpongebobLegs(ctx, legOffset);
}

function drawSpongebobSide(
  ctx: CanvasRenderingContext2D,
  legOffset: number,
  bodyBob: number,
  facingRight: boolean,
): void {
  if (facingRight) {
    ctx.translate(FRAME, 0);
    ctx.scale(-1, 1);
  }
  drawSpongebobBody(ctx, bodyBob);

  // Single eye in profile
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(10, 9 + bodyBob, 6, 6);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(10, 9 + bodyBob, 6, 1);
  ctx.fillRect(10, 14 + bodyBob, 6, 1);
  ctx.fillRect(10, 9 + bodyBob, 1, 6);
  ctx.fillRect(15, 9 + bodyBob, 1, 6);
  ctx.fillStyle = "#4a90c8";
  ctx.fillRect(12, 11 + bodyBob, 2, 2);
  ctx.fillStyle = "#111111";
  ctx.fillRect(12, 12 + bodyBob, 1, 1);

  // Smile from side
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(10, 17 + bodyBob, 6, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(11, 17 + bodyBob, 2, 2);

  drawSpongebobOutfit(ctx);
  drawSpongebobLegs(ctx, legOffset);
}

/** 20x16 stacked-burger Krabby Patty — bun, lettuce, patty, bun. */
export function buildKrabbyPattyDataURL(): string {
  const [canvas, ctx] = newCanvas(20, 16);

  // Top bun (golden brown dome)
  ctx.fillStyle = "#d08a3a";
  ctx.beginPath();
  ctx.ellipse(10, 4, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e0a050";
  ctx.beginPath();
  ctx.ellipse(10, 3, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sesame seeds
  ctx.fillStyle = "#f4e0a0";
  ctx.fillRect(5, 3, 1, 1);
  ctx.fillRect(8, 2, 1, 1);
  ctx.fillRect(11, 2, 1, 1);
  ctx.fillRect(14, 3, 1, 1);

  // Lettuce (green wavy strip)
  ctx.fillStyle = "#6ac048";
  ctx.fillRect(1, 6, 18, 2);
  ctx.fillStyle = "#4aa030";
  ctx.fillRect(1, 7, 18, 1);
  // Leafy edges
  ctx.fillStyle = "#6ac048";
  ctx.fillRect(1, 8, 2, 1);
  ctx.fillRect(4, 8, 2, 1);
  ctx.fillRect(8, 8, 2, 1);
  ctx.fillRect(12, 8, 2, 1);
  ctx.fillRect(16, 8, 2, 1);

  // Cheese slice (yellow triangle peeking from right)
  ctx.fillStyle = "#f0c840";
  ctx.fillRect(2, 8, 16, 1);
  ctx.fillStyle = "#d0a820";
  ctx.fillRect(14, 9, 4, 1);

  // Beef patty
  ctx.fillStyle = "#5a2e1a";
  ctx.fillRect(1, 9, 18, 3);
  ctx.fillStyle = "#3a1a0a";
  ctx.fillRect(1, 11, 18, 1);
  // Char marks
  ctx.fillStyle = "#2a0f05";
  ctx.fillRect(4, 10, 2, 1);
  ctx.fillRect(9, 10, 2, 1);
  ctx.fillRect(14, 10, 2, 1);

  // Bottom bun
  ctx.fillStyle = "#b87a2a";
  ctx.fillRect(1, 12, 18, 3);
  ctx.fillStyle = "#8a5a1a";
  ctx.fillRect(1, 14, 18, 1);

  return canvas.toDataURL("image/png");
}

/** 32x32 pink 5-point Patrick starfish with goofy face. */
export function buildPatrickDataURL(): string {
  const [canvas, ctx] = newCanvas(32, 32);

  // 5-point star in pink
  ctx.fillStyle = "#ed7590";
  ctx.beginPath();
  const cx = 16;
  const cy = 17;
  const outer = 13;
  const inner = 5.5;
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Darker underside hint
  ctx.fillStyle = "#c05070";
  ctx.beginPath();
  ctx.arc(cx, cy + 3, 8, 0, Math.PI);
  ctx.fill();

  // Lighter speckles on body
  ctx.fillStyle = "#ffa0b8";
  ctx.fillRect(10, 15, 2, 2);
  ctx.fillRect(20, 14, 2, 2);
  ctx.fillRect(14, 20, 2, 2);
  ctx.fillRect(18, 22, 2, 2);

  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(11, 14, 4, 4);
  ctx.fillRect(17, 14, 4, 4);
  ctx.fillStyle = "#111111";
  ctx.fillRect(13, 15, 1, 2);
  ctx.fillRect(19, 15, 1, 2);

  // Gap-tooth mouth
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(12, 20, 8, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(15, 20, 2, 2);

  // Green swim-trunk strip across the bottom points
  ctx.fillStyle = "#3aa048";
  ctx.fillRect(8, 24, 16, 3);
  // Purple polka dots on trunks
  ctx.fillStyle = "#9848c0";
  ctx.fillRect(10, 25, 2, 1);
  ctx.fillRect(14, 25, 2, 1);
  ctx.fillRect(18, 25, 2, 1);
  ctx.fillRect(22, 25, 1, 1);

  return canvas.toDataURL("image/png");
}

/** 32x32 stacked-swirl poop pile with a couple of buzzing flies. */
export function buildPoophoodDataURL(): string {
  const [canvas, ctx] = newCanvas(32, 32);

  // Soft ground shadow under the pile
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(16, 27, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bottom swirl (base)
  ctx.fillStyle = "#5a3a1c";
  ctx.beginPath();
  ctx.ellipse(16, 24, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b4524";
  ctx.beginPath();
  ctx.ellipse(16, 23, 9, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Middle swirl
  ctx.fillStyle = "#5a3a1c";
  ctx.beginPath();
  ctx.ellipse(16, 18, 7, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a5028";
  ctx.beginPath();
  ctx.ellipse(16, 17, 6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top swirl (tip)
  ctx.fillStyle = "#5a3a1c";
  ctx.beginPath();
  ctx.ellipse(16, 13, 4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a5c30";
  ctx.beginPath();
  ctx.ellipse(16, 12, 3, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Little tip peak
  ctx.fillStyle = "#5a3a1c";
  ctx.fillRect(15, 9, 2, 2);
  ctx.fillStyle = "#9c6836";
  ctx.fillRect(15, 10, 2, 1);

  // Highlights
  ctx.fillStyle = "rgba(255, 220, 160, 0.35)";
  ctx.fillRect(11, 22, 3, 1);
  ctx.fillRect(12, 16, 2, 1);
  ctx.fillRect(13, 11, 2, 1);

  // Two flies buzzing nearby (tiny dark specks with green tint wings)
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(4, 6, 2, 2);
  ctx.fillRect(26, 10, 2, 2);
  ctx.fillStyle = "rgba(140, 220, 120, 0.85)";
  ctx.fillRect(3, 5, 1, 1);
  ctx.fillRect(6, 5, 1, 1);
  ctx.fillRect(25, 9, 1, 1);
  ctx.fillRect(28, 9, 1, 1);

  return canvas.toDataURL("image/png");
}

/** 16x16 holy water vial. */
export function buildHolyWaterDataURL(): string {
  const [canvas, ctx] = newCanvas(16, 16);

  // Bottle neck
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(6, 1, 4, 3);

  // Bottle body
  ctx.fillStyle = "#9fd8ff";
  ctx.fillRect(3, 4, 10, 10);

  // Liquid highlight
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(4, 5, 2, 4);

  // Cross on the bottle
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(8, 7, 1, 5);
  ctx.fillRect(6, 9, 5, 1);

  // Rim shadow
  ctx.fillStyle = "#5c8fa8";
  ctx.fillRect(3, 13, 10, 1);

  return canvas.toDataURL("image/png");
}
