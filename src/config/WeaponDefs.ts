export type WeaponId =
  | "shuriken"
  | "magicOrb"
  | "boomerang"
  | "arrow"
  | "bomb"
  | "caltrop"
  | "samuraiSword"
  | "dualKatana"
  | "stormShuriken"
  | "arcaneHalo"
  | "warhammerKunai"
  | "arrowHail"
  | "megaBomb"
  | "bloodspikes"
  | "fireTrail"
  | "holyBeam"
  | "holyWater"
  | "judasPriest";

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
  stormShuriken: {
    id: "stormShuriken",
    label: "Storm Shuriken",
    description: "Wild triple-shuriken barrage, fires almost constantly.",
    spriteKey: "shuriken",
    base: { damage: 18, cooldownMs: 320, speed: 440, range: 440, count: 3, area: 24 },
  },
  arcaneHalo: {
    id: "arcaneHalo",
    label: "Arcane Halo",
    description: "A wide ring of magic orbs spins around you at ferocious speed.",
    spriteKey: "magic-orb",
    base: { damage: 18, cooldownMs: 0, speed: 0, range: 0, count: 4, area: 34 },
  },
  warhammerKunai: {
    id: "warhammerKunai",
    label: "Warhammer Kunai",
    description: "A massive kunai that hammers through crowds before returning.",
    spriteKey: "boomerang",
    base: { damage: 52, cooldownMs: 1400, speed: 360, range: 500, count: 1, area: 48 },
  },
  arrowHail: {
    id: "arrowHail",
    label: "Arrow Hail",
    description: "Arrows rain out in every direction on a tight cooldown.",
    spriteKey: "weapon-arrow",
    base: { damage: 14, cooldownMs: 620, speed: 520, range: 440, count: 8, area: 20 },
  },
  megaBomb: {
    id: "megaBomb",
    label: "Mega Bomb",
    description: "An enormous explosive with devastating blast radius.",
    spriteKey: "weapon-bomb",
    base: { damage: 110, cooldownMs: 1600, speed: 260, range: 300, count: 1, area: 140 },
  },
  bloodspikes: {
    id: "bloodspikes",
    label: "Blood Spikes",
    description: "A thicket of vicious spikes covering the ground around you.",
    spriteKey: "weapon-caltrop",
    base: { damage: 14, cooldownMs: 2200, speed: 0, range: 160, count: 7, area: 28 },
  },
  fireTrail: {
    id: "fireTrail",
    label: "Fire Trail",
    description: "Leave a trail of scorched earth that burns enemies.",
    spriteKey: "fire-trail",
    base: { damage: 8, cooldownMs: 250, speed: 0, range: 0, count: 1, area: 26 },
  },
  holyBeam: {
    id: "holyBeam",
    label: "Holy Beam",
    description: "A radiant piercing beam of divine light smites all in its path.",
    spriteKey: "holy-beam",
    base: { damage: 26, cooldownMs: 700, speed: 0, range: 560, count: 1, area: 18 },
  },
  holyWater: {
    id: "holyWater",
    label: "Holy Water",
    description: "Tosses a vial that shatters into a scorching sacred puddle.",
    spriteKey: "holy-water",
    base: { damage: 10, cooldownMs: 2200, speed: 260, range: 260, count: 1, area: 52 },
  },
  judasPriest: {
    id: "judasPriest",
    label: "Judas Priest",
    description: "Shred a diabolical power-chord that rains searing shockwaves on all sides.",
    spriteKey: "weapon-shockwave",
    base: { damage: 22, cooldownMs: 500, speed: 560, range: 460, count: 10, area: 20 },
  },
};

export const WEAPON_IDS: WeaponId[] = Object.keys(WEAPON_DEFS) as WeaponId[];
