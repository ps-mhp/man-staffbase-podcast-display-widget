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

  it("reports an unreachable podcast instead of staying blank", async () => {
    mockFetch(async () => new Response("", { status: 404 }));

    render(<PodcastView podcastId={PODCAST_ID} displayMode="latest" episodeId={null} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/404/);
  });
});
