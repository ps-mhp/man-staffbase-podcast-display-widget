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
import { act, render, screen } from "@testing-library/react";
import { ConfigShellProvider, ConfigView } from "@man/config-ui/shell/shell-context";

import type { PodcastConfig } from "./podcast-config";
import { NARROW_PREVIEW_CLASS, PodcastPreview } from "./podcast-preview";
import { PODCAST_DISPLAY_CSS, STYLE_ELEMENT_ID } from "./styles";

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

function renderPreview(config: PodcastConfig, view: ConfigView = "desktop") {
  const shell = { view, setView: jest.fn(), preview: true, issuesVisible: false };
  return render(
    <ConfigShellProvider value={shell}>
      <PodcastPreview config={config} />
    </ConfigShellProvider>,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
});

describe("PodcastPreview", () => {
  it("zeigt die echte Anzeige mit dem Entwurf, still und nicht bedienbar", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      String(input).includes("/episode-audio")
        ? new Response(JSON.stringify(EPISODES))
        : new Response("{}", { status: 404 }),
    );
    const play = jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    renderPreview({ podcastId: A, mode: "specific", episodeId: E1, size: "small" });
    await act(async () => undefined);

    const preview = screen.getByTestId("podcast-preview");
    expect(preview).toHaveAttribute("inert");
    expect(screen.getByText("Folge 1")).toBeInTheDocument();
    expect(preview.querySelector(".podcast-display__player--small")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`/api/ai-podcast/${A}/episode-audio`), expect.anything());
    // Von selbst spielt nichts.
    expect(play).not.toHaveBeenCalled();
  });

  it("zeigt den Ladezustand, solange die Episode aus dem Netz kommt", () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => undefined));

    renderPreview({ podcastId: A, mode: "latest", size: "large" });

    expect(screen.getByText("Episode wird geladen …")).toBeInTheDocument();
  });

  it("nennt, was fehlt, statt leer zu bleiben", () => {
    renderPreview({ podcastId: "", mode: "latest", size: "large" });

    expect(screen.getByRole("alert")).toHaveTextContent("Keine Podcast-ID konfiguriert");
  });

  // Die Seite stapelt Cover und Text per Medienabfrage; die fragt im Studio
  // das Fenster, nicht den Gerätrahmen.
  it("stapelt den großen Player nur in der Ansicht Mobil", () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => undefined));
    const config: PodcastConfig = { podcastId: A, mode: "latest", size: "large" };

    const { unmount } = renderPreview(config, "tablet");
    expect(screen.getByTestId("podcast-preview")).not.toHaveClass(NARROW_PREVIEW_CLASS);
    unmount();

    renderPreview(config, "mobile");
    expect(screen.getByTestId("podcast-preview")).toHaveClass(NARROW_PREVIEW_CLASS);
    expect(PODCAST_DISPLAY_CSS).toContain(`.${NARROW_PREVIEW_CLASS} #podcast-display-widget-root .podcast-display__player--large .podcast-display__header`);
  });
});
