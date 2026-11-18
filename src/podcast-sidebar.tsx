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
 * Die linke Spalte im Fenster „Podcast einstellen“: oben die Suche, darunter
 * alle erreichbaren Podcasts als Ordner, darin ihre Episoden.
 *
 * Jeder Zustand ist zu sehen – Laden, Fehler mit „Erneut versuchen“, keine
 * Podcasts, keine Treffer. Eine stumm leere Spalte sähe aus wie ein kaputtes
 * Fenster.
 *
 * Die Suche findet Podcasts und Episoden. Damit sie Episoden auch in
 * zugeklappten Podcasts findet, lädt sie beim ersten Tippen die erste Seite
 * jedes nutzbaren Podcasts; Podcasts, die nur über Episoden passen, stehen
 * dabei offen.
 *
 * Unten steht kurz, warum ein Podcast fehlen kann; die ganze Erklärung öffnet
 * eine Seitenleiste rechts, damit der Baum stehen bleibt. Die Ursache liegt
 * fast immer in den Rechten des Space, nicht im Widget.
 */

import * as React from "react";
import { CircleHelp, Search } from "lucide-react";
import { FormSection } from "@man/config-ui/form/form-section";
import { Button } from "@man/config-ui/primitives/button";
import { Input } from "@man/config-ui/primitives/input";
import { useSidePanel } from "@man/config-ui/shell/side-panels";
import { ItemTree } from "@man/config-ui/sidebar/item-tree";
import { SidebarPanel } from "@man/config-ui/sidebar/sidebar-panel";
import type { EntityOption } from "@shared/entity-picker/entity-catalog";

import { PodcastAccessHelpText, pickPodcastAccessHelpText } from "./podcast-access-help-translations";
import type { PodcastCatalog } from "./podcast-catalog-state";
import type { PodcastConfig } from "./podcast-config";
import { documentLocales } from "./podcast-content";
import { buildPodcastTree, filterPodcastTree, selectedNodeId } from "./podcast-tree";

export interface PodcastSidebarProps {
  catalog: PodcastCatalog;
  config: PodcastConfig;
  expandedIds: readonly string[];
  onExpandedChange: (ids: string[]) => void;
  /** Bekommt die Kennung der gewählten Zeile; was sie bedeutet, weiss `parseNodeId`. */
  onSelect: (nodeId: string) => void;
}

const NOTE = "px-3 py-6 text-center text-[13px] text-muted-foreground";
const NO_PODCASTS: readonly EntityOption[] = [];
const SEARCH_LABEL = "Podcast oder Episode suchen";
const ACCESS_PANEL_ID = "podcast-access-help";

function RetryNote({ message, onRetry }: { message: string; onRetry: () => void }): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-3 px-3 py-6 text-center">
      <p role="alert" className="text-[13px] text-destructive">
        {message}
      </p>
      <Button type="button" variant="outline" size="sm" className="h-10" onClick={onRetry}>
        Erneut versuchen
      </Button>
    </div>
  );
}

interface SearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

/**
 * Das Suchfeld, beim Scrollen oben stehend. Escape leert es zuerst; erst ein
 * leeres Feld lässt Escape an den Rahmen, der dann schließt.
 */
function TreeSearch({ query, onQueryChange }: SearchProps): React.ReactElement {
  return (
    <div className="sticky top-0 z-10 -mx-2 bg-muted px-4 pb-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          aria-label={SEARCH_LABEL}
          placeholder={SEARCH_LABEL}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || query === "") return;
            event.preventDefault();
            onQueryChange("");
          }}
          className="h-10 bg-background pl-[38px]"
        />
      </div>
    </div>
  );
}

/** Lädt beim Suchen die erste Seite jedes nutzbaren Podcasts; schon Geladenes lädt `loadEpisodes` nicht noch einmal. */
function useEpisodesForSearch(catalog: PodcastCatalog, searching: boolean): void {
  const { podcasts, loadEpisodes } = catalog;
  React.useEffect(() => {
    if (!searching || podcasts.status !== "ready") return;
    for (const option of podcasts.value) {
      if (option.disabled !== true) loadEpisodes(option.id);
    }
  }, [searching, podcasts, loadEpisodes]);
}

