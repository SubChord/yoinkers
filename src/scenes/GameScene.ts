import type { KAPLAYCtx } from "kaplay";
import {
  GAME_DURATION_MS,
  PLAYER_IFRAME_MS,
  WAVE_DURATION_MS,
  WORLD_SIZE,
  xpForLevel,
} from "../config/GameConfig";
import type { GearId } from "../config/GearDefs";
import { MAP_DEFS, type MapId } from "../config/MapDefs";
import type { WeaponId } from "../config/WeaponDefs";
import { createPlayer, updatePlayer, type Player } from "../entities/Player";
import { scatterScenery } from "../entities/Scenery";
import { updateGem, spawnXpGem, type XpGem } from "../entities/XpGem";
import { playDeathAnim, type Enemy } from "../entities/Enemy";
import { ChestSystem } from "../systems/ChestSystem";
import { EnemySpawner } from "../systems/EnemySpawner";
import { GearSystem } from "../systems/GearSystem";
import { ItemSystem } from "../systems/ItemSystem";
import { consumeMobileAction, isTouchDevice } from "../systems/MobileInput";
import { MusicSystem } from "../systems/MusicSystem";
import { burstVfx, impactVfx } from "../systems/PickupVfx";
import { QuestSystem } from "../systems/QuestSystem";
import { currentMetaBonuses, loadSave, persistRun } from "../systems/SaveStore";
import { StatsTracker } from "../systems/StatsTracker";
import { WeaponSystem } from "../systems/WeaponSystem";
import { applyUpgrade, pickUpgradeChoices } from "../systems/UpgradeSystem";
import { mountDamageOverlay } from "../ui/DamageOverlay";
import { createHud, updateHud } from "../ui/HUD";
import { mountMinimap } from "../ui/Minimap";
import { mountMobileControls, type MobileControls } from "../ui/MobileControls";
import { mountMusicSelector } from "../ui/MusicSelector";
import { mountPauseButton } from "../ui/PauseButton";
import { showEvolutionPopup } from "../ui/EvolutionPopup";
import { showUpgradeMenu, type UpgradeMenu } from "../ui/UpgradeMenu";

interface GameSceneArgs {
  mapId?: MapId;
}

