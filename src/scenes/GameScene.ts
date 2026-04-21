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
import { MusicSystem } from "../systems/MusicSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { applyUpgrade, pickUpgradeChoices } from "../systems/UpgradeSystem";
import { createHud, updateHud } from "../ui/HUD";
import { showPauseMenu, type PauseMenu } from "../ui/PauseMenu";
import { showUpgradeMenu, type UpgradeMenu } from "../ui/UpgradeMenu";

export function registerGameScene(k: KAPLAYCtx): void {
  k.scene("game", () => {
    drawWorld(k);

    const player = createPlayer(k);
    const spawner = new EnemySpawner(k, player);
    const gems: XpGem[] = [];

    const weapons = new WeaponSystem(
      k,
      player,
      spawner,
      (enemy, index) => {
        gems.push(spawnXpGem(k, enemy.obj.pos.x, enemy.obj.pos.y, enemy.xpValue));
        enemy.obj.destroy();
        spawner.removeAt(index);
        state.enemiesKilled += 1;
        playSfx(k, "sfx-death");
      },
      () => playSfx(k, "sfx-hit"),
    );

    const chests = new ChestSystem(k, player, (key) => playSfx(k, key));
    const hud = createHud(k);
    const music = new MusicSystem(k);
    music.start();

    interface GameState {
      startMs: number;
      waveStartedMs: number;
      wave: number;
      enemiesKilled: number;
      paused: boolean;
      pauseMenuOpen: boolean;
      pauseMenu: PauseMenu | null;
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
      pauseMenuOpen: false,
      pauseMenu: null,
      pausedAtMs: undefined,
      levelQueue: 0,
      activeMenu: null,
    };

    spawner.spawnWave(state.wave);

    const openPauseMenu = () => {
      if (state.paused) return;
      state.paused = true;
      state.pauseMenuOpen = true;
      music.pause();
      state.pauseMenu = showPauseMenu(k, {
        tracks: music.getTracks(),
        currentTrackId: music.getCurrentTrackId(),
        onResume: () => closePauseMenu(),
        onQuit: () => {
          state.pauseMenu?.destroy();
          state.pauseMenu = null;
          music.stop();
          k.go("menu");
        },
        onSelectTrack: (trackId) => music.selectTrack(trackId),
      });
    };

    const closePauseMenu = () => {
      const pausedAt = state.pausedAtMs;
      state.pauseMenu?.destroy();
      state.pauseMenu = null;
      state.pauseMenuOpen = false;
      state.paused = false;
      if (pausedAt !== undefined) {
        const drift = Date.now() - pausedAt;
        state.startMs += drift;
        state.waveStartedMs += drift;
        state.pausedAtMs = undefined;
      }
      music.resume();
    };

    k.onKeyPress("escape", () => {
      if (state.pauseMenuOpen) {
        closePauseMenu();
      } else if (!state.paused) {
        state.pausedAtMs = Date.now();
        openPauseMenu();
      }
    });
    k.onKeyPress("p", () => {
      if (state.pauseMenuOpen) {
        closePauseMenu();
      } else if (!state.paused) {
        state.pausedAtMs = Date.now();
        openPauseMenu();
      }
    });

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
        endGame(k, state, player, music, true);
        return;
      }

      if (nowMs - state.waveStartedMs >= WAVE_DURATION_MS) {
        state.wave += 1;
        state.waveStartedMs = nowMs;
        spawner.spawnWave(state.wave);
      }

      updatePlayer(k, player, dt);
      spawner.update(dt);
      weapons.update(nowMs, dt);
      chests.update(nowMs, dt);

      handleEnemyTouchPlayer(k, player, spawner, nowMs);
      collectGems(gems, player, dt);

      maybeLevelUp(player, state);

      updateHud(hud, {
        player,
        wave: state.wave,
        enemiesKilled: state.enemiesKilled,
        remainingMs: Math.max(0, GAME_DURATION_MS - (nowMs - state.startMs)),
      });

      if (player.stats.hp <= 0) {
        endGame(k, state, player, music, false);
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
      k.shake(4);
      return;
    }
  }
}

function collectGems(gems: XpGem[], player: Player, dt: number): void {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    if (updateGem(gems[i], player, dt) === "collected") {
      gems.splice(i, 1);
    }
  }
}

function maybeLevelUp(
  player: Player,
  state: { levelQueue: number },
): void {
  let threshold = XP_PER_LEVEL[Math.min(player.stats.level, XP_PER_LEVEL.length - 1)];
  while (player.stats.xp >= threshold) {
    player.stats.xp -= threshold;
    player.stats.level += 1;
    player.stats.maxHp += 5;
    player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 5);
    state.levelQueue += 1;
    threshold = XP_PER_LEVEL[Math.min(player.stats.level, XP_PER_LEVEL.length - 1)];
  }
}

function endGame(
  k: KAPLAYCtx,
  state: { startMs: number; wave: number; enemiesKilled: number },
  player: Player,
  music: MusicSystem,
  won: boolean,
): void {
  music.stop();
  k.go("end", {
    won,
    enemiesKilled: state.enemiesKilled,
    level: player.stats.level + 1,
    wave: state.wave,
    timeSurvivedMs: Date.now() - state.startMs,
  });
}

function playSfx(k: KAPLAYCtx, key: string): void {
  try {
    k.play(key, { volume: 0.6 });
  } catch {
    // Audio may be locked until the user interacts; safe to ignore.
  }
}
