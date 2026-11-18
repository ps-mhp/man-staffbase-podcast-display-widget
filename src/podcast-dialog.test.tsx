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
 * Das Fenster „Podcast wählen“ im gemeinsamen Rahmen von
 * `@man/config-ui`, eingehängt in einen echten RJSF-Dialog: Ausgangsstand aus
 * den alten Feldern, erstes Übernehmen nach `podcast-config`, Prüfung,
 * Ausblenden nur im eigenen Dialog, Nachladen des Editors.
 */

import * as React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { modalRoot, settleModal, settleEditor, clickElement } from "@shared/ui/config-modal.testing";
import { configurationSchema } from "./configuration-schema";
import { pickPodcastAccessHelpText } from "./podcast-access-help-translations";
import { readPodcastConfig, serializePodcastConfig } from "./podcast-config";
import { documentLocales } from "./podcast-content";
import { podcastEditorShell, startPodcastDialog } from "./podcast-dialog";
import { STYLE_ELEMENT_ID } from "./styles";

const EDITOR_SELECTOR = '[role="treegrid"]';

const mockEditorLoaded = jest.fn();
jest.mock("./podcast-editor", () => {
  mockEditorLoaded();
  return jest.requireActual("./podcast-editor");
});

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const E1 = "11111111-1111-1111-1111-111111111111";

const EPISODES = {
  data: [
    {
      episodeId: E1,
      episodeTitle: "Folge 1",
      publishedAt: "2026-11-03T08:00:00Z",
      thumbnailUrl: "https://cdn.example.test/cover.png",
      url: "https://cdn.example.test/folge-1.mp3",
    },
  ],
};

/** Antwortet wie die Staffbase-API: ein Podcast „Werkfunk“ mit einer Folge. */
function answer(url: string): Response {
  if (url.startsWith("/api/ai-podcast/search")) return Response.json({ entries: [{ installationId: A, scope: "global" }] });
  if (url === `/api/installations/${A}`) return Response.json({ config: { localization: { de_DE: { title: "Werkfunk" } } } });
  if (url.startsWith(`/api/ai-podcast/${A}/episode-audio`)) return Response.json(EPISODES);
  return new Response("{}", { status: 404 });
}

beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => answer(String(input)));
});

afterEach(() => {
  jest.restoreAllMocks();
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
});

const fieldValue = (container: HTMLElement): string =>
  container.querySelector<HTMLInputElement>("#podcast #root_podcast-config")!.value;

const inModal = (selector: string): HTMLElement | null => modalRoot()?.querySelector<HTMLElement>(selector) ?? null;

const buttonNamed = (name: string): HTMLElement | null =>
  Array.from(modalRoot()?.querySelectorAll<HTMLElement>('button, [role="radio"]') ?? []).find(
    (button) => button.textContent?.trim() === name || button.getAttribute("aria-label") === name,
  ) ?? null;

/** Der eigene Dialog neben einem fremden mit gleichen Feldnamen (Hotspot: `display-mode`, Navigation: `menu-id`). */
function Dialogs({ formData }: { formData: Record<string, string> }): React.ReactElement {
  return (
    <>
      <div id="podcast">
        <Form schema={configurationSchema} validator={validator} formData={formData} />
      </div>
      <form id="foreign">
        <div data-row="display-mode">
          <label htmlFor="root_display-mode">Darstellung</label>
          <input id="root_display-mode" defaultValue="dots" />
        </div>
        <div data-row="menu-id">
          <label htmlFor="root_menu-id">Startpunkt</label>
          <input id="root_menu-id" defaultValue="menu-1" />
        </div>
      </form>
    </>
  );
}

async function open(formData: Record<string, string>): Promise<{ container: HTMLElement; stop: () => void }> {
  const { container } = render(<Dialogs formData={formData} />);
  let stop = (): void => {};
  await act(async () => {
    stop = startPodcastDialog(container);
  });
  await settleEditor(EDITOR_SELECTOR);
  return { container, stop };
}