export function registerGameScene(k: KAPLAYCtx): void {
  k.scene("game", (args: GameSceneArgs = {}) => {
    const mapId: MapId = args.mapId ?? "grove";
    const mapDef = MAP_DEFS[mapId];
    drawWorld(k, mapDef.palette);

    const player = createPlayer(k, loadSave().selectedCharacter);
    const pendingStartLevels = applyMetaBonuses(player);
    const spawner = new EnemySpawner(k, player);
    const gems: XpGem[] = [];
    const tracker = new StatsTracker();
    const gear = new GearSystem(k, player, (key) => playSfx(k, key));
    const quests = new QuestSystem(
      k,
      player,
      (key) => playSfx(k, key),
      (id, x, y) => gear.dropAt(x, y, id),
    );
    const handleKill = (enemy: Enemy, index: number) => {
      gems.push(spawnXpGem(k, enemy.obj.pos.x, enemy.obj.pos.y, enemy.xpValue));
      items.onEnemyKilled(enemy, enemy.isElite);
      gear.onEnemyKilled(enemy);
      quests.onKill(enemy.isElite, enemy.isBoss);
      if (enemy.isBoss) playSfx(k, "sfx-yoink");
      playDeathAnim(k, enemy);
      spawner.removeAt(index);
      state.enemiesKilled += 1;
      playSfx(k, "sfx-death");
    };
    const items = new ItemSystem(
      k,
      player,
      spawner,
      (key) => playSfx(k, key),
      () => quests.onItem(),
      (enemy, index) => handleKill(enemy, index),
    );

    const weapons = new WeaponSystem(
      k,
      player,
      spawner,
      (enemy, index) => handleKill(enemy, index),
      () => playSfx(k, "sfx-hit"),
      tracker,
      (amount) => quests.onDamage(amount),
    );

    const chests = new ChestSystem(
      k,
      player,
      (key) => playSfx(k, key),
      () => quests.onChest(),
    );
    const hud = createHud(k);
    const minimap = mountMinimap(k);
    const music = new MusicSystem(k);
    music.selectTrack(mapDef.defaultTrackId);
    mountMusicSelector(k, music);
    const damageFlash = mountDamageOverlay(k);
    const mobileControls: MobileControls | null = isTouchDevice() ? mountMobileControls(k) : null;

    interface GameState {
      startMs: number;
      waveStartedMs: number;
      wave: number;
      enemiesKilled: number;
      paused: boolean;
      pauseButtonPaused: boolean;
      pausedAtMs: number | undefined;
      levelQueue: number;
      activeMenu: UpgradeMenu | null;
    }

    const state: GameState = {
      startMs: Date.now(),
      waveStartedMs: Date.now(),
      wave: 1,
      enemiesKilled: 0,
      paused: false,
      pauseButtonPaused: false,
      pausedAtMs: undefined,
      levelQueue: 0,
      activeMenu: null,
    };

    for (let i = 0; i < pendingStartLevels; i += 1) {
      player.stats.level += 1;
      player.stats.maxHp += 5;
      player.stats.hp = player.stats.maxHp;
      state.levelQueue += 1;
      quests.onLevel(player.stats.level);
    }

    const pauseButton = mountPauseButton(k, {
      onToggle: () => togglePause(),
    });

    const togglePause = () => {
      if (state.pauseButtonPaused) {
        resumeGame();
      } else {
        pauseGame();
      }
    };

    const pauseGame = () => {
      if (state.paused) return;
      state.paused = true;
      state.pauseButtonPaused = true;
      state.pausedAtMs = Date.now();
      music.pause();
      pauseButton.setPaused(true);
    };

    const resumeGame = () => {
      if (!state.pauseButtonPaused) return;
      const pausedAt = state.pausedAtMs;
      if (pausedAt !== undefined) {
        const drift = Date.now() - pausedAt;
        state.startMs += drift;
        state.waveStartedMs += drift;
        state.pausedAtMs = undefined;
      }
      state.pauseButtonPaused = false;
      state.paused = false;
      music.resume();
      pauseButton.setPaused(false);
    };

    k.onKeyPress("escape", () => {
      if (state.pauseButtonPaused) resumeGame();
      else pauseGame();
    });
    k.onKeyPress("p", () => togglePause());

    const announced = new Set<string>();
    const checkEvolutions = () => {
      for (const evo of WEAPON_EVOLUTIONS) {
        if (announced.has(evo.to)) continue;
        if (!player.stats.weapons.includes(evo.from)) continue;
        if ((player.stats.gear[evo.gear] ?? 0) < 1) continue;

        announced.add(evo.to);
        state.paused = true;
        playSfx(k, "sfx-yoink");
        playSfx(k, "sfx-levelup");
        const idx = player.stats.weapons.indexOf(evo.from);
        if (idx >= 0) player.stats.weapons.splice(idx, 1);
        if (!player.stats.weapons.includes(evo.to)) {
          player.stats.weapons.push(evo.to);
        }
        showEvolutionPopup(k, {
          title: evo.title,
          subtitle: evo.subtitle,
          spriteKey: evo.spriteKey,
          onDone: () => {
            state.paused = false;
          },
        });
        return;
      }
    };

    spawner.spawnWave(state.wave);
    quests.onWave(state.wave);

    const openUpgradeMenuIfQueued = () => {
      if (state.paused || state.levelQueue <= 0) return;
      state.paused = true;
      const choices = pickUpgradeChoices(player, () => k.rand(0, 1));
      if (choices.length === 0) {
        state.levelQueue = 0;
        state.paused = false;
        return;
      }
      state.activeMenu = showUpgradeMenu(k, {
        choices,
        onChoose: (choice) => {
          applyUpgrade(player, choice);
          playSfx(k, "sfx-levelup");
          state.activeMenu?.destroy();
          state.activeMenu = null;
          state.levelQueue -= 1;
          state.paused = false;
          openUpgradeMenuIfQueued();
        },
      });
    };

    k.onUpdate(() => {
      const nowMs = Date.now();
      k.setCamPos(player.obj.pos);

      if (state.paused) {
        return;
      }

      const dt = k.dt();

      if (nowMs - state.startMs >= GAME_DURATION_MS) {
        endGame(k, state, player, music, tracker, mapId, true);
        return;
      }

      if (nowMs - state.waveStartedMs >= WAVE_DURATION_MS) {
        state.wave += 1;
        state.waveStartedMs = nowMs;
        spawner.spawnWave(state.wave);
        quests.onWave(state.wave);
      }

      updatePlayer(k, player, dt);

      // Active item activation (SPACE / mobile tap — Mario Kart style, 1 slot)
      const activePressed = k.isKeyPressed("space") || consumeMobileAction();
      if (
        player.stats.activeItem &&
        activePressed &&
        nowMs >= player.stats.activeItemCooldownMs
      ) {
        switch (player.stats.activeItem) {
          case "redBull": {
            const REDBULL_DURATION_MS = 2500;
            const REDBULL_COOLDOWN_MS = 12000;
            player.stats.speedBuffMult = 2.2;
            player.stats.speedBuffExpiresMs = nowMs + REDBULL_DURATION_MS;
            player.stats.activeItemCooldownMs = nowMs + REDBULL_COOLDOWN_MS;
            playSfx(k, "sfx-levelup");

            burstVfx(k, {
              x: player.obj.pos.x,
              y: player.obj.pos.y,
              color: [255, 220, 40],
              sparkles: 10,
              ringEnd: 40,
              duration: 0.4,
            });

            for (let i = 0; i < 6; i++) {
              const offsetX = k.rand(-16, 16);
              const offsetY = k.rand(-10, 10);
              const line = k.add([
                k.rect(k.rand(12, 24), 2),
                k.pos(player.obj.pos.x + offsetX, player.obj.pos.y + offsetY),
                k.anchor("center"),
                k.color(255, 255, 100),
                k.opacity(0.8),
                k.z(9),
              ]);
              const fadeTime = k.rand(0.3, 0.6);
              let elapsed = 0;
              line.onUpdate(() => {
                elapsed += k.dt();
                (line as unknown as { opacity: number }).opacity = 0.8 * (1 - elapsed / fadeTime);
                line.pos.x -= 120 * k.dt();
                if (elapsed >= fadeTime) line.destroy();
              });
            }
            break;
          }
          case "novaBlast": {
            const NOVA_RADIUS = 200;
            const NOVA_DAMAGE = 250;
            const NOVA_COOLDOWN_MS = 18000;
            player.stats.activeItemCooldownMs = nowMs + NOVA_COOLDOWN_MS;
            playSfx(k, "sfx-hit");

            for (let ring = 0; ring < 3; ring++) {
              const delay = ring * 0.08;
              const ringObj = k.add([
                k.circle(8),
                k.pos(player.obj.pos.x, player.obj.pos.y),
                k.anchor("center"),
                k.color(255, 100 - ring * 30, 20),
                k.opacity(0.9),
                k.z(50),
                k.outline(3, k.rgb(255, 200, 60)),
              ]);
              let t = -delay;
              ringObj.onUpdate(() => {
                t += k.dt();
                if (t < 0) return;
                const progress = Math.min(t / 0.4, 1);
                const r = NOVA_RADIUS * progress;
                (ringObj as unknown as { radius: number }).radius = r;
                (ringObj as unknown as { opacity: number }).opacity = 0.9 * (1 - progress);
                if (progress >= 1) ringObj.destroy();
              });
            }

            const flash = k.add([
              k.rect(k.width(), k.height()),
              k.pos(0, 0),
              k.color(255, 200, 60),
              k.opacity(0.5),
              k.fixed(),
              k.z(200),
            ]);
            let flashT = 0;
            flash.onUpdate(() => {
              flashT += k.dt();
              (flash as unknown as { opacity: number }).opacity = 0.5 * (1 - flashT / 0.25);
              if (flashT >= 0.25) flash.destroy();
            });

            k.shake(8);

            const px = player.obj.pos.x;
            const py = player.obj.pos.y;
            const r2 = NOVA_RADIUS * NOVA_RADIUS;
            for (let i = spawner.enemies.length - 1; i >= 0; i--) {
              const e = spawner.enemies[i];
              const dx = e.obj.pos.x - px;
              const dy = e.obj.pos.y - py;
              if (dx * dx + dy * dy <= r2) {
                e.hp -= NOVA_DAMAGE;
                impactVfx(k, {
                  x: e.obj.pos.x,
                  y: e.obj.pos.y,
                  color: [255, 160, 40],
                  radius: 14,
                  kill: e.hp <= 0,
                });
                if (e.hp <= 0) {
                  gems.push(spawnXpGem(k, e.obj.pos.x, e.obj.pos.y, e.xpValue));
                  items.onEnemyKilled(e, e.isElite);
                  gear.onEnemyKilled(e);
                  quests.onKill(e.isElite, e.isBoss);
                  playDeathAnim(k, e);
                  spawner.removeAt(i);
                  state.enemiesKilled += 1;
                }
              }
            }
            break;
          }
        }
      }

      spawner.update(dt, nowMs);
      weapons.update(nowMs, dt);
      chests.update(nowMs, dt);
      items.update(nowMs, dt);
      gear.update(nowMs, dt);

      handleEnemyTouchPlayer(k, player, spawner, nowMs, damageFlash);
      collectGems(k, gems, player, dt, quests);

      maybeLevelUp(player, state, quests);
      checkEvolutions();

      updateHud(hud, {
        player,
        wave: state.wave,
        enemiesKilled: state.enemiesKilled,
        remainingMs: Math.max(0, GAME_DURATION_MS - (nowMs - state.startMs)),
      });

      minimap.update({
        player,
        enemies: spawner.enemies,
        items: items.items,
        chests: chests.chests,
      });

      if (mobileControls) {
        mobileControls.showActionButton(player.stats.activeItem !== null);
      }

      if (player.stats.hp <= 0) {
        endGame(k, state, player, music, tracker, mapId, false);
        return;
      }

      openUpgradeMenuIfQueued();
    });
  });
}

