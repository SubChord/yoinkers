export type MetaUpgradeId =
  | "toughness"
  | "vigor"
  | "fleet"
  | "rage"
  | "focus"
  | "magnet"
  | "wisdom"
  | "greed"
  | "headstart";

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  label: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  icon?: string;
}

export const META_UPGRADE_DEFS: Record<MetaUpgradeId, MetaUpgradeDef> = {
  toughness: {
    id: "toughness",
    label: "Toughness",
    description: "+10 max HP per level.",
    maxLevel: 10,
    baseCost: 40,
    costGrowth: 1.45,
    icon: "gear-amulet",
  },
  vigor: {
    id: "vigor",
    label: "Vigor",
    description: "+0.2 HP regen / sec per level.",
    maxLevel: 5,
    baseCost: 80,
    costGrowth: 1.6,
    icon: "item-medipack",
  },
  fleet: {
    id: "fleet",
    label: "Fleet Feet",
    description: "+4% movement speed per level.",
    maxLevel: 8,
    baseCost: 60,
    costGrowth: 1.5,
    icon: "gear-feather",
  },
  rage: {
    id: "rage",
    label: "Rage",
    description: "+3% weapon damage per level.",
    maxLevel: 10,
    baseCost: 70,
    costGrowth: 1.55,
    icon: "gear-hammer",
  },
  focus: {
    id: "focus",
    label: "Focus",
    description: "-2% weapon cooldown per level.",
    maxLevel: 10,
    baseCost: 70,
    costGrowth: 1.55,
    icon: "gear-hourglass",
  },
  magnet: {
    id: "magnet",
    label: "Magnet",
    description: "+10% gem pickup radius per level.",
    maxLevel: 5,
    baseCost: 50,
    costGrowth: 1.5,
    icon: "gear-bag",
  },
  wisdom: {
    id: "wisdom",
    label: "Wisdom",
    description: "+4% XP gain per level.",
    maxLevel: 10,
    baseCost: 60,
    costGrowth: 1.5,
  },
  greed: {
    id: "greed",
    label: "Greed",
    description: "+5% yoinks earned per run, per level.",
    maxLevel: 10,
    baseCost: 100,
    costGrowth: 1.6,
  },
  headstart: {
    id: "headstart",
    label: "Head Start",
    description: "Begin with +1 starting level per level.",
    maxLevel: 3,
    baseCost: 200,
    costGrowth: 2.0,
  },
};

export const META_UPGRADE_ORDER: MetaUpgradeId[] = [
  "toughness",
  "vigor",
  "fleet",
  "rage",
  "focus",
  "magnet",
  "wisdom",
  "greed",
  "headstart",
];

export function metaUpgradeCost(def: MetaUpgradeDef, currentLevel: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

export interface MetaBonuses {
  maxHpBonus: number;
  regenBonus: number;
  speedMult: number;
  damageMult: number;
  cooldownMult: number;
  magnetMult: number;
  xpMult: number;
  yoinkMult: number;
  startingLevel: number;
}

export function computeMetaBonuses(levels: Partial<Record<MetaUpgradeId, number>>): MetaBonuses {
  const lvl = (id: MetaUpgradeId): number => levels[id] ?? 0;
  return {
    maxHpBonus: lvl("toughness") * 10,
    regenBonus: lvl("vigor") * 0.2,
    speedMult: 1 + lvl("fleet") * 0.04,
    damageMult: 1 + lvl("rage") * 0.03,
    cooldownMult: 1 - lvl("focus") * 0.02,
    magnetMult: 1 + lvl("magnet") * 0.1,
    xpMult: 1 + lvl("wisdom") * 0.04,
    yoinkMult: 1 + lvl("greed") * 0.05,
    startingLevel: lvl("headstart"),
  };
}
