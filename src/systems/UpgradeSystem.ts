import { UPGRADE_DEFS, type UpgradeDef } from "../config/UpgradeDefs";
import type { Player } from "../entities/Player";

const CHOICE_COUNT = 3;
const MAX_WEAPONS = 5;

export function pickUpgradeChoices(
  player: Player,
  rand: () => number,
): UpgradeDef[] {
  const available = UPGRADE_DEFS.filter((def) => isAvailable(def, player));

  const pool = [...available];
  const chosen: UpgradeDef[] = [];

  while (pool.length > 0 && chosen.length < CHOICE_COUNT) {
    const index = Math.floor(rand() * pool.length);
    chosen.push(pool[index]);
    pool.splice(index, 1);
  }

  return chosen;
}

function isAvailable(def: UpgradeDef, player: Player): boolean {
  if (player.stats.bannedUpgrades.includes(def.id)) return false;
  const taken = player.stats.upgrades[def.id] ?? 0;
  if (taken >= def.maxLevel) return false;

  if (def.kind === "weapon-unlock") {
    if (!def.weapon) return false;
    if (player.stats.weapons.includes(def.weapon)) return false;
    return player.stats.weapons.length < MAX_WEAPONS;
  }

  if (def.kind === "weapon-upgrade") {
    if (!def.weapon) return false;
    return player.stats.weapons.includes(def.weapon);
  }

  // Active items: available if you don't already have this one equipped
  return true;
}

export function applyUpgrade(player: Player, upgrade: UpgradeDef): void {
  const stats = player.stats;
  stats.upgrades[upgrade.id] = (stats.upgrades[upgrade.id] ?? 0) + 1;

  if (upgrade.kind === "weapon-unlock" && upgrade.weapon) {
    if (!stats.weapons.includes(upgrade.weapon)) {
      stats.weapons.push(upgrade.weapon);
    }
    return;
  }

  if (upgrade.kind === "weapon-upgrade") {
    // Weapon stats are recomputed from upgrade counts inside WeaponSystem.
    return;
  }

  switch (upgrade.id) {
    case "boost-speed":
      stats.speed *= 1.12;
      break;
    case "boost-maxHp":
      stats.maxHp += 25;
      stats.hp = stats.maxHp;
      break;
    case "boost-regen":
      stats.regenPerSec += 0.6;
      break;
    case "boost-magnet":
      stats.magnetMult *= 1.5;
      break;
    case "boost-damage":
      stats.damageMult *= 1.1;
      break;
    case "boost-cooldown":
      stats.cooldownMult *= 0.92;
      break;
  }
}
