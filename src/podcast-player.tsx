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

import { pickAiLabel } from "./ai-label";
import { Episode, documentLocales, userLocales } from "./podcast-content";

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

/**
 * The "KI" pill, marking an episode as AI-generated.
 *
 * Staffbase draws its own version of this with `ds-pill` utility classes.
 * Those are the host app's classes, not the widget's, and inside the widget's
 * id-scoped stylesheet they are neither guaranteed to be loaded nor to win —
 * so the pill is rebuilt here from the MAN tokens the rest of the player
 * already uses. The sparkles path is Staffbase's own icon, kept so the two
 * read as the same badge.
 */
function AiBadge({ label }: { label: string }): React.JSX.Element {
  return (
    <span className="podcast-display__ai" data-testid="podcast-ai-badge">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
        <path d="M14.1414 20.9728C14.0837 20.9935 14.022 21.0034 13.9598 20.9989C13.8123 20.9876 13.6796 20.8961 13.5893 20.7789C13.4284 20.5701 13.3623 20.2753 13.2858 20.027C13.1985 19.743 13.123 19.4552 13.0505 19.1672C12.9084 18.6039 12.7796 18.0355 12.5965 17.4835C11.8075 15.1057 10.0865 13.2913 7.72449 12.4499C7.13979 12.2417 6.53733 12.0893 5.93782 11.9291C5.64128 11.8499 5.34473 11.7688 5.05164 11.6783C4.7847 11.5956 4.44917 11.5269 4.21184 11.3755C4.17286 11.3508 4.13881 11.3192 4.1097 11.2835C4.0199 11.1732 3.98141 11.0223 4.00855 10.8829C4.05888 10.6197 4.28684 10.4945 4.51529 10.409C4.78322 10.3086 5.05805 10.2264 5.33387 10.1513C5.90821 9.99449 6.49094 9.86935 7.06282 9.70364C7.16051 9.67545 7.25772 9.64576 7.35443 9.61459C9.08929 9.05363 10.539 8.05546 11.5786 6.54624C12.2565 5.5619 12.6306 4.4158 12.9464 3.27266C13.0337 2.95609 13.1176 2.63902 13.2034 2.32195C13.2454 2.16811 13.2863 2.01378 13.3317 1.86094C13.3771 1.70809 13.4008 1.54238 13.4679 1.393C13.535 1.24361 13.6362 1.11648 13.7782 1.04822C13.9593 0.961165 14.1903 0.994801 14.3427 1.12638C14.548 1.30396 14.5702 1.58096 14.6363 1.82532C14.7024 2.06967 14.7656 2.31849 14.8317 2.56482C14.961 3.04216 15.0972 3.51851 15.2526 3.98793C15.5496 4.88621 15.9212 5.7662 16.4467 6.55615C17.0003 7.38866 17.7197 8.09402 18.5541 8.64158C18.5955 8.6688 18.637 8.6955 18.6789 8.72174C19.3707 9.15848 20.1365 9.44739 20.919 9.67493C21.7016 9.90247 22.4832 10.0761 23.2495 10.3308C23.4661 10.403 23.7083 10.454 23.8653 10.6345C23.9767 10.7627 24.031 10.9457 23.9817 11.1084C23.9427 11.238 23.843 11.3429 23.7286 11.4151C23.5623 11.52 23.3629 11.5729 23.1774 11.6318C22.9771 11.6956 22.7748 11.7539 22.5715 11.8094C22.16 11.9216 21.745 12.022 21.3325 12.1318C21.0518 12.2066 20.7725 12.2852 20.4962 12.3757C17.9393 13.2151 16.1709 15.076 15.3528 17.6309C15.1855 18.1537 15.0646 18.6899 14.9309 19.2217C14.8638 19.4888 14.7937 19.7559 14.7138 20.0195C14.6413 20.2579 14.583 20.529 14.4389 20.7358C14.3659 20.8407 14.2608 20.9297 14.1429 20.9722L14.1414 20.9728Z" />
        <path d="M6.05657 7.9891C6.03348 7.9974 6.00881 8.00137 5.98393 7.99958C5.92492 7.99504 5.87184 7.95844 5.83571 7.91154C5.77138 7.82804 5.74493 7.71012 5.71433 7.61079C5.6794 7.49722 5.6492 7.38207 5.62018 7.26689C5.56335 7.04155 5.51184 6.8142 5.43861 6.59339C5.12301 5.64228 4.4346 4.91652 3.4898 4.57996C3.25592 4.49667 3.01493 4.43573 2.77513 4.37162C2.65651 4.33997 2.53789 4.30751 2.42066 4.2713C2.31388 4.23825 2.17967 4.21077 2.08473 4.15021C2.06914 4.14031 2.05552 4.12766 2.04388 4.1134C2.00796 4.06928 1.99256 4.00893 2.00342 3.95315C2.02355 3.84788 2.11474 3.79782 2.20612 3.7636C2.31329 3.72342 2.42322 3.69058 2.53355 3.66051C2.76329 3.5978 2.99638 3.54774 3.22513 3.48145C3.26421 3.47018 3.30309 3.45831 3.34177 3.44584C4.03572 3.22145 4.61559 2.82218 5.03144 2.2185C5.30262 1.82476 5.45223 1.36632 5.57855 0.909065C5.61349 0.782435 5.64703 0.655607 5.68137 0.528779C5.69815 0.467244 5.71454 0.405513 5.73269 0.344374C5.75085 0.283235 5.76031 0.216951 5.78715 0.157198C5.81399 0.0974438 5.85446 0.0465935 5.9113 0.0192889C5.98373 -0.0155341 6.07612 -0.00207961 6.13709 0.0505518C6.21919 0.121583 6.22809 0.232385 6.25452 0.330127C6.28097 0.42787 6.30623 0.527395 6.33269 0.625928C6.3844 0.816863 6.43886 1.0074 6.50105 1.19517C6.61985 1.55449 6.76848 1.90648 6.97868 2.22246C7.20011 2.55546 7.48788 2.83761 7.82164 3.05663C7.83821 3.06752 7.85479 3.0782 7.87157 3.0887C8.14828 3.26339 8.4546 3.37896 8.76762 3.46997C9.08063 3.56099 9.39326 3.63043 9.69979 3.73234C9.78644 3.76122 9.88333 3.78159 9.94611 3.85381C9.99069 3.90506 10.0124 3.97827 9.99268 4.04336C9.97709 4.09521 9.93722 4.13715 9.89142 4.16605C9.82491 4.208 9.74517 4.22915 9.67098 4.25271C9.59084 4.27822 9.50991 4.30158 9.42861 4.32374C9.26399 4.36864 9.09801 4.40882 8.93301 4.45273C8.8207 4.48262 8.709 4.51407 8.59848 4.55028C7.5757 4.88606 6.86834 5.63041 6.54111 6.65234C6.47421 6.86149 6.42585 7.07597 6.37235 7.28867C6.34551 7.39552 6.31748 7.50235 6.28552 7.60781C6.25651 7.70318 6.23321 7.81161 6.17557 7.89433C6.14638 7.93627 6.10374 7.9721 6.05657 7.9891Z" />
        <path d="M5.07071 23.9864C5.04185 23.9968 5.01101 24.0017 4.97992 23.9995C4.90616 23.9938 4.8398 23.948 4.79464 23.8894C4.71422 23.7851 4.68116 23.6376 4.64292 23.5135C4.59925 23.3715 4.5615 23.2276 4.52523 23.0836C4.45418 22.8019 4.3898 22.5178 4.29826 22.2417C3.90376 21.0529 3.04325 20.1457 1.86225 19.725C1.56989 19.6208 1.26866 19.5447 0.96891 19.4645C0.820638 19.425 0.672366 19.3844 0.52582 19.3391C0.392349 19.2978 0.224586 19.2635 0.105919 19.1878C0.0864279 19.1754 0.0694053 19.1596 0.0548496 19.1418C0.00994843 19.0866 -0.00929505 19.0112 0.00427384 18.9414C0.0294383 18.8098 0.14342 18.7473 0.257646 18.7045C0.391609 18.6543 0.529026 18.6132 0.666936 18.5756C0.954106 18.4972 1.24547 18.4347 1.53141 18.3518C1.58026 18.3377 1.62886 18.3229 1.67721 18.3073C2.54465 18.0268 3.26948 17.5277 3.7893 16.7731C4.12827 16.281 4.31529 15.7079 4.47319 15.1363C4.51686 14.978 4.55878 14.8195 4.60171 14.661C4.62268 14.5841 4.64317 14.5069 4.66587 14.4305C4.68856 14.354 4.70039 14.2712 4.73394 14.1965C4.76749 14.1218 4.81808 14.0582 4.88912 14.0241C4.97966 13.9806 5.09515 13.9974 5.17137 14.0632C5.27399 14.152 5.28511 14.2905 5.31815 14.4127C5.35121 14.5348 5.38279 14.6592 5.41586 14.7824C5.4805 15.0211 5.54858 15.2593 5.62631 15.494C5.77481 15.9431 5.9606 16.3831 6.22335 16.7781C6.50013 17.1943 6.85985 17.547 7.27705 17.8208C7.29777 17.8344 7.31849 17.8477 7.33946 17.8609C7.68535 18.0792 8.06825 18.2237 8.45952 18.3375C8.85079 18.4512 9.24158 18.538 9.62473 18.6654C9.73304 18.7015 9.85416 18.727 9.93264 18.8173C9.98837 18.8813 10.0155 18.9728 9.99085 19.0542C9.97136 19.119 9.92152 19.1714 9.86428 19.2076C9.78114 19.26 9.68146 19.2864 9.58872 19.3159C9.48855 19.3478 9.38738 19.377 9.28576 19.4047C9.07999 19.4608 8.87251 19.511 8.66626 19.5659C8.52588 19.6033 8.38624 19.6426 8.24809 19.6879C6.96963 20.1076 6.08543 21.038 5.67638 22.3154C5.59276 22.5769 5.53232 22.845 5.46544 23.1108C5.43189 23.2444 5.39685 23.3779 5.3569 23.5098C5.32063 23.629 5.29151 23.7645 5.21946 23.8679C5.18297 23.9203 5.12967 23.9651 5.07071 23.9864Z" />
      </svg>
      {label}
    </span>
  );
}

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

  // The document already names a language, so the badge is never blank; the
  // reader's own setting only refines it once the request comes back, which
  // is the difference between "AI" on an English shell and the "IA" a Spanish
  // reader has asked for.
  const [aiLabel, setAiLabel] = React.useState(() => pickAiLabel(documentLocales()));

  React.useEffect(() => {
    let current = true;
    void userLocales().then((locales) => {
      if (current) setAiLabel(pickAiLabel(locales));
    });
    return () => {
      current = false;
    };
  }, []);

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
            <AiBadge label={aiLabel} />
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
          <p className="podcast-display__date">
            {date}
            <AiBadge label={aiLabel} />
          </p>
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
