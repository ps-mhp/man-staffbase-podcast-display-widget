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
 * Der Baum links im Fenster „Podcast wählen“: Podcasts als Ordner, ihre
 * Episoden darin – als reine Funktionen, damit sich ohne DOM prüfen lässt,
 * was wo steht und was eine Auswahl bewirkt.
 *
 * Episoden kommen erst, wenn ein Podcast aufgeklappt oder gewählt wird; bis
 * dahin steht im Ordner eine Zeile „wird geladen“. Ein leerer Ordner hätte
 * keinen Pfeil (`ItemTree`), und ohne Pfeil gäbe es nichts, was das Laden
 * auslöst. Laden, Fehler, „keine Episoden“ und „weitere laden“ sind eigene
 * Zeilen: wählbar, aber sie ändern die Konfiguration nicht, sondern lösen
 * höchstens ein erneutes Laden aus.
 *
 * Symbole wie im Screen: ein Mikrofon für den Podcast, Play für die Episode.
 * Die Suche über dem Baum ({@link filterPodcastTree}) arbeitet auf denselben
 * Knoten.
 */

import { Info, LoaderCircle, Mic, Play, RotateCw } from "lucide-react";
import type { TreeNode } from "@man/config-ui/sidebar/reorder";
import type { EntityOption } from "@shared/entity-picker/entity-catalog";

import type { PodcastConfig } from "./podcast-config";
import { Episode, pickLocalizedTitle } from "./podcast-content";

/** Etwas, das geladen wird. */
export type Loadable<T> = { status: "loading" } | { status: "error" } | { status: "ready"; value: T };

/** Die bisher geladenen Seiten der Episoden eines Podcasts. */
export interface EpisodeList {
  episodes: readonly Episode[];
  /** Gesetzt, solange es weitere Seiten gibt. */
  nextCursor?: string;
  /** Zustand der nächsten Seite, solange sie nachgeladen wird oder daran scheiterte. */
  more?: "loading" | "error";
}

/** Je Podcast-ID; fehlt ein Eintrag, wurde noch nicht geladen. */
export type EpisodeLoads = Readonly<Record<string, Loadable<EpisodeList>>>;

export type TreeTarget =
  | { kind: "podcast"; podcastId: string }
  | { kind: "episode"; podcastId: string; episodeId: string }
  | { kind: "retry"; podcastId: string }
  | { kind: "more"; podcastId: string }
  | { kind: "status" };

export const podcastNodeId = (podcastId: string): string => `podcast:${podcastId}`;
export const episodeNodeId = (podcastId: string, episodeId: string): string => `episode:${podcastId}:${episodeId}`;

/** Was eine Zeile meint. IDs sind Hex bzw. UUIDs, ein `:` kommt darin nicht vor. */
export function parseNodeId(id: string): TreeTarget {
  const [kind, podcastId = "", episodeId = ""] = id.split(":");
  if (podcastId === "") return { kind: "status" };
  if (kind === "podcast" || kind === "retry" || kind === "more") return { kind, podcastId };
  if (kind === "episode" && episodeId !== "") return { kind, podcastId, episodeId };
  return { kind: "status" };
}

const OTHER_SPACE = "Anderer Space – hier nicht nutzbar";

/** Das Datum einer Episode in deutscher Schreibweise; der Rohwert, wenn es keins ist. */
export function formatEpisodeDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  return Number.isNaN(date.getTime()) ? publishedAt : date.toLocaleDateString("de-DE");
}

export function episodeTitle(episode: Episode, locales: readonly string[]): string {
  return pickLocalizedTitle(episode.titleTranslations, episode.episodeTitle, [...locales]);
}

function statusNode(podcastId: string, label: string, loading: boolean): TreeNode {
  return { id: `status:${podcastId}`, label, icon: loading ? LoaderCircle : Info };
}

function moreNode(podcastId: string, more: EpisodeList["more"]): TreeNode {
  if (more === "loading") return { id: `status:${podcastId}`, label: "Weitere werden geladen …", icon: LoaderCircle };
  const label = more === "error" ? "Weitere nicht geladen – erneut versuchen" : "Weitere Episoden laden";
  return { id: `more:${podcastId}`, label, icon: RotateCw, invalid: more === "error" };
}

/** Die gewählte Episode, solange sie nicht unter den geladenen Seiten ist – sonst fände man die Auswahl nicht. */
function missingEpisode(podcastId: string, list: EpisodeList, config: PodcastConfig): TreeNode[] {
  const { episodeId } = config;
  if (config.podcastId !== podcastId || episodeId === undefined) return [];
  if (list.episodes.some((episode) => episode.episodeId === episodeId)) return [];
  return [{ id: episodeNodeId(podcastId, episodeId), label: episodeId, description: "Gewählte Episode", icon: Play }];
}

interface ChildrenInput {
  podcastId: string;
  load: Loadable<EpisodeList> | undefined;
  config: PodcastConfig;
  locales: readonly string[];
}

