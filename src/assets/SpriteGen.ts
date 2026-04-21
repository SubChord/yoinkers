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
