export type MapId = "grove" | "desert" | "darkforest" | "tundra";

export type RGB = [number, number, number];

export interface MapPalette {
  background: RGB;
  ground: RGB;
  grass: RGB;
  bushDark: RGB;
  bushLight: RGB;
  treeTrunk: RGB;
  treeCanopy: RGB;
  treeCanopyHighlight: RGB;
  rockDark: RGB;
  rockLight: RGB;
  logDark: RGB;
  logLight: RGB;
  flowers: RGB[];
}

export interface MapDef {
  id: MapId;
  label: string;
  subtitle: string;
  palette: MapPalette;
  defaultTrackId: string;
  prerequisite: MapId | null;
}

export const MAP_DEFS: Record<MapId, MapDef> = {
  grove: {
    id: "grove",
    label: "Bamboo Grove",
    subtitle: "Lush clearings, rookie swarms.",
    palette: {
      background: [16, 34, 24],
      ground: [38, 72, 44],
      grass: [54, 96, 58],
      bushDark: [34, 80, 44],
      bushLight: [60, 116, 70],
      treeTrunk: [70, 48, 28],
      treeCanopy: [24, 62, 34],
      treeCanopyHighlight: [46, 90, 54],
      rockDark: [126, 126, 132],
      rockLight: [170, 170, 178],
      logDark: [58, 38, 22],
      logLight: [92, 62, 38],
      flowers: [
        [246, 202, 78],
        [238, 106, 144],
        [200, 180, 242],
        [244, 242, 218],
      ],
    },
    defaultTrackId: "adventure",
    prerequisite: null,
  },
  desert: {
    id: "desert",
    label: "Sunken Desert",
    subtitle: "Baked sand and roaming marauders.",
    palette: {
      background: [68, 48, 30],
      ground: [196, 146, 82],
      grass: [214, 170, 100],
      bushDark: [180, 120, 70],
      bushLight: [220, 162, 96],
      treeTrunk: [92, 60, 32],
      treeCanopy: [140, 96, 48],
      treeCanopyHighlight: [190, 138, 70],
      rockDark: [150, 120, 88],
      rockLight: [208, 176, 128],
      logDark: [86, 56, 28],
      logLight: [138, 96, 52],
      flowers: [
        [246, 228, 122],
        [236, 150, 80],
        [220, 90, 66],
      ],
    },
    defaultTrackId: "sunny",
    prerequisite: "grove",
  },
  darkforest: {
    id: "darkforest",
    label: "Cursed Forest",
    subtitle: "Creeping shadows and elite ambushes.",
    palette: {
      background: [8, 18, 14],
      ground: [22, 42, 32],
      grass: [28, 56, 38],
      bushDark: [18, 44, 30],
      bushLight: [40, 70, 48],
      treeTrunk: [30, 20, 12],
      treeCanopy: [16, 38, 24],
      treeCanopyHighlight: [30, 58, 34],
      rockDark: [70, 74, 82],
      rockLight: [108, 112, 124],
      logDark: [24, 18, 12],
      logLight: [52, 36, 24],
      flowers: [
        [160, 120, 220],
        [120, 200, 200],
        [70, 80, 140],
      ],
    },
    defaultTrackId: "dark-forest",
    prerequisite: "desert",
  },
  tundra: {
    id: "tundra",
    label: "Frozen Tundra",
    subtitle: "Endless snow, relentless waves.",
    palette: {
      background: [40, 58, 80],
      ground: [200, 220, 236],
      grass: [220, 232, 244],
      bushDark: [168, 196, 216],
      bushLight: [226, 238, 248],
      treeTrunk: [78, 66, 56],
      treeCanopy: [110, 152, 178],
      treeCanopyHighlight: [172, 204, 228],
      rockDark: [140, 150, 166],
      rockLight: [200, 214, 230],
      logDark: [70, 58, 48],
      logLight: [118, 98, 78],
      flowers: [
        [230, 240, 255],
        [170, 200, 240],
        [244, 218, 230],
      ],
    },
    defaultTrackId: "tension",
    prerequisite: "darkforest",
  },
};

export const MAP_ORDER: MapId[] = ["grove", "desert", "darkforest", "tundra"];