function drawWorld(k: KAPLAYCtx, palette: typeof MAP_DEFS["grove"]["palette"]): void {
  k.add([
    k.rect(WORLD_SIZE, WORLD_SIZE),
    k.pos(-WORLD_SIZE / 2, -WORLD_SIZE / 2),
    k.color(palette.ground[0], palette.ground[1], palette.ground[2]),
    k.z(0),
  ]);
  scatterScenery(k, palette);
}

function handleEnemyTouchPlayer(
  k: KAPLAYCtx,
  player: Player,
  spawner: EnemySpawner,
  nowMs: number,
  damageFlash: { flash: () => void },
): void {
  if (nowMs - player.lastHitMs < PLAYER_IFRAME_MS) return;

  for (const enemy of spawner.enemies) {
    const dx = enemy.obj.pos.x - player.obj.pos.x;
    const dy = enemy.obj.pos.y - player.obj.pos.y;
    const range = enemy.area + 16;
    if (dx * dx + dy * dy <= range * range) {
      player.lastHitMs = nowMs;
      player.stats.hp = Math.max(0, player.stats.hp - enemy.damage);
      playSfx(k, "sfx-hit");
      damageFlash.flash();
      k.shake(4);
      return;
    }
  }
}

const GEM_COLORS: Record<string, [number, number, number]> = {
  small: [100, 220, 120],
  medium: [180, 120, 220],
  large: [220, 80, 80],
  huge: [240, 220, 60],
};