describe("Nachladen", () => {
  // Muss zuerst laufen: einmal geladen, bleibt das Modul im Speicher.
  it("lädt den Editor erst, wenn ein eigener Dialog erscheint", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const stop = startPodcastDialog(container);
    await settleModal();

    expect(mockEditorLoaded).not.toHaveBeenCalled();
    await act(async () => stop());
    container.remove();

    const opened = await open({});
    expect(mockEditorLoaded).toHaveBeenCalledTimes(1);
    expect(inModal('[data-testid="podcast-editor"]')).not.toBeNull();
    await act(async () => opened.stop());
  });
});

describe("startPodcastDialog", () => {
  it("öffnet das Fenster im gemeinsamen Rahmen mit Vorschau-Umschalter", async () => {
    const { stop } = await open({});

    expect(modalRoot()!.textContent).toContain("Podcast-Anzeige");
    expect(modalRoot()!.querySelector("h1")).toHaveTextContent("Podcast wählen");
    expect(inModal('[aria-label="Ansicht"]')).not.toBeNull();
    expect(inModal('[role="treegrid"][aria-label="Podcasts"]')).toHaveTextContent("Werkfunk");

    await act(async () => stop());
  });

  it("blendet die alten Felder nur im eigenen Dialog aus", async () => {
    const { container, stop } = await open({});

    for (const key of ["podcast-id", "display-mode", "episode-id", "player-size"]) {
      const field = container.querySelector(`#podcast [id="root_${key}"]`);
      expect(field).not.toBeNull();
      expect(field!.closest<HTMLElement>('[style*="display: none"]')).not.toBeNull();
    }
    expect(container.querySelector<HTMLElement>('#foreign [data-row="display-mode"]')?.style.display).toBe("");
    expect(container.querySelector<HTMLElement>('#foreign [data-row="menu-id"]')?.style.display).toBe("");
    expect(container.querySelector<HTMLElement>("#foreign")?.style.display).toBe("");

    await act(async () => stop());
    expect(container.querySelector('#podcast [id="root_podcast-id"]')!.closest('[style*="display: none"]')).toBeNull();
  });

  it("beginnt mit den alten Feldern und schreibt sie beim ersten Übernehmen nach podcast-config", async () => {
    const { container, stop } = await open({ "podcast-id": A, "episode-id": E1, "player-size": "small" });
    expect(fieldValue(container)).toBe("");
    expect(inModal('[data-testid="config-shell-apply"]')).toBeDisabled();
    expect(buttonNamed("Kompakt")).toHaveAttribute("aria-checked", "true");

    await clickElement(buttonNamed("Groß"));
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    expect(readPodcastConfig(fieldValue(container))).toEqual({
      podcastId: A,
      mode: "latest",
      episodeId: E1,
      size: "large",
    });
    // Die alten Felder bleiben, wie sie sind; es gilt jetzt podcast-config.
    expect(container.querySelector<HTMLInputElement>('#podcast [id="root_podcast-id"]')!.value).toBe(A);

    await act(async () => stop());
  });

  it("nimmt eine vorhandene podcast-config vor den alten Feldern", async () => {
    const config = serializePodcastConfig({ podcastId: A, mode: "specific", episodeId: E1, size: "large" });
    const { stop } = await open({ "podcast-config": config, "player-size": "small" });
    await settleModal();

    expect(buttonNamed("Groß")).toHaveAttribute("aria-checked", "true");
    expect(buttonNamed("Bestimmte Episode")).toHaveAttribute("aria-checked", "true");
    expect(inModal('[role="row"][aria-selected="true"]')).toHaveTextContent("Folge 1");

    await act(async () => stop());
  });

  it("schreibt die gewählte Episode, und übernimmt nichts ohne Podcast", async () => {
    const { container, stop } = await open({});

    await clickElement(inModal('[data-testid="config-shell-apply"]'));
    expect(inModal('[role="status"]')).toHaveTextContent("Keine Änderungen");

    await clickElement(buttonNamed("Bestimmte Episode"));
    await clickElement(inModal('[data-testid="config-shell-apply"]'));
    expect(fieldValue(container)).toBe("");
    expect(inModal('[role="status"]')).toHaveTextContent("2 Fehler");

    await clickElement(Array.from(modalRoot()!.querySelectorAll('[role="row"]')).find((row) => row.textContent?.includes("Werkfunk")) ?? null);
    await settleModal();
    await clickElement(Array.from(modalRoot()!.querySelectorAll('[role="row"]')).find((row) => row.textContent?.includes("Folge 1")) ?? null);
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    expect(readPodcastConfig(fieldValue(container))).toEqual({ podcastId: A, mode: "specific", episodeId: E1, size: "large" });

    await act(async () => stop());
  });

  it("erklärt in einer Seitenleiste, warum ein Podcast fehlen kann, und lässt den Baum stehen", async () => {
    const { stop } = await open({});

    // Die Erklärung spricht die Sprache der Seite; im Test ist das Englisch.
    const text = pickPodcastAccessHelpText(documentLocales());
    expect(inModal('[data-testid="podcast-access-hint"]')).toBeNull();
    await clickElement(buttonNamed(text.linkText));

    const panel = inModal('[data-side-panel="podcast-access-help"]');
    expect(panel).toHaveTextContent(text.title);
    expect(panel?.querySelector('[data-testid="podcast-access-hint"]')).toHaveTextContent(text.resolveStepsTitle);
    expect(inModal('[role="treegrid"][aria-label="Podcasts"]')).not.toBeNull();

    await act(async () => stop());
  });

  it("leert mit Escape erst die Suche, statt das Fenster zu schließen", async () => {
    const { stop } = await open({});
    const search = inModal('input[type="search"]') as HTMLInputElement;

    fireEvent.change(search, { target: { value: "werk" } });
    await act(async () => {
      fireEvent.keyDown(search, { key: "Escape" });
    });

    expect(search.value).toBe("");
    expect(inModal('[data-testid="config-shell"]')).not.toBeNull();

    await act(async () => stop());
  });

  it("zeigt in der Vorschau den Entwurf, mit Stylesheet im Fenster statt auf der Wirtsseite", async () => {
    const { stop } = await open({ "podcast-id": A });

    await clickElement(buttonNamed("Desktop"));
    await settleModal();

    expect(inModal('[data-testid="podcast-preview"]')).toHaveAttribute("inert");
    expect(inModal('[data-testid="podcast-display"]')).toHaveTextContent("Folge 1");
    expect(modalRoot()!.getElementById(STYLE_ELEMENT_ID)).not.toBeNull();
    expect(document.getElementById(STYLE_ELEMENT_ID)).toBeNull();

    await act(async () => stop());
  });
});

