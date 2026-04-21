import type { KAPLAYCtx, AudioPlay } from "kaplay";
import { DEFAULT_TRACK_ID, MUSIC_TRACKS, type MusicTrack } from "../config/MusicDefs";

const MUSIC_VOLUME = 0.4;
const STORAGE_KEY = "yoinkers.music.trackId";

export class MusicSystem {
  private handle: AudioPlay | null = null;
  private currentTrackId: string;

  constructor(private k: KAPLAYCtx) {
    this.currentTrackId = loadStoredTrackId() ?? DEFAULT_TRACK_ID;
  }

  public start(): void {
    this.playTrack(this.currentTrackId);
  }

  public getCurrentTrackId(): string {
    return this.currentTrackId;
  }

  public getTracks(): MusicTrack[] {
    return MUSIC_TRACKS;
  }

  public selectTrack(trackId: string): void {
    if (trackId === this.currentTrackId && this.handle && !this.handle.paused) {
      return;
    }
    this.currentTrackId = trackId;
    persistTrackId(trackId);
    this.playTrack(trackId);
  }

  public pause(): void {
    if (this.handle) {
      this.handle.paused = true;
    }
  }

  public resume(): void {
    if (this.handle) {
      this.handle.paused = false;
    }
  }

  public stop(): void {
    this.handle?.stop();
    this.handle = null;
  }

  private playTrack(trackId: string): void {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId) ?? MUSIC_TRACKS[0];
    this.handle?.stop();
    try {
      this.handle = this.k.play(track.soundKey, { loop: true, volume: MUSIC_VOLUME });
    } catch {
      this.handle = null;
    }
  }
}

function loadStoredTrackId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistTrackId(trackId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, trackId);
  } catch {
    // localStorage may be unavailable (private mode, SSR); ignore.
  }
}
