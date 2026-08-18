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
// back to `episodeTitle`, matching the shape the episode-audio endpoint
// sends. The shared one takes a single `localization` object and is for
// installation-config-shaped data (see podcast-catalog.ts).
import { documentLocales, pickLocalizedTitle, Episode } from "./podcast-content";
import { fetchEpisodesPage } from "./podcast-client";

/**
 * How the episode picker gets its list for whichever podcast is currently
 * selected.
 *
 * Fetches the *same* endpoint and reads the *same* `episodeId` field that
 * `fetchEpisodeById` later searches for — an earlier version of this source
 * called a different, unverified `episodes` endpoint and offered its `id`
 * field instead, so every episode picked through the dialog was one
 * `fetchEpisodeById` could never find: two different id spaces that only
 * looked alike. `episode-audio` is the one endpoint confirmed to exist (see
 * `podcast-client.ts` and the widget's README).
 *
 * Takes a `getPodcastId` callback rather than a fixed id because the episode
 * list depends on the widget's `podcast-id` field, which can change after
 * this source is created — `fetchList` reads it fresh on every call, which is
 * exactly what `startEntityPickerInjector`'s `watchFields` re-triggers.
 */
export function createEpisodeCatalogSource(
  getPodcastId: () => string | null,
): EntityCatalogSource<Episode> {
  return {
    async fetchList(): Promise<Episode[]> {
      const podcastId = getPodcastId();
      if (!podcastId) return [];

      const page = await fetchEpisodesPage(podcastId);
      return page.data;
    },

    toOption(episode: Episode): EntityOption {
      return {
        id: episode.episodeId,
        title: pickLocalizedTitle(episode.titleTranslations, episode.episodeTitle, documentLocales()),
      };
    },
  };
}

