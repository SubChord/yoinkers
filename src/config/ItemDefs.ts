import type { ActiveItemId } from "../types/GameTypes";

export type ItemId =
  | "onigiri"
  | "sushi"
  | "life-potion"
  | "medipack"
  | "milk-potion"
  | "water-potion"
  | "scroll-fire"
  | "scroll-thunder"
  | "gold-coin"
  | "redBull"
  | "novaBlast";

export type ItemEffect =
  | { kind: "heal"; amount: number }
  | { kind: "heal-full" }
  | { kind: "maxhp"; amount: number }
  | { kind: "buff-damage"; mult: number; durationMs: number }
  | { kind: "buff-speed"; mult: number; durationMs: number }
  | { kind: "nuke"; damage: number }
  | { kind: "slow-all"; mult: number; durationMs: number }
  | { kind: "xp"; amount: number }
  | { kind: "equip-active"; activeItemId: ActiveItemId };

export interface ItemDef {
  id: ItemId;
  label: string;
  spriteKey: string;
  rarity: number;
  effect: ItemEffect;
  pickupText: string;
}

export const ITEM_DEFS: Record<ItemId, ItemDef> = {
  onigiri: {
    id: "onigiri",
    label: "Onigiri",
    spriteKey: "item-onigiri",
    rarity: 1.0,
    effect: { kind: "heal", amount: 30 },
    pickupText: "+30 HP",
  },
  sushi: {
    id: "sushi",
    label: "Sushi",
    spriteKey: "item-sushi",
    rarity: 0.7,
    effect: { kind: "heal", amount: 55 },
    pickupText: "+55 HP",
  },
  "life-potion": {
    id: "life-potion",
    label: "Life Potion",
    spriteKey: "item-life-potion",
    rarity: 0.4,
    effect: { kind: "heal-full" },
    pickupText: "Full HP",
  },
  medipack: {
    id: "medipack",
    label: "Medipack",
    spriteKey: "item-medipack",
    rarity: 0.25,
    effect: { kind: "maxhp", amount: 20 },
    pickupText: "+20 Max HP",
  },
  "milk-potion": {
    id: "milk-potion",
    label: "Milk of Fury",
    spriteKey: "item-milk-potion",
    rarity: 0.45,
    effect: { kind: "buff-damage", mult: 1.4, durationMs: 10_000 },
    pickupText: "+40% DMG 10s",
  },
  "water-potion": {
    id: "water-potion",
    label: "Swift Brew",
    spriteKey: "item-water-potion",
    rarity: 0.45,
    effect: { kind: "buff-speed", mult: 1.4, durationMs: 10_000 },
    pickupText: "+40% SPD 10s",
  },
  "scroll-fire": {
    id: "scroll-fire",
    label: "Scroll of Fire",
    spriteKey: "item-scroll-fire",
    rarity: 0.3,
    effect: { kind: "nuke", damage: 70 },
    pickupText: "Scorch the swarm",
  },
  "scroll-thunder": {
    id: "scroll-thunder",
    label: "Scroll of Thunder",
    spriteKey: "item-scroll-thunder",
    rarity: 0.3,
    effect: { kind: "slow-all", mult: 0.4, durationMs: 4000 },
    pickupText: "Time slows!",
  },
  "gold-coin": {
    id: "gold-coin",
    label: "Gold Coin",
    spriteKey: "item-gold-coin",
    rarity: 0.8,
    effect: { kind: "xp", amount: 80 },
    pickupText: "+80 XP",
  },
  redBull: {
    id: "redBull",
    label: "Red Bull",
    spriteKey: "item-redbull",
    rarity: 0.15,
    effect: { kind: "equip-active", activeItemId: "redBull" },
    pickupText: "Red Bull!",
  },
  novaBlast: {
    id: "novaBlast",
    label: "Nova Blast",
    spriteKey: "weapon-bomb",
    rarity: 0.15,
    effect: { kind: "equip-active", activeItemId: "novaBlast" },
    pickupText: "Nova Blast!",
  },
};

export const ALL_ITEM_IDS: ItemId[] = Object.keys(ITEM_DEFS) as ItemId[];

export function weightedRandomItem(rand: () => number): ItemId {
  const entries = ALL_ITEM_IDS.map((id) => ({ id, weight: ITEM_DEFS[id].rarity }));
  const total = entries.reduce((acc, e) => acc + e.weight, 0);
  let r = rand() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.id;
  }
  return entries[entries.length - 1].id;
}
