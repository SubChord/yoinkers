import kaplay from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "./config/GameConfig";
import { GEAR_DEFS } from "./config/GearDefs";
import { ITEM_DEFS } from "./config/ItemDefs";
import { MUSIC_TRACKS } from "./config/MusicDefs";
import { registerEndScene } from "./scenes/EndScene";
import { registerGameScene } from "./scenes/GameScene";
import { registerGuideScene } from "./scenes/GuideScene";
import { registerMapSelectScene } from "./scenes/MapSelectScene";
import { registerMenuScene } from "./scenes/MenuScene";
import { registerShopScene } from "./scenes/ShopScene";
import { registerStatsScene } from "./scenes/StatsScene";

const k = kaplay({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  letterbox: true,
  pixelDensity: 1,
  crisp: true,
  background: [16, 34, 24],
  buttons: {
    up: { keyboard: ["w", "up"] },
    down: { keyboard: ["s", "down"] },
    left: { keyboard: ["a", "left"] },
    right: { keyboard: ["d", "right"] },
  },
});

// NinjaAdventure 4x4 sheet. Rows: 0=down, 1=up, 2=left, 3=right.
const PLAYER_ANIMS = {
  "idle-down": 0,
  "idle-up": 4,
  "idle-left": 8,
  "idle-right": 12,
  "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
  "walk-up": { from: 4, to: 7, loop: true, speed: 8 },
  "walk-left": { from: 8, to: 11, loop: true, speed: 8 },
  "walk-right": { from: 12, to: 15, loop: true, speed: 8 },
} as const;

const ENEMY_ANIMS = {
  "walk-down": { from: 0, to: 3, loop: true, speed: 6 },
  "walk-up": { from: 4, to: 7, loop: true, speed: 6 },
  "walk-left": { from: 8, to: 11, loop: true, speed: 6 },
  "walk-right": { from: 12, to: 15, loop: true, speed: 6 },
} as const;

k.loadSprite("player-walk", "assets/Actor/Characters/NinjaGirl/Walk.png", {
  sliceX: 4,
  sliceY: 4,
  anims: PLAYER_ANIMS,
});

const ENEMY_SPRITES: Array<{ key: string; path: string }> = [
  { key: "enemy-slime", path: "assets/Actor/Monster/Slime/SpriteSheet.png" },
  { key: "enemy-skel", path: "assets/Actor/Monster/SkullBlue/SpriteSheet.png" },
  { key: "enemy-bat", path: "assets/Actor/Monster/BlueBat/SpriteSheet.png" },
  { key: "enemy-mushroom", path: "assets/Actor/Monster/Mushroom/SpriteSheet.png" },
  { key: "enemy-snake", path: "assets/Actor/Monster/Snake/SpriteSheet.png" },
  { key: "enemy-spider", path: "assets/Actor/Monster/SpiderRed/SpriteSheet.png" },
  { key: "enemy-spirit", path: "assets/Actor/Monster/Spirit/SpriteSheet.png" },
  { key: "enemy-racoon", path: "assets/Actor/Monster/GoldRacoon/SpriteSheet.png" },
  { key: "enemy-octopus", path: "assets/Actor/Monster/GreenOctopus/SpriteSheet.png" },
  { key: "enemy-mole", path: "assets/Actor/Monster/Mole/SpriteSheet.png" },
  { key: "enemy-owl", path: "assets/Actor/Monster/Owl/SpriteSheet.png" },
];

for (const enemy of ENEMY_SPRITES) {
  k.loadSprite(enemy.key, enemy.path, {
    sliceX: 4,
    sliceY: 4,
    anims: ENEMY_ANIMS,
  });
}

k.loadSprite("gem", "assets/Items/Collectibles/gem.png");
k.loadSprite("gem-small", "assets/Items/Gems/green.png");
k.loadSprite("gem-medium", "assets/Items/Gems/purple.png");
k.loadSprite("gem-large", "assets/Items/Gems/red.png");
k.loadSprite("gem-huge", "assets/Items/Gems/yellow.png");
k.loadSprite("shuriken", "assets/Items/Weapon/shuriken-icon.png");
k.loadSprite("magic-orb", "assets/Items/Weapon/magic-orb-blue.png", {
  sliceX: 5,
  sliceY: 1,
  anims: {
    spin: { from: 0, to: 4, loop: true, speed: 10 },
  },
});
k.loadSprite("boomerang", "assets/Items/Weapon/kunai.png");
k.loadSprite("weapon-arrow", "assets/Items/Weapon/arrow.png");
k.loadSprite("weapon-bomb", "assets/Items/Weapon/bomb.png");
k.loadSprite("weapon-caltrop", "assets/Items/Weapon/caltrop.png");
k.loadSprite("weapon-katana", "assets/Items/Weapon/katana.png");
k.loadSprite("chest", "assets/Items/Treasure/chest.png", { sliceX: 2, sliceY: 1 });
k.loadSprite("heart", "assets/HUD/HeartsAnimation.png");

for (const item of Object.values(ITEM_DEFS)) {
  k.loadSprite(item.spriteKey, `assets/Items/Consumables/${item.id}.png`);
}

for (const gearId of Object.keys(GEAR_DEFS)) {
  const def = GEAR_DEFS[gearId as keyof typeof GEAR_DEFS];
  k.loadSprite(def.spriteKey, `assets/Items/Gear/${gearId}.png`);
}

for (const track of MUSIC_TRACKS) {
  k.loadSound(track.soundKey, track.file);
}
k.loadSound("sfx-hit", "assets/Sounds/hit.wav");
k.loadSound("sfx-death", "assets/Sounds/death.wav");
k.loadSound("sfx-levelup", "assets/Sounds/levelup.wav");
k.loadSound("sfx-gem", "assets/Sounds/gem.wav");
k.loadSound("sfx-yoink", "assets/Sounds/yoink.wav");

registerMenuScene(k);
registerGameScene(k);
registerEndScene(k);
registerStatsScene(k);
registerGuideScene(k);
registerMapSelectScene(k);
registerShopScene(k);

k.go("menu");
