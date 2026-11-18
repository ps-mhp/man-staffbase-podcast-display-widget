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
 * Was das Fenster „Podcast wählen“ vom Netz braucht: die Podcasts und, je
 * Podcast erst auf Nachfrage, seine Episoden – seitenweise.
 *
 * Gelesen wird über dieselben Quellen wie bisher im Dialog
 * (`podcastCatalogSource`, `fetchEpisodesPage`): dieselben Endpunkte,
 * dieselben Rechte der angemeldeten Person, dieselbe Kennzeichnung von
 * Podcasts aus einem anderen Space. Anders als `fetchEntityCatalog` schluckt
 * das Fenster einen Fehler aber nicht zu einer leeren Liste: es zeigt ihn und
 * bietet „Erneut versuchen“ an.
 */

import * as React from "react";
import type { EntityOption } from "@shared/entity-picker/entity-catalog";

import { podcastCatalogSource } from "./podcast-catalog";
import { fetchEpisodesPage } from "./podcast-client";
import type { EpisodeAudioResponse } from "./podcast-content";
import type { EpisodeList, EpisodeLoads, Loadable } from "./podcast-tree";

export interface PodcastCatalogLoaders {
  loadPodcasts: () => Promise<EntityOption[]>;
  loadEpisodes: (podcastId: string, cursor?: string) => Promise<EpisodeAudioResponse>;
}

async function loadPodcastOptions(): Promise<EntityOption[]> {
  const entries = await podcastCatalogSource.fetchList();
  const options = await Promise.all(entries.map((entry) => podcastCatalogSource.toOption(entry)));
  return options.filter((option): option is EntityOption => option !== null);
}

export const DEFAULT_CATALOG_LOADERS: PodcastCatalogLoaders = {
  loadPodcasts: loadPodcastOptions,
  loadEpisodes: (podcastId, cursor) => fetchEpisodesPage(podcastId, cursor),
};

export interface CatalogState {
  podcasts: Loadable<readonly EntityOption[]>;
  episodes: EpisodeLoads;
}

export type CatalogAction =
  | { type: "podcasts"; value: Loadable<readonly EntityOption[]> }
  | { type: "episodes"; podcastId: string; value: Loadable<EpisodeList> }
  | { type: "more"; podcastId: string; more: "loading" | "error" }
  | { type: "page"; podcastId: string; page: EpisodeAudioResponse };

export const INITIAL_CATALOG: CatalogState = { podcasts: { status: "loading" }, episodes: {} };

function withList(state: CatalogState, podcastId: string, update: (list: EpisodeList) => EpisodeList): CatalogState {
  const load = state.episodes[podcastId];
  if (load?.status !== "ready") return state;
  return { ...state, episodes: { ...state.episodes, [podcastId]: { status: "ready", value: update(load.value) } } };
}

/** Rein und unveränderlich: jeder Schritt liefert einen neuen Stand. */
export function catalogReducer(state: CatalogState, action: CatalogAction): CatalogState {
  switch (action.type) {
    case "podcasts":
      return { ...state, podcasts: action.value };
    case "episodes":
      return { ...state, episodes: { ...state.episodes, [action.podcastId]: action.value } };
    case "more":
      return withList(state, action.podcastId, (list) => ({ ...list, more: action.more }));
    case "page":
      return withList(state, action.podcastId, (list) => ({
        episodes: [...list.episodes, ...action.page.data],
        nextCursor: action.page.nextCursor,
      }));
  }
}

export interface PodcastCatalog extends CatalogState {
  reloadPodcasts: () => void;
  /** Lädt die erste Seite, falls noch nicht geschehen oder gescheitert. */
  loadEpisodes: (podcastId: string) => void;
  loadMoreEpisodes: (podcastId: string) => void;
}

/** Ein `dispatch`, der nach dem Abbau nichts mehr tut: späte Antworten fallen still weg. */
function useAliveDispatch(dispatch: React.Dispatch<CatalogAction>): React.Dispatch<CatalogAction> {
  const alive = React.useRef(false);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return React.useCallback(
    (action: CatalogAction) => {
      if (alive.current) dispatch(action);
    },
    [dispatch],
  );
}

/** Der jüngste Stand für die Handler, damit sie nicht doppelt laden. Gelesen nur in Handlern, nie beim Rendern. */
function useLatest<T>(value: T): React.RefObject<T> {
  const latest = React.useRef(value);
  React.useLayoutEffect(() => {
    latest.current = value;
  }, [value]);
  return latest;
}

export function usePodcastCatalog(loaders: PodcastCatalogLoaders = DEFAULT_CATALOG_LOADERS): PodcastCatalog {
  const [state, rawDispatch] = React.useReducer(catalogReducer, INITIAL_CATALOG);
  const dispatch = useAliveDispatch(rawDispatch);
  const latest = useLatest(state);

  const reloadPodcasts = React.useCallback(() => {
    dispatch({ type: "podcasts", value: { status: "loading" } });
    loaders.loadPodcasts().then(
      (value) => dispatch({ type: "podcasts", value: { status: "ready", value } }),
      () => dispatch({ type: "podcasts", value: { status: "error" } }),
    );
  }, [loaders, dispatch]);

  React.useEffect(reloadPodcasts, [reloadPodcasts]);

  const requested = React.useRef(new Set<string>());
  const loadEpisodes = React.useCallback(
    (podcastId: string) => {
      const load = latest.current.episodes[podcastId];
      if (requested.current.has(podcastId) && load?.status !== "error") return;
      requested.current.add(podcastId);
      dispatch({ type: "episodes", podcastId, value: { status: "loading" } });
      loaders.loadEpisodes(podcastId).then(
        ({ data, nextCursor }) => {
          const value = { episodes: data, nextCursor };
          dispatch({ type: "episodes", podcastId, value: { status: "ready", value } });
        },
        () => dispatch({ type: "episodes", podcastId, value: { status: "error" } }),
      );
    },
    [loaders, dispatch],
  );

  const loadMoreEpisodes = React.useCallback(
    (podcastId: string) => {
      const load = latest.current.episodes[podcastId];
      if (load?.status !== "ready" || load.value.nextCursor === undefined || load.value.more === "loading") return;
      dispatch({ type: "more", podcastId, more: "loading" });
      loaders.loadEpisodes(podcastId, load.value.nextCursor).then(
        (page) => dispatch({ type: "page", podcastId, page }),
        () => dispatch({ type: "more", podcastId, more: "error" }),
      );
    },
    [loaders, dispatch],
  );

  return { ...state, reloadPodcasts, loadEpisodes, loadMoreEpisodes };
}