interface TreeProps extends PodcastSidebarProps {
  query: string;
}

function PodcastTree({ catalog, config, expandedIds, onExpandedChange, onSelect, query }: TreeProps): React.ReactElement {
  const { podcasts, episodes, reloadPodcasts } = catalog;
  const options = podcasts.status === "ready" ? podcasts.value : NO_PODCASTS;
  const locales = React.useMemo(() => documentLocales(), []);
  const nodes = React.useMemo(
    () => buildPodcastTree({ podcasts: options, episodes, config, locales }),
    [options, episodes, config, locales],
  );
  const filtered = React.useMemo(() => filterPodcastTree(nodes, query), [nodes, query]);
  // Treffer in Episoden stehen offen, solange gesucht wird; gemerkt wird nur, was man selbst aufklappt.
  const expanded = React.useMemo(() => [...new Set([...expandedIds, ...filtered.expand])], [expandedIds, filtered.expand]);
  const handleExpanded = (ids: string[]): void =>
    onExpandedChange(ids.filter((id) => !filtered.expand.includes(id) || expandedIds.includes(id)));

  if (podcasts.status === "loading") {
    return (
      <p role="status" className={NOTE}>
        Podcasts werden geladen …
      </p>
    );
  }
  if (podcasts.status === "error") {
    return <RetryNote message="Die Podcasts konnten nicht geladen werden." onRetry={reloadPodcasts} />;
  }
  if (nodes.length === 0) {
    return <RetryNote message="Keine Podcasts gefunden, auf die dieses Konto zugreifen darf." onRetry={reloadPodcasts} />;
  }
  return (
    <ItemTree
      aria-label="Podcasts"
      nodes={filtered.nodes}
      selectedId={selectedNodeId(config)}
      onSelect={onSelect}
      expandedIds={expanded}
      onExpandedChange={handleExpanded}
      emptyState={`Nichts gefunden zu „${query.trim()}“`}
    />
  );
}

/** Warum ein Podcast fehlen kann – der Text, den bisher der Link unter der Auswahl öffnete. */
function AccessHelpBody({ text }: { text: PodcastAccessHelpText }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2 text-[13px] leading-normal text-muted-foreground" data-testid="podcast-access-hint">
      {text.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className="font-semibold text-foreground">{text.resolveStepsTitle}</p>
      <ol className="list-decimal pl-5">
        {text.resolveSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Der Fuß: ein Satz, was die Liste zeigt, und der Weg zur ganzen Erklärung.
 * Ohne Rahmen (es gibt keine Seitenleisten) klappt sie wie bisher hier auf.
 */
function AccessHint(): React.ReactElement {
  const text = React.useMemo(() => pickPodcastAccessHelpText(documentLocales()), []);
  const panels = useSidePanel();
  if (!panels.available) {
    return (
      <FormSection title={text.linkText} collapsible defaultOpen={false}>
        <AccessHelpBody text={text} />
      </FormSection>
    );
  }
  const open = (): void =>
    panels.open({ id: ACCESS_PANEL_ID, title: text.title, content: <div className="px-5 py-4"><AccessHelpBody text={text} /></div> });
  return (
    <div className="flex flex-col items-start gap-1 text-[13px] leading-[1.45] text-muted-foreground">
      <p>Die Liste zeigt die Podcasts, auf die dieses Konto zugreifen darf.</p>
      <Button type="button" variant="link" className="-ml-1 h-10 px-1 text-[13px] font-semibold" onClick={open}>
        <CircleHelp aria-hidden />
        {text.linkText}
      </Button>
    </div>
  );
}

export function PodcastSidebar(props: PodcastSidebarProps): React.ReactElement {
  const { catalog } = props;
  const { podcasts } = catalog;
  const [query, setQuery] = React.useState("");
  const ready = podcasts.status === "ready" && podcasts.value.length > 0;
  useEpisodesForSearch(catalog, query.trim() !== "");
  return (
    <SidebarPanel
      title="Podcasts"
      count={podcasts.status === "ready" ? podcasts.value.length : undefined}
      footer={<AccessHint />}
    >
      {ready && <TreeSearch query={query} onQueryChange={setQuery} />}
      <PodcastTree {...props} query={query} />
    </SidebarPanel>
  );
}
