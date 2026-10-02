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

import { PODCAST_DISPLAY_CSS, STYLE_ELEMENT_ID, ensureStyles } from "./styles";

describe("ensureStyles", () => {
  afterEach(() => {
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
  });

  it("adds exactly one style element even when called twice", () => {
    ensureStyles();
    ensureStyles();

    expect(document.querySelectorAll(`#${STYLE_ELEMENT_ID}`)).toHaveLength(1);
  });

  it("fills the style element with the stylesheet", () => {
    ensureStyles();

    expect(document.getElementById(STYLE_ELEMENT_ID)?.textContent).toContain(".podcast-display");
  });
});

/** The declarations of the first rule whose selector list is exactly `selector`. */
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(PODCAST_DISPLAY_CSS);
  return match === null ? "" : match[1];
};

const ROOT = "#podcast-display-widget-root";

// Craft (the MAN Design System), see man-theme `docs/CRAFT-MIGRATION.md` E4:
// no capitals and no tracking anywhere on the page, only the two Man Europe
// families, and a focus ring drawn as a real outline.
describe("podcast stylesheet after Craft", () => {
  it("sets no capitals, no tracking and no retired font names", () => {
    expect(PODCAST_DISPLAY_CSS).not.toMatch(/uppercase/i);
    expect(PODCAST_DISPLAY_CSS).not.toMatch(/MANEurope/);
    const tracking = PODCAST_DISPLAY_CSS.match(/letter-spacing:[^;]*/g) ?? [];
    expect(tracking.filter((declaration) => !/:\s*normal\b/.test(declaration))).toEqual([]);
  });

  it("keeps the large title in mixed case", () => {
    expect(rule(`${ROOT} .podcast-display__player--large .podcast-display__title`)).toMatch(
      /text-transform:\s*none\s*!important/,
    );
  });

  // `man("focus")` is the box-shadow form `0 0 0 2px #3875b2` — as an
  // `outline` value that was invalid CSS, so no ring was drawn at all.
  it.each([
    `${ROOT} button.podcast-display__play:focus-visible`,
    `${ROOT} .podcast-display__track:focus-visible`,
    `${ROOT} button.podcast-display__rate:focus-visible,\n${ROOT} button.podcast-display__mute:focus-visible`,
  ])("draws the focus ring as a valid outline on %s", (selector) => {
    const declarations = rule(selector);
    expect(declarations).toMatch(/outline:\s*var\(--man-focus-width, 2px\) solid var\(--man-focus-color, #3875b2\)\s*!important/);
    expect(declarations).toMatch(/outline-offset:\s*var\(--man-focus-offset, 2px\)\s*!important/);
  });

  it("never puts the box-shadow focus token into an outline", () => {
    expect(PODCAST_DISPLAY_CSS).not.toMatch(/outline:\s*var\(--man-focus,/);
  });

  it("writes error text in the error ink, not the signal red", () => {
    expect(rule(`${ROOT} .podcast-display__error`)).toMatch(/color:\s*var\(--man-error-ink, #990000\)/);
  });

  // Craft: focus changes nothing but the ring; only hover recolours.
  it("does not recolour the buttons on plain focus", () => {
    expect(PODCAST_DISPLAY_CSS).not.toMatch(/button\.podcast-display__(play|rate|mute):focus\s*[,{]/);
  });
});
