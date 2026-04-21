import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import type { MusicSystem } from "../systems/MusicSystem";

const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 44;
const PANEL_MARGIN = 16;

export function mountMusicSelector(k: KAPLAYCtx, music: MusicSystem): void {
  const tracks = music.getTracks();
  const panelX = GAME_WIDTH - PANEL_WIDTH - PANEL_MARGIN;
  const panelY = GAME_HEIGHT - PANEL_HEIGHT - PANEL_MARGIN;

  k.add([
    k.rect(PANEL_WIDTH, PANEL_HEIGHT, { radius: 8 }),
    k.pos(panelX, panelY),
    k.color(24, 40, 30),
    k.outline(2, k.rgb(140, 190, 150)),
    k.opacity(0.9),
    k.fixed(),
    k.z(100),
  ]);

  k.add([
    k.text("♪", { size: 22 }),
    k.pos(panelX + 14, panelY + 10),
    k.color(240, 230, 170),
    k.fixed(),
    k.z(101),
  ]);

  const labelText = k.add([
    k.text(labelFor(music.getCurrentTrackId(), music), { size: 16 }),
    k.pos(panelX + PANEL_WIDTH / 2, panelY + PANEL_HEIGHT / 2),
    k.anchor("center"),
    k.color(240, 248, 232),
    k.fixed(),
    k.z(101),
  ]);

  const makeArrow = (x: number, glyph: string, step: number) => {
    const btn = k.add([
      k.rect(30, 30, { radius: 6 }),
      k.pos(x, panelY + 7),
      k.color(48, 88, 62),
      k.outline(1, k.rgb(170, 210, 180)),
      k.area(),
      k.fixed(),
      k.z(101),
    ]);
    k.add([
      k.text(glyph, { size: 18 }),
      k.pos(x + 15, panelY + 22),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.fixed(),
      k.z(102),
    ]);
    btn.onClick(() => cycle(step));
    btn.onHover(() => {
      (btn as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(72, 120, 88);
    });
    btn.onHoverEnd(() => {
      (btn as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(48, 88, 62);
    });
  };

  const cycle = (step: number) => {
    const currentIndex = tracks.findIndex((t) => t.id === music.getCurrentTrackId());
    const nextIndex = ((currentIndex === -1 ? 0 : currentIndex) + step + tracks.length) % tracks.length;
    const next = tracks[nextIndex];
    music.selectTrack(next.id);
    (labelText as unknown as { text: string }).text = next.label;
  };

  makeArrow(panelX + 44, "◀", -1);
  makeArrow(panelX + PANEL_WIDTH - 74, "▶", 1);
}

function labelFor(trackId: string, music: MusicSystem): string {
  const track = music.getTracks().find((t) => t.id === trackId);
  return track?.label ?? trackId;
}
