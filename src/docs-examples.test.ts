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

import "./docs-examples";
import { getDocsExamplesResolver } from "@shared/docs/register-docs-examples";
import { PODCAST_SEARCH_ENDPOINT } from "./podcast-catalog";

function mockFetch(implementation: (input: RequestInfo | URL) => Promise<Response>): jest.SpyInstance {
  return jest.spyOn(globalThis, "fetch").mockImplementation(implementation as never);
}

describe("podcast-display-widget docs-examples", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers a resolver that returns the first podcast's and first episode's id", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.startsWith(PODCAST_SEARCH_ENDPOINT)) {
        return new Response(
          JSON.stringify({ entries: [{ installationId: "podcast-1", scope: "global" }] }),
          { status: 200 },
        );
      }
      if (url.includes("/api/installations/")) {
        return new Response(JSON.stringify({ config: { localization: {} } }), { status: 200 });
      }
      if (url.includes("episode-audio")) {
        return new Response(
          JSON.stringify({
            data: [
              { episodeId: "ep-1", episodeTitle: "Folge 1", publishedAt: "2026-01-01", thumbnailUrl: "", url: "" },
            ],
          }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const resolver = getDocsExamplesResolver("podcast-display-widget");
    expect(resolver).toBeDefined();

    const result = await resolver!();
    expect(result["podcast-id"]).toBe("podcast-1");
    expect(result["episode-id"]).toBe("ep-1");
  });

  it("omits the podcast-id key when no podcast is available", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.startsWith(PODCAST_SEARCH_ENDPOINT)) {
        return new Response(JSON.stringify({ entries: [] }), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const resolver = getDocsExamplesResolver("podcast-display-widget");
    const result = await resolver!();

    expect(result["podcast-id"]).toBeUndefined();
    expect(result["episode-id"]).toBeUndefined();
  });
});
