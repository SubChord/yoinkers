import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import type { UpgradeDef } from "../config/UpgradeDefs";

export interface UpgradeMenu {
  destroy: () => void;
}

export interface UpgradeMenuOpts {
  choices: UpgradeDef[];
  onChoose: (choice: UpgradeDef) => void;
  onReroll?: () => void;
  onBanish?: (choice: UpgradeDef) => void;
  rerollsLeft?: number;
  banishesLeft?: number;
}

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;
const CARD_SPACING = 40;

export function showUpgradeMenu(k: KAPLAYCtx, opts: UpgradeMenuOpts): UpgradeMenu {
  const created: GameObj[] = [];

  const add = <T extends GameObj>(obj: T): T => {
    created.push(obj);
    return obj;
  };

  add(
    k.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.7),
      k.fixed(),
      k.z(500),
    ]),
  );

  add(
    k.add([
      k.text("Level Up!", { size: 48 }),
      k.color(255, 236, 160),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 120),
      k.fixed(),
      k.z(501),
    ]),
  );

  add(
    k.add([
      k.text("Choose an upgrade", { size: 22 }),
      k.color(235, 235, 235),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 170),
      k.fixed(),
      k.z(501),
    ]),
  );

  const totalWidth =
    opts.choices.length * CARD_WIDTH + Math.max(0, opts.choices.length - 1) * CARD_SPACING;
  const startX = (GAME_WIDTH - totalWidth) / 2;
  const startY = 230;

  const keyBindings: Array<() => void> = [];

  opts.choices.forEach((choice, index) => {
    const cx = startX + index * (CARD_WIDTH + CARD_SPACING);
    const centerX = cx + CARD_WIDTH / 2;

    const kindColor = colorForKind(choice.kind);

    const card = add(
      k.add([
        k.rect(CARD_WIDTH, CARD_HEIGHT, { radius: 12 }),
        k.color(kindColor.bg[0], kindColor.bg[1], kindColor.bg[2]),
        k.outline(3, k.rgb(kindColor.outline[0], kindColor.outline[1], kindColor.outline[2])),
        k.pos(cx, startY),
        k.area(),
        k.fixed(),
        k.z(502),
      ]),
    );

    add(
      k.add([
        k.text(tagForKind(choice.kind), { size: 18, width: CARD_WIDTH - 40 }),
        k.color(kindColor.outline[0], kindColor.outline[1], kindColor.outline[2]),
        k.anchor("center"),
        k.pos(centerX, startY + 28),
        k.fixed(),
        k.z(503),
      ]),
    );

    if (choice.icon) {
      add(
        k.add([
          k.sprite(choice.icon, { frame: 0 }),
          k.scale(3.5),
          k.anchor("center"),
          k.pos(centerX, startY + 110),
          k.fixed(),
          k.z(503),
        ]),
      );
    }

    add(
      k.add([
        k.text(choice.label, { size: 26, width: CARD_WIDTH - 32, align: "center" }),
        k.color(255, 255, 255),
        k.anchor("center"),
        k.pos(centerX, startY + 190),
        k.fixed(),
        k.z(503),
      ]),
    );

    add(
      k.add([
        k.text(choice.description, { size: 16, width: CARD_WIDTH - 40, align: "center" }),
        k.color(220, 232, 220),
        k.anchor("center"),
        k.pos(centerX, startY + 250),
        k.fixed(),
        k.z(503),
      ]),
    );

    add(
      k.add([
        k.text(`Press ${index + 1}`, { size: 16 }),
        k.color(200, 220, 210),
        k.anchor("center"),
        k.pos(centerX, startY + CARD_HEIGHT - 56),
        k.fixed(),
        k.z(503),
      ]),
    );

    const chooseThis = () => {
      opts.onChoose(choice);
    };

    card.onClick(chooseThis);
    card.onHover(() => {
      (card as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(
        kindColor.hover[0],
        kindColor.hover[1],
        kindColor.hover[2],
      );
    });
    card.onHoverEnd(() => {
      (card as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(
        kindColor.bg[0],
        kindColor.bg[1],
        kindColor.bg[2],
      );
    });

    keyBindings.push(chooseThis);

    // Per-card banish button — only shown when the caller supplies a handler and the player has banishes left.
    if (opts.onBanish && (opts.banishesLeft ?? 0) > 0) {
      const banBtn = add(
        k.add([
          k.rect(CARD_WIDTH - 60, 28, { radius: 6 }),
          k.color(90, 40, 40),
          k.outline(1, k.rgb(220, 150, 150)),
          k.pos(cx + 30, startY + CARD_HEIGHT - 34),
          k.area(),
          k.fixed(),
          k.z(503),
        ]),
      );
      add(
        k.add([
          k.text(`Banish (${opts.banishesLeft} left)`, { size: 14 }),
          k.color(255, 220, 220),
          k.anchor("center"),
          k.pos(centerX, startY + CARD_HEIGHT - 34 + 14),
          k.fixed(),
          k.z(504),
        ]),
      );
      banBtn.onClick(() => opts.onBanish?.(choice));
    }
  });

  // Global Reroll button — centered below the cards.
  let rerollKeyHandler: ReturnType<KAPLAYCtx["onKeyPress"]> | null = null;
  if (opts.onReroll) {
    const hasCharge = (opts.rerollsLeft ?? 0) > 0;
    const rerollY = startY + CARD_HEIGHT + 30;
    const rerollBtn = add(
      k.add([
        k.rect(260, 44, { radius: 8 }),
        k.color(hasCharge ? 60 : 50, hasCharge ? 80 : 60, hasCharge ? 140 : 70),
        k.outline(
          2,
          hasCharge ? k.rgb(170, 190, 240) : k.rgb(130, 130, 140),
        ),
        k.pos(GAME_WIDTH / 2 - 130, rerollY),
        k.area(),
        k.fixed(),
        k.z(502),
      ]),
    );
    add(
      k.add([
        k.text(`(R) Reroll (${opts.rerollsLeft ?? 0} left)`, { size: 18 }),
        k.color(hasCharge ? 255 : 180, hasCharge ? 255 : 180, hasCharge ? 255 : 180),
        k.anchor("center"),
        k.pos(GAME_WIDTH / 2, rerollY + 22),
        k.fixed(),
        k.z(503),
      ]),
    );
    if (hasCharge) {
      rerollBtn.onClick(() => opts.onReroll?.());
      rerollKeyHandler = k.onKeyPress("r", () => opts.onReroll?.());
    }
  }

  const keyHandlers = keyBindings.map((choose, i) =>
    k.onKeyPress(`${i + 1}` as any, choose),
  );

  return {
    destroy: () => {
      for (const obj of created) {
        obj.destroy();
      }
      for (const handler of keyHandlers) {
        handler.cancel();
      }
      rerollKeyHandler?.cancel();
    },
  };
}

function colorForKind(kind: UpgradeDef["kind"]): {
  bg: [number, number, number];
  outline: [number, number, number];
  hover: [number, number, number];
} {
  switch (kind) {
    case "weapon-unlock":
      return {
        bg: [58, 40, 90],
        outline: [190, 150, 255],
        hover: [80, 60, 120],
      };
    case "weapon-upgrade":
      return {
        bg: [40, 66, 86],
        outline: [140, 210, 244],
        hover: [58, 88, 112],
      };
    case "boost":
      return {
        bg: [50, 78, 48],
        outline: [186, 230, 150],
        hover: [68, 100, 66],
      };
  }
}

function tagForKind(kind: UpgradeDef["kind"]): string {
  switch (kind) {
    case "weapon-unlock":
      return "NEW WEAPON";
    case "weapon-upgrade":
      return "WEAPON UPGRADE";
    case "boost":
      return "BOOST";
  }
}
