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

// The *local* pickLocalizedTitle, not `@shared/entity-picker/localized-title`:
// this one takes `(translations, episodeTitle, locales)` and always falls
// back to `episodeTitle`, matching the shape the episode-audio and episodes
// endpoints both send. The shared one takes a single `localization` object
// and is for installation-config-shaped data (see podcast-catalog.ts).
import { documentLocales, pickLocalizedTitle } from "./podcast-content";

interface RawEpisode {
  id?: unknown;
  titleTranslations?: Record<string, string>;
}

interface EpisodesResponse {
  data?: RawEpisode[];
}

/**
 * How the episode picker gets its list for whichever podcast is currently
 * selected.
 *
 * Takes a `getPodcastId` callback rather than a fixed id because the episode
 * list depends on the widget's `podcast-id` field, which can change after
 * this source is created — `fetchList` reads it fresh on every call, which is
 * exactly what `startEntityPickerInjector`'s `watchFields` re-triggers.
 */
export function createEpisodeCatalogSource(
  getPodcastId: () => string | null,
): EntityCatalogSource<RawEpisode> {
  return {
    async fetchList(): Promise<RawEpisode[]> {
      const podcastId = getPodcastId();
      if (!podcastId) return [];

      const response = await fetch(`/api/ai-podcast/${podcastId}/episodes?limit=10`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return [];

      const body = (await response.json()) as EpisodesResponse;
      return body.data ?? [];
    },

    toOption(entry: RawEpisode): EntityOption | null {
      const id = entry?.id;
      if (typeof id !== "string" || id === "") return null;
      return { id, title: pickLocalizedTitle(entry.titleTranslations, id, documentLocales()) };
    },
  };
}
