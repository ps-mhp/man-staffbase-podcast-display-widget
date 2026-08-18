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

import { EntityCatalogSource, EntityOption } from "@shared/entity-picker/entity-catalog";
import { pickLocalizedTitle } from "@shared/entity-picker/localized-title";

/** Where the app lists this account's ai-podcast installations. */
export const PODCAST_SEARCH_ENDPOINT = "/api/ai-podcast/search";

/**
 * How many podcasts the list offers at most.
 *
 * Most recently updated first; anything beyond it is still reachable by
 * typing the id.
 */
const CATALOG_LIMIT = 100;

interface RawPodcastEntry {
  installationId?: unknown;
  latestEpisodePublishedAt?: unknown;
  scope?: unknown;
}

interface SearchResponse {
  entries?: RawPodcastEntry[];
}

interface InstallationDetailResponse {
  config?: { localization?: Record<string, { title?: unknown }> };
}

/**
 * How the podcast picker gets its list.
 *
 * The search endpoint carries ids only; `toOption` makes one detail request
 * per entry for its title. That request is this source's own responsibility
 * to guard — `fetchEntityCatalog` only catches `fetchList` — so every failure
 * path here resolves to `{ id, title: id }` instead of rejecting.
 */
export const podcastCatalogSource: EntityCatalogSource<RawPodcastEntry> = {
  async fetchList(): Promise<RawPodcastEntry[]> {
    const query = new URLSearchParams({
      limit: String(CATALOG_LIMIT),
      sort: "updated_DESC",
    });

    const response = await fetch(`${PODCAST_SEARCH_ENDPOINT}?${query}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];

    const body = (await response.json()) as SearchResponse;
    return body.entries ?? [];
  },

  async toOption(entry: RawPodcastEntry): Promise<EntityOption | null> {
    const id = entry?.installationId;
    if (typeof id !== "string" || id === "") return null;

    try {
      const response = await fetch(`/api/installations/${id}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return { id, title: id };

      const body = (await response.json()) as InstallationDetailResponse;
      return { id, title: pickLocalizedTitle(body.config?.localization) ?? id };
    } catch {
      return { id, title: id };
    }
  },
};
