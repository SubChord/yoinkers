export type QuestMetric =
  | "kills"
  | "eliteKills"
  | "bossKills"
  | "chests"
  | "items"
  | "gems"
  | "level"
  | "wave"
  | "damage";

export type QuestReward =
  | { kind: "maxHp"; amount: number }
  | { kind: "heal-full" }
  | { kind: "speed"; mult: number }
  | { kind: "damage"; mult: number }
  | { kind: "cooldown"; mult: number }
  | { kind: "magnet"; mult: number }
  | { kind: "xp"; amount: number }
  | { kind: "gear" };

export interface QuestDef {
  id: string;
  metric: QuestMetric;
  goal: number;
  label: string;
  reward: QuestReward;
  rewardText: string;
}

export const QUEST_DEFS: QuestDef[] = [
  { id: "q-kill-50", metric: "kills", goal: 50, label: "Defeat 50 enemies", reward: { kind: "maxHp", amount: 20 }, rewardText: "+20 Max HP" },
  { id: "q-kill-150", metric: "kills", goal: 150, label: "Defeat 150 enemies", reward: { kind: "damage", mult: 1.1 }, rewardText: "+10% Damage" },
  { id: "q-kill-400", metric: "kills", goal: 400, label: "Defeat 400 enemies", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-elite-5", metric: "eliteKills", goal: 5, label: "Slay 5 elites", reward: { kind: "cooldown", mult: 0.92 }, rewardText: "-8% Cooldown" },
  { id: "q-elite-15", metric: "eliteKills", goal: 15, label: "Slay 15 elites", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-boss-1", metric: "bossKills", goal: 1, label: "Topple a boss", reward: { kind: "heal-full" }, rewardText: "Full Heal" },
  { id: "q-boss-3", metric: "bossKills", goal: 3, label: "Topple 3 bosses", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-chest-5", metric: "chests", goal: 5, label: "Open 5 chests", reward: { kind: "magnet", mult: 1.3 }, rewardText: "+30% Magnet" },
  { id: "q-chest-15", metric: "chests", goal: 15, label: "Open 15 chests", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-items-8", metric: "items", goal: 8, label: "Grab 8 consumables", reward: { kind: "speed", mult: 1.05 }, rewardText: "+5% Speed" },
  { id: "q-items-25", metric: "items", goal: 25, label: "Grab 25 consumables", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-gems-200", metric: "gems", goal: 200, label: "Collect 200 gems", reward: { kind: "xp", amount: 200 }, rewardText: "+200 XP" },
  { id: "q-level-5", metric: "level", goal: 5, label: "Reach level 5", reward: { kind: "maxHp", amount: 30 }, rewardText: "+30 Max HP" },
  { id: "q-level-10", metric: "level", goal: 10, label: "Reach level 10", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-wave-5", metric: "wave", goal: 5, label: "Survive to wave 5", reward: { kind: "speed", mult: 1.05 }, rewardText: "+5% Speed" },
  { id: "q-wave-15", metric: "wave", goal: 15, label: "Survive to wave 15", reward: { kind: "gear" }, rewardText: "Random Gear" },
  { id: "q-damage-5k", metric: "damage", goal: 5_000, label: "Deal 5k damage", reward: { kind: "damage", mult: 1.08 }, rewardText: "+8% Damage" },
  { id: "q-damage-20k", metric: "damage", goal: 20_000, label: "Deal 20k damage", reward: { kind: "gear" }, rewardText: "Random Gear" },
];
