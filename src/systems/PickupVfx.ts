import type { KAPLAYCtx } from "kaplay";

interface VfxOpts {
  x: number;
  y: number;
  /** RGB colour of the flash ring and sparkles */
  color: [number, number, number];
  /** Initial ring radius (default 8) */
  ringStart?: number;
  /** Final ring radius (default 36) */
  ringEnd?: number;
  /** Number of sparkle particles (default 6) */
  sparkles?: number;
  /** Ring + sparkle lifetime in seconds (default 0.35) */
  duration?: number;
  /** Screen‑shake intensity, 0 to skip (default 0) */
  shake?: number;
}

/**
 * Spawn a Vampire-Survivors-style burst at the given position:
 *   – expanding + fading ring
 *   – small sparkle dots flying outward
 *   – optional screen shake
 */
export function burstVfx(k: KAPLAYCtx, opts: VfxOpts): void {
  const {
    x,
    y,
    color,
    ringStart = 8,
    ringEnd = 36,
    sparkles = 6,
    duration = 0.35,
    shake = 0,
  } = opts;

  if (shake > 0) k.shake(shake);

  // --- expanding ring ---
  const ring = k.add([
    k.circle(ringStart),
    k.pos(x, y),
    k.anchor("center"),
    k.color(...color),
    k.opacity(0.7),
    k.z(48),
  ]);
  let t = 0;
  ring.onUpdate(() => {
    t += k.dt();
    const p = Math.min(t / duration, 1);
    const ease = 1 - (1 - p) * (1 - p); // easeOutQuad
    (ring as any).radius = ringStart + (ringEnd - ringStart) * ease;
    (ring as any).opacity = 0.7 * (1 - p);
    if (p >= 1) ring.destroy();
  });

  // --- sparkle particles ---
  const angleStep = (Math.PI * 2) / sparkles;
  for (let i = 0; i < sparkles; i++) {
    const angle = angleStep * i + k.rand(-0.3, 0.3);
    const speed = k.rand(80, 160);
    const size = k.rand(2, 4);
    const spark = k.add([
      k.circle(size),
      k.pos(x, y),
      k.anchor("center"),
      k.color(...color),
      k.opacity(1),
      k.z(49),
    ]);
    let st = 0;
    spark.onUpdate(() => {
      st += k.dt();
      const sp = Math.min(st / duration, 1);
      spark.pos.x += Math.cos(angle) * speed * k.dt();
      spark.pos.y += Math.sin(angle) * speed * k.dt();
      (spark as any).opacity = 1 - sp;
      if (sp >= 1) spark.destroy();
    });
  }
}

interface LabelOpts {
  x: number;
  y: number;
  text: string;
  color: [number, number, number];
  /** Duration in ms (default 1500) */
  durationMs?: number;
  /** Starting scale multiplier (default 1.6) */
  popScale?: number;
}

/**
 * Floating pickup label with a scale-pop that shrinks to 1× then fades out.
 */
export function popLabel(k: KAPLAYCtx, opts: LabelOpts): void {
  const {
    x,
    y,
    text,
    color,
    durationMs = 1500,
    popScale = 1.6,
  } = opts;

  const label = k.add([
    k.text(text, { size: 16 }),
    k.pos(x, y - 20),
    k.anchor("center"),
    k.color(...color),
    k.opacity(1),
    k.scale(popScale),
    k.z(50),
  ]);

  let elapsed = 0;
  const duration = durationMs / 1000;
  const popDur = 0.15;

  label.onUpdate(() => {
    elapsed += k.dt();
    label.pos.y -= 22 * k.dt();

    // scale pop: shrink from popScale → 1 in the first popDur seconds
    if (elapsed < popDur) {
      const sp = elapsed / popDur;
      const s = popScale + (1 - popScale) * sp;
      (label as any).scale = k.vec2(s, s);
    }

    (label as any).opacity = Math.max(0, 1 - elapsed / duration);
    if (elapsed >= duration) label.destroy();
  });
}

interface ImpactOpts {
  x: number;
  y: number;
  /** RGB colour (default white) */
  color?: [number, number, number];
  /** Flash radius (default 14) */
  radius?: number;
  /** Number of spark particles (default 4) */
  sparks?: number;
  /** Whether this was a killing blow — bigger flash (default false) */
  kill?: boolean;
}

/**
 * Quick combat hit-flash: bright circle that pops then fades,
 * plus small directional sparks.
 */
export function impactVfx(k: KAPLAYCtx, opts: ImpactOpts): void {
  const {
    x,
    y,
    color = [255, 255, 255],
    radius = 14,
    sparks = 4,
    kill = false,
  } = opts;

  const dur = kill ? 0.25 : 0.15;
  const startRadius = kill ? radius * 0.6 : radius * 0.4;
  const endRadius = kill ? radius * 1.6 : radius;
  const startOpacity = kill ? 0.9 : 0.7;

  // --- flash circle ---
  const flash = k.add([
    k.circle(startRadius),
    k.pos(x, y),
    k.anchor("center"),
    k.color(...color),
    k.opacity(startOpacity),
    k.z(15),
  ]);
  let t = 0;
  flash.onUpdate(() => {
    t += k.dt();
    const p = Math.min(t / dur, 1);
    (flash as any).radius = startRadius + (endRadius - startRadius) * p;
    (flash as any).opacity = startOpacity * (1 - p);
    if (p >= 1) flash.destroy();
  });

  // --- spark particles ---
  for (let i = 0; i < sparks; i++) {
    const angle = k.rand(0, Math.PI * 2);
    const speed = k.rand(60, 140);
    const size = k.rand(1.5, 3);
    const spark = k.add([
      k.circle(size),
      k.pos(x, y),
      k.anchor("center"),
      k.color(...color),
      k.opacity(0.9),
      k.z(15),
    ]);
    let st = 0;
    spark.onUpdate(() => {
      st += k.dt();
      const sp = Math.min(st / dur, 1);
      spark.pos.x += Math.cos(angle) * speed * k.dt();
      spark.pos.y += Math.sin(angle) * speed * k.dt();
      (spark as any).opacity = 0.9 * (1 - sp);
      if (sp >= 1) spark.destroy();
    });
  }
}
