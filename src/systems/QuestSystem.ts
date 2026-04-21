import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT } from "../config/GameConfig";
import { weightedRandomGear, applyGearStack } from "../config/GearDefs";
import { QUEST_DEFS, type QuestDef, type QuestMetric, type QuestReward } from "../config/QuestDefs";
import { spawnGear } from "../entities/Gear";
import type { Player } from "../entities/Player";

const ACTIVE_SLOTS = 3;

interface ActiveQuest {
  def: QuestDef;
  progress: number;
  bg: GameObj;
  label: GameObj;
  progressText: GameObj;
  bar: GameObj;
}

export class QuestSystem {
  private pool: QuestDef[];
  private active: ActiveQuest[] = [];
  private metrics: Record<QuestMetric, number> = {
    kills: 0,
    eliteKills: 0,
    bossKills: 0,
    chests: 0,
    items: 0,
    gems: 0,
    level: 0,
    wave: 0,
    damage: 0,
  };

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private onPlaySfx: (key: string) => void,
  ) {
    this.pool = shuffle(k, [...QUEST_DEFS]);
    for (let i = 0; i < ACTIVE_SLOTS && this.pool.length > 0; i += 1) {
      this.addSlot();
    }
  }

  public onKill(isElite: boolean, isBoss: boolean): void {
    this.increment("kills", 1);
    if (isElite) this.increment("eliteKills", 1);
    if (isBoss) this.increment("bossKills", 1);
  }

  public onChest(): void {
    this.increment("chests", 1);
  }

  public onItem(): void {
    this.increment("items", 1);
  }

  public onGem(): void {
    this.increment("gems", 1);
  }

  public onLevel(level: number): void {
    this.setAbsolute("level", level);
  }

  public onWave(wave: number): void {
    this.setAbsolute("wave", wave);
  }

  public onDamage(amount: number): void {
    this.increment("damage", amount);
  }

  private increment(metric: QuestMetric, amount: number): void {
    this.metrics[metric] += amount;
    this.checkAll();
  }

  private setAbsolute(metric: QuestMetric, value: number): void {
    if (value > this.metrics[metric]) {
      this.metrics[metric] = value;
      this.checkAll();
    }
  }

  private checkAll(): void {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const q = this.active[i];
      const progress = Math.min(q.def.goal, this.metrics[q.def.metric]);
      q.progress = progress;
      this.refreshRow(q);
      if (progress >= q.def.goal) {
        this.completeQuest(i);
      }
    }
  }

  private completeQuest(index: number): void {
    const quest = this.active[index];
    this.applyReward(quest.def.reward);
    this.showCompletionBanner(quest.def);
    this.onPlaySfx("sfx-levelup");
    this.destroyRow(quest);
    this.active.splice(index, 1);
    if (this.pool.length > 0) this.addSlot();
    this.layoutRows();
  }

  private applyReward(reward: QuestReward): void {
    const stats = this.player.stats;
    switch (reward.kind) {
      case "maxHp":
        stats.maxHp += reward.amount;
        stats.hp = Math.min(stats.maxHp, stats.hp + reward.amount);
        break;
      case "heal-full":
        stats.hp = stats.maxHp;
        break;
      case "speed":
        stats.speed *= reward.mult;
        break;
      case "damage":
        stats.damageMult *= reward.mult;
        break;
      case "cooldown":
        stats.cooldownMult *= reward.mult;
        break;
      case "magnet":
        stats.magnetMult *= reward.mult;
        break;
      case "xp":
        stats.xp += reward.amount;
        break;
      case "gear": {
        const id = weightedRandomGear(() => this.k.rand(0, 1));
        applyGearStack(this.player, id);
        stats.gear[id] = (stats.gear[id] ?? 0) + 1;
        const p = this.player.obj.pos;
        spawnGear(this.k, id, p.x + this.k.rand(-10, 10), p.y - 40);
        break;
      }
    }
  }

  private addSlot(): void {
    const def = this.pool.shift();
    if (!def) return;

    const slotIndex = this.active.length;
    const y = rowY(slotIndex);

    const bg = this.k.add([
      this.k.rect(280, 42, { radius: 6 }),
      this.k.pos(20, y),
      this.k.color(18, 36, 28),
      this.k.outline(1, this.k.rgb(120, 170, 130)),
      this.k.opacity(0.9),
      this.k.fixed(),
      this.k.z(100),
    ]);

    const label = this.k.add([
      this.k.text(def.label, { size: 14 }),
      this.k.pos(30, y + 4),
      this.k.color(232, 240, 224),
      this.k.fixed(),
      this.k.z(101),
    ]);

    const progressText = this.k.add([
      this.k.text(`0 / ${def.goal}  →  ${def.rewardText}`, { size: 12 }),
      this.k.pos(30, y + 22),
      this.k.color(190, 210, 190),
      this.k.fixed(),
      this.k.z(101),
    ]);

    const bar = this.k.add([
      this.k.rect(4, 4, { radius: 2 }),
      this.k.pos(30, y + 38),
      this.k.color(120, 190, 120),
      this.k.fixed(),
      this.k.z(101),
    ]);

    this.active.push({ def, progress: 0, bg, label, progressText, bar });
  }

  private refreshRow(q: ActiveQuest): void {
    const pct = Math.min(1, q.progress / q.def.goal);
    (q.bar as unknown as { width: number }).width = Math.max(4, 260 * pct);
    (q.progressText as unknown as { text: string }).text =
      `${formatProgress(q.progress)} / ${formatProgress(q.def.goal)}  →  ${q.def.rewardText}`;
  }

  private destroyRow(q: ActiveQuest): void {
    q.bg.destroy();
    q.label.destroy();
    q.progressText.destroy();
    q.bar.destroy();
  }

  private layoutRows(): void {
    this.active.forEach((q, i) => {
      const y = rowY(i);
      q.bg.pos.y = y;
      q.label.pos.y = y + 4;
      q.progressText.pos.y = y + 22;
      q.bar.pos.y = y + 38;
    });
  }

  private showCompletionBanner(def: QuestDef): void {
    const banner = this.k.add([
      this.k.rect(420, 44, { radius: 6 }),
      this.k.pos(20, GAME_HEIGHT - 120),
      this.k.color(68, 130, 88),
      this.k.outline(2, this.k.rgb(210, 238, 196)),
      this.k.fixed(),
      this.k.z(102),
    ]);
    const text = this.k.add([
      this.k.text(`Quest complete — ${def.label}  (${def.rewardText})`, { size: 14 }),
      this.k.pos(30, GAME_HEIGHT - 120 + 14),
      this.k.color(255, 255, 255),
      this.k.fixed(),
      this.k.z(103),
    ]);
    let elapsed = 0;
    banner.onUpdate(() => {
      elapsed += this.k.dt();
      if (elapsed > 2.8) {
        banner.destroy();
        text.destroy();
      }
    });
  }
}

function rowY(slotIndex: number): number {
  return GAME_HEIGHT - 220 + slotIndex * 50;
}

function formatProgress(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.floor(n));
}

function shuffle<T>(k: KAPLAYCtx, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(k.rand(0, i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
