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

import { PODCAST_ACCESS_HELP_TRANSLATIONS, pickPodcastAccessHelpText } from "./podcast-access-help-translations";

describe("PODCAST_ACCESS_HELP_TRANSLATIONS", () => {
  it("carries an entry for every language this branch is configured for", () => {
    // Verified live against this branch's `config.availableLocales` — see the
    // module comment. Kept as a literal list here (not a re-derivation of the
    // dictionary's own keys) so an accidental deletion of one entry fails
    // this test instead of silently shrinking the covered languages.
    const systemLocales = ["it_IT", "pl_PL", "en_US", "es_ES", "fr_FR", "de_DE", "nl_NL", "pt_PT"];

    for (const locale of systemLocales) {
      expect(PODCAST_ACCESS_HELP_TRANSLATIONS[locale]).toBeDefined();
    }
  });

  it("gives every entry a non-empty link, title, close label and at least one body paragraph", () => {
    for (const text of Object.values(PODCAST_ACCESS_HELP_TRANSLATIONS)) {
      expect(text.linkText.trim()).not.toBe("");
      expect(text.episodesUnavailableLabel.trim()).not.toBe("");
      expect(text.title.trim()).not.toBe("");
      expect(text.close.trim()).not.toBe("");
      expect(text.body.length).toBeGreaterThan(0);
      text.body.forEach((paragraph) => expect(paragraph.trim()).not.toBe(""));
      expect(text.resolveStepsTitle.trim()).not.toBe("");
      expect(text.resolveSteps.length).toBeGreaterThan(0);
      text.resolveSteps.forEach((step) => expect(step.trim()).not.toBe(""));
    }
  });
});

describe("pickPodcastAccessHelpText", () => {
  it("picks the exact locale when it is in the dictionary", () => {
    expect(pickPodcastAccessHelpText(["fr_FR"])).toBe(PODCAST_ACCESS_HELP_TRANSLATIONS.fr_FR);
  });

  it("tries locales in order, exact match first", () => {
    expect(pickPodcastAccessHelpText(["xx_XX", "pt_PT"])).toBe(PODCAST_ACCESS_HELP_TRANSLATIONS.pt_PT);
  });

  it("falls back to the language part of a locale not in the dictionary verbatim", () => {
    expect(pickPodcastAccessHelpText(["en_GB"])).toBe(PODCAST_ACCESS_HELP_TRANSLATIONS.en_US);
  });

  it("falls back to en_US when nothing matches at all", () => {
    expect(pickPodcastAccessHelpText(["xx_XX"])).toBe(PODCAST_ACCESS_HELP_TRANSLATIONS.en_US);
  });

  it("falls back to en_US for an empty locale list", () => {
    expect(pickPodcastAccessHelpText([])).toBe(PODCAST_ACCESS_HELP_TRANSLATIONS.en_US);
  });
});
