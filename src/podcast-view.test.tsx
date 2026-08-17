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
import { render, screen } from "@testing-library/react";

import { PodcastView } from "./podcast-view";

const PODCAST_ID = "6a6ae5e1d64a8c30f478a339";
const EPISODE_ID = "8398abc1-c638-4175-bed1-e47809b22931";

const episode = {
  episodeId: EPISODE_ID,
  episodeTitle: "Ignition Podcast II",
  publishedAt: "2026-07-30T06:42:10.566886Z",
  thumbnailUrl: "https://www.onetruck.man/thumb.jpg",
  url: `/api/ai-podcast/${PODCAST_ID}/episode-audio/${EPISODE_ID}/audio.mp3`,
  titleTranslations: { de_DE: "Zündung Podcast II", en_US: "Ignition Podcast II" },
};

function mockFetch(implementation: () => Promise<unknown>): jest.SpyInstance {
  return jest.spyOn(globalThis, "fetch").mockImplementation(implementation as never);
}

function abortError(): Error {
  return typeof DOMException === "function"
    ? new DOMException("The operation was aborted.", "AbortError")
    : Object.assign(new Error("The operation was aborted."), { name: "AbortError" });
}

describe("PodcastView", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("lang", "de-DE");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.documentElement.removeAttribute("lang");
  });

  it("shows a loading notice while the episode is on its way", async () => {
    mockFetch(() => new Promise(() => {}));
    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);
    expect(await screen.findByText(/wird geladen/i)).toBeInTheDocument();
  });

  it("renders the latest episode with thumbnail, title, date and player", async () => {
    mockFetch(async () => new Response(JSON.stringify({ data: [episode] }), { status: 200 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);

    expect(await screen.findByText("Zündung Podcast II")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", episode.thumbnailUrl);
    expect(document.querySelector("audio")).toHaveAttribute("src", episode.url);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/ai-podcast/${PODCAST_ID}/episode-audio`),
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("fetches a specific episode by id in specific mode", async () => {
    mockFetch(async () => new Response(JSON.stringify({ data: [episode] }), { status: 200 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="specific" episodeId={EPISODE_ID} />);

    expect(await screen.findByText("Zündung Podcast II")).toBeInTheDocument();
  });

  it("reports a missing podcast id without asking the backend", async () => {
    const fetchMock = mockFetch(async () => new Response("", { status: 200 }));

    render(<PodcastView podcastId={null} displayMode="latest" episodeId={null} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Podcast-ID/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a missing episode id in specific mode without asking the backend", async () => {
    const fetchMock = mockFetch(async () => new Response("", { status: 200 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="specific" episodeId={null} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Episode-ID/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an unreachable podcast with a German fallback message", async () => {
    mockFetch(async () => new Response("", { status: 404 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Podcast konnte nicht geladen werden.");
  });

  it("shows a fixed German message for HTTP failures", async () => {
    mockFetch(async () => new Response("", { status: 500 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Podcast konnte nicht geladen werden.");
    expect(alert).not.toHaveTextContent("HTTP 500");
  });

  it("shows a fixed German message for network failures", async () => {
    mockFetch(async () => Promise.reject(new TypeError("Failed to fetch")));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Podcast konnte nicht geladen werden.");
    expect(alert).not.toHaveTextContent("Failed to fetch");
  });

  it("shows the empty-podcast domain error verbatim", async () => {
    mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Der Podcast hat noch keine Episoden.");
  });

  it("shows the missing-episode domain error verbatim", async () => {
    mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="specific" episodeId={EPISODE_ID} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Episode nicht gefunden.");
  });

  it("aborts stale requests on prop change without surfacing an abort error", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");
    const fetchMock = jest.spyOn(globalThis, "fetch").mockImplementation(((_url: string, init?: RequestInit) => {
      const signal = init?.signal;
      return new Promise((resolve, reject) => {
        signal?.addEventListener("abort", () => reject(abortError()), { once: true });
        if (typeof _url === "string" && _url.includes("podcast-two")) {
          resolve(new Response(JSON.stringify({ data: [episode] }), { status: 200 }));
        }
      });
    }) as never);

    const { rerender } = render(<PodcastView podcastId="podcast-one" displayMode="latest" episodeId={null} />);
    expect(await screen.findByText(/wird geladen/i)).toBeInTheDocument();

    rerender(<PodcastView podcastId="podcast-two" displayMode="latest" episodeId={null} />);

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Zündung Podcast II")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/ai-podcast/podcast-one/episode-audio"),
      expect.objectContaining({ signal: expect.anything() }),
    );
  });
});
