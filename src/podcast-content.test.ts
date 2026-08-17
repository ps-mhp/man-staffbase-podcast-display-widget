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

import { readPodcastId, readEpisodeId, documentLocales, pickLocalizedTitle } from "./podcast-content";

describe("readPodcastId", () => {
  it("accepts a 24-digit hex id and trims it", () => {
    expect(readPodcastId("  6a6ae5e1d64a8c30f478a339 ")).toBe("6a6ae5e1d64a8c30f478a339");
  });

  it("rejects anything that is not such an id", () => {
    expect(readPodcastId("")).toBeNull();
    expect(readPodcastId("nope")).toBeNull();
    expect(readPodcastId("6a6ae5e1d64a8c30f478a3")).toBeNull();
    expect(readPodcastId(undefined)).toBeNull();
    expect(readPodcastId(42)).toBeNull();
  });

  it("reads the id out of a pasted podcast url", () => {
    expect(readPodcastId("https://www.onetruck.man/content/ai-podcast/6a6ae5e1d64a8c30f478a339")).toBe(
      "6a6ae5e1d64a8c30f478a339",
    );
  });
});

describe("readEpisodeId", () => {
  it("accepts a 36-char episode uuid", () => {
    expect(readEpisodeId("  8398abc1-c638-4175-bed1-e47809b22931 ")).toBe(
      "8398abc1-c638-4175-bed1-e47809b22931",
    );
  });

  it("rejects anything that is not such an id", () => {
    expect(readEpisodeId("")).toBeNull();
    expect(readEpisodeId("nope")).toBeNull();
    expect(readEpisodeId(undefined)).toBeNull();
    expect(readEpisodeId(42)).toBeNull();
  });

  it("reads the id out of a pasted audio url", () => {
    expect(
      readEpisodeId(
        "/api/ai-podcast/6a6ae5e1d64a8c30f478a339/episode-audio/8398abc1-c638-4175-bed1-e47809b22931/audio.mp3",
      ),
    ).toBe("8398abc1-c638-4175-bed1-e47809b22931");
  });
});

describe("documentLocales", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("lang");
    document.head.innerHTML = "";
  });

  it("prefers the document language over the browser language", () => {
    document.documentElement.setAttribute("lang", "fr-FR");
    expect(documentLocales()[0]).toBe("fr_FR");
  });

  it("falls back to the content-language meta tag", () => {
    document.head.innerHTML = '<meta http-equiv="content-language" content="it-IT">';
    expect(documentLocales()).toContain("it_IT");
  });

  it("always ends up with the browser language and no duplicates", () => {
    document.documentElement.setAttribute("lang", navigator.language);
    const locales = documentLocales();
    expect(new Set(locales).size).toBe(locales.length);
    expect(locales.length).toBeGreaterThan(0);
  });
});

describe("pickLocalizedTitle", () => {
  const translations = { de_DE: "Zündung Podcast II", en_US: "Ignition Podcast II" };

  it("takes the exact locale match", () => {
    expect(pickLocalizedTitle(translations, "Ignition Podcast II", ["de_DE"])).toBe("Zündung Podcast II");
  });

  it("matches on the language part alone", () => {
    expect(pickLocalizedTitle(translations, "Ignition Podcast II", ["de_AT"])).toBe("Zündung Podcast II");
  });

  it("falls back to episodeTitle rather than an unrelated translation", () => {
    expect(pickLocalizedTitle(translations, "Ignition Podcast II", ["es_ES"])).toBe("Ignition Podcast II");
  });

  it("falls back to episodeTitle when there are no translations at all", () => {
    expect(pickLocalizedTitle(undefined, "Ignition Podcast II", ["de_DE"])).toBe("Ignition Podcast II");
    expect(pickLocalizedTitle({}, "Ignition Podcast II", ["de_DE"])).toBe("Ignition Podcast II");
  });
});
