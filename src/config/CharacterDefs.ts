import type { WeaponId } from "./WeaponDefs";
import type { CharacterId } from "../types/GameTypes";

export interface CharacterDef {
  id: CharacterId;
  label: string;
  description: string;
  spriteKey: string;
  startingWeapon: WeaponId;
  unlockCost: number;
}

export const CHARACTER_DEFS: Record<CharacterId, CharacterDef> = {
  ninja: {
    id: "ninja",
    label: "Ninja",
    description: "The default silent-movement class. Starts with Shuriken.",
    spriteKey: "player-walk",
    startingWeapon: "shuriken",
    unlockCost: 0,
  },
  jesus: {
    id: "jesus",
    label: "Jesus Christ",
    description: "Radiates divine fury. Starts with Holy Beam.",
    spriteKey: "jesus-walk",
    startingWeapon: "holyBeam",
    unlockCost: 500,
  },
  catLady: {
    id: "catLady",
    label: "Crazy Cat Lady",
    description: "Fires a laser pointer — her cats handle the rest.",
    spriteKey: "catlady-walk",
    startingWeapon: "laserPointer",
    unlockCost: 750,
  },
};

export const CHARACTER_ORDER: CharacterId[] = ["ninja", "jesus", "catLady"];
