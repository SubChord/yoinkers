# YOINKERS KNOWLEDGE BASE

**Generated:** 2026-04-21
**Commit:** 3d14b1e
**Branch:** main

## OVERVIEW
Vampire-Survivors-style roguelike. KAPLAY 3001 + Vite + TypeScript. Single package, ~6.4k LOC, canvas rendering, localStorage persistence.

## STRUCTURE
```
./
├── src/
│   ├── main.ts              # KAPLAY init, sprite/sound loads, scene registration, k.go("menu")
│   ├── config/              # Data defs: weapons (14), enemies, gear, items, upgrades, maps, music, quests, meta
│   ├── entities/            # In-world factories (Player, Enemy + playDeathAnim, Projectile, Gear, Item, XpGem, Chest, Scenery)
│   ├── systems/             # Per-scene engines + MobileInput (touch) + SaveStore (localStorage) + PickupVfx helpers
│   ├── scenes/              # 7 KAPLAY scenes (menu, game, end, stats, guide, maps, shop)
│   ├── ui/                  # Fixed-layer HUD + overlays + MobileControls (joystick + action button)
│   └── types/GameTypes.ts   # Shared types (PlayerStats, EndStats, Facing, ActiveItemId)
├── public/assets/           # Runtime sprite + sound assets — paths as "assets/..." (no leading slash)
├── Ninja Adventure - Asset Pack/   # Source pack, NOT served. Curate into public/assets/ manually.
├── index.html               # #app mount, <script src="/src/main.ts">
├── vite.config.ts           # base "/" dev, "/yoinkers/" build
├── tsconfig.json            # strict, types:[], include: ["src/main.ts"] only
└── .github/workflows/deploy.yml   # push main → build → peaceiris/actions-gh-pages@v4 → gh-pages branch
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Add/balance weapon | `src/config/WeaponDefs.ts` + fire switch in `src/systems/WeaponSystem.ts:fireWeapon` |
| Add weapon evolution | `WEAPON_EVOLUTIONS` at `src/scenes/GameScene.ts:542-599` (7 entries, gated on `gear[id] >= 1`) |
| Add enemy | `src/config/EnemyDefs.ts` + sprite load in `src/main.ts` `ENEMY_SPRITES` |
| Add upgrade | `src/config/UpgradeDefs.ts` (kinds: weapon-unlock / weapon-upgrade / boost). WeaponSystem reads `upgrades["<weapon>-damage\|cooldown\|count"]` verbatim. |
| Meta / shop | `src/config/MetaUpgradeDefs.ts`, `src/scenes/ShopScene.ts` |
| Save schema | `src/systems/SaveStore.ts` (key `yoinkers.save.v2`, no migration — bump to v3 on breaking change) |
| Wave scaling | `src/systems/EnemySpawner.ts` |
| Game loop | `src/scenes/GameScene.ts` (612 lines — orchestrator, collisions, win/loss, evolutions) |
| Active item (SPACE / mobile tap) | `src/scenes/GameScene.ts:253-376` |
| Mobile input | `src/systems/MobileInput.ts` + `src/ui/MobileControls.ts`. Routed via `getMobileInput()` inside `updatePlayer`. |
| HUD / level-up UI | `src/ui/HUD.ts`, `src/ui/UpgradeMenu.ts` |

## CODE MAP
| Symbol | Location | Role |
|--------|----------|------|
| `WeaponSystem` | systems/WeaponSystem.ts | Largest file (772 lines). Fire cadence, projectiles, orbits (magicOrb / dualKatana / arcaneHalo), fire-trail drops, fire-arrow synergy (`FIRE_ARROW_BONUS_MULT` 1.5x when `fireTrail` + `arrow-pierce` upgrade). |
| `registerGameScene` | scenes/GameScene.ts | Per-frame update sequencer. All collisions and win-condition checks here. |
| `SaveStore` | systems/SaveStore.ts | Stateless localStorage I/O. Key `yoinkers.save.v2`. Forward-compatible `{...defaults, ...parsed}` spread in `loadSave`. |
| `playDeathAnim` | entities/Enemy.ts:112 | Shrink + spin + fade (not a plain destroy). Called from `WeaponSystem` kill path, `ItemSystem.nukeAll`, and Nova Blast. |
| `impactVfx` | systems/PickupVfx.ts:156 | Combat hit flash (distinct from `burstVfx` pickup ring). Pass `kill: true` for a larger flash. |
| `MobileInput` module | systems/MobileInput.ts | Module-level state: `setMobileMove`, `getMobileInput`, `requestMobileAction`, `consumeMobileAction`, `isTouchDevice`. |

## CONVENTIONS
- **Assets referenced WITHOUT leading slash**: `"assets/..."`. Vite base (`/yoinkers/` in prod) is prepended at build. Leading-slash breaks prod.
- **Scenes register via `register*Scene(k)`** that calls `k.scene(name, handler)`. Never instantiate `kaplay()` outside `main.ts`.
- **Systems are per-scene instances** created inside the scene handler. They do NOT persist across `k.go(...)`.
- **KAPLAY 3001 idioms**: `obj.scaleTo(n)` and `obj.scaleTo(x, y)` to mutate scale (NOT `obj.scale = n`). `k.setCamPos(...)` (not `camPos`). The scale setter throws on non-Vec2 writes.
- **Orbit sprites**: `spawnProjectile` creates the sprite with `{ frame: 0 }` then wraps `obj.play("spin")` in `try/catch` so non-animated orbit sprites (e.g. `weapon-katana` for dualKatana) don't crash.
- **Player movement source**: keyboard buttons (`up/down/left/right` from `main.ts:21-26`) AND mobile joystick coexist. `updatePlayer` uses mobile if active, keyboard otherwise.
- **Active item is a single slot.** Pickup of `redBull` / `novaBlast` sets `player.stats.activeItem` and resets `activeItemCooldownMs`. SPACE or mobile-tap consumes + sets cooldown. HUD shows `[SPACE] <label> <Ns>` during cooldown.
- **Stat multipliers are multiplicative** on `PlayerStats` (`damageMult`, `cooldownMult`, `magnetMult`, `xpMult`, `damageBuffMult`, `speedBuffMult`). Buffs expire via `*BuffExpiresMs`.
- **Z-bands**: world 0-10, HUD 100-102, damage flash 200, pause overlay 400-401, upgrade menu 500-503, evolution popup 600-603.

## ANTI-PATTERNS (THIS PROJECT)
- Do NOT assign `obj.scale = x`. Use `obj.scaleTo(x)` or `obj.scaleTo(x, y)` — KAPLAY 3001 setter throws.
- Do NOT read from `"Ninja Adventure - Asset Pack/"` at runtime. Copy needed files into `public/assets/` first.
- Do NOT instantiate `kaplay()` outside `main.ts` — pass `k` down.
- Do NOT change `STORAGE_KEY` suffix without a migration — breaks existing players' saves.
- Do NOT add a tsconfig path alias — project uses relative imports; `types: []` and `include: ["src/main.ts"]` are intentional.
- Do NOT call `k.play("spin")` unconditionally on orbit sprites. Some evolved orbits use sprites without a `spin` anim (e.g. `weapon-katana` for dualKatana); use the try/catch pattern in `spawnProjectile`.
- Do NOT commit `pnpm-lock.yaml` as source of truth — CI uses `npm ci` against `package-lock.json`. Both lockfiles currently exist; prefer npm.

## COMMANDS
```bash
npm run dev       # vite dev server, base "/"
npm run build     # tsc --noEmit then vite build, base "/yoinkers/"
npm run preview   # serve ./dist
```
Deploy: push to `main` → GitHub Action builds `./dist` → push to `gh-pages` → served at `https://<user>.github.io/yoinkers/`.

## NOTES
- No tests, no ESLint, no Prettier. `tsc --noEmit` in the build script is the only gate.
- Win = survive 900s (`GAME_DURATION_MS`). Loss = `hp <= 0`.
- "Yoinks" = persistent post-run currency spent in `ShopScene` on meta upgrades.
- XP curve: `xpForLevel(level)` in `GameConfig.ts`. Array entries for levels 0-9, then `last * 1.2^(level - 9)` past the array.
- `checkEvolutions` at `GameScene.ts:171` still contains 3 `console.log("[EVO] ...")` debug statements (lines 177, 178, 189). Remove when the samurai-sword/evolution flow is considered stable.
- Mobile detection is one-time at scene mount (`isTouchDevice()` in `GameScene.ts:94`). Rotating from touch to non-touch mid-scene won't teardown mobile UI.
