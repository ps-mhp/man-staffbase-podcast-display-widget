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

import { createEpisodeCatalogSource } from "./episode-catalog";

const respondWith = (body: unknown, status = 200): jest.SpyInstance =>
  jest.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe("createEpisodeCatalogSource", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.documentElement.removeAttribute("lang");
  });

  it("fetches no episodes when no podcast is selected", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch");
    const source = createEpisodeCatalogSource(() => null);

    await expect(source.fetchList()).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches no episodes when the podcast id is blank", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch");
    const source = createEpisodeCatalogSource(() => "");

    await expect(source.fetchList()).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists the selected podcast's episodes", async () => {
    const fetchMock = respondWith({
      data: [{ id: "43d35217-0aa6-4338-8151-c211810fea52", titleTranslations: { en_US: "erste Episode" } }],
    });
    const source = createEpisodeCatalogSource(() => "6a7ae1fa403301105978071c");

    await source.fetchList();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/ai-podcast/6a7ae1fa403301105978071c/episodes?limit=10");
    expect(init.credentials).toBe("same-origin");
  });

  it("reads the podcast id again on every fetchList call", async () => {
    let podcastId = "aaaaaaaaaaaaaaaaaaaaaaaa";
    const fetchMock = respondWith({ data: [] });
    const source = createEpisodeCatalogSource(() => podcastId);

    await source.fetchList();
    podcastId = "bbbbbbbbbbbbbbbbbbbbbbbb";
    await source.fetchList();

    expect((fetchMock.mock.calls[0] as [string])[0]).toContain("aaaaaaaaaaaaaaaaaaaaaaaa");
    expect((fetchMock.mock.calls[1] as [string])[0]).toContain("bbbbbbbbbbbbbbbbbbbbbbbb");
  });

  it("answers with an empty list when data is missing", async () => {
    respondWith({});
    const source = createEpisodeCatalogSource(() => "aaaaaaaaaaaaaaaaaaaaaaaa");

    await expect(source.fetchList()).resolves.toEqual([]);
  });

  it("answers with an empty list when the request is not ok", async () => {
    respondWith({}, 404);
    const source = createEpisodeCatalogSource(() => "aaaaaaaaaaaaaaaaaaaaaaaa");

    await expect(source.fetchList()).resolves.toEqual([]);
  });

  it("lets a network failure propagate to the shared loader", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const source = createEpisodeCatalogSource(() => "aaaaaaaaaaaaaaaaaaaaaaaa");

    await expect(source.fetchList()).rejects.toThrow("offline");
  });

  it("titles each episode in the reader's language", () => {
    document.documentElement.setAttribute("lang", "de-DE");
    const source = createEpisodeCatalogSource(() => "aaaaaaaaaaaaaaaaaaaaaaaa");

    expect(
      source.toOption({
        id: "43d35217-0aa6-4338-8151-c211810fea52",
        titleTranslations: { en_US: "First episode", de_DE: "Erste Episode" },
      } as never),
    ).toEqual({ id: "43d35217-0aa6-4338-8151-c211810fea52", title: "Erste Episode" });
  });

  it("falls back to the episode's own id when it carries no matching translation", () => {
    document.documentElement.setAttribute("lang", "fr-FR");
    const source = createEpisodeCatalogSource(() => "aaaaaaaaaaaaaaaaaaaaaaaa");

    const option = source.toOption({
      id: "43d35217-0aa6-4338-8151-c211810fea52",
      titleTranslations: undefined,
    } as never);

    expect(option).toEqual({ id: "43d35217-0aa6-4338-8151-c211810fea52", title: "43d35217-0aa6-4338-8151-c211810fea52" });
  });
});
