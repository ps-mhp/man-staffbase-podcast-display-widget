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

import { registerDocsExamples } from "@shared/docs/register-docs-examples";
import { fetchEntityCatalog } from "@shared/entity-picker/entity-catalog";
import { podcastCatalogSource } from "./podcast-catalog";
import { createEpisodeCatalogSource } from "./episode-catalog";

/** The first non-disabled option, or the first option if all are disabled. */
function firstUsableId(options: { id: string; disabled?: boolean }[]): string | null {
  return options.find((option) => !option.disabled)?.id ?? options[0]?.id ?? null;
}

/**
 * All ids in "try this order" — every non-disabled option first (in their
 * original, most-recently-updated-first order), then every disabled one.
 * Matches `firstUsableId`'s preference for a single pick, but keeps every
 * candidate so the caller can move on to the next one instead of settling
 * for the very first, which may turn out unusable for a *different* reason
 * (see below: a podcast with no episodes yet).
 */
function orderedUsableIds(options: { id: string; disabled?: boolean }[]): string[] {
  const enabled = options.filter((option) => !option.disabled).map((option) => option.id);
  const disabled = options.filter((option) => option.disabled).map((option) => option.id);
  return [...enabled, ...disabled];
}

async function resolveAttributes(): Promise<Record<string, string>> {
  const attributes: Record<string, string> = {};

  const podcasts = await fetchEntityCatalog(podcastCatalogSource);
  const firstPodcastId = firstUsableId(podcasts);
  if (!firstPodcastId) {
    return attributes;
  }
  // Default: the plain first-available podcast, no episode — this is what
  // ships if none of the candidates below have an episode yet.
  attributes["podcast-id"] = firstPodcastId;

  // The "specific episode" example needs a podcast that actually *has* an
  // episode — the pragmatic "just take the first available entity" rule
  // from the design doesn't hold up once the first podcast happens to be
  // empty (a brand-new podcast with no episodes yet), which would otherwise
  // always show the "kein Live-Datensatz" fallback even though other,
  // usable podcasts exist. So this tries every candidate, in the same
  // enabled-before-disabled order, and keeps the first one with episodes.
  for (const podcastId of orderedUsableIds(podcasts)) {
    const episodes = await fetchEntityCatalog(createEpisodeCatalogSource(() => podcastId));
    const firstEpisodeId = firstUsableId(episodes);
    if (firstEpisodeId) {
      attributes["podcast-id"] = podcastId;
      attributes["episode-id"] = firstEpisodeId;
      break;
    }
  }

  return attributes;
}

/**
 * The result of {@link resolveAttributes}, looked up once and reused for
 * every example on the docs page.
 *
 * The docs app is just a *display* of the widget — it renders the same
 * "which podcast/episode should the examples use" question for every
 * example on the page (currently two), and asking it twice is both wasted
 * work (a podcast search plus one episode search per candidate, all over
 * again) and a correctness risk: two independent searches can land on
 * different results if the underlying data changes between them, which
 * would make the "latest episode" example show one podcast while the
 * "specific episode" example resolves a different, unrelated one. Doing the
 * lookup once and reusing it keeps every example on the same page
 * consistent with each other.
 */
let cachedAttributes: Promise<Record<string, string>> | null = null;

/**
 * Test-only: clears the memoized lookup so each test starts from a clean
 * slate instead of silently reusing an earlier test's mocked result.
 */
export function __resetDocsExamplesCacheForTests(): void {
  cachedAttributes = null;
}

registerDocsExamples("podcast-display-widget", () => {
  cachedAttributes ??= resolveAttributes();
  return cachedAttributes;
});
