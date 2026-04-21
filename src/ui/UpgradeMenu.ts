import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import type { UpgradeDef } from "../config/UpgradeDefs";

export interface UpgradeMenu {
  destroy: () => void;
}

export interface UpgradeMenuOpts {
  choices: UpgradeDef[];
  onChoose: (choice: UpgradeDef) => void;
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
        k.text(`Press ${index + 1}`, { size: 18 }),
        k.color(200, 220, 210),
        k.anchor("center"),
        k.pos(centerX, startY + CARD_HEIGHT - 40),
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
  });

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
    case "active-item":
      return {
        bg: [86, 60, 30],
        outline: [255, 200, 80],
        hover: [110, 80, 44],
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
    case "active-item":
      return "ACTIVE ITEM";
  }
}
