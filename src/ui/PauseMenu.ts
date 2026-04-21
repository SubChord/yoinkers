import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import type { MusicTrack } from "../config/MusicDefs";

export interface PauseMenu {
  destroy: () => void;
}

export interface PauseMenuOpts {
  tracks: MusicTrack[];
  currentTrackId: string;
  onResume: () => void;
  onQuit: () => void;
  onSelectTrack: (trackId: string) => void;
}

const PANEL_WIDTH = 640;
const PANEL_HEIGHT = 540;
const ROW_HEIGHT = 44;

export function showPauseMenu(k: KAPLAYCtx, opts: PauseMenuOpts): PauseMenu {
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
      k.opacity(0.65),
      k.fixed(),
      k.z(500),
    ]),
  );

  const panelX = (GAME_WIDTH - PANEL_WIDTH) / 2;
  const panelY = (GAME_HEIGHT - PANEL_HEIGHT) / 2;

  add(
    k.add([
      k.rect(PANEL_WIDTH, PANEL_HEIGHT, { radius: 14 }),
      k.pos(panelX, panelY),
      k.color(26, 40, 32),
      k.outline(3, k.rgb(210, 238, 196)),
      k.fixed(),
      k.z(501),
    ]),
  );

  add(
    k.add([
      k.text("Paused", { size: 44 }),
      k.color(255, 236, 160),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, panelY + 48),
      k.fixed(),
      k.z(502),
    ]),
  );

  add(
    k.add([
      k.text("Music", { size: 24 }),
      k.color(220, 235, 220),
      k.pos(panelX + 40, panelY + 100),
      k.fixed(),
      k.z(502),
    ]),
  );

  let currentTrackId = opts.currentTrackId;
  const rowRefs: Array<{ bg: GameObj; label: GameObj; track: MusicTrack }> = [];

  const refreshHighlight = () => {
    for (const row of rowRefs) {
      const selected = row.track.id === currentTrackId;
      (row.bg as unknown as { color: ReturnType<typeof k.rgb> }).color = selected
        ? k.rgb(60, 120, 84)
        : k.rgb(36, 60, 48);
      (row.label as unknown as { color: ReturnType<typeof k.rgb> }).color = selected
        ? k.rgb(255, 255, 255)
        : k.rgb(216, 232, 216);
    }
  };

  opts.tracks.forEach((track, index) => {
    const rowY = panelY + 140 + index * (ROW_HEIGHT + 6);

    const bg = add(
      k.add([
        k.rect(PANEL_WIDTH - 80, ROW_HEIGHT, { radius: 6 }),
        k.pos(panelX + 40, rowY),
        k.color(36, 60, 48),
        k.outline(1, k.rgb(90, 130, 104)),
        k.area(),
        k.fixed(),
        k.z(502),
      ]),
    );

    const label = add(
      k.add([
        k.text(track.label, { size: 20 }),
        k.pos(panelX + 60, rowY + 12),
        k.color(216, 232, 216),
        k.fixed(),
        k.z(503),
      ]),
    );

    add(
      k.add([
        k.text(`${index + 1}`, { size: 16 }),
        k.pos(panelX + PANEL_WIDTH - 80, rowY + 14),
        k.color(180, 200, 180),
        k.fixed(),
        k.z(503),
      ]),
    );

    const pick = () => {
      currentTrackId = track.id;
      opts.onSelectTrack(track.id);
      refreshHighlight();
    };

    bg.onClick(pick);
    rowRefs.push({ bg, label, track });
  });

  refreshHighlight();

  const resumeBtn = add(
    k.add([
      k.rect(220, 54, { radius: 8 }),
      k.color(62, 120, 82),
      k.outline(2, k.rgb(210, 238, 196)),
      k.pos(panelX + 60, panelY + PANEL_HEIGHT - 80),
      k.area(),
      k.fixed(),
      k.z(502),
    ]),
  );

  add(
    k.add([
      k.text("Resume (Esc)", { size: 22 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(panelX + 60 + 110, panelY + PANEL_HEIGHT - 80 + 27),
      k.fixed(),
      k.z(503),
    ]),
  );

  resumeBtn.onClick(() => opts.onResume());

  const quitBtn = add(
    k.add([
      k.rect(220, 54, { radius: 8 }),
      k.color(110, 52, 52),
      k.outline(2, k.rgb(244, 196, 196)),
      k.pos(panelX + PANEL_WIDTH - 280, panelY + PANEL_HEIGHT - 80),
      k.area(),
      k.fixed(),
      k.z(502),
    ]),
  );

  add(
    k.add([
      k.text("Quit to Menu", { size: 22 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(panelX + PANEL_WIDTH - 280 + 110, panelY + PANEL_HEIGHT - 80 + 27),
      k.fixed(),
      k.z(503),
    ]),
  );

  quitBtn.onClick(() => opts.onQuit());

  const keyHandlers = [
    k.onKeyPress("escape", () => opts.onResume()),
    k.onKeyPress("p", () => opts.onResume()),
  ];

  opts.tracks.forEach((track, index) => {
    if (index >= 9) return;
    const handler = k.onKeyPress(`${index + 1}` as any, () => {
      currentTrackId = track.id;
      opts.onSelectTrack(track.id);
      refreshHighlight();
    });
    keyHandlers.push(handler);
  });

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
