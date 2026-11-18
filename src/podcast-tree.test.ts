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

import type { TreeNode } from "@man/config-ui/sidebar/reorder";

import type { PodcastConfig } from "./podcast-config";
import type { Episode } from "./podcast-content";
import {
  EpisodeLoads,
  applyTreeTarget,
  buildPodcastTree,
  episodeNodeId,
  filterPodcastTree,
  parseNodeId,
  podcastDescription,
  podcastNodeId,
  selectedNodeId,
} from "./podcast-tree";

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const E1 = "11111111-1111-1111-1111-111111111111";
const E2 = "22222222-2222-2222-2222-222222222222";

const episode = (episodeId: string, title: string): Episode => ({
  episodeId,
  episodeTitle: title,
  publishedAt: "2026-11-03T08:00:00Z",
  thumbnailUrl: "",
  url: `https://cdn.example.test/${episodeId}.mp3`,
});

const LATEST: PodcastConfig = { podcastId: A, mode: "latest", size: "large" };
const PODCASTS = [
  { id: A, title: "Werkfunk" },
  { id: B, title: "Fremder Space", disabled: true },
];

const labels = (nodes: readonly TreeNode[] | undefined): string[] => (nodes ?? []).map((node) => node.label);

function tree(episodes: EpisodeLoads, config: PodcastConfig = LATEST): TreeNode[] {
  return buildPodcastTree({ podcasts: PODCASTS, episodes, config, locales: ["de_DE"] });
}

describe("Knotenkennungen", () => {
  it("unterscheiden Podcast, Episode und die Zustandszeilen", () => {
    expect(parseNodeId(podcastNodeId(A))).toEqual({ kind: "podcast", podcastId: A });
    expect(parseNodeId(episodeNodeId(A, E1))).toEqual({ kind: "episode", podcastId: A, episodeId: E1 });
    expect(parseNodeId(`retry:${A}`)).toEqual({ kind: "retry", podcastId: A });
    expect(parseNodeId(`more:${A}`)).toEqual({ kind: "more", podcastId: A });
    expect(parseNodeId(`status:${A}`)).toEqual({ kind: "status" });
    expect(parseNodeId("unsinn")).toEqual({ kind: "status" });
  });
});

describe("buildPodcastTree", () => {
  it("zeigt Podcasts als Ordner, deren Episoden noch nicht geladen sind", () => {
    const [own, foreign] = tree({});

    expect(own.label).toBe("Werkfunk");
    // Ein Platzhalter, damit der Ordner einen Pfeil hat: ein leerer Ordner
    // liesse sich nicht aufklappen, und erst Aufklappen lädt.
    expect(labels(own.children)).toEqual(["Episoden werden geladen …"]);
    // Ein Podcast aus einem anderen Space bleibt sichtbar, aber ohne Episoden.
    expect(foreign.children).toBeUndefined();
    expect(foreign.description).toBe("Anderer Space – hier nicht nutzbar");
  });

  it("zeigt geladene Episoden mit Datum und bietet weitere Seiten an", () => {
    const [own] = tree({
      [A]: { status: "ready", value: { episodes: [episode(E1, "Folge 1"), episode(E2, "Folge 2")], nextCursor: "c2" } },
    });

    expect(labels(own.children)).toEqual(["Folge 1", "Folge 2", "Weitere Episoden laden"]);
    expect(own.children?.[0]).toMatchObject({ id: episodeNodeId(A, E1), description: "3.11.2026" });
    expect(own.children?.[2].id).toBe(`more:${A}`);
  });

  it("meldet Laden, Fehler und leere Podcasts als eigene Zeile", () => {
    expect(labels(tree({ [A]: { status: "loading" } })[0].children)).toEqual(["Episoden werden geladen …"]);
    expect(tree({ [A]: { status: "error" } })[0].children).toEqual([
      expect.objectContaining({ id: `retry:${A}`, label: "Episoden nicht geladen", invalid: true }),
    ]);
    expect(labels(tree({ [A]: { status: "ready", value: { episodes: [] } } })[0].children)).toEqual([
      "Noch keine Episoden",
    ]);
  });

  it("zeigt beim Nachladen und nach einem Fehler beim Nachladen den Zustand am Ende", () => {
    const value = { episodes: [episode(E1, "Folge 1")], nextCursor: "c2" };

    expect(labels(tree({ [A]: { status: "ready", value: { ...value, more: "loading" } } })[0].children)).toContain(
      "Weitere werden geladen …",
    );
    expect(labels(tree({ [A]: { status: "ready", value: { ...value, more: "error" } } })[0].children)).toContain(
      "Weitere nicht geladen – erneut versuchen",
    );
  });

  it("stellt einen gewählten Podcast, der nicht in der Liste steht, an den Anfang", () => {
    const C = "cccccccccccccccccccccccc";
    const nodes = tree({}, { ...LATEST, podcastId: C });

    expect(nodes[0]).toMatchObject({ id: podcastNodeId(C), label: C, description: "Nicht in der Liste" });
    expect(nodes).toHaveLength(3);
  });

  it("zeigt eine gewählte Episode, die noch nicht unter den geladenen ist", () => {
    const config: PodcastConfig = { ...LATEST, mode: "specific", episodeId: E2 };
    const [own] = tree({ [A]: { status: "ready", value: { episodes: [episode(E1, "Folge 1")] } } }, config);

    expect(own.children?.[0]).toMatchObject({ id: episodeNodeId(A, E2), description: "Gewählte Episode" });
  });
});

