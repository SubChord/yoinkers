export type EnemyId =
  | "slime"
  | "skeleton"
  | "bat"
  | "mushroom"
  | "snake"
  | "spider"
  | "spirit"
  | "racoon"
  | "octopus"
  | "mole"
  | "owl"
  | "boss-slime"
  | "boss-spirit"
  | "boss-octopus"
  | "boss-racoon";

export interface EnemyDef {
  id: EnemyId;
  spriteKey: string;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  area: number;
  minWave: number;
  boss: boolean;
  scale: number;
  tint?: [number, number, number];
}

export const ENEMY_DEFS: Record<EnemyId, EnemyDef> = {
  slime: {
    id: "slime",
    spriteKey: "enemy-slime",
    hp: 28, speed: 40, damage: 10, xpValue: 5,
    area: 22, minWave: 1, boss: false, scale: 1,
  },
  bat: {
    id: "bat",
    spriteKey: "enemy-bat",
    hp: 20, speed: 80, damage: 8, xpValue: 8,
    area: 20, minWave: 1, boss: false, scale: 1,
  },
  skeleton: {
    id: "skeleton",
    spriteKey: "enemy-skel",
    hp: 55, speed: 55, damage: 15, xpValue: 10,
    area: 26, minWave: 3, boss: false, scale: 1,
  },
  mushroom: {
    id: "mushroom",
    spriteKey: "enemy-mushroom",
    hp: 90, speed: 30, damage: 18, xpValue: 14,
    area: 26, minWave: 4, boss: false, scale: 1,
  },
  snake: {
    id: "snake",
    spriteKey: "enemy-snake",
    hp: 30, speed: 95, damage: 12, xpValue: 11,
    area: 20, minWave: 5, boss: false, scale: 1,
  },
  spider: {
    id: "spider",
    spriteKey: "enemy-spider",
    hp: 65, speed: 70, damage: 14, xpValue: 13,
    area: 22, minWave: 6, boss: false, scale: 1,
  },
  spirit: {
    id: "spirit",
    spriteKey: "enemy-spirit",
    hp: 45, speed: 85, damage: 16, xpValue: 16,
    area: 22, minWave: 8, boss: false, scale: 1,
  },
  racoon: {
    id: "racoon",
    spriteKey: "enemy-racoon",
    hp: 110, speed: 60, damage: 18, xpValue: 18,
    area: 26, minWave: 10, boss: false, scale: 1,
  },
  octopus: {
    id: "octopus",
    spriteKey: "enemy-octopus",
    hp: 140, speed: 50, damage: 22, xpValue: 22,
    area: 26, minWave: 12, boss: false, scale: 1,
  },
  mole: {
    id: "mole",
    spriteKey: "enemy-mole",
    hp: 95, speed: 70, damage: 18, xpValue: 20,
    area: 24, minWave: 14, boss: false, scale: 1,
  },
  owl: {
    id: "owl",
    spriteKey: "enemy-owl",
    hp: 70, speed: 110, damage: 20, xpValue: 24,
    area: 22, minWave: 16, boss: false, scale: 1,
  },

  "boss-slime": {
    id: "boss-slime",
    spriteKey: "enemy-slime",
    hp: 600, speed: 45, damage: 28, xpValue: 120,
    area: 48, minWave: 5, boss: true, scale: 3,
    tint: [255, 160, 160],
  },
  "boss-spirit": {
    id: "boss-spirit",
    spriteKey: "enemy-spirit",
    hp: 1100, speed: 70, damage: 34, xpValue: 220,
    area: 46, minWave: 10, boss: true, scale: 2.8,
    tint: [255, 200, 120],
  },
  "boss-octopus": {
    id: "boss-octopus",
    spriteKey: "enemy-octopus",
    hp: 2000, speed: 55, damage: 42, xpValue: 360,
    area: 54, minWave: 15, boss: true, scale: 3.2,
    tint: [180, 180, 255],
  },
  "boss-racoon": {
    id: "boss-racoon",
    spriteKey: "enemy-racoon",
    hp: 3200, speed: 65, damage: 52, xpValue: 500,
    area: 56, minWave: 20, boss: true, scale: 3.4,
    tint: [255, 220, 140],
  },
};

export const BASIC_ENEMY_IDS: EnemyId[] = [
  "slime", "bat", "skeleton", "mushroom", "snake",
  "spider", "spirit", "racoon", "octopus", "mole", "owl",
];

export const BOSS_ENEMY_IDS: EnemyId[] = [
  "boss-slime", "boss-spirit", "boss-octopus", "boss-racoon",
];

export function availableEnemiesForWave(wave: number): EnemyId[] {
  return BASIC_ENEMY_IDS.filter((id) => ENEMY_DEFS[id].minWave <= wave);
}

export function bossForWave(wave: number): EnemyId | null {
  if (wave < 5 || wave % 5 !== 0) return null;
  const eligible = BOSS_ENEMY_IDS.filter((id) => ENEMY_DEFS[id].minWave <= wave);
  if (eligible.length === 0) return null;
  return eligible[eligible.length - 1];
}
