import type { WeaponId } from "./WeaponDefs";

export type UpgradeKind = "weapon-unlock" | "weapon-upgrade" | "boost";

export interface UpgradeDef {
  id: string;
  kind: UpgradeKind;
  label: string;
  description: string;
  maxLevel: number;
  icon?: string;
  weapon?: WeaponId;
}

export const UPGRADE_DEFS: UpgradeDef[] = [
  {
    id: "unlock-magicOrb",
    kind: "weapon-unlock",
    label: "Magic Orb",
    description: "Summon a magic orb that orbits you and damages nearby foes.",
    maxLevel: 1,
    icon: "magic-orb",
    weapon: "magicOrb",
  },
  {
    id: "unlock-boomerang",
    kind: "weapon-unlock",
    label: "Kunai",
    description: "Hurl a magic kunai that pierces enemies and returns to you.",
    maxLevel: 1,
    icon: "boomerang",
    weapon: "boomerang",
  },
  {
    id: "unlock-arrow",
    kind: "weapon-unlock",
    label: "Arrow Volley",
    description: "Fire fast arrows that pierce through multiple enemies.",
    maxLevel: 1,
    icon: "weapon-arrow",
    weapon: "arrow",
  },
  {
    id: "unlock-bomb",
    kind: "weapon-unlock",
    label: "Bomb",
    description: "Lob an explosive that deals area damage.",
    maxLevel: 1,
    icon: "weapon-bomb",
    weapon: "bomb",
  },
  {
    id: "unlock-caltrop",
    kind: "weapon-unlock",
    label: "Caltrops",
    description: "Scatter spikes around you that damage enemies over time.",
    maxLevel: 1,
    icon: "weapon-caltrop",
    weapon: "caltrop",
  },

  {
    id: "shuriken-damage",
    kind: "weapon-upgrade",
    label: "Sharper Shuriken",
    description: "+6 shuriken damage.",
    maxLevel: 5,
    icon: "shuriken",
    weapon: "shuriken",
  },
  {
    id: "shuriken-cooldown",
    kind: "weapon-upgrade",
    label: "Quick Draw",
    description: "-15% shuriken cooldown.",
    maxLevel: 4,
    icon: "shuriken",
    weapon: "shuriken",
  },
  {
    id: "shuriken-count",
    kind: "weapon-upgrade",
    label: "Extra Shuriken",
    description: "+1 shuriken per volley.",
    maxLevel: 3,
    icon: "shuriken",
    weapon: "shuriken",
  },

  {
    id: "magicOrb-damage",
    kind: "weapon-upgrade",
    label: "Empowered Orb",
    description: "+4 magic orb damage.",
    maxLevel: 5,
    icon: "magic-orb",
    weapon: "magicOrb",
  },
  {
    id: "magicOrb-count",
    kind: "weapon-upgrade",
    label: "Orb Multiplier",
    description: "+1 orbiting magic orb.",
    maxLevel: 3,
    icon: "magic-orb",
    weapon: "magicOrb",
  },

  {
    id: "boomerang-damage",
    kind: "weapon-upgrade",
    label: "Heavy Kunai",
    description: "+8 kunai damage.",
    maxLevel: 5,
    icon: "boomerang",
    weapon: "boomerang",
  },
  {
    id: "boomerang-count",
    kind: "weapon-upgrade",
    label: "Double Kunai",
    description: "+1 kunai per throw.",
    maxLevel: 2,
    icon: "boomerang",
    weapon: "boomerang",
  },

  {
    id: "arrow-damage",
    kind: "weapon-upgrade",
    label: "Sharpened Arrows",
    description: "+6 arrow damage.",
    maxLevel: 5,
    icon: "weapon-arrow",
    weapon: "arrow",
  },
  {
    id: "arrow-count",
    kind: "weapon-upgrade",
    label: "Volley Expansion",
    description: "+1 arrow per volley.",
    maxLevel: 3,
    icon: "weapon-arrow",
    weapon: "arrow",
  },
  {
    id: "arrow-pierce",
    kind: "weapon-upgrade",
    label: "Piercing Tip",
    description: "+1 arrow pierce.",
    maxLevel: 3,
    icon: "weapon-arrow",
    weapon: "arrow",
  },

  {
    id: "bomb-damage",
    kind: "weapon-upgrade",
    label: "Potent Explosive",
    description: "+20 bomb damage.",
    maxLevel: 5,
    icon: "weapon-bomb",
    weapon: "bomb",
  },
  {
    id: "bomb-cooldown",
    kind: "weapon-upgrade",
    label: "Short Fuse",
    description: "-15% bomb cooldown.",
    maxLevel: 3,
    icon: "weapon-bomb",
    weapon: "bomb",
  },

  {
    id: "caltrop-damage",
    kind: "weapon-upgrade",
    label: "Barbed Spikes",
    description: "+4 caltrop damage.",
    maxLevel: 5,
    icon: "weapon-caltrop",
    weapon: "caltrop",
  },
  {
    id: "caltrop-count",
    kind: "weapon-upgrade",
    label: "More Caltrops",
    description: "+1 spike per scatter.",
    maxLevel: 3,
    icon: "weapon-caltrop",
    weapon: "caltrop",
  },

  {
    id: "boost-speed",
    kind: "boost",
    label: "Swift Feet",
    description: "+12% movement speed.",
    maxLevel: 5,
    icon: "gear-feather",
  },
  {
    id: "boost-maxHp",
    kind: "boost",
    label: "Iron Body",
    description: "+25 max HP and heal to full.",
    maxLevel: 5,
    icon: "gear-amulet",
  },
  {
    id: "boost-regen",
    kind: "boost",
    label: "Regeneration",
    description: "+0.6 HP / second.",
    maxLevel: 3,
    icon: "item-medipack",
  },
  {
    id: "boost-magnet",
    kind: "boost",
    label: "Gem Magnet",
    description: "+50% gem pickup radius.",
    maxLevel: 3,
    icon: "gear-bag",
  },
  {
    id: "boost-damage",
    kind: "boost",
    label: "Battle Rage",
    description: "+10% damage to all weapons.",
    maxLevel: 5,
    icon: "gear-hammer",
  },
  {
    id: "boost-cooldown",
    kind: "boost",
    label: "Focused Mind",
    description: "-8% cooldown on all weapons.",
    maxLevel: 4,
    icon: "gear-hourglass",
  },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADE_DEFS.map((u) => [u.id, u]),
);
