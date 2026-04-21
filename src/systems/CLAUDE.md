# systems/

## OVERVIEW
Mutable per-scene classes (one instance per run, owned by GameScene) plus a few module-level helpers (SaveStore, MobileInput, PickupVfx).

## FILE MAP
- `WeaponSystem.ts` — class. Owns projectiles, fires weapons, resolves hits.
- `EnemySpawner.ts` — class. Wave spawns + streaming; exposes `enemies[]`, `nearest()`, `removeAt()`.
- `UpgradeSystem.ts` — module (stateless). `pickUpgradeChoices()`, `applyUpgrade()`.
- `GearSystem.ts` — class. World + kill drops; applies gear stacks.
- `ItemSystem.ts` — class. Consumables incl. `equip-active` (redBull / novaBlast).
- `ChestSystem.ts` — class. Timed spawns near player; rolls + applies loot.
- `QuestSystem.ts` — class. Owns its own fixed HUD rows (see below).
- `SaveStore.ts` — module. localStorage; no class.
- `StatsTracker.ts` — class. Per-weapon damage totals.
- `MusicSystem.ts` — class. Track switching + persisted selection.
- `MobileInput.ts` — module state + helpers: `setMobileMove`, `getMobileInput`, `requestMobileAction`, `consumeMobileAction`, `isTouchDevice`.
- `PickupVfx.ts` — module. `burstVfx` (pickup ring + sparkles), `popLabel` (floating text), `impactVfx` (combat hit-flash — kill makes it bigger).

## UPDATE ORDER
Verified in `GameScene.ts` lines 228-414:
1. `k.setCamPos(player.obj.pos)` (230) — runs even while paused; pause check is on line 232.
2. `updatePlayer` (250)
3. Active item activation on SPACE / mobile tap (253-376) — redBull / novaBlast
4. `spawner.update(dt, nowMs)` (378) — note swapped arg order
5. `weapons.update(nowMs, dt)` (379)
6. `chests.update(nowMs, dt)` (380)
7. `items.update(nowMs, dt)` (381)
8. `gear.update(nowMs, dt)` (382)
9. `handleEnemyTouchPlayer` (384)
10. `collectGems` (385)
11. `maybeLevelUp` (387)
12. `checkEvolutions()` (388) — local closure in GameScene, not a system
13. `updateHud` (390)
14. `minimap.update` (397) — reads `spawner.enemies`, `items.items`, `chests.chests`
15. `mobileControls.showActionButton` (404-406)
16. hp check → `endGame` (408)
17. `openUpgradeMenuIfQueued` (413)

## CONVENTIONS
- Constructors take `(k, player, ...)` plus SFX callback `(key: string) => void` and optional quest-hook callbacks.
- Common update signature: `update(nowMs, dt)` — but `EnemySpawner.update(dt, nowMs)` has the args swapped. Grep before calling.
- HUD reads `player.stats` directly (no system abstraction).
- Minimap pulls arrays off systems by reference — don't reassign `spawner.enemies`, splice in place.
- `QuestSystem` builds its own fixed-position HUD rows (see `rowY()` / `layoutRows()` in `QuestSystem.ts`); it does not go through the shared HUD.
- `MobileInput` is module state, not a class — single touch device per runtime, so a singleton is fine.

## SAVE SCHEMA
- Key: `yoinkers.save.v2`. Bump the `.v2` suffix on any breaking change — there is no migration logic.
- Fields: `runsPlayed / winCount / totalEnemiesKilled / totalDamage / totalTimeMs`, `bestWave / bestLevel / bestTimeMs / bestEnemies`, `yoinks + lifetimeYoinks + lastYoinksEarned + metaUpgrades`, `unlockedMaps / clearedMaps / lastMapId`, `lastRun`, `allTimeDamage`.
- Writes only happen in: `persistRun`, `purchaseMetaUpgrade`, `refundMetaUpgrades`, `setLastMap`, `resetSave`. No write-on-update.
- Forward-compatible via `{ ...cloneEmpty(), ...parsed, ... }` spread in `loadSave`. New optional fields just work.
- `activeItem` and `activeItemCooldownMs` live on `PlayerStats` and are runtime-only; NOT persisted.

## WeaponSystem GOTCHAS
- `fireTrail` drops ground sprites only when the player has moved `FIRE_TRAIL_DROP_DIST = 28` pixels since the last drop (not a cooldown).
- Fire-arrow synergy: when player has `fireTrail` in `weapons` AND `upgrades["arrow-pierce"] > 0`, arrow damage is multiplied by `FIRE_ARROW_BONUS_MULT = 1.5` and tinted orange.
- Orbits (`magicOrb`, `dualKatana`, `arcaneHalo`) are persistent projectiles reconciled every frame by `ensureOrbit` — it adds/removes orbs to match `stats.count` and rewrites radius/speed/damage on existing ones.
- `computeStats` runs every frame per weapon — cheap, but don't mutate its return value.
- Per-weapon upgrade keys: `"<weaponId>-damage" | "<weaponId>-cooldown" | "<weaponId>-count"` on `player.stats.upgrades`. Evolved weapons (e.g. `stormShuriken`, `warhammerKunai`) have their own `WeaponId` and therefore their own key namespace — they do NOT inherit the base weapon's upgrade levels.

## GENERAL GOTCHAS
- Evolution logic lives in `GameScene.ts` (`checkEvolutions` closure, line 171), NOT in `GearSystem`.
- Kills fan out via the `WeaponSystem` `onEnemyDeath` callback passed from GameScene (lines 66-76): spawn xp gem, `items.onEnemyKilled`, `gear.onEnemyKilled`, `quests.onKill`, boss SFX, `playDeathAnim`, `spawner.removeAt(index)`, increment kill counter. The `ItemSystem.nukeAll` path and the GameScene novaBlast path both replicate this (see line 362-370) and both use `playDeathAnim` instead of a plain `obj.destroy()`.
- `ItemSystem` `equip-active` pickups (redBull, novaBlast) set `player.stats.activeItem` and reset `activeItemCooldownMs = 0`. They do NOT trigger the effect — consumption happens in GameScene on SPACE / mobile action (lines 253-376).
- `ItemSystem` converts wasted heals to `WASTED_ITEM_XP = 40` XP (see `isWasted`).
