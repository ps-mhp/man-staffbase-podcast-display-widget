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
 * The short form marking AI-generated content, per language.
 *
 * Every entry is the abbreviation that language actually uses, not a
 * translation of the English one: German writes out "künstliche Intelligenz"
 * and abbreviates it "KI", the Romance languages invert the word order and
 * arrive at "IA". Dutch and Polish use the English "AI" in practice, so they
 * keep it rather than being given a coined native form nobody writes.
 *
 * One entry per language the Staffbase branch is configured for, matching
 * `PODCAST_ACCESS_HELP_TRANSLATIONS`.
 */
export const AI_LABELS: Record<string, string> = {
  de_DE: "KI",
  en_US: "AI",
  es_ES: "IA",
  fr_FR: "IA",
  it_IT: "IA",
  nl_NL: "AI",
  pl_PL: "AI",
};

/** The label shown when no locale matches — the term with the widest reach. */
export const AI_LABEL_FALLBACK = "AI";

/**
 * The AI label in the reader's language.
 *
 * Same fallback chain as `pickPodcastAccessHelpText`: the exact locale, then
 * the language part alone (`de_AT` takes `de_DE`'s "KI"), then the fallback.
 */
export function pickAiLabel(locales: string[]): string {
  for (const locale of locales) {
    const exact = AI_LABELS[locale];
    if (exact) return exact;
  }

  for (const locale of locales) {
    const language = locale.split("_")[0].toLowerCase();
    const key = Object.keys(AI_LABELS).find((candidate) => candidate.split("_")[0].toLowerCase() === language);
    if (key) return AI_LABELS[key];
  }

  return AI_LABEL_FALLBACK;
}
