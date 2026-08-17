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

/** One episode, as far as this widget cares about it. */
export interface Episode {
  episodeId: string;
  episodeTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
  titleTranslations?: Record<string, string>;
}

/** One page of the episode-audio list endpoint. */
export interface EpisodeAudioResponse {
  data: Episode[];
  nextCursor?: string;
}

/** The shape of a Staffbase backend id: 24 hex digits. */
const PODCAST_ID = /(?<![0-9a-f])[0-9a-f]{24}(?![0-9a-f])/i;

/** The shape of an episode id: a UUID. */
const EPISODE_ID = /(?<![0-9a-f])[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?![0-9a-f])/i;

/**
 * Finds the last match of `pattern` in `raw`, or null if there is none.
 *
 * Shared by `readPodcastId` and `readEpisodeId`: both accept the id inline or
 * inside a longer, pasted URL, and in either case the id one is looking for is
 * the last run of the matching shape in the string, not the first — a podcast
 * URL, for instance, may carry unrelated ids earlier in its path.
 */
function readId(raw: unknown, pattern: RegExp): string | null {
  if (typeof raw !== "string") return null;
  const matches = raw.trim().match(new RegExp(pattern, "gi"));
  return matches === null ? null : matches[matches.length - 1].toLowerCase();
}

function normalizeLocale(raw: string): string {
  const [language, region] = raw.trim().replace("-", "_").split("_");
  return region ? `${language.toLowerCase()}_${region.toUpperCase()}` : language.toLowerCase();
}

/**
 * The podcast id out of whatever the author typed — the id itself, or a
 * podcast URL it was pasted from.
 */
export function readPodcastId(raw: unknown): string | null {
  return readId(raw, PODCAST_ID);
}

/**
 * The episode id out of whatever the author typed — the id itself, or an
 * episode/audio URL it was pasted from.
 */
export function readEpisodeId(raw: unknown): string | null {
  return readId(raw, EPISODE_ID);
}

/**
 * The user's languages, most trustworthy first, in the API's `de_DE` spelling.
 *
 * Same order as in the post widget: `<html lang>`, then the page's
 * `content-language`, then the browser's `navigator.language` last, because
 * it is a guess about the user rather than their choice inside the app.
 */
export function documentLocales(): string[] {
  const meta = document.querySelector('meta[http-equiv="content-language"]');
  const candidates = [
    document.documentElement.getAttribute("lang"),
    meta?.getAttribute("content"),
    navigator.language,
  ];

  const locales: string[] = [];
  for (const candidate of candidates) {
    const locale = candidate ? normalizeLocale(candidate) : undefined;
    if (locale && !locales.includes(locale)) locales.push(locale);
  }
  return locales;
}

/**
 * The episode title to show, in the reader's language where possible.
 *
 * Two passes over `translations`: the exact locale, then the language part
 * alone (`de` takes `de_DE`). Neither pass matching falls back to
 * `episodeTitle` — the field the API sends for exactly this purpose — rather
 * than to some other, unrelated translation: showing the wrong language
 * outright would be a worse answer than the title the API itself considers
 * the default.
 */
export function pickLocalizedTitle(
  translations: Record<string, string> | undefined,
  episodeTitle: string,
  locales: string[],
): string {
  const keys = Object.keys(translations ?? {});
  if (translations === undefined || keys.length === 0) return episodeTitle;

  for (const locale of locales) {
    if (translations[locale]) return translations[locale];
  }

  for (const locale of locales) {
    const language = locale.split("_")[0].toLowerCase();
    const match = keys.find((key) => key.split("_")[0].toLowerCase() === language);
    if (match !== undefined) return translations[match];
  }

  return episodeTitle;
}
