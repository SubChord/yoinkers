# src/entities

## OVERVIEW
Factory functions that build KAPLAY GameObjs and return `{ obj, ...state }` wrappers consumed by systems.

## FILE MAP
- Player.ts — `createPlayer(k, characterId?)` / `updatePlayer`; sprite z=10, scale 2; 4-dir walk via frame offset (FACING_ROW, WALK_FPS=8, 4 frames). Sprite key and starting weapon are resolved from `CHARACTER_SPRITES` / `CHARACTER_STARTING_WEAPONS` tables (ninja → `player-walk` + `shuriken`; jesus → `jesus-walk` + `holyBeam`).
- Enemy.ts — `spawnEnemy(k, id, x, y, opts)` z=5 (boss z=6); `opts.waveScale` scales HP, speed, and damage (damage via `ENEMY_DAMAGE_SCALE_RATIO`); `opts.elite` adds HP×2.2 / dmg×1.4 / spd×1.1 / xp×1.8 + red tint. `updateEnemy` returns `EnemyEvent` = `"none" | "explode"` — chase + flip for normal enemies; leapers run a 3-phase state machine (`approach → telegraph 0.6s → lunge @600px/s`) and return `"explode"` when they reach target or time out (0.8s). `playDeathAnim` shrink+spin+fade over 0.3s then destroys; `destroyEnemy` plain destroy for non-kill cleanup.
- Projectile.ts — `spawnProjectile` only; z=7 (ground=2); rotation only for linear/pierce/boomerang; orbit sprites try `play("spin")` in try/catch (katana orbit lacks the anim).
- XpGem.ts — `spawnXpGem` z=3; `updateGem` returns `"idle" | "collected"`; tier picked by xp value (small/medium/large/huge).
- Gear.ts — `spawnGear` creates TWO objs: glow `circle(18)` z=3 + sprite z=4. Both positions synced each frame. Pickup destroys both.
- Item.ts — `spawnItem` z=4 with bob + magnet; pickup-only bobbing drop.
- Chest.ts — `spawnChest` z=3, pulses scale until opened; frame 0 closed / frame 1 open. Also hosts `rollLoot` / `applyLoot` / `lootLabel` helpers.
- Scenery.ts — `scatterScenery(k, palette)` spawns ~2300 static primitives (grass/flowers/mushrooms/bushes/trees/rocks/logs) at z 1-5. No wrapper, no update.

## CONVENTIONS
- Signature: `createX / spawnX(k, ...args) => { obj, ...state }`. Never return a bare `GameObj` — systems expect the wrapper.
- No KAPLAY `tag()` / `area()` / `body()`. Collisions and pickups are `Math.hypot(dx, dy) < range` against the wrapper's `obj.pos`.
- Facing lives on the wrapper (`facing: Facing` or `"left"|"right"`), not on the GameObj. Driver code mutates `(obj as any).frame` or `flipX` from the wrapper's facing.
- Animation swap guard: only call `obj.play(key)` when `obj.curAnim?.() !== key`. See Enemy.ts updateEnemy.
- Pickup bob pattern: `obj.pos.y = baseY + Math.sin(bobT) * 3`. Magnet mutates `baseY` (and `obj.pos.x` directly) so the sine offset survives magnet travel. See Item.ts and Gear.ts.

## PLAYER INPUT
`updatePlayer` polls `getMobileInput()` first; if `mobile.active` and stick has any magnitude, uses `mobile.dirX/dirY` as-is (already magnitude-scaled). Otherwise falls back to keyboard `isButtonDown("left"|"right"|"up"|"down")` and normalizes via `k.vec2().unit()`. Both paths share `speed * speedBuffMult * dt`, world clamp, and the same facing rule (dominant axis wins, exact diagonal keeps previous facing).

## GOTCHAS
- Projectile.ts has NO update or destroy — WeaponSystem owns the projectile lifecycle, collisions, and cleanup.
- Enemies are not pooled; each `spawnEnemy` is a fresh `k.add`. Respect that when tuning spawn counts.
- Gear destroy must remove BOTH `drop.obj` and `drop.glow`. Destroying only the sprite leaves an orphan glow circle.
- Scenery is fire-and-forget — never add `onUpdate` there; 2300 primitives × per-frame logic will tank the frame.
- `playDeathAnim` is the only correct kill path for weapons, nuke, and nova blast (it self-destructs after the 0.3s tween). Bare `enemy.obj.destroy()` is reserved for spawner cleanup of stale/out-of-range refs AND for leaper self-detonation (GameScene calls `leaper.obj.destroy()` directly before running AoE damage — no xp gem, no kill counter).
- Player facing is sticky on exact diagonals — intentional. Don't "fix" it.
