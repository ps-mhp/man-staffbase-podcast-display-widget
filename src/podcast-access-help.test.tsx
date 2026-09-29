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
import { render, screen, fireEvent } from "@testing-library/react";

import { PodcastAccessHelp } from "./podcast-access-help";

describe("PodcastAccessHelp", () => {
  afterEach(() => document.documentElement.removeAttribute("lang"));

  it("shows only the link until it is clicked", () => {
    document.documentElement.setAttribute("lang", "de-DE");
    render(<PodcastAccessHelp />);

    expect(screen.getByTestId("podcast-access-help-link")).toHaveTextContent("Podcast nicht auffindbar?");
    expect(screen.queryByTestId("podcast-access-help-modal")).not.toBeInTheDocument();
  });

  it("opens the modal with the reader's language and closes it again", () => {
    document.documentElement.setAttribute("lang", "fr-FR");
    render(<PodcastAccessHelp />);

    fireEvent.click(screen.getByTestId("podcast-access-help-link"));

    const modal = screen.getByTestId("podcast-access-help-modal");
    expect(modal).toHaveTextContent("Podcast introuvable ?");
    expect(modal).toHaveTextContent("Space");

    fireEvent.click(screen.getByTestId("podcast-access-help-close"));
    expect(screen.queryByTestId("podcast-access-help-modal")).not.toBeInTheDocument();
  });

  it("falls back to English for a language outside the dictionary", () => {
    document.documentElement.setAttribute("lang", "xx-XX");
    render(<PodcastAccessHelp />);

    fireEvent.click(screen.getByTestId("podcast-access-help-link"));

    expect(screen.getByTestId("podcast-access-help-modal")).toHaveTextContent("Podcast missing?");
  });
});
