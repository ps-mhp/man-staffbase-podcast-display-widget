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

import { fetchCurrentSpaceId } from "./podcast-space-context";

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
  /**
   * Stitched onto every entry by `fetchList`, once per catalog load, so
   * `toOption` — which only ever sees one entry at a time — can still tell
   * whether *this* entry's Space is the one the editor is currently in. See
   * the module comment for why this can't just be a reachability probe.
   */
  currentSpaceId?: string | null;
}

interface SearchResponse {
  entries?: RawPodcastEntry[];
}

interface InstallationDetailResponse {
  config?: { localization?: Record<string, { title?: unknown }> };
  spaceID?: unknown;
}

/**
 * How the podcast picker gets its list.
 *
 * The search endpoint carries ids only; `toOption` makes one detail request
 * per entry for its title. That request is this source's own responsibility
 * to guard — `fetchEntityCatalog` only catches `fetchList` — so every failure
 * path here resolves to `{ id, title: id }` instead of rejecting.
 *
 * Deliberately does *not* drop podcasts a "space"-scoped author cannot reach
 * (e.g. by calling `episode-audio` per entry as an earlier version of this
 * file did): that endpoint is scoped to the Space the *calling page* is
 * rendered in, and the config dialog itself is not rendered inside any
 * particular podcast's Space — so the probe came back empty for every
 * podcast, not just the inaccessible ones, and the whole picker fell back to
 * raw id entry.
 *
 * What this file *can* tell, without probing anything per podcast: the
 * search endpoint's own `scope` field (`"global"` vs `"space"`), and — via
 * `podcast-space-context.ts` — the Space id of the page the editor has open,
 * read straight from its own URL. A `"space"`-scoped podcast whose Space
 * differs from that one is marked `disabled` rather than removed: it may
 * still work once the page is moved, or may simply need an admin to fix
 * access (see `podcast-access-help.tsx`) — greying it out says "not usable
 * from here" without pretending it doesn't exist.
 */
export const podcastCatalogSource: EntityCatalogSource<RawPodcastEntry> = {
  async fetchList(): Promise<RawPodcastEntry[]> {
    const query = new URLSearchParams({
      limit: String(CATALOG_LIMIT),
      sort: "updated_DESC",
    });

    const [response, currentSpaceId] = await Promise.all([
      fetch(`${PODCAST_SEARCH_ENDPOINT}?${query}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      }),
      fetchCurrentSpaceId(),
    ]);
    if (!response.ok) return [];

    const body = (await response.json()) as SearchResponse;
    return (body.entries ?? []).map((entry) => ({ ...entry, currentSpaceId }));
  },

  async toOption(entry: RawPodcastEntry): Promise<EntityOption | null> {
    const id = entry?.installationId;
    if (typeof id !== "string" || id === "") return null;

    // Only a "space"-scoped podcast can ever be out of reach this way; a
    // "global" one (or an unrecognized/legacy scope, treated the same to
    // avoid disabling entries this file doesn't understand yet) is left
    // enabled regardless of the current page's Space.
    const isSpaceScoped = entry.scope === "space";

    try {
      const response = await fetch(`/api/installations/${id}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return { id, title: id };

      const body = (await response.json()) as InstallationDetailResponse;
      const title = pickLocalizedTitle(body.config?.localization) ?? id;

      // Both sides must be known ids to disable anything — an
      // undeterminable current Space (URL didn't match, request failed)
      // must not grey out every space-scoped podcast on a guess.
      const spaceID = typeof body.spaceID === "string" ? body.spaceID : null;
      const disabled = isSpaceScoped && spaceID !== null && entry.currentSpaceId !== null && spaceID !== entry.currentSpaceId;

      return disabled ? { id, title, disabled: true } : { id, title };
    } catch {
      return { id, title: id };
    }
  },
};
