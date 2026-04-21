export type GearId =
  | "amulet"
  | "feather"
  | "hammer"
  | "book"
  | "bag"
  | "hourglass"
  | "sai"
  | "patrick";

export interface GearDef {
  id: GearId;
  label: string;
  description: string;
  spriteKey: string;
  rarity: number;
}

export const GEAR_DEFS: Record<GearId, GearDef> = {
  amulet: {
    id: "amulet",
    label: "Amulet of Vitality",
    description: "+25 max HP per copy. Evolves Bomb into Mega Bomb.",
    spriteKey: "gear-amulet",
    rarity: 1.0,
  },
  feather: {
    id: "feather",
    label: "Feather of Swiftness",
    description: "+10% movement speed per copy. Evolves Shuriken into Storm Shuriken.",
    spriteKey: "gear-feather",
    rarity: 1.0,
  },
  hammer: {
    id: "hammer",
    label: "Hammer of Might",
    description: "+10% weapon damage per copy. Evolves Kunai into Warhammer Kunai.",
    spriteKey: "gear-hammer",
    rarity: 0.8,
  },
  book: {
    id: "book",
    label: "Book of Wisdom",
    description: "+15% XP gain per copy. Evolves Magic Orb into Arcane Halo.",
    spriteKey: "gear-book",
    rarity: 0.8,
  },
  bag: {
    id: "bag",
    label: "Bag of Yoinking",
    description: "+35% pickup magnet per copy. Evolves Caltrops into Blood Spikes.",
    spriteKey: "gear-bag",
    rarity: 0.9,
  },
  hourglass: {
    id: "hourglass",
    label: "Hourglass of Haste",
    description: "-8% weapon cooldown per copy. Evolves Arrow Volley into Arrow Hail.",
    spriteKey: "gear-hourglass",
    rarity: 0.7,
  },
  sai: {
    id: "sai",
    label: "Twin Sai",
    description: "Ancient dueling daggers. Pair with a Samurai Sword to awaken a dual blade form.",
    spriteKey: "gear-sai",
    rarity: 0.5,
  },
  patrick: {
    id: "patrick",
    label: "Patrick Star",
    description: "A dim-witted starfish sidekick. +8% damage per copy. Evolves Krabby Patty into Best Friends Forever.",
    spriteKey: "gear-patrick",
    rarity: 0.5,
  },
};

export const GEAR_IDS: GearId[] = Object.keys(GEAR_DEFS) as GearId[];

export function weightedRandomGear(rand: () => number): GearId {
  const entries = GEAR_IDS.map((id) => ({ id, weight: GEAR_DEFS[id].rarity }));
  const total = entries.reduce((a, e) => a + e.weight, 0);
  let r = rand() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.id;
  }
  return entries[entries.length - 1].id;
}

export function applyGearStack(player: {
  stats: {
    maxHp: number;
    hp: number;
    speed: number;
    damageMult: number;
    cooldownMult: number;
    magnetMult: number;
    xpMult: number;
  };
}, id: GearId): void {
  switch (id) {
    case "amulet":
      player.stats.maxHp += 25;
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 25);
      break;
    case "feather":
      player.stats.speed *= 1.1;
      break;
    case "hammer":
      player.stats.damageMult *= 1.1;
      break;
    case "book":
      player.stats.xpMult *= 1.15;
      break;
    case "bag":
      player.stats.magnetMult *= 1.35;
      break;
    case "hourglass":
      player.stats.cooldownMult *= 0.92;
      break;
    case "sai":
      player.stats.damageMult *= 1.05;
      break;
    case "patrick":
      player.stats.damageMult *= 1.08;
      break;
  }
}
