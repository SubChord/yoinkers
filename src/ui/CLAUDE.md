# src/ui

## OVERVIEW
Fixed-layer HUD + overlays + mobile touch controls. Pinned to camera, not world.

## FILE MAP
- `HUD.ts` — `createHud(k)` / `updateHud(refs, state)`: hp/xp/wave/timer/score, weapons, gear icons, active-item slot.
- `UpgradeMenu.ts` — `showUpgradeMenu(k, {choices, onChoose})`: dim backdrop + 3 cards, number keys + click.
- `EvolutionPopup.ts` — `showEvolutionPopup(k, {title, subtitle, spriteKey, onDone})`: rays/panel/flash/sprite burst ~3.2s.
- `DamageOverlay.ts` — `mountDamageOverlay(k)` → `{flash()}`: red full-screen flash on hit.
- `Minimap.ts` — `mountMinimap(k)` → `{update(ctx)}`: 140px square, player + enemy/item/chest dot pools.
- `MusicSelector.ts` — `mountMusicSelector(k, music)`: bottom-right 260×44 panel with prev/next arrows.
- `PauseButton.ts` — `mountPauseButton(k, {onToggle})` → `{setPaused}`: 44px btn + PAUSED overlay/label/hint.
- `MobileControls.ts` — `mountMobileControls(k)` → `{showActionButton, destroy}`: left joystick + right action button.

## CONVENTIONS
`.fixed()` on every element — omit and it parents to world, not camera. UpgradeMenu binds `k.onKeyPress("1"|"2"|"3")` by card index plus `card.onClick(chooseThis)`; handlers cancelled in `destroy`. PauseButton is mouse-only — ESC/P live in GameScene. MusicSelector arrows are mouse-only (onClick). MobileControls uses `k.onTouchStart/Move/End`, tracks `joyTouchId`/`actionTouchId` by `t.identifier`, writes `setMobileMove(nx, ny, active)` and `requestMobileAction()` into `systems/MobileInput` module state.

## ACTIVE ITEM HUD
In `HUD.ts`: `activeItemIcon` + `activeItemText` live at top-right under Wave. When `player.stats.activeItem` set → icon opacity 1, label `[SPACE] <label>` from `ACTIVE_ITEM_LABELS`. During cooldown (`activeItemCooldownMs > now`) label becomes `[SPACE] <label> Ns` dimmed rgb(160,160,160); ready = rgb(255,220,40). When `activeItem === null` → icon opacity 0, text cleared.

## GOTCHAS
- `state.paused` in GameScene is the single source of truth. UpgradeMenu and EvolutionPopup flip it in their callbacks. `openUpgradeMenuIfQueued` chains via `onChoose` — do not make UpgradeMenu async-dismiss or menus will stack.
- EvolutionPopup uses `(obj as any).scaleTo(n)` (KAPLAY 3001 setter). Assigning `.scale = {x,y}` or a number throws.
- Minimap dots reuse `dotPool` and toggle opacity — never `k.add` per frame.
- MobileControls mounted once at scene start via `isTouchDevice()` check in GameScene; a device switching no-touch → touch mid-scene gets no controls.
- PauseButton positions itself via `PANEL_WIDTH_GUESS = 260` to the left of MusicSelector. Keep that constant in sync with MusicSelector's `PANEL_WIDTH`.