describe("podcastDescription", () => {
  it("nennt die Zahl der Episoden, sobald sie geladen sind", () => {
    const ready = (episodes: Episode[], nextCursor?: string) => ({ status: "ready" as const, value: { episodes, nextCursor } });

    expect(podcastDescription(undefined)).toBe("Podcast");
    expect(podcastDescription({ status: "loading" })).toBe("Podcast");
    expect(podcastDescription(ready([]))).toBe("Podcast · noch keine Episoden");
    expect(podcastDescription(ready([episode(E1, "Folge 1")]))).toBe("Podcast · 1 Episode");
    expect(podcastDescription(ready([episode(E1, "Folge 1"), episode(E2, "Folge 2")]))).toBe("Podcast · 2 Episoden");
    // Weitere Seiten: die Zahl ist ein Mindestwert.
    expect(podcastDescription(ready([episode(E1, "Folge 1")], "c2"))).toBe("Podcast · 1+ Episoden");
  });

  it("steht am Podcast im Baum", () => {
    const [own] = tree({ [A]: { status: "ready", value: { episodes: [episode(E1, "Folge 1")] } } });

    expect(own.description).toBe("Podcast · 1 Episode");
  });
});

describe("filterPodcastTree", () => {
  const W = "dddddddddddddddddddddddd";
  const nodes = buildPodcastTree({
    podcasts: [...PODCASTS, { id: W, title: "Werkstattgespräch" }],
    episodes: {
      [A]: { status: "ready", value: { episodes: [episode(E1, "Arbeitssicherheit"), episode(E2, "Ausbildung im Werk")] } },
      [W]: { status: "loading" },
    },
    config: LATEST,
    locales: ["de_DE"],
  });

  it("lässt ohne Suchtext alles stehen", () => {
    expect(filterPodcastTree(nodes, "  ")).toEqual({ nodes, expand: [] });
  });

  it("behält einen passenden Podcast mit allem, was darin steht", () => {
    const { nodes: kept, expand } = filterPodcastTree(nodes, "werkstatt");

    expect(labels(kept)).toEqual(["Werkstattgespräch"]);
    expect(labels(kept[0].children)).toEqual(["Episoden werden geladen …"]);
    expect(expand).toEqual([]);
  });

  it("behält bei passenden Episoden nur diese und klappt ihren Podcast auf", () => {
    const { nodes: kept, expand } = filterPodcastTree(nodes, "SICHERHEIT");

    expect(labels(kept)).toEqual(["Werkfunk"]);
    expect(labels(kept[0].children)).toEqual(["Arbeitssicherheit"]);
    expect(expand).toEqual([podcastNodeId(A)]);
  });

  it("findet Podcast und Episode nebeneinander, Zustandszeilen nie", () => {
    expect(labels(filterPodcastTree(nodes, "werk").nodes)).toEqual(["Werkfunk", "Werkstattgespräch"]);
    expect(filterPodcastTree(nodes, "geladen").nodes).toEqual([]);
  });
});

describe("selectedNodeId", () => {
  it("wählt den Podcast im Modus „Neueste“ und die Episode im Modus „Bestimmte“", () => {
    expect(selectedNodeId(LATEST)).toBe(podcastNodeId(A));
    expect(selectedNodeId({ ...LATEST, mode: "specific", episodeId: E1 })).toBe(episodeNodeId(A, E1));
    expect(selectedNodeId({ ...LATEST, mode: "specific" })).toBe(podcastNodeId(A));
    expect(selectedNodeId({ ...LATEST, podcastId: "" })).toBeNull();
  });
});

describe("applyTreeTarget", () => {
  it("setzt beim Podcast nur die ID und lässt den Modus stehen", () => {
    const specific: PodcastConfig = { podcastId: A, mode: "specific", episodeId: E1, size: "small" };

    // Eine Episode gehört zu ihrem Podcast: beim Wechsel fällt sie weg.
    expect(applyTreeTarget(specific, { kind: "podcast", podcastId: B })).toEqual({
      podcastId: B,
      mode: "specific",
      size: "small",
    });
    // Derselbe Podcast ändert nichts – kein leerer Schritt im Verlauf.
    expect(applyTreeTarget(specific, { kind: "podcast", podcastId: A })).toBe(specific);
  });

  it("setzt bei der Episode Podcast, Modus „Bestimmte“ und Episode", () => {
    expect(applyTreeTarget(LATEST, { kind: "episode", podcastId: B, episodeId: E2 })).toEqual({
      podcastId: B,
      mode: "specific",
      episodeId: E2,
      size: "large",
    });
  });

  it("lässt die Konfiguration bei Zustandszeilen unverändert", () => {
    expect(applyTreeTarget(LATEST, { kind: "retry", podcastId: A })).toBe(LATEST);
    expect(applyTreeTarget(LATEST, { kind: "status" })).toBe(LATEST);
  });
});
