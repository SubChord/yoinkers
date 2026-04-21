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
