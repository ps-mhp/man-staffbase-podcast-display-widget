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

/**
 * Die ganze Konfiguration der Podcast-Anzeige in einem Attribut:
 * `podcast-config`.
 *
 * Bis 0.4.0-rc.3 lag sie verteilt auf vier Felder des Staffbase-Dialogs. Im
 * Content Designer liess sich das nicht bedienen: seine Auswahlfelder sind
 * keine echten `<select>`, ihr Wert ist von aussen nicht zu lesen – das Feld
 * „Episode-ID“ ging je nach Modus nicht zuverlässig auf und zu. Seither pflegt
 * ein eigenes Fenster alles und schreibt es hierher.
 *
 * Ältere Inhalte tragen nur die einzelnen Felder. Solange `podcast-config`
 * leer ist, gelten sie ({@link configFromLegacy}); beim ersten Übernehmen im
 * Fenster wandern sie hierher.
 *
 * Der Name trägt das Widget im Namen: Editoren hängen sich über
 * `root_<Attribut>` ein, ohne das Widget zu kennen, und `config` hat schon
 * das Hotspot-Widget.
 */

import { decodePayload, encodePayload } from "@shared/payload";

import { readEpisodeId, readPodcastId } from "./podcast-content";

export type PodcastMode = "latest" | "specific";
export type PodcastPlayerSize = "large" | "small";

export interface PodcastConfig {
  /** Leer, solange kein Podcast gewählt ist. */
  podcastId: string;
  mode: PodcastMode;
  /** Bleibt auch im Modus „Neueste“ stehen: der Wechsel zurück soll sie nicht verlieren. */
  episodeId?: string;
  size: PodcastPlayerSize;
}

/** Die vier Attribute bis 0.4.0-rc.3, so wie sie am Element ankommen. */
export interface LegacyPodcastAttributes {
  "podcast-id"?: unknown;
  "display-mode"?: unknown;
  "episode-id"?: unknown;
  "player-size"?: unknown;
}

export const DEFAULT_PODCAST_CONFIG: PodcastConfig = { podcastId: "", mode: "latest", size: "large" };

/** Alles ausser dem wörtlichen `"specific"` heisst „Neueste“ – auch ein leerer oder veralteter Wert. */
export const readMode = (raw: unknown): PodcastMode => (raw === "specific" ? "specific" : "latest");

/** Alles ausser dem wörtlichen `"small"` heisst „Groß“, die Vorgabe des Schemas. */
export const readSize = (raw: unknown): PodcastPlayerSize => (raw === "small" ? "small" : "large");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Baut die Konfiguration aus losen Werten; was nicht passt, wird zur Vorgabe. */
function configOf(podcastId: unknown, mode: unknown, episodeId: unknown, size: unknown): PodcastConfig {
  const episode = readEpisodeId(episodeId);
  return {
    podcastId: readPodcastId(podcastId) ?? "",
    mode: readMode(mode),
    ...(episode === null ? {} : { episodeId: episode }),
    size: readSize(size),
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Liest `podcast-config`; `null`, wenn dort nichts Brauchbares steht – leer,
 * kaputt kodiert oder kein Objekt. Dann gelten die alten Felder.
 */
export function readPodcastConfig(raw: string): PodcastConfig | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = parseJson(decodePayload(trimmed) ?? trimmed);
  if (!isRecord(value)) return null;
  return configOf(value.podcastId, value.mode, value.episodeId, value.size);
}

/** Wie {@link readPodcastConfig}, aber nie leer: Unbrauchbares wird zur Vorgabe. */
export function parsePodcastConfig(raw: string): PodcastConfig {
  return readPodcastConfig(raw) ?? DEFAULT_PODCAST_CONFIG;
}

/** Schreibt `podcast-config`, kodiert wie die übrigen JSON-Attribute (`@shared/payload`). */
export function serializePodcastConfig(config: PodcastConfig): string {
  const { podcastId, mode, episodeId, size } = config;
  return encodePayload(JSON.stringify({ podcastId, mode, ...(episodeId === undefined ? {} : { episodeId }), size }));
}

/** Die Konfiguration aus den einzelnen Feldern älterer Fassungen. */
export function configFromLegacy(attrs: LegacyPodcastAttributes): PodcastConfig {
  return configOf(attrs["podcast-id"], attrs["display-mode"], attrs["episode-id"], attrs["player-size"]);
}

/** Was gilt: `podcast-config`, sonst die einzelnen Felder. */
export function resolvePodcastConfig(attrs: LegacyPodcastAttributes & { "podcast-config"?: unknown }): PodcastConfig {
  const raw = attrs["podcast-config"];
  return (typeof raw === "string" ? readPodcastConfig(raw) : null) ?? configFromLegacy(attrs);
}
