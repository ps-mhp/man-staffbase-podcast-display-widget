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

import { Episode, EpisodeAudioResponse } from "./podcast-content";

const PAGE_SIZE = 20;

/**
 * Looking for one specific episode means paging through the list — there is
 * no endpoint for a single episode. Ten pages (200 episodes) is generous for
 * any real podcast; beyond that, a typo in the configured id is far likelier
 * than a podcast this long, and looping further would just delay the error.
 */
const MAX_PAGES = 10;

/**
 * Fetches one page of a podcast's episodes from the app the widget is
 * embedded in.
 *
 * `same-origin` credentials carry the user's own session, so the backend
 * applies exactly the permissions it would apply if the user opened the
 * podcast directly.
 */
export async function fetchEpisodesPage(podcastId: string, cursor?: string): Promise<EpisodeAudioResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/ai-podcast/${podcastId}/episode-audio?${params.toString()}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as EpisodeAudioResponse;
}

/** The newest episode of a podcast — the first entry of its first page. */
export async function fetchLatestEpisode(podcastId: string): Promise<Episode> {
  const page = await fetchEpisodesPage(podcastId);
  if (page.data.length === 0) throw new Error("Der Podcast hat noch keine Episoden.");
  return page.data[0];
}

/**
 * One specific episode, found by paging through the list until it turns up.
 *
 * @throws if the episode is not found within {@link MAX_PAGES} pages.
 */
export async function fetchEpisodeById(podcastId: string, episodeId: string): Promise<Episode> {
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchEpisodesPage(podcastId, cursor);
    const found = result.data.find((episode) => episode.episodeId === episodeId);
    if (found) return found;

    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }

  throw new Error("Episode nicht gefunden.");
}
