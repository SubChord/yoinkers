# src/scenes/

KAPLAY scenes (Vampire-Survivors clone). See root `CLAUDE.md` for engine overview, KAPLAY idioms, and anti-patterns — this file is scene-specific only.

## OVERVIEW

Each file exports `register{Name}Scene(k)` which calls `k.scene(name, handler)`. Scenes are registered once at boot; `k.go(name, ...args)` swaps.

## SCENE TABLE

| scene name | file                | args               | k.go transitions                              |
|------------|---------------------|--------------------|------------------------------------------------|
| `menu`     | MenuScene.ts        | —                  | `game {mapId}`, `maps`, `shop`, `stats`, `guide` |
| `game`     | GameScene.ts        | `{mapId?: MapId}`  | `end {EndStats}` (only — via `endGame`)       |
| `end`      | EndScene.ts         | `EndStats`         | `menu`, `shop`                                 |
| `maps`     | MapSelectScene.ts   | —                  | `menu`, `game {mapId}`                         |
| `shop`     | ShopScene.ts        | —                  | `menu`, `shop` (self, after buy/respec)        |
| `stats`    | StatsScene.ts       | —                  | `menu`, `stats` (self, after reset)            |
| `guide`    | GuideScene.ts       | —                  | `menu`                                         |

## GAMESCENE LAYOUT

- Imports ~10 systems (`EnemySpawner`, `WeaponSystem`, `ChestSystem`, `ItemSystem`, `GearSystem`, `QuestSystem`, `StatsTracker`, `MusicSystem`, `SaveStore`, `UpgradeSystem`) + UI (`HUD`, `Minimap`, `MobileControls`, `MusicSelector`, `PauseButton`, `DamageOverlay`, `UpgradeMenu`, `EvolutionPopup`).
- `GameState` (lines 96-106): `startMs, waveStartedMs, wave, enemiesKilled, paused, pauseButtonPaused, pausedAtMs, levelQueue, activeMenu`.
- Update order (lines 228-414): early-out on `paused` → time-up check → wave advance → `updatePlayer` → active-item branch → `spawner/weapons/chests/items/gear.update` → `handleEnemyTouchPlayer` → `collectGems` → `maybeLevelUp` → `checkEvolutions` → HUD/minimap/mobile refresh → hp-death check → drain `levelQueue`.
- Collision wiring: player↔enemy via `handleEnemyTouchPlayer` (AABB-ish squared distance, `PLAYER_IFRAME_MS` gate, lines 428-450). Enemy deaths flow through `WeaponSystem`'s kill callback (lines 66-80) which spawns xp gem, fans out to items/gear/quests, then `spawner.removeAt(index)`.
- `WEAPON_EVOLUTIONS` table lives at lines 542-599 — 7 entries, each `{from: WeaponId, gear: GearId, to: WeaponId, title, subtitle, spriteKey}`. Drives `checkEvolutions` (lines 171-200).
- Active item activation (lines 253-376): `k.isKeyDown("space") || consumeMobileAction()` + cooldown gate → `switch(player.stats.activeItem)` → `redBull` (speed buff + yellow burst VFX) or `novaBlast` (3 expanding rings, screen flash, `k.shake(8)`, radial damage loop over `spawner.enemies`).
- Mobile controls mount conditionally at line 94: `isTouchDevice() ? mountMobileControls(k) : null`. `mobileControls.showActionButton(...)` toggled each frame based on `activeItem !== null`.
- Win (time-up) and loss (hp≤0) both funnel through `endGame` (lines 500-523): `music.stop()` → build `stats` object → `persistRun(stats, mapId)` → `k.go("end", stats)`.

## CONVENTIONS

- **Scene args**: typed inline via local interface (`GameSceneArgs`) or imported type (`EndStats` from `types/GameTypes`).
- **SaveStore I/O**: read once on entry via `loadSave()`; writes go through specific mutators (`setLastMap`, `purchaseMetaUpgrade`, `refundMetaUpgrades`, `resetSave`, `persistRun`) — never write the whole blob.
- **Pause semantics**: `state.paused` gates the entire `k.onUpdate` tick (upgrade menu, evolution popup, and user-toggle all set it). `state.pauseButtonPaused` is the user toggle (ESC / P / pause button). Resume replays `Date.now()` drift into `startMs` + `waveStartedMs` so run timer is honest (lines 149-162).
- **Navigation keys**: every hub scene binds `escape` + `backspace` → `k.go("menu")`.

## GOTCHAS

- **Restart**: always go through `menu` — never re-enter `game` directly from `end`. MenuScene re-reads save and resupplies `mapId`.
- **Music**: must `music.stop()` explicitly before any scene swap out of `game`. Only `endGame` does this; any new exit path must too.
- **`mapId` wiring**: MenuScene passes `save.lastMapId` (line 53). MapSelectScene writes `setLastMap(def.id)` before `k.go("game", {mapId})` (lines 148-153). GameScene defaults to `"grove"` if arg missing (line 43).
- **Upgrade menu**: level-ups bump `state.levelQueue`; `openUpgradeMenuIfQueued` drains one at a time, chaining the next via `onChoose` callback (lines 205-226).
- **Evolutions**: `announced: Set<WeaponId>` ensures each evolution fires exactly once per run (line 170, 173, 180).
- **Self-reentry**: `ShopScene` re-enters `shop` after buy/respec; `StatsScene` re-enters `stats` after reset — cheap full redraw pattern.