function collectGems(
  k: KAPLAYCtx,
  gems: XpGem[],
  player: Player,
  dt: number,
  quests: QuestSystem,
): void {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    const gem = gems[i];
    if (updateGem(gem, player, dt) === "collected") {
      burstVfx(k, {
        x: player.obj.pos.x,
        y: player.obj.pos.y,
        color: GEM_COLORS[gem.tier] ?? [100, 220, 120],
        ringEnd: 18,
        sparkles: 4,
        duration: 0.2,
      });
      quests.onGem();
      gems.splice(i, 1);
    }
  }
}

function maybeLevelUp(
  player: Player,
  state: { levelQueue: number },
  quests: QuestSystem,
): void {
  let threshold = xpForLevel(player.stats.level);
  while (player.stats.xp >= threshold) {
    player.stats.xp -= threshold;
    player.stats.level += 1;
    player.stats.maxHp += 5;
    player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 5);
    state.levelQueue += 1;
    quests.onLevel(player.stats.level);
    threshold = xpForLevel(player.stats.level);
  }
}

function endGame(
  k: KAPLAYCtx,
  state: { startMs: number; wave: number; enemiesKilled: number },
  player: Player,
  music: MusicSystem,
  tracker: StatsTracker,
  mapId: MapId,
  won: boolean,
): void {
  music.stop();
  const damageByWeapon = tracker.totals();
  const totalDamage = tracker.totalDamage();
  const stats = {
    won,
    enemiesKilled: state.enemiesKilled,
    level: player.stats.level + 1,
    wave: state.wave,
    timeSurvivedMs: Date.now() - state.startMs,
    damageByWeapon,
    totalDamage,
  };
  persistRun(stats, mapId);
  k.go("end", stats);
}

