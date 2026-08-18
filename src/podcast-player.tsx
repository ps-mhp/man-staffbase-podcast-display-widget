/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";

import { Episode } from "./podcast-content";

/** Mirrors the `player-size` configuration field. */
export type PlayerSize = "large" | "small";

/** How far an arrow-key press on the progress bar moves playback. */
const SKIP_SECONDS = 15;

/** The steps `cyclePlaybackRate` walks through, in order. */
const PLAYBACK_RATES = [1, 1.25, 1.5, 2];

const PLAY_ICON = (
  <svg width="14" height="16" viewBox="0 0 17 20" fill="currentColor" aria-hidden="true">
    <path d="M0 0l17 10L0 20z" />
  </svg>
);

const PAUSE_ICON = (
  <svg width="13" height="16" viewBox="0 0 16 20" fill="currentColor" aria-hidden="true">
    <rect x="0" y="0" width="5" height="20" />
    <rect x="11" y="0" width="5" height="20" />
  </svg>
);

/** `mm:ss`, `0:00` for anything not (yet) a usable number. */
function formatTime(seconds: number): string {
  const value = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const wholeSeconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${Math.floor(value / 60)}:${wholeSeconds}`;
}

/** `1,25×` — comma as the decimal separator throughout the widget's German copy. */
function formatRate(rate: number): string {
  return `${rate.toString().replace(".", ",")}×`;
}

/**
 * The episode's own audio element plus the controls drawn over it.
 *
 * A native `<audio controls>` renders with the browser's own chrome — its
 * exact look varies by browser and cannot be restyled consistently, which is
 * why every visible control here is this widget's own markup instead, with
 * the element itself hidden and driven through its API (`play`, `pause`,
 * `currentTime`, `playbackRate`, `muted`).
 *
 * `size === "small"` renders the compact feed-tile variant: title and date
 * share a row with a smaller play button, and the progress bar is a bare
 * strip underneath with no time readout, rate, or mute control — the tile is
 * too narrow to fit them without crowding, and a feed is a discovery surface
 * more than a place to fine-tune playback speed.
 */
export function PodcastPlayer({
  episode,
  title,
  date,
  size,
}: {
  episode: Episode;
  title: string;
  date: string;
  size: PlayerSize;
}): React.JSX.Element {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);

  // Reset to the new episode's own playback state; the element itself is
  // recreated by React because `episode.url` changes its `src`, but the
  // controls' state would otherwise still show the previous episode's
  // position and duration for one render.
  React.useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMuted(false);
    setRate(1);
  }, [episode.url]);

  const togglePlay = (): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
    } else {
      audio.pause();
    }
  };

  const skip = (delta: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    const total = audio.duration || 0;
    audio.currentTime = Math.max(0, Math.min(total, audio.currentTime + delta));
  };

  const seekToClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) : 0;
    audio.currentTime = ratio * (audio.duration || 0);
  };

  const handleTrackKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      skip(SKIP_SECONDS);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      skip(-SKIP_SECONDS);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      togglePlay();
    }
  };

  const cyclePlaybackRate = (): void => {
    const audio = audioRef.current;
    const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(rate) + 1) % PLAYBACK_RATES.length];
    if (audio) audio.playbackRate = next;
    setRate(next);
  };

  const toggleMute = (): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressPercent = `${percent.toFixed(2)}%`;

  const audio = (
    <audio
      ref={audioRef}
      className="podcast-display__audio"
      src={episode.url}
      preload="metadata"
      style={{ display: "none" }}
      onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={(event) => {
        event.currentTarget.currentTime = 0;
        setPlaying(false);
        setCurrentTime(0);
      }}
    />
  );

  const playButton = (
    <button
      type="button"
      className={size === "small" ? "podcast-display__play podcast-display__play--small" : "podcast-display__play"}
      aria-label={playing ? "Pause" : "Abspielen"}
      onClick={togglePlay}
    >
      {playing ? PAUSE_ICON : PLAY_ICON}
    </button>
  );

  if (size === "small") {
    return (
      <div className="podcast-display__player podcast-display__player--small">
        <div className="podcast-display__row">
          <img className="podcast-display__thumbnail podcast-display__thumbnail--small" src={episode.thumbnailUrl} alt={title} />
          <div className="podcast-display__info">
            <p className="podcast-display__title podcast-display__title--small">{title}</p>
            <p className="podcast-display__date">
              {date} · {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          {playButton}
        </div>
        <div
          role="slider"
          aria-label="Wiedergabeposition"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          tabIndex={0}
          className="podcast-display__track podcast-display__track--thin"
          onClick={seekToClick}
          onKeyDown={handleTrackKeyDown}
        >
          <div className="podcast-display__fill" style={{ width: progressPercent }} />
        </div>
        {audio}
      </div>
    );
  }

  return (
    <div className="podcast-display__player podcast-display__player--large">
      <div className="podcast-display__header">
        <img className="podcast-display__thumbnail" src={episode.thumbnailUrl} alt={title} />
        <div className="podcast-display__info">
          <p className="podcast-display__title">{title}</p>
          <p className="podcast-display__date">{date}</p>
          <div className="podcast-display__controls">
            {playButton}
            <div className="podcast-display__progress">
              <div
                role="slider"
                aria-label="Wiedergabeposition"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
                tabIndex={0}
                className="podcast-display__track"
                onClick={seekToClick}
                onKeyDown={handleTrackKeyDown}
              >
                <div className="podcast-display__fill" style={{ width: progressPercent }} />
                <div className="podcast-display__handle" style={{ left: progressPercent }} />
              </div>
              <div className="podcast-display__times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="podcast-display__extra">
              <button type="button" className="podcast-display__rate" aria-label="Wiedergabegeschwindigkeit" onClick={cyclePlaybackRate}>
                {formatRate(rate)}
              </button>
              <button
                type="button"
                className="podcast-display__mute"
                aria-label={muted ? "Ton einschalten" : "Ton stumm schalten"}
                onClick={toggleMute}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4z" />
                  {!muted && <path d="M15.5 9a4 4 0 0 1 0 6" />}
                  {muted && (
                    <>
                      <path d="M16 9.5l5 5" />
                      <path d="M21 9.5l-5 5" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {audio}
    </div>
  );
}
