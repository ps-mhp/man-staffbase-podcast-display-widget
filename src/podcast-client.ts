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
export class PodcastDomainError extends Error {}
const MALFORMED_RESPONSE = "Malformed response";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readTitleTranslations(value: unknown): Record<string, string> | undefined {
  if (!isObject(value) || Array.isArray(value)) return undefined;
  const entries = Object.entries(value);
  return entries.every(([, translation]) => typeof translation === "string")
    ? Object.fromEntries(entries) as Record<string, string>
    : undefined;
}

function readEpisode(value: unknown): Episode {
  if (!isObject(value)) throw new Error(MALFORMED_RESPONSE);

  const { episodeId, episodeTitle, publishedAt, thumbnailUrl, url } = value;
  if (
    typeof episodeId !== "string" ||
    typeof episodeTitle !== "string" ||
    typeof publishedAt !== "string" ||
    typeof thumbnailUrl !== "string" ||
    typeof url !== "string"
  ) {
    throw new Error(MALFORMED_RESPONSE);
  }

  return {
    episodeId,
    episodeTitle,
    publishedAt,
    thumbnailUrl,
    url,
    titleTranslations: readTitleTranslations(value.titleTranslations),
  };
}

function readEpisodesResponse(value: unknown): EpisodeAudioResponse {
  if (!isObject(value) || !Array.isArray(value.data)) throw new Error(MALFORMED_RESPONSE);

  const { nextCursor } = value;
  if (nextCursor !== undefined && nextCursor !== null && typeof nextCursor !== "string") {
    throw new Error(MALFORMED_RESPONSE);
  }

  return {
    data: value.data.map(readEpisode),
    nextCursor: typeof nextCursor === "string" ? nextCursor : undefined,
  };
}

function abortError(): Error {
  return typeof DOMException === "function"
    ? new DOMException("The operation was aborted.", "AbortError")
    : Object.assign(new Error("The operation was aborted."), { name: "AbortError" });
}

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
export async function fetchEpisodesPage(
  podcastId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<EpisodeAudioResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/ai-podcast/${podcastId}/episode-audio?${params.toString()}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return readEpisodesResponse(await response.json());
}

/** The newest episode of a podcast — the first entry of its first page. */
export async function fetchLatestEpisode(podcastId: string, signal?: AbortSignal): Promise<Episode> {
  const page = await fetchEpisodesPage(podcastId, undefined, signal);
  if (page.data.length === 0) throw new PodcastDomainError("Der Podcast hat noch keine Episoden.");
  return page.data[0];
}

/**
 * One specific episode, found by paging through the list until it turns up.
 *
 * @throws if the episode is not found within {@link MAX_PAGES} pages.
 */
export async function fetchEpisodeById(podcastId: string, episodeId: string, signal?: AbortSignal): Promise<Episode> {
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    if (signal?.aborted) throw abortError();

    const result = await fetchEpisodesPage(podcastId, cursor, signal);
    const found = result.data.find((episode) => episode.episodeId === episodeId);
    if (found) return found;

    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }

  throw new PodcastDomainError("Episode nicht gefunden.");
}
