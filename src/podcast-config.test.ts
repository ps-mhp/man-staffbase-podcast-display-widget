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

import { encodePayload } from "@shared/payload";

import manifest from "../docs/manifest.json";
import {
  DEFAULT_PODCAST_CONFIG,
  PodcastConfig,
  configFromLegacy,
  parsePodcastConfig,
  readPodcastConfig,
  resolvePodcastConfig,
  serializePodcastConfig,
} from "./podcast-config";

const PODCAST = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_PODCAST = "bbbbbbbbbbbbbbbbbbbbbbbb";
const EPISODE = "11111111-2222-3333-4444-555555555555";

const SPECIFIC: PodcastConfig = { podcastId: PODCAST, mode: "specific", episodeId: EPISODE, size: "small" };

describe("serializePodcastConfig / readPodcastConfig", () => {
  it("schreibt kodiertes JSON und liest es unverändert zurück", () => {
    const raw = serializePodcastConfig(SPECIFIC);

    // Kodiert, damit Übersetzung und HTML-Escaping das Attribut nicht zerschneiden.
    expect(raw.startsWith("b64:")).toBe(true);
    expect(readPodcastConfig(raw)).toEqual(SPECIFIC);
  });

  it("lässt eine fehlende Episode weg, statt `undefined` zu speichern", () => {
    const raw = serializePodcastConfig({ podcastId: PODCAST, mode: "latest", size: "large" });

    expect(readPodcastConfig(raw)).toEqual({ podcastId: PODCAST, mode: "latest", size: "large" });
    expect(Object.keys(readPodcastConfig(raw) ?? {})).not.toContain("episodeId");
  });

  it("behält die Episode auch im Modus „Neueste“, damit der Wechsel zurück sie nicht verliert", () => {
    const config: PodcastConfig = { ...SPECIFIC, mode: "latest" };

    expect(readPodcastConfig(serializePodcastConfig(config))).toEqual(config);
  });

  it("liest auch unkodiertes JSON", () => {
    expect(readPodcastConfig(JSON.stringify(SPECIFIC))).toEqual(SPECIFIC);
  });

  it.each([
    ["leer", ""],
    ["Leerzeichen", "   "],
    ["kein JSON", "{kaputt"],
    ["kaputte Kodierung", "b64:%%%"],
    ["Liste statt Objekt", encodePayload("[1,2]")],
    ["Zahl", encodePayload("42")],
    ["null", encodePayload("null")],
  ])("liefert null für Unbrauchbares (%s)", (_, raw) => {
    expect(readPodcastConfig(raw)).toBeNull();
  });

  it("ersetzt unbrauchbare Felder durch Vorgaben", () => {
    const raw = encodePayload(
      JSON.stringify({ podcastId: 42, mode: "irgendwas", episodeId: "keine-uuid", size: "riesig" }),
    );

    expect(readPodcastConfig(raw)).toEqual(DEFAULT_PODCAST_CONFIG);
  });

  it("liest die IDs auch aus eingefügten Adressen", () => {
    const raw = encodePayload(
      JSON.stringify({
        podcastId: `https://app.example.test/content/podcast/${PODCAST}`,
        mode: "specific",
        episodeId: `https://cdn.example.test/audio/${EPISODE}.mp3`,
        size: "small",
      }),
    );

    expect(readPodcastConfig(raw)).toEqual(SPECIFIC);
  });
});

describe("parsePodcastConfig", () => {
  it("fällt bei Unbrauchbarem auf die Vorgaben zurück", () => {
    expect(parsePodcastConfig("{kaputt")).toEqual(DEFAULT_PODCAST_CONFIG);
    expect(parsePodcastConfig("")).toEqual(DEFAULT_PODCAST_CONFIG);
  });

  it("liest eine gespeicherte Konfiguration", () => {
    expect(parsePodcastConfig(serializePodcastConfig(SPECIFIC))).toEqual(SPECIFIC);
  });
});

describe("configFromLegacy", () => {
  it("übernimmt die vier alten Felder", () => {
    expect(
      configFromLegacy({
        "podcast-id": PODCAST,
        "display-mode": "specific",
        "episode-id": EPISODE,
        "player-size": "small",
      }),
    ).toEqual(SPECIFIC);
  });

  it("setzt fehlende oder fremde Werte auf die Vorgaben", () => {
    expect(configFromLegacy({})).toEqual(DEFAULT_PODCAST_CONFIG);
    expect(configFromLegacy({ "display-mode": "grid", "player-size": 3, "podcast-id": "abc" })).toEqual(
      DEFAULT_PODCAST_CONFIG,
    );
  });
});

describe("resolvePodcastConfig", () => {
  const legacy = { "podcast-id": OTHER_PODCAST, "display-mode": "latest", "player-size": "large" };

  it("nimmt `podcast-config`, wenn es dort etwas Brauchbares gibt", () => {
    expect(resolvePodcastConfig({ ...legacy, "podcast-config": serializePodcastConfig(SPECIFIC) })).toEqual(SPECIFIC);
  });

  it("nimmt die alten Felder, solange `podcast-config` fehlt oder leer ist", () => {
    const expected: PodcastConfig = { podcastId: OTHER_PODCAST, mode: "latest", size: "large" };

    expect(resolvePodcastConfig(legacy)).toEqual(expected);
    expect(resolvePodcastConfig({ ...legacy, "podcast-config": "" })).toEqual(expected);
  });

  it("nimmt die alten Felder auch, wenn `podcast-config` kaputt ist", () => {
    expect(resolvePodcastConfig({ ...legacy, "podcast-config": "b64:%%%" }).podcastId).toBe(OTHER_PODCAST);
  });

  it("ignoriert Werte, die keine Zeichenketten sind", () => {
    expect(resolvePodcastConfig({ "podcast-config": 42 })).toEqual(DEFAULT_PODCAST_CONFIG);
  });

  // Die Beispiele der Dokumentation setzen weiter die alten Felder; der
  // Rückfall muss sie verstehen, sonst zeigt die Doku nur Fehlermeldungen.
  it("versteht die Beispiele der Dokumentation", () => {
    const [latest, specific] = manifest.examples;

    expect(resolvePodcastConfig({ ...latest.attributes, "podcast-id": PODCAST })).toEqual({
      podcastId: PODCAST,
      mode: "latest",
      size: "large",
    });
    expect(resolvePodcastConfig({ ...specific.attributes, "podcast-id": PODCAST, "episode-id": EPISODE })).toEqual(
      SPECIFIC,
    );
  });
});
