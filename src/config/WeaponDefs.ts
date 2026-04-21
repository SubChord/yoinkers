export type WeaponId =
  | "shuriken"
  | "magicOrb"
  | "boomerang"
  | "arrow"
  | "bomb"
  | "caltrop"
  | "samuraiSword"
  | "dualKatana";

export interface WeaponStats {
  damage: number;
  cooldownMs: number;
  speed: number;
  range: number;
  count: number;
  area: number;
}

export interface WeaponDef {
  id: WeaponId;
  label: string;
  description: string;
  spriteKey: string;
  base: WeaponStats;
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  shuriken: {
    id: "shuriken",
    label: "Shuriken",
    description: "Auto-throws spinning stars at the nearest enemy.",
    spriteKey: "shuriken",
    base: { damage: 20, cooldownMs: 800, speed: 360, range: 380, count: 1, area: 22 },
  },
  magicOrb: {
    id: "magicOrb",
    label: "Magic Orb",
    description: "Orbits around you dealing damage on contact.",
    spriteKey: "magic-orb",
    base: { damage: 12, cooldownMs: 600, speed: 0, range: 90, count: 1, area: 26 },
  },
  boomerang: {
    id: "boomerang",
    label: "Kunai",
    description: "Throws a piercing kunai that returns to you.",
    spriteKey: "boomerang",
    base: { damage: 28, cooldownMs: 1600, speed: 320, range: 420, count: 1, area: 24 },
  },
  arrow: {
    id: "arrow",
    label: "Arrow Volley",
    description: "Flat arrows that pierce through enemies.",
    spriteKey: "weapon-arrow",
    base: { damage: 18, cooldownMs: 900, speed: 520, range: 520, count: 1, area: 18 },
  },
  bomb: {
    id: "bomb",
    label: "Bomb",
    description: "Lobbed explosive with wide area damage.",
    spriteKey: "weapon-bomb",
    base: { damage: 60, cooldownMs: 2400, speed: 240, range: 260, count: 1, area: 80 },
  },
  caltrop: {
    id: "caltrop",
    label: "Caltrops",
    description: "Scatters spikes around you that damage over time.",
    spriteKey: "weapon-caltrop",
    base: { damage: 10, cooldownMs: 3000, speed: 0, range: 120, count: 4, area: 22 },
  },
  samuraiSword: {
    id: "samuraiSword",
    label: "Samurai Sword",
    description: "Slashes an arc in front of you cleaving nearby foes.",
    spriteKey: "weapon-katana",
    base: { damage: 32, cooldownMs: 1100, speed: 0, range: 70, count: 1, area: 44 },
  },
  dualKatana: {
    id: "dualKatana",
    label: "Dual Spinning Samurai Sword",
    description: "Twin spinning blades orbit you, shredding everything in reach.",
    spriteKey: "weapon-katana",
    base: { damage: 26, cooldownMs: 0, speed: 0, range: 0, count: 2, area: 28 },
  },
};

export const WEAPON_IDS: WeaponId[] = Object.keys(WEAPON_DEFS) as WeaponId[];
