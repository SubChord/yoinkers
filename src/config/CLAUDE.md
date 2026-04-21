# src/config

## OVERVIEW
Pure data directory. No runtime logic beyond weighted-random helpers, XP curve, and meta-bonus aggregation.

## FILE MAP
- `EnemyDefs.ts` — enemy stats, wave gating, boss selection. `EnemyId`, `ENEMY_DEFS`, `BASIC_ENEMY_IDS`, `BOSS_ENEMY_IDS`, `availableEnemiesForWave`, `bossForWave`.
- `GameConfig.ts` — raw numeric constants (world size, player base stats, wave timing, XP curve). `GAME_WIDTH/HEIGHT`, `WORLD_SIZE`, `PLAYER_BASE_*`, `WAVE_DURATION_MS`, `GAME_DURATION_MS`, `XP_PER_LEVEL`, `xpForLevel`.
- `GearDefs.ts` — passive gear pickups + stacking. `GearId`, `GEAR_DEFS`, `weightedRandomGear`, `applyGearStack` (mutates player.stats).
- `ItemDefs.ts` — consumable pickups with discriminated `ItemEffect` union. `ItemId`, `ITEM_DEFS`, `weightedRandomItem`.
- `MapDefs.ts` — biome palettes and progression. `MapId`, `MAP_DEFS`, `MAP_ORDER`. `defaultTrackId` must match a `MusicTrack.id`.
- `MetaUpgradeDefs.ts` — persistent meta-progression. `MetaUpgradeId`, `META_UPGRADE_DEFS`, `metaUpgradeCost`, `computeMetaBonuses` → `MetaBonuses`.
- `MusicDefs.ts` — BGM registry. `MusicTrack`, `MUSIC_TRACKS`, `DEFAULT_TRACK_ID`.
- `QuestDefs.ts` — in-run quest goals + rewards. `QuestMetric`, `QuestReward`, `QUEST_DEFS` (array, not record).
- `UpgradeDefs.ts` — level-up choice pool: weapon-unlock, weapon-upgrade, boost. `UpgradeDef`, `UPGRADE_DEFS`, `UPGRADES_BY_ID`.
- `WeaponDefs.ts` — weapon stat blocks including evolutions. `WeaponId`, `WeaponStats`, `WEAPON_DEFS`, `WEAPON_IDS`.

## CONVENTIONS
- IDs are hand-maintained string-literal unions paired with `Record<Id, Def>`. Adding an entry requires updating both the union and the record — TS errors if out of sync.
- `rarity` fields are raw weights for `weightedRandom*` helpers; no normalization, no tiers.
- Cross-file refs: `UpgradeDef.weapon: WeaponId` imports from WeaponDefs. `MapDef.defaultTrackId: string` indexes `MusicTrack.id` (runtime-checked, not typed).
- `ItemEffect` is a `{ kind }` discriminated union consumed by pickup-effect dispatch. `kind: "equip-active"` (redBull, novaBlast) does NOT apply a one-shot effect — it writes `activeItemId` to `player.stats.activeItem` for later manual trigger. Distinct from `kind: "buff-*"` etc.
- `QUEST_DEFS` is an array; quests are iterated in order, not keyed by id.
- `computeMetaBonuses` produces multipliers (1 + lvl * pct) and flat bonuses consumed once at run start.

## XP CURVE
`xpForLevel(level)` in `GameConfig.ts` — first 10 levels from `XP_PER_LEVEL` array, then extrapolates `last * 1.2^(level - 9)` via `XP_POST_ARRAY_GROWTH`.

## GOTCHAS
- Adding a new weapon requires ALL of: `WeaponId` union + `WEAPON_DEFS` entry + `UpgradeDefs` unlock entry + `WeaponSystem` fire switch case + sprite loaded in `main.ts`. Missing any one → silent failure (weapon offered but nothing fires, or never offered, or renders as missing sprite).
- `spriteKey` typos fail silently at render time — KAPLAY draws nothing. Verify sprite is actually loaded.
- `dualKatana` and `arcaneHalo` have `cooldownMs: 0` on purpose — they are persistent orbit weapons driven by update loop, not cooldown-gated fire events. Do not "fix" to non-zero.
- Evolutions (`stormShuriken`, `arcaneHalo`, `warhammerKunai`, `arrowHail`, `megaBomb`, `bloodspikes`, `dualKatana`) have no unlock upgrade — they are granted by evolution logic pairing a base weapon with a gear.
- `ActiveItemId` lives in `types/GameTypes`, not here — ItemDefs imports it.
- Boss spawns gated to `wave >= 5 && wave % 5 === 0` inside `bossForWave`; changing cadence requires editing that predicate, not just `minWave`.
