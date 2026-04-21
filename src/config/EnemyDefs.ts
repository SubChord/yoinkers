export type EnemyId = "slime" | "skeleton" | "bat";

export interface EnemyDef {
  id: EnemyId;
  spriteKey: string;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  area: number;
}

export const ENEMY_DEFS: Record<EnemyId, EnemyDef> = {
  slime: {
    id: "slime",
    spriteKey: "enemy-slime",
    hp: 30,
    speed: 40,
    damage: 10,
    xpValue: 5,
    area: 24,
  },
  skeleton: {
    id: "skeleton",
    spriteKey: "enemy-skel",
    hp: 60,
    speed: 55,
    damage: 15,
    xpValue: 10,
    area: 26,
  },
  bat: {
    id: "bat",
    spriteKey: "enemy-bat",
    hp: 20,
    speed: 80,
    damage: 8,
    xpValue: 8,
    area: 20,
  },
};

export const ENEMY_IDS: EnemyId[] = Object.keys(ENEMY_DEFS) as EnemyId[];
