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
import { act, render, screen, fireEvent } from "@testing-library/react";

import { CONFIG_MODAL_HOST_ATTRIBUTE } from "@shared/ui/config-modal";

import { PodcastAccessHelp } from "./podcast-access-help";

/** The modal lives in its own shadow root and arrives lazily. */
const modal = (testId = "podcast-access-help-modal"): HTMLElement | null =>
  document.querySelector(`[${CONFIG_MODAL_HOST_ATTRIBUTE}]`)?.shadowRoot?.querySelector<HTMLElement>(
    `[data-testid="${testId}"]`,
  ) ?? null;

async function openHelp(): Promise<void> {
  fireEvent.click(screen.getByTestId("podcast-access-help-link"));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("PodcastAccessHelp", () => {
  afterEach(() => document.documentElement.removeAttribute("lang"));

  it("shows only the link until it is clicked", () => {
    document.documentElement.setAttribute("lang", "de-DE");
    render(<PodcastAccessHelp />);

    expect(screen.getByTestId("podcast-access-help-link")).toHaveTextContent("Podcast nicht auffindbar?");
    expect(modal()).toBeNull();
  });

  it("opens the modal with the reader's language and closes it again", async () => {
    document.documentElement.setAttribute("lang", "fr-FR");
    render(<PodcastAccessHelp />);

    await openHelp();

    expect(modal()).toHaveTextContent("Podcast introuvable ?");
    expect(modal()).toHaveTextContent("Space");

    await act(async () => {
      modal("podcast-access-help-close")!.click();
    });
    expect(modal()).toBeNull();
  });

  it("falls back to English for a language outside the dictionary", async () => {
    document.documentElement.setAttribute("lang", "xx-XX");
    render(<PodcastAccessHelp />);

    await openHelp();

    expect(modal()).toHaveTextContent("Podcast missing?");
  });

  it("puts the modal into the dialog around the link", async () => {
    const showPopover = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "showPopover", { value: showPopover, configurable: true });
    render(
      <div role="dialog">
        <PodcastAccessHelp />
      </div>,
    );

    await openHelp();

    expect(document.querySelector(`[role="dialog"] > [${CONFIG_MODAL_HOST_ATTRIBUTE}]`)).not.toBeNull();
    delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
  });
});
