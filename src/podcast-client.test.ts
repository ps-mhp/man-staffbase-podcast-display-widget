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

import { fetchEpisodesPage, fetchLatestEpisode, fetchEpisodeById } from "./podcast-client";
import { Episode } from "./podcast-content";

const PODCAST_ID = "6a6ae5e1d64a8c30f478a339";

function episode(episodeId: string): Episode {
  return {
    episodeId,
    episodeTitle: `Episode ${episodeId}`,
    publishedAt: "2026-07-30T06:42:10.566886Z",
    thumbnailUrl: "https://www.onetruck.man/thumb.jpg",
    url: `/api/ai-podcast/${PODCAST_ID}/episode-audio/${episodeId}/audio.mp3`,
  };
}

function mockFetch(implementation: (url: string) => Promise<unknown>): jest.SpyInstance {
  return jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(((url: string) => implementation(url)) as never);
}

describe("fetchEpisodesPage", () => {
  afterEach(() => jest.restoreAllMocks());

  it("requests the first page with the same-origin session", async () => {
    const fetchMock = mockFetch(
      async () => new Response(JSON.stringify({ data: [episode("a")] }), { status: 200 }),
    );

    await fetchEpisodesPage(PODCAST_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/ai-podcast/${PODCAST_ID}/episode-audio?limit=20`,
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("adds the cursor when given one", async () => {
    const fetchMock = mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

    await fetchEpisodesPage(PODCAST_ID, "AQAAAA7h_OlCIcn-cAAA");

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/ai-podcast/${PODCAST_ID}/episode-audio?limit=20&cursor=AQAAAA7h_OlCIcn-cAAA`,
      expect.anything(),
    );
  });

  it("throws on an HTTP error", async () => {
    mockFetch(async () => new Response("", { status: 404 }));

    await expect(fetchEpisodesPage(PODCAST_ID)).rejects.toThrow(/404/);
  });
});

describe("fetchLatestEpisode", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns the first episode of the first page", async () => {
    mockFetch(
      async () => new Response(JSON.stringify({ data: [episode("newest"), episode("older")] }), { status: 200 }),
    );

    await expect(fetchLatestEpisode(PODCAST_ID)).resolves.toEqual(episode("newest"));
  });

  it("treats an empty podcast as an error rather than an empty view", async () => {
    mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

    await expect(fetchLatestEpisode(PODCAST_ID)).rejects.toThrow(/Episoden/);
  });
});

describe("fetchEpisodeById", () => {
  afterEach(() => jest.restoreAllMocks());

  it("finds the episode on the first page", async () => {
    mockFetch(async () => new Response(JSON.stringify({ data: [episode("a"), episode("b")] }), { status: 200 }));

    await expect(fetchEpisodeById(PODCAST_ID, "b")).resolves.toEqual(episode("b"));
  });

  it("follows the cursor to a later page", async () => {
    const fetchMock = mockFetch(async (url: string) => {
      if (!url.includes("cursor=")) {
        return new Response(JSON.stringify({ data: [episode("a")], nextCursor: "page2" }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: [episode("b")] }), { status: 200 });
    });

    await expect(fetchEpisodeById(PODCAST_ID, "b")).resolves.toEqual(episode("b"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after 10 pages rather than looping forever", async () => {
    const fetchMock = mockFetch(
      async () => new Response(JSON.stringify({ data: [episode("a")], nextCursor: "more" }), { status: 200 }),
    );

    await expect(fetchEpisodeById(PODCAST_ID, "missing")).rejects.toThrow(/nicht gefunden/);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
