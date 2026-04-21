export interface MusicTrack {
  id: string;
  label: string;
  soundKey: string;
  file: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "adventure", label: "Adventure", soundKey: "bgm-adventure", file: "assets/Music/bgm.ogg" },
  { id: "fight", label: "Fight", soundKey: "bgm-fight", file: "assets/Music/fight.ogg" },
  { id: "fight2", label: "Duel", soundKey: "bgm-fight2", file: "assets/Music/fight2.ogg" },
  { id: "tension", label: "Tension", soundKey: "bgm-tension", file: "assets/Music/tension.ogg" },
  { id: "dark-forest", label: "Dark Forest", soundKey: "bgm-dark-forest", file: "assets/Music/dark-forest.ogg" },
  { id: "sunny", label: "Sunny", soundKey: "bgm-sunny", file: "assets/Music/sunny.ogg" },
  { id: "village", label: "Village", soundKey: "bgm-village", file: "assets/Music/village.ogg" },
];

export const DEFAULT_TRACK_ID = "adventure";
