import type { WeaponId } from "../config/WeaponDefs";

export class StatsTracker {
  private damage = new Map<WeaponId, number>();

  public record(weapon: WeaponId, amount: number): void {
    this.damage.set(weapon, (this.damage.get(weapon) ?? 0) + amount);
  }

  public totals(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [weapon, amount] of this.damage.entries()) {
      out[weapon] = Math.round(amount);
    }
    return out;
  }

  public totalDamage(): number {
    let sum = 0;
    for (const v of this.damage.values()) sum += v;
    return Math.round(sum);
  }
}
