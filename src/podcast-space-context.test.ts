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

import { fetchCurrentSpaceId, readCurrentPageId } from "./podcast-space-context";

const setPath = (pathname: string): void => {
  window.history.pushState({}, "", pathname);
};

const respondWith = (body: unknown, status = 200): jest.SpyInstance =>
  jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe("readCurrentPageId", () => {
  afterEach(() => setPath("/"));

  it("reads the page id from the classic editor's route (verified live 2026-08-18)", () => {
    setPath("/admin/plugin/page/aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(readCurrentPageId()).toBe("aaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("reads the page id from the Content Designer's edit route", () => {
    setPath("/studio/content/page/aaaaaaaaaaaaaaaaaaaaaaaa/edit");
    expect(readCurrentPageId()).toBe("aaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("reads the page id from a plain /pages/:id route", () => {
    setPath("/pages/bbbbbbbbbbbbbbbbbbbbbbbb");
    expect(readCurrentPageId()).toBe("bbbbbbbbbbbbbbbbbbbbbbbb");
  });

  it("lower-cases a mixed-case id", () => {
    setPath("/studio/content/page/AAAAAAAAAAAAAAAAAAAAAAAA/edit");
    expect(readCurrentPageId()).toBe("aaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("answers null when the path carries no recognizable page id", () => {
    setPath("/studio/apps/some-widget");
    expect(readCurrentPageId()).toBeNull();
  });
});

describe("fetchCurrentSpaceId", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    setPath("/");
  });

  it("answers null without calling the API when the URL carries no page id", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch");

    await expect(fetchCurrentSpaceId()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads spaceID from the page's own installation detail", async () => {
    setPath("/studio/content/page/aaaaaaaaaaaaaaaaaaaaaaaa/edit");
    const fetchMock = respondWith({ pluginID: "page", spaceID: "the-space" });

    await expect(fetchCurrentSpaceId()).resolves.toBe("the-space");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/installations/aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(init.credentials).toBe("same-origin");
  });

  it("reads spaceID via the classic editor's own route too", async () => {
    setPath("/admin/plugin/page/aaaaaaaaaaaaaaaaaaaaaaaa");
    respondWith({ pluginID: "page", spaceID: "the-space" });

    await expect(fetchCurrentSpaceId()).resolves.toBe("the-space");
  });

  it("answers null when the installation lookup fails", async () => {
    setPath("/studio/content/page/aaaaaaaaaaaaaaaaaaaaaaaa/edit");
    respondWith({}, 404);

    await expect(fetchCurrentSpaceId()).resolves.toBeNull();
  });

  it("answers null when the response carries no spaceID", async () => {
    setPath("/studio/content/page/aaaaaaaaaaaaaaaaaaaaaaaa/edit");
    respondWith({ pluginID: "page" });

    await expect(fetchCurrentSpaceId()).resolves.toBeNull();
  });

  it("answers null instead of rejecting on a network failure", async () => {
    setPath("/studio/content/page/aaaaaaaaaaaaaaaaaaaaaaaa/edit");
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(fetchCurrentSpaceId()).resolves.toBeNull();
  });
});
