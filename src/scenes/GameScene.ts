import type { KAPLAYCtx } from "kaplay";
import {
  GAME_DURATION_MS,
  PLAYER_IFRAME_MS,
  WAVE_DURATION_MS,
  WORLD_SIZE,
  XP_PER_LEVEL,
} from "../config/GameConfig";
import { createPlayer, updatePlayer, type Player } from "../entities/Player";
import { scatterScenery } from "../entities/Scenery";
import { updateGem, spawnXpGem, type XpGem } from "../entities/XpGem";
import { ChestSystem } from "../systems/ChestSystem";
import { EnemySpawner } from "../systems/EnemySpawner";
import { GearSystem } from "../systems/GearSystem";
import { ItemSystem } from "../systems/ItemSystem";
import { MusicSystem } from "../systems/MusicSystem";
import { QuestSystem } from "../systems/QuestSystem";
import { persistRun } from "../systems/SaveStore";
import { StatsTracker } from "../systems/StatsTracker";
import { WeaponSystem } from "../systems/WeaponSystem";
import { applyUpgrade, pickUpgradeChoices } from "../systems/UpgradeSystem";
import { mountDamageOverlay } from "../ui/DamageOverlay";
import { createHud, updateHud } from "../ui/HUD";
import { mountMusicSelector } from "../ui/MusicSelector";
import { showUpgradeMenu, type UpgradeMenu } from "../ui/UpgradeMenu";

export function registerGameScene(k: KAPLAYCtx): void {
  k.scene("game", () => {
    drawWorld(k);

    const player = createPlayer(k);
    const spawner = new EnemySpawner(k, player);
    const gems: XpGem[] = [];
    const tracker = new StatsTracker();
    const quests = new QuestSystem(k, player, (key) => playSfx(k, key));
    const gear = new GearSystem(k, player, (key) => playSfx(k, key));
    const items = new ItemSystem(k, player, spawner, (key) => playSfx(k, key), () => quests.onItem());

    const weapons = new WeaponSystem(
      k,
      player,
      spawner,
      (enemy, index) => {
        gems.push(spawnXpGem(k, enemy.obj.pos.x, enemy.obj.pos.y, enemy.xpValue));
        items.onEnemyKilled(enemy, enemy.isElite);
        gear.onEnemyKilled(enemy);
        quests.onKill(enemy.isElite, enemy.isBoss);
        enemy.obj.destroy();
        spawner.removeAt(index);
        state.enemiesKilled += 1;
        playSfx(k, "sfx-death");
      },
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
    const music = new MusicSystem(k);
    music.start();
    mountMusicSelector(k, music);
    const damageFlash = mountDamageOverlay(k);

    interface GameState {
      startMs: number;
      waveStartedMs: number;
      wave: number;
      enemiesKilled: number;
      paused: boolean;
      levelQueue: number;
      activeMenu: UpgradeMenu | null;
    }

    const state: GameState = {
      startMs: Date.now(),
      waveStartedMs: Date.now(),
      wave: 1,
      enemiesKilled: 0,
      paused: false,
      levelQueue: 0,
      activeMenu: null,
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
      k.camPos(player.obj.pos);

      if (state.paused) {
        return;
      }

      const dt = k.dt();

      if (nowMs - state.startMs >= GAME_DURATION_MS) {
        endGame(k, state, player, music, tracker, true);
        return;
      }

      if (nowMs - state.waveStartedMs >= WAVE_DURATION_MS) {
        state.wave += 1;
        state.waveStartedMs = nowMs;
        spawner.spawnWave(state.wave);
        quests.onWave(state.wave);
      }

      updatePlayer(k, player, dt);
      spawner.update(dt, nowMs);
      weapons.update(nowMs, dt);
      chests.update(nowMs, dt);
      items.update(nowMs, dt);
      gear.update(nowMs, dt);

      handleEnemyTouchPlayer(k, player, spawner, nowMs, damageFlash);
      collectGems(gems, player, dt, quests);

      maybeLevelUp(player, state, quests);

      updateHud(hud, {
        player,
        wave: state.wave,
        enemiesKilled: state.enemiesKilled,
        remainingMs: Math.max(0, GAME_DURATION_MS - (nowMs - state.startMs)),
      });

      if (player.stats.hp <= 0) {
        endGame(k, state, player, music, tracker, false);
        return;
      }

      openUpgradeMenuIfQueued();
    });
  });
}

function drawWorld(k: KAPLAYCtx): void {
  k.add([
    k.rect(WORLD_SIZE, WORLD_SIZE),
    k.pos(-WORLD_SIZE / 2, -WORLD_SIZE / 2),
    k.color(38, 72, 44),
    k.z(0),
  ]);
  scatterScenery(k);
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

function collectGems(
  gems: XpGem[],
  player: Player,
  dt: number,
  quests: QuestSystem,
): void {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    if (updateGem(gems[i], player, dt) === "collected") {
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
  let threshold = XP_PER_LEVEL[Math.min(player.stats.level, XP_PER_LEVEL.length - 1)];
  while (player.stats.xp >= threshold) {
    player.stats.xp -= threshold;
    player.stats.level += 1;
    player.stats.maxHp += 5;
    player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 5);
    state.levelQueue += 1;
    quests.onLevel(player.stats.level);
    threshold = XP_PER_LEVEL[Math.min(player.stats.level, XP_PER_LEVEL.length - 1)];
  }
}

function endGame(
  k: KAPLAYCtx,
  state: { startMs: number; wave: number; enemiesKilled: number },
  player: Player,
  music: MusicSystem,
  tracker: StatsTracker,
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
  persistRun(stats);
  k.go("end", stats);
}

function playSfx(k: KAPLAYCtx, key: string): void {
  try {
    k.play(key, { volume: 0.6 });
  } catch {
    // Audio may be locked until the user interacts; safe to ignore.
  }
}
