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
 * Prüfung und Status des Fensters „Podcast einstellen“.
 *
 * Liegt im Seitenbündel, nicht beim nachgeladenen Editor: der Rahmen braucht
 * beides schon, bevor der Editor da ist. Darum nur reine Funktionen, nichts
 * aus `@man/config-ui` ausser Typen.
 */

import type { ValidationIssue } from "@man/config-ui/shell/shell-context";

import type { PodcastConfig } from "./podcast-config";

export const PODCAST_ISSUE = "podcast";
export const EPISODE_ISSUE = "episode";

/**
 * Was fehlt, damit die Seite etwas abspielen kann. Ohne Podcast zeigte die
 * Seite nur eine Fehlermeldung, ohne Episode im Modus „Bestimmte“ ebenso.
 */
export function validatePodcastConfig(config: PodcastConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (config.podcastId === "") issues.push({ id: PODCAST_ISSUE, message: "Podcast auswählen" });
  if (config.mode === "specific" && config.episodeId === undefined) {
    issues.push({ id: EPISODE_ISSUE, message: "Episode auswählen" });
  }
  return issues;
}

function joinGerman(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`;
}

/** Was sich gegenüber dem übernommenen Stand geändert hat, etwa „Podcast und Player geändert“. */
export function podcastChangesStatus(draft: PodcastConfig, saved: PodcastConfig): string | undefined {
  const changed = [
    draft.podcastId !== saved.podcastId && "Podcast",
    (draft.mode !== saved.mode || draft.episodeId !== saved.episodeId) && "Episode",
    draft.size !== saved.size && "Player",
  ].filter((part): part is string => part !== false);
  return changed.length === 0 ? undefined : `${joinGerman(changed)} geändert`;
}
