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
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Episode } from "./podcast-content";
import { PodcastPlayer } from "./podcast-player";

const episode: Episode = {
  episodeId: "8398abc1-c638-4175-bed1-e47809b22931",
  episodeTitle: "Ignition Podcast II",
  publishedAt: "2026-07-30T06:42:10.566886Z",
  thumbnailUrl: "https://www.onetruck.man/thumb.jpg",
  url: "/api/ai-podcast/podcast/episode-audio/episode/audio.mp3",
  titleTranslations: {},
};

// jsdom's `HTMLMediaElement` has no real playback engine — `.play()` throws
// "not implemented" and `.currentTime`/`.duration` are not settable via a
// real decoder. Every interaction the player drives through the element is
// stubbed here instead, and each control is checked by what it *asked* the
// element to do, not by an audible result jsdom cannot produce anyway.
function stubAudio(): { play: jest.Mock; pause: jest.Mock } {
  let paused = true;
  const play = jest.fn().mockImplementation(() => {
    paused = false;
    return Promise.resolve();
  });
  const pause = jest.fn().mockImplementation(() => {
    paused = true;
  });
  jest.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(play);
  jest.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(pause);
  jest.spyOn(window.HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
  jest.spyOn(window.HTMLMediaElement.prototype, "duration", "get").mockReturnValue(120);
  return { play, pause };
}

describe("PodcastPlayer (large)", () => {
  afterEach(() => jest.restoreAllMocks());

  it("toggles play/pause on the audio element via the play button", () => {
    const { play, pause } = stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="large" />);

    const button = screen.getByRole("button", { name: "Abspielen" });
    fireEvent.click(button);
    expect(play).toHaveBeenCalledTimes(1);

    fireEvent.play(document.querySelector("audio")!);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("seeks by clicking the progress track", () => {
    stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="large" />);

    const track = screen.getByRole("slider", { name: "Wiedergabeposition" });
    jest.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      height: 4,
      right: 200,
      bottom: 4,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const audio = document.querySelector("audio")!;

    fireEvent.click(track, { clientX: 100 });

    expect(audio.currentTime).toBe(60); // half of the stubbed 120s duration
  });

  it("skips forward and back with the arrow keys", () => {
    stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="large" />);

    const track = screen.getByRole("slider", { name: "Wiedergabeposition" });
    const audio = document.querySelector("audio")!;
    audio.currentTime = 10;

    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(audio.currentTime).toBe(25);

    fireEvent.keyDown(track, { key: "ArrowLeft" });
    expect(audio.currentTime).toBe(10);
  });

  it("cycles the playback rate through 1x, 1.25x, 1.5x and 2x", () => {
    stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="large" />);

    const rateButton = screen.getByRole("button", { name: "Wiedergabegeschwindigkeit" });
    const audio = document.querySelector("audio")!;

    expect(rateButton).toHaveTextContent("1×");
    fireEvent.click(rateButton);
    expect(rateButton).toHaveTextContent("1,25×");
    expect(audio.playbackRate).toBe(1.25);
    fireEvent.click(rateButton);
    expect(rateButton).toHaveTextContent("1,5×");
    fireEvent.click(rateButton);
    expect(rateButton).toHaveTextContent("2×");
    fireEvent.click(rateButton);
    expect(rateButton).toHaveTextContent("1×");
  });

  it("toggles mute on the mute button", () => {
    stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="large" />);

    const muteButton = screen.getByRole("button", { name: "Ton stumm schalten" });
    fireEvent.click(muteButton);

    expect(document.querySelector("audio")!.muted).toBe(true);
    expect(screen.getByRole("button", { name: "Ton einschalten" })).toBeInTheDocument();
  });

  it("resets play/pause, time and rate state when the episode changes", () => {
    stubAudio();
    const { rerender } = render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="large" />);

    fireEvent.play(document.querySelector("audio")!);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    rerender(
      <PodcastPlayer
        episode={{ ...episode, url: "/api/ai-podcast/podcast/episode-audio/other/audio.mp3" }}
        title="Andere Folge"
        date="01.08.2026"
        size="large"
      />,
    );

    expect(screen.getByRole("button", { name: "Abspielen" })).toBeInTheDocument();
  });
});

describe("PodcastPlayer (small)", () => {
  afterEach(() => jest.restoreAllMocks());

  it("renders the compact layout without a rate or mute control", () => {
    stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="small" />);

    expect(screen.queryByRole("button", { name: "Wiedergabegeschwindigkeit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ton /i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abspielen" })).toHaveClass("podcast-display__play--small");
  });

  it("still plays and seeks like the large variant", () => {
    const { play } = stubAudio();
    render(<PodcastPlayer episode={episode} title="Zündung" date="30.07.2026" size="small" />);

    fireEvent.click(screen.getByRole("button", { name: "Abspielen" }));
    expect(play).toHaveBeenCalledTimes(1);

    const track = screen.getByRole("slider", { name: "Wiedergabeposition" });
    jest.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      height: 4,
      right: 200,
      bottom: 4,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const audio = document.querySelector("audio")!;
    fireEvent.click(track, { clientX: 50 });
    expect(audio.currentTime).toBe(30); // a quarter of the stubbed 120s duration
  });
});

describe("KI-Kennzeichnung", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("lang");
    jest.restoreAllMocks();
  });

  it("marks the episode in the large player", () => {
    render(<PodcastPlayer episode={episode} title="Folge" date="30.7.2026" size="large" />);
    expect(screen.getByTestId("podcast-ai-badge")).toBeInTheDocument();
  });

  it("marks the episode in the small player", () => {
    render(<PodcastPlayer episode={episode} title="Folge" date="30.7.2026" size="small" />);
    expect(screen.getByTestId("podcast-ai-badge")).toBeInTheDocument();
  });

  it("labels it in the language of the page until the user's own is known", () => {
    document.documentElement.setAttribute("lang", "de-DE");
    render(<PodcastPlayer episode={episode} title="Folge" date="30.7.2026" size="large" />);
    expect(screen.getByTestId("podcast-ai-badge")).toHaveTextContent("KI");
  });

  it("prefers the language the app has on file for the reader", async () => {
    document.documentElement.setAttribute("lang", "en");
    jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        new Response(JSON.stringify({ config: { locale: "es_ES" } }), { status: 200 }),
      );

    render(<PodcastPlayer episode={episode} title="Folge" date="30.7.2026" size="large" />);
    await waitFor(() => expect(screen.getByTestId("podcast-ai-badge")).toHaveTextContent("IA"));
  });
});