describe("podcastEditorShell", () => {
  it("verlangt einen Podcast und im Modus „Bestimmte“ eine Episode", () => {
    const validate = podcastEditorShell.validate!;

    expect(validate({ podcastId: "", mode: "latest", size: "large" })).toEqual([
      { id: "podcast", message: "Podcast auswählen" },
    ]);
    expect(validate({ podcastId: A, mode: "specific", size: "large" })).toEqual([
      { id: "episode", message: "Episode auswählen" },
    ]);
    expect(validate({ podcastId: A, mode: "specific", episodeId: E1, size: "large" })).toEqual([]);
  });

  it("nennt im Status, was sich gegenüber dem übernommenen Stand geändert hat", () => {
    const saved = { podcastId: A, mode: "latest" as const, size: "large" as const };
    const statusText = podcastEditorShell.statusText!;

    expect(statusText({ ...saved, size: "small" }, saved)).toBe("Player geändert");
    expect(statusText({ ...saved, mode: "specific", episodeId: E1 }, saved)).toBe("Episode gewählt");
    expect(statusText({ podcastId: "", mode: "specific", episodeId: E1, size: "small" }, saved)).toBe(
      "Podcast und Episode gewählt, Player geändert",
    );
    expect(statusText(saved, saved)).toBeUndefined();
  });

  it("erklärt in der Hilfe Auswahl, Modus, Größe und den Weg von Hand", () => {
    const { container } = render(<>{podcastEditorShell.help}</>);

    expect(container).toHaveTextContent("Neueste Episode");
    expect(container).toHaveTextContent("Bestimmte Episode");
    expect(container).toHaveTextContent("Kompakt");
    expect(container).toHaveTextContent("ID von Hand eintragen");
    expect(container).toHaveTextContent("Die Suche darüber findet Podcasts und Episoden.");
  });
});