function episodeChildren({ podcastId, load, config, locales }: ChildrenInput): TreeNode[] {
  if (load === undefined || load.status === "loading") return [statusNode(podcastId, "Episoden werden geladen …", true)];
  if (load.status === "error") {
    return [{ id: `retry:${podcastId}`, label: "Episoden nicht geladen", description: "Erneut versuchen", icon: RotateCw, invalid: true }];
  }
  const list = load.value;
  const episodes = list.episodes.map((episode) => ({
    id: episodeNodeId(podcastId, episode.episodeId),
    label: episodeTitle(episode, locales),
    description: formatEpisodeDate(episode.publishedAt),
    icon: Play,
  }));
  const tail = list.nextCursor === undefined ? [] : [moreNode(podcastId, list.more)];
  const all = [...missingEpisode(podcastId, list, config), ...episodes, ...tail];
  return all.length > 0 ? all : [statusNode(podcastId, "Noch keine Episoden", false)];
}

/**
 * Die Unterzeile eines Podcasts: „Podcast · 12 Episoden“, sobald seine
 * Episoden geladen sind. Gibt es weitere Seiten, ist die Zahl ein Mindestwert.
 */
export function podcastDescription(load: Loadable<EpisodeList> | undefined): string {
  if (load?.status !== "ready") return "Podcast";
  const { episodes, nextCursor } = load.value;
  if (nextCursor !== undefined) return `Podcast · ${episodes.length}+ Episoden`;
  if (episodes.length === 0) return "Podcast · noch keine Episoden";
  return `Podcast · ${episodes.length} ${episodes.length === 1 ? "Episode" : "Episoden"}`;
}

export interface PodcastTreeInput {
  podcasts: readonly EntityOption[];
  episodes: EpisodeLoads;
  config: PodcastConfig;
  locales: readonly string[];
}

/**
 * Der ganze Baum. Ein Podcast aus einem anderen Space bleibt sichtbar, aber
 * ohne Episoden – wie zuvor in der Auswahlliste des Dialogs, wo er grau
 * stand: er existiert, nützt von hier aus aber nichts.
 */
export function buildPodcastTree({ podcasts, episodes, config, locales }: PodcastTreeInput): TreeNode[] {
  const nodeOf = (id: string, label: string, description = podcastDescription(episodes[id])): TreeNode => ({
    id: podcastNodeId(id),
    label,
    description,
    icon: Mic,
    children: episodeChildren({ podcastId: id, load: episodes[id], config, locales }),
  });
  const listed = podcasts.map((option) =>
    option.disabled === true
      ? { id: podcastNodeId(option.id), label: option.title, description: OTHER_SPACE, icon: Mic }
      : nodeOf(option.id, option.title),
  );
  const known = config.podcastId === "" || podcasts.some((option) => option.id === config.podcastId);
  return known ? listed : [nodeOf(config.podcastId, config.podcastId, "Nicht in der Liste"), ...listed];
}

/** Was die Suche übrig lässt, und welche Podcasts dafür offen stehen müssen. */
export interface FilteredTree {
  nodes: TreeNode[];
  /** Podcasts, die nur über Episoden passen: aufgeklappt, sonst sähe man die Treffer nicht. */
  expand: string[];
}

const normalize = (text: string): string => text.trim().toLocaleLowerCase("de");

/**
 * Filtert den Baum nach Titeln. Passt ein Podcast, bleibt er mit allem, was
 * darin steht; passen nur Episoden, bleibt er mit genau diesen. Gesucht wird
 * in den geladenen Episoden – Zustandszeilen („wird geladen“) zählen nicht.
 */
export function filterPodcastTree(nodes: readonly TreeNode[], query: string): FilteredTree {
  const needle = normalize(query);
  if (needle === "") return { nodes: [...nodes], expand: [] };
  const matches = (node: TreeNode): boolean => normalize(node.label).includes(needle);
  const kept: TreeNode[] = [];
  const expand: string[] = [];
  for (const node of nodes) {
    if (matches(node)) {
      kept.push(node);
      continue;
    }
    const episodes = (node.children ?? []).filter((child) => parseNodeId(child.id).kind === "episode" && matches(child));
    if (episodes.length > 0) {
      kept.push({ ...node, children: episodes });
      expand.push(node.id);
    }
  }
  return { nodes: kept, expand };
}

/** Die Zeile, die die Konfiguration zeigt: die Episode nur im Modus „Bestimmte“. */
export function selectedNodeId(config: PodcastConfig): string | null {
  if (config.podcastId === "") return null;
  if (config.mode === "specific" && config.episodeId !== undefined) {
    return episodeNodeId(config.podcastId, config.episodeId);
  }
  return podcastNodeId(config.podcastId);
}

/**
 * Was eine Auswahl im Baum aus der Konfiguration macht. Unverändert heisst
 * dasselbe Objekt: so legt eine Auswahl ohne Wirkung keinen leeren Schritt im
 * Verlauf an.
 */
export function applyTreeTarget(config: PodcastConfig, target: TreeTarget): PodcastConfig {
  if (target.kind === "episode") {
    return { ...config, podcastId: target.podcastId, mode: "specific", episodeId: target.episodeId };
  }
  if (target.kind !== "podcast" || target.podcastId === config.podcastId) return config;
  // Eine Episode gehört zu ihrem Podcast; beim Wechsel fällt sie weg.
  return { podcastId: target.podcastId, mode: config.mode, size: config.size };
}
