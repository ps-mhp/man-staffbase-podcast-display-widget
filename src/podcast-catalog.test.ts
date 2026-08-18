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

import { PODCAST_SEARCH_ENDPOINT, podcastCatalogSource } from "./podcast-catalog";

function respondWith(body, status = 200) {
  return jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("podcastCatalogSource.fetchList", () => {
  afterEach(() => jest.restoreAllMocks());

  it("lists the most recently updated podcasts first", async () => {
    const fetchMock = respondWith({ entries: [] });

    await podcastCatalogSource.fetchList();

    const callArgs = fetchMock.mock.calls[0];
    const url = callArgs[0];
    const init = callArgs[1];
    expect(url.startsWith(PODCAST_SEARCH_ENDPOINT)).toBe(true);
    expect(url).toContain("limit=100");
    expect(url).toContain("sort=updated_DESC");
    expect(init.credentials).toBe("same-origin");
  });

  it("returns the raw entries as-is for toOption to map", async () => {
    respondWith({
      entries: [{ installationId: "aaaaaaaaaaaaaaaaaaaaaaaa", latestEpisodePublishedAt: "2026-01-01T00:00:00Z", scope: "space" }],
    });

    await expect(podcastCatalogSource.fetchList()).resolves.toEqual([
      { installationId: "aaaaaaaaaaaaaaaaaaaaaaaa", latestEpisodePublishedAt: "2026-01-01T00:00:00Z", scope: "space" },
    ]);
  });

  it("answers with an empty list when entries is missing", async () => {
    respondWith({});

    await expect(podcastCatalogSource.fetchList()).resolves.toEqual([]);
  });

  it("answers with an empty list when the request is not ok", async () => {
    respondWith({}, 403);

    await expect(podcastCatalogSource.fetchList()).resolves.toEqual([]);
  });

  it("lets a network failure propagate to the shared loader", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(podcastCatalogSource.fetchList()).rejects.toThrow("offline");
  });
});

describe("podcastCatalogSource.toOption", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.documentElement.removeAttribute("lang");
  });

  it("looks up the installation's title in the reader's language", async () => {
    document.documentElement.setAttribute("lang", "de-DE");
    respondWith({ config: { localization: { en_US: { title: "Podcast" }, de_DE: { title: "Hörprogramm" } } } });

    await expect(
      podcastCatalogSource.toOption({ installationId: "aaaaaaaaaaaaaaaaaaaaaaaa" }),
    ).resolves.toEqual({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Hörprogramm" });
  });

  it("falls back to the id when the detail request fails", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(
      podcastCatalogSource.toOption({ installationId: "bbbbbbbbbbbbbbbbbbbbbbbb" }),
    ).resolves.toEqual({ id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "bbbbbbbbbbbbbbbbbbbbbbbb" });
  });

  it("falls back to the id when the detail request answers with an error status", async () => {
    respondWith({}, 404);

    await expect(
      podcastCatalogSource.toOption({ installationId: "cccccccccccccccccccccccc" }),
    ).resolves.toEqual({ id: "cccccccccccccccccccccccc", title: "cccccccccccccccccccccccc" });
  });

  it("falls back to the id when the installation carries no usable title", async () => {
    respondWith({ config: { localization: {} } });

    await expect(
      podcastCatalogSource.toOption({ installationId: "dddddddddddddddddddddddd" }),
    ).resolves.toEqual({ id: "dddddddddddddddddddddddd", title: "dddddddddddddddddddddddd" });
  });
});
