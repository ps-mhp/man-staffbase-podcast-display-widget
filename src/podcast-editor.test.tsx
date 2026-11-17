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

import * as React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigShellProvider } from "@man/config-ui/shell/shell-context";

import type { PodcastCatalogLoaders } from "./podcast-catalog-state";
import type { PodcastConfig } from "./podcast-config";
import type { Episode, EpisodeAudioResponse } from "./podcast-content";
import { PodcastEditor } from "./podcast-editor";

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const C = "cccccccccccccccccccccccc";
const E1 = "11111111-1111-1111-1111-111111111111";
const E2 = "22222222-2222-2222-2222-222222222222";
const E3 = "33333333-3333-3333-3333-333333333333";

const episode = (episodeId: string, title: string): Episode => ({
  episodeId,
  episodeTitle: title,
  publishedAt: "2026-11-03T08:00:00Z",
  thumbnailUrl: "",
  url: `https://cdn.example.test/${episodeId}.mp3`,
});

const PODCASTS = [
  { id: A, title: "Werkfunk" },
  { id: B, title: "Technik-Talk" },
  { id: C, title: "Fremder Space", disabled: true },
];

const EMPTY: PodcastConfig = { podcastId: "", mode: "latest", size: "large" };

function loaders(overrides: Partial<PodcastCatalogLoaders> = {}): jest.Mocked<PodcastCatalogLoaders> {
  return {
    loadPodcasts: jest.fn().mockResolvedValue(PODCASTS),
    loadEpisodes: jest.fn(
      async (podcastId: string): Promise<EpisodeAudioResponse> =>
        podcastId === A ? { data: [episode(E1, "Folge 1"), episode(E2, "Folge 2")] } : { data: [] },
    ),
    ...overrides,
  } as jest.Mocked<PodcastCatalogLoaders>;
}

interface HarnessProps {
  initial: PodcastConfig;
  catalog: PodcastCatalogLoaders;
  onChange?: (value: PodcastConfig) => void;
}

