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

const respondWith = (body: unknown, status = 200): jest.SpyInstance =>
  jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe("podcastCatalogSource.fetchList", () => {
  afterEach(() => jest.restoreAllMocks());

  it("lists the most recently updated podcasts first", async () => {
    const fetchMock = respondWith({ entries: [] });

    await podcastCatalogSource.fetchList();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith(PODCAST_SEARCH_ENDPOINT)).toBe(true);
    expect(url).toContain("limit=100");
    expect(url).toContain("sort=updated_DESC");
    expect(init.credentials).toBe("same-origin");
  });

  it("returns the raw entries as-is for toOption to map (plus the current Space, resolved once per list)", async () => {
    respondWith({
      entries: [{ installationId: "aaaaaaaaaaaaaaaaaaaaaaaa", latestEpisodePublishedAt: "2026-01-01T00:00:00Z", scope: "space" }],
    });

    // jsdom's default location has no page id in its path, so the current
    // Space cannot be resolved here — this test only pins down that the
    // field is *attached*, not what value it resolves to on a real editor
    // page (see podcast-space-context.test.ts for that).
    await expect(podcastCatalogSource.fetchList()).resolves.toEqual([
      {
        installationId: "aaaaaaaaaaaaaaaaaaaaaaaa",
        latestEpisodePublishedAt: "2026-01-01T00:00:00Z",
        scope: "space",
        currentSpaceId: null,
      },
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
      podcastCatalogSource.toOption({ installationId: "aaaaaaaaaaaaaaaaaaaaaaaa" } as never),
    ).resolves.toEqual({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Hörprogramm" });
  });

  it("falls back to the id when the detail request fails", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(
      podcastCatalogSource.toOption({ installationId: "bbbbbbbbbbbbbbbbbbbbbbbb" } as never),
    ).resolves.toEqual({ id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "bbbbbbbbbbbbbbbbbbbbbbbb" });
  });

  it("falls back to the id when the detail request answers with an error status", async () => {
    respondWith({}, 404);

    await expect(
      podcastCatalogSource.toOption({ installationId: "cccccccccccccccccccccccc" } as never),
    ).resolves.toEqual({ id: "cccccccccccccccccccccccc", title: "cccccccccccccccccccccccc" });
  });

  it("falls back to the id when the installation carries no usable title", async () => {
    respondWith({ config: { localization: {} } });

    await expect(
      podcastCatalogSource.toOption({ installationId: "dddddddddddddddddddddddd" } as never),
    ).resolves.toEqual({ id: "dddddddddddddddddddddddd", title: "dddddddddddddddddddddddd" });
  });

  it("disables a space-scoped podcast whose Space differs from the current page's", async () => {
    respondWith({ config: { localization: { en_US: { title: "Elsewhere" } } }, spaceID: "space-b" });

    await expect(
      podcastCatalogSource.toOption({
        installationId: "eeeeeeeeeeeeeeeeeeeeeeee",
        scope: "space",
        currentSpaceId: "space-a",
      } as never),
    ).resolves.toEqual({ id: "eeeeeeeeeeeeeeeeeeeeeeee", title: "Elsewhere", disabled: true });
  });

  it("leaves a space-scoped podcast enabled when its Space matches the current page's", async () => {
    respondWith({ config: { localization: { en_US: { title: "Here" } } }, spaceID: "space-a" });

    await expect(
      podcastCatalogSource.toOption({
        installationId: "ffffffffffffffffffffffff",
        scope: "space",
        currentSpaceId: "space-a",
      } as never),
    ).resolves.toEqual({ id: "ffffffffffffffffffffffff", title: "Here" });
  });

  it("leaves a global podcast enabled even outside the current page's Space", async () => {
    respondWith({ config: { localization: { en_US: { title: "Everywhere" } } }, spaceID: "space-b" });

    await expect(
      podcastCatalogSource.toOption({
        installationId: "1111111111111111111111aa",
        scope: "global",
        currentSpaceId: "space-a",
      } as never),
    ).resolves.toEqual({ id: "1111111111111111111111aa", title: "Everywhere" });
  });

  it("leaves a space-scoped podcast enabled when the current Space could not be determined", async () => {
    respondWith({ config: { localization: { en_US: { title: "Unknown context" } } }, spaceID: "space-b" });

    await expect(
      podcastCatalogSource.toOption({
        installationId: "2222222222222222222222bb",
        scope: "space",
        currentSpaceId: null,
      } as never),
    ).resolves.toEqual({ id: "2222222222222222222222bb", title: "Unknown context" });
  });
});
