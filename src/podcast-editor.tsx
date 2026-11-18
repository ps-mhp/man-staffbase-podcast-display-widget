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
 * Der Rumpf des Fensters „Podcast einstellen“ im gemeinsamen Rahmen von
 * `@man/config-ui`: links der Baum, in der Mitte das Formular – Kopf mit dem
 * gewählten Podcast, Anzeige, Player –, in den Geräteansichten die Vorschau.
 *
 * Nur im Studio nachgeladen (`podcast-dialog.tsx`): er bringt react-aria und
 * Tailwind mit, und das hat im Seitenbündel, das jede Leserin lädt, nichts
 * verloren. Kopf, Übernehmen, Rückgängig und Rückfrage kommen vom Rahmen.
 */

import * as React from "react";
import { ConfigWorkspace } from "@man/config-ui/layout/config-workspace";

import { DEFAULT_CATALOG_LOADERS, PodcastCatalog, PodcastCatalogLoaders, usePodcastCatalog } from "./podcast-catalog-state";
import type { PodcastConfig } from "./podcast-config";
import { documentLocales } from "./podcast-content";
import { DisplaySection, ManualIdsSection, PlayerSection, PodcastHeading } from "./podcast-editor-sections";
import { PodcastPreview } from "./podcast-preview";
import { PodcastSidebar } from "./podcast-sidebar";
import { applyTreeTarget, episodeTitle, parseNodeId, podcastNodeId } from "./podcast-tree";

export interface PodcastEditorProps {
  value: PodcastConfig;
  onChange: (value: PodcastConfig) => void;
  /** Woher Podcasts und Episoden kommen; offengelegt für Tests. */
  loaders?: PodcastCatalogLoaders;
}

function isUnusable(catalog: PodcastCatalog, podcastId: string): boolean {
  const { podcasts } = catalog;
  return podcasts.status === "ready" && podcasts.value.some((option) => option.id === podcastId && option.disabled === true);
}

/**
 * Aufklappen und Auswahl im Baum. Beides lädt die Episoden des Podcasts nach;
 * ein gewählter Podcast klappt auch gleich auf, damit man seine Episoden sieht.
 */
function useTreeNavigation(value: PodcastConfig, onChange: (value: PodcastConfig) => void, catalog: PodcastCatalog) {
  const { loadEpisodes, loadMoreEpisodes } = catalog;
  const [expandedIds, setExpandedIds] = React.useState<string[]>(() =>
    value.podcastId === "" ? [] : [podcastNodeId(value.podcastId)],
  );

  // Der gewählte Podcast – auch einer von Hand eingetragene – lädt seine Episoden gleich mit.
  React.useEffect(() => {
    if (value.podcastId !== "") loadEpisodes(value.podcastId);
  }, [value.podcastId, loadEpisodes]);

  const expand = (ids: string[]): void => {
    setExpandedIds(ids);
    for (const target of ids.map(parseNodeId)) {
      if (target.kind === "podcast") loadEpisodes(target.podcastId);
    }
  };

  const select = (nodeId: string): void => {
    const target = parseNodeId(nodeId);
    if (target.kind === "retry") {
      loadEpisodes(target.podcastId);
      return;
    }
    if (target.kind === "more") {
      loadMoreEpisodes(target.podcastId);
      return;
    }
    if (target.kind === "podcast") {
      // Aus einem anderen Space: sichtbar, aber nicht wählbar – wie bisher in der Auswahlliste.
      if (isUnusable(catalog, target.podcastId)) return;
      setExpandedIds((ids) => (ids.includes(nodeId) ? ids : [...ids, nodeId]));
    }
    const next = applyTreeTarget(value, target);
    if (next !== value) onChange(next);
  };

  return { expandedIds, expand, select };
}

interface Labels {
  /** Titel des gewählten Podcasts, sonst seine ID. */
  podcastTitle: string;
  /** Woher der Podcast kommt, für die Zeile neben dem Titel. */
  podcastKicker: string;
  /** Titel der gewählten Episode, sonst ihre ID; leer ohne Wahl. */
  episodeLabel: string;
}

function kickerOf(catalog: PodcastCatalog, listed: boolean): string {
  if (catalog.podcasts.status !== "ready") return "Podcast";
  return listed ? "Podcast · links gewählt" : "Podcast · nicht in der Liste";
}

/** Was im Formular zum Ablesen steht: Titel, wo bekannt, sonst die ID. */
function useLabels(value: PodcastConfig, catalog: PodcastCatalog): Labels {
  const { podcasts, episodes } = catalog;
  const locales = React.useMemo(() => documentLocales(), []);
  const podcast = podcasts.status === "ready" ? podcasts.value.find((option) => option.id === value.podcastId) : undefined;
  const load = episodes[value.podcastId];
  const episode =
    load?.status === "ready" ? load.value.episodes.find((item) => item.episodeId === value.episodeId) : undefined;
  return {
    podcastTitle: podcast?.title ?? value.podcastId,
    podcastKicker: kickerOf(catalog, podcast !== undefined),
    episodeLabel: episode === undefined ? (value.episodeId ?? "") : episodeTitle(episode, locales),
  };
}

export function PodcastEditor({ value, onChange, loaders = DEFAULT_CATALOG_LOADERS }: PodcastEditorProps): React.ReactElement {
  const catalog = usePodcastCatalog(loaders);
  const { expandedIds, expand, select } = useTreeNavigation(value, onChange, catalog);
  const labels = useLabels(value, catalog);

  return (
    <ConfigWorkspace
      sidebar={
        <PodcastSidebar
          catalog={catalog}
          config={value}
          expandedIds={expandedIds}
          onExpandedChange={expand}
          onSelect={select}
        />
      }
      preview={<PodcastPreview config={value} />}
    >
      <div className="flex max-w-[720px] flex-col gap-8 px-10 pt-6 pb-12" data-testid="podcast-editor">
        <PodcastHeading value={value} title={labels.podcastTitle} kicker={labels.podcastKicker} />
        <DisplaySection value={value} onChange={onChange} episodeLabel={labels.episodeLabel} detailed />
        <PlayerSection value={value} onChange={onChange} detailed />
        <ManualIdsSection value={value} onChange={onChange} />
      </div>
    </ConfigWorkspace>
  );
}