function playSfx(k: KAPLAYCtx, key: string): void {
  try {
    k.play(key, { volume: 0.6 });
  } catch {
    // Audio may be locked until the user interacts; safe to ignore.
  }
}

interface WeaponEvolution {
  from: WeaponId;
  gear: GearId;
  to: WeaponId;
  title: string;
  subtitle: string;
  spriteKey: string;
}

const WEAPON_EVOLUTIONS: WeaponEvolution[] = [
  {
    from: "samuraiSword",
    gear: "sai",
    to: "dualKatana",
    title: "Dual Spinning Samurai Sword",
    subtitle: "Samurai Sword + Twin Sai combine into whirling twin blades!",
    spriteKey: "weapon-katana",
  },
  {
    from: "shuriken",
    gear: "feather",
    to: "stormShuriken",
    title: "Storm Shuriken",
    subtitle: "Shuriken + Feather of Swiftness become a relentless triple-volley!",
    spriteKey: "shuriken",
  },
  {
    from: "magicOrb",
    gear: "book",
    to: "arcaneHalo",
    title: "Arcane Halo",
    subtitle: "Magic Orb + Book of Wisdom awaken a wide ring of spinning orbs!",
    spriteKey: "magic-orb",
  },
  {
    from: "boomerang",
    gear: "hammer",
    to: "warhammerKunai",
    title: "Warhammer Kunai",
    subtitle: "Kunai + Hammer of Might forge a crushing, oversized blade!",
    spriteKey: "boomerang",
  },
  {
    from: "arrow",
    gear: "hourglass",
    to: "arrowHail",
    title: "Arrow Hail",
    subtitle: "Arrow Volley + Hourglass of Haste pour arrows out in every direction!",
    spriteKey: "weapon-arrow",
  },
  {
    from: "bomb",
    gear: "amulet",
    to: "megaBomb",
    title: "Mega Bomb",
    subtitle: "Bomb + Amulet of Vitality swell into a colossal blast!",
    spriteKey: "weapon-bomb",
  },
  {
    from: "caltrop",
    gear: "bag",
    to: "bloodspikes",
    title: "Blood Spikes",
    subtitle: "Caltrops + Bag of Yoinking bloom into a lethal thicket of spikes!",
    spriteKey: "weapon-caltrop",
  },
];

function applyMetaBonuses(player: Player): number {
  const b = currentMetaBonuses();
  player.stats.maxHp += b.maxHpBonus;
  player.stats.hp = player.stats.maxHp;
  player.stats.regenPerSec += b.regenBonus;
  player.stats.speed = Math.round(player.stats.speed * b.speedMult);
  player.stats.damageMult *= b.damageMult;
  player.stats.cooldownMult *= b.cooldownMult;
  player.stats.magnetMult *= b.magnetMult;
  player.stats.xpMult *= b.xpMult;
  return b.startingLevel;
}
