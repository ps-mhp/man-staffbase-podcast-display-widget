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

import React from "react";

import { fetchLatestEpisode, fetchEpisodeById } from "./podcast-client";
import { Episode, documentLocales, pickLocalizedTitle } from "./podcast-content";
import { ensureStyles } from "./styles";

const MISSING_PODCAST_ID =
  "Keine Podcast-ID konfiguriert. Bitte die ID des Podcasts in den Widget-Einstellungen eintragen.";
const MISSING_EPISODE_ID =
  'Modus "Bestimmte Episode" ausgewählt, aber keine Episode-ID konfiguriert. ' +
  "Bitte die ID der Episode in den Widget-Einstellungen eintragen.";

/** Display mode, mirrored from the `display-mode` configuration field. */
export type DisplayMode = "latest" | "specific";

/** What the view knows at any moment. */
type State =
  | { status: "loading" }
  | { status: "ready"; episode: Episode; title: string; date: string }
  | { status: "error"; message: string };

/** The publish date, formatted in the reader's language; the raw value if it cannot be parsed. */
function formatDate(publishedAt: string, locales: string[]): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;

  const locale = locales[0]?.replace("_", "-");
  return date.toLocaleDateString(locale);
}

/**
 * A single podcast episode, in the language of the reader.
 *
 * Every outcome is visible: loading, failure and the episode itself. A block
 * that silently renders nothing is indistinguishable from a broken widget,
 * and in the editor that is exactly where an author would be left guessing.
 */
export function PodcastView({
  podcastId,
  displayMode,
  episodeId,
}: {
  podcastId: string | null;
  displayMode: DisplayMode;
  episodeId: string | null;
}): React.JSX.Element {
  const [state, setState] = React.useState<State>({ status: "loading" });

  React.useEffect(() => {
    ensureStyles();

    if (podcastId === null) {
      setState({ status: "error", message: MISSING_PODCAST_ID });
      return;
    }
    if (displayMode === "specific" && episodeId === null) {
      setState({ status: "error", message: MISSING_EPISODE_ID });
      return;
    }

    // A changed configuration makes the running request's answer the wrong
    // one; the flag keeps it from overwriting the newer state after the
    // component moved on.
    let current = true;
    setState({ status: "loading" });

    const request =
      displayMode === "specific" ? fetchEpisodeById(podcastId, episodeId as string) : fetchLatestEpisode(podcastId);

    request
      .then((episode) => {
        if (!current) return;
        const locales = documentLocales();
        setState({
          status: "ready",
          episode,
          title: pickLocalizedTitle(episode.titleTranslations, episode.episodeTitle, locales),
          date: formatDate(episode.publishedAt, locales),
        });
      })
      .catch((error: unknown) => {
        if (!current) return;
        const reason = error instanceof Error ? error.message : String(error);
        setState({ status: "error", message: `Podcast konnte nicht geladen werden: ${reason}` });
      });

    return () => {
      current = false;
    };
  }, [podcastId, displayMode, episodeId]);

  if (state.status === "loading") {
    return (
      <div className="podcast-display" data-testid="podcast-display">
        <p className="podcast-display__status">Episode wird geladen …</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="podcast-display" data-testid="podcast-display">
        <p className="podcast-display__error" role="alert">
          {state.message}
        </p>
      </div>
    );
  }

  const { episode, title, date } = state;
  return (
    <article className="podcast-display" data-testid="podcast-display">
      <img className="podcast-display__thumbnail" src={episode.thumbnailUrl} alt={title} />
      <p className="podcast-display__title">{title}</p>
      <p className="podcast-display__date">{date}</p>
      <audio className="podcast-display__audio" controls src={episode.url} />
    </article>
  );
}