/** Hält den Entwurf wie der Rahmen: der Editor ist gesteuert. */
function Harness({ initial, catalog, onChange }: HarnessProps): React.ReactElement {
  const [value, setValue] = React.useState(initial);
  return (
    <PodcastEditor
      value={value}
      loaders={catalog}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

async function renderEditor(initial: PodcastConfig = EMPTY, catalog = loaders()) {
  const onChange = jest.fn();
  const view = render(<Harness initial={initial} catalog={catalog} onChange={onChange} />);
  await act(async () => undefined);
  return { ...view, onChange, catalog };
}

const row = (name: RegExp | string): HTMLElement => screen.getByRole("row", { name });
const tree = (): HTMLElement => screen.getByRole("treegrid", { name: "Podcasts" });
const field = (label: "Podcast" | "Episode"): HTMLElement =>
  screen.getByRole("textbox", { name: `${label} (Pflichtfeld)` });

describe("PodcastEditor – Baum", () => {
  it("zeigt die Podcasts als Ordner und lädt noch keine Episoden", async () => {
    const { catalog } = await renderEditor();

    expect(within(tree()).getAllByRole("row")).toHaveLength(3);
    expect(row(/Werkfunk/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("(3)")).toBeInTheDocument();
    expect(catalog.loadEpisodes).not.toHaveBeenCalled();
  });

  it("lädt die Episoden erst beim Aufklappen", async () => {
    const { catalog } = await renderEditor();

    await userEvent.click(within(row(/Werkfunk/)).getByRole("button", { name: /Aufklappen/ }));

    expect(catalog.loadEpisodes).toHaveBeenCalledTimes(1);
    expect(catalog.loadEpisodes).toHaveBeenCalledWith(A);
    expect(row(/Folge 1/)).toBeInTheDocument();
    expect(row(/Folge 2/)).toBeInTheDocument();
  });

  it("schreibt beim Wählen einer Episode Podcast, Modus und Episode in den Entwurf", async () => {
    const { onChange } = await renderEditor();
    await userEvent.click(within(row(/Werkfunk/)).getByRole("button", { name: /Aufklappen/ }));

    await userEvent.click(screen.getByText("Folge 2"));

    expect(onChange).toHaveBeenLastCalledWith({ podcastId: A, mode: "specific", episodeId: E2, size: "large" });
    expect(row(/Folge 2/)).toHaveAttribute("aria-selected", "true");
    expect(field("Episode")).toHaveValue("Folge 2");
  });

  it("setzt beim Wählen eines Podcasts nur die ID, klappt ihn auf und lädt seine Episoden", async () => {
    const { onChange, catalog } = await renderEditor({ ...EMPTY, size: "small" });

    await userEvent.click(screen.getByText("Technik-Talk"));

    expect(onChange).toHaveBeenLastCalledWith({ podcastId: B, mode: "latest", size: "small" });
    expect(catalog.loadEpisodes).toHaveBeenCalledWith(B);
    expect(row(/Technik-Talk/)).toHaveAttribute("aria-expanded", "true");
    expect(row(/Noch keine Episoden/)).toBeInTheDocument();
    expect(field("Podcast")).toHaveValue("Technik-Talk");
  });

  it("lässt einen Podcast aus einem anderen Space nicht wählen", async () => {
    const { onChange } = await renderEditor();

    await userEvent.click(screen.getByText("Fremder Space"));

    expect(onChange).not.toHaveBeenCalled();
    expect(row(/Fremder Space/)).toHaveTextContent("Anderer Space – hier nicht nutzbar");
  });

  it("öffnet den gewählten Podcast gleich und zeigt die gewählte Episode", async () => {
    const { catalog } = await renderEditor({ podcastId: A, mode: "specific", episodeId: E1, size: "large" });

    expect(catalog.loadEpisodes).toHaveBeenCalledWith(A);
    expect(row(/Werkfunk/)).toHaveAttribute("aria-expanded", "true");
    expect(row(/Folge 1/)).toHaveAttribute("aria-selected", "true");
  });

  it("lädt weitere Seiten über die letzte Zeile nach", async () => {
    const catalog = loaders({
      loadEpisodes: jest.fn(async (_id: string, cursor?: string) =>
        cursor === undefined ? { data: [episode(E1, "Folge 1")], nextCursor: "seite-2" } : { data: [episode(E3, "Folge 3")] },
      ),
    });
    await renderEditor({ ...EMPTY, podcastId: A }, catalog);

    await userEvent.click(screen.getByText("Weitere Episoden laden"));

    expect(catalog.loadEpisodes).toHaveBeenLastCalledWith(A, "seite-2");
    expect(row(/Folge 3/)).toBeInTheDocument();
    expect(screen.queryByText("Weitere Episoden laden")).toBeNull();
  });
});

describe("PodcastEditor – Laden und Fehler", () => {
  it("meldet das Laden der Podcasts", async () => {
    render(<Harness initial={EMPTY} catalog={loaders({ loadPodcasts: jest.fn(() => new Promise(() => undefined)) })} />);

    expect(screen.getByRole("status")).toHaveTextContent("Podcasts werden geladen …");
  });

  it("zeigt einen Fehler und lädt auf Wunsch erneut", async () => {
    const loadPodcasts = jest.fn().mockRejectedValueOnce(new Error("HTTP 500")).mockResolvedValue(PODCASTS);
    await renderEditor(EMPTY, loaders({ loadPodcasts }));

    expect(screen.getByRole("alert")).toHaveTextContent("Die Podcasts konnten nicht geladen werden.");
    await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));

    expect(loadPodcasts).toHaveBeenCalledTimes(2);
    expect(row(/Werkfunk/)).toBeInTheDocument();
  });

  it("sagt, wenn es keine erreichbaren Podcasts gibt", async () => {
    await renderEditor(EMPTY, loaders({ loadPodcasts: jest.fn().mockResolvedValue([]) }));

    expect(screen.getByRole("alert")).toHaveTextContent("Keine Podcasts gefunden");
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
  });

  it("bietet bei gescheiterten Episoden eine Zeile zum erneuten Laden an", async () => {
    const loadEpisodes = jest
      .fn()
      .mockRejectedValueOnce(new Error("HTTP 403"))
      .mockResolvedValue({ data: [episode(E1, "Folge 1")] });
    await renderEditor({ ...EMPTY, podcastId: A }, loaders({ loadEpisodes }));

    expect(row(/Episoden nicht geladen/)).toHaveTextContent("Fehlerhaft");
    await userEvent.click(screen.getByText("Episoden nicht geladen"));

    expect(loadEpisodes).toHaveBeenCalledTimes(2);
    expect(row(/Folge 1/)).toBeInTheDocument();
  });
});

describe("PodcastEditor – Formular", () => {
  it("schaltet Modus und Player-Größe um", async () => {
    const { onChange } = await renderEditor({ ...EMPTY, podcastId: A });

    await userEvent.click(screen.getByRole("radio", { name: "Bestimmte Episode" }));
    expect(onChange).toHaveBeenLastCalledWith({ podcastId: A, mode: "specific", size: "large" });
    expect(screen.getByText("Episode links in der Liste wählen")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Kompakt" }));
    expect(onChange).toHaveBeenLastCalledWith({ podcastId: A, mode: "specific", size: "small" });
  });

  it("zeigt Fehler an den Feldern erst, wenn Übernehmen an ihnen scheiterte", async () => {
    const shell = { view: "editor" as const, setView: jest.fn(), preview: true, issuesVisible: true };
    render(
      <ConfigShellProvider value={shell}>
        <Harness initial={{ ...EMPTY, mode: "specific" }} catalog={loaders()} />
      </ConfigShellProvider>,
    );
    await act(async () => undefined);

    expect(screen.getByText("Podcast auswählen")).toBeInTheDocument();
    expect(screen.getByText("Episode auswählen")).toBeInTheDocument();
    expect(field("Podcast")).toHaveAttribute("aria-invalid", "true");
  });

  it("nimmt eine eingefügte Podcast-Adresse von Hand an", async () => {
    const { onChange } = await renderEditor();

    await userEvent.click(screen.getByRole("button", { name: "ID von Hand eintragen" }));
    const input = screen.getByLabelText("Podcast-ID oder Adresse");
    fireEvent.change(input, { target: { value: "nur Text" } });
    expect(screen.getByText("Keine gültige ID erkannt")).toBeInTheDocument();

    const pasted = "dddddddddddddddddddddddd";
    fireEvent.change(input, { target: { value: `https://app.example.test/podcast/${pasted.toUpperCase()}` } });
    // Der neue Podcast lädt gleich seine Episoden.
    await act(async () => undefined);
    expect(onChange).toHaveBeenLastCalledWith({ podcastId: pasted, mode: "latest", size: "large" });
    // Steht der Podcast nicht in der Liste, erscheint er oben im Baum, damit die Wahl sichtbar bleibt.
    expect(row(pasted)).toHaveAttribute("aria-selected", "true");
    expect(row(pasted)).toHaveTextContent("Nicht in der Liste");
  });
});
