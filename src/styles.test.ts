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
    `${ROOT} .podcast-display__track:focus-visible .podcast-display__handle`,
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

// Craft `craft-slider`, man-theme `analysis/craft/components-forms.md` §14.
// The player draws it on its own `role="slider"` element, so the picture is
// split over track, fill and handle.
describe("progress bar as the Craft slider", () => {
  const TRACK = `${ROOT} .podcast-display__track`;
  const HANDLE = `${ROOT} .podcast-display__handle`;
  const FILL = `${ROOT} .podcast-display__fill`;

  it("draws a 4px pill track in grey 200", () => {
    const declarations = rule(TRACK);
    expect(declarations).toMatch(/height:\s*4px/);
    expect(declarations).toMatch(/background:\s*var\(--man-grey-200, #e5e5e5\)/);
    expect(declarations).toMatch(/border-radius:\s*var\(--man-radius-pill, 24px\)/);
  });

  it("fills the played part in MAN red", () => {
    const declarations = rule(FILL);
    expect(declarations).toMatch(/background-color:\s*var\(--man-red, #e40045\)/);
    expect(declarations).toMatch(/border-radius:\s*var\(--man-radius-pill, 24px\)/);
  });

  it("draws a 20px round red handle without a border", () => {
    const declarations = rule(HANDLE);
    expect(declarations).toMatch(/width:\s*20px/);
    expect(declarations).toMatch(/height:\s*20px/);
    expect(declarations).toMatch(/background-color:\s*var\(--man-red, #e40045\)/);
    expect(declarations).toMatch(/border-radius:\s*var\(--man-radius-round, 50%\)/);
    expect(declarations).toMatch(/border:\s*0/);
  });

  it("shows the Craft halo on hover and while pressed, 100ms linear", () => {
    expect(rule(`${ROOT} .podcast-display__track:hover .podcast-display__handle`)).toMatch(
      /box-shadow:\s*0 0 1px 4px rgba\(253, 226, 232, 0\.7\)/,
    );
    expect(rule(`${ROOT} .podcast-display__track:active .podcast-display__handle`)).toMatch(
      /box-shadow:\s*0 0 1px 4px rgba\(250, 183, 198, 0\.7\)/,
    );
    expect(rule(HANDLE)).toMatch(/transition:\s*box-shadow var\(--man-duration, 100ms\) var\(--man-ease, linear\)/);
  });

  it("greys fill and handle out when disabled, after the hover and pressed rules", () => {
    const selector = `${TRACK}[aria-disabled=true] .podcast-display__fill,\n${TRACK}[aria-disabled=true] .podcast-display__handle`;
    const declarations = rule(selector);
    expect(declarations).toMatch(/background-color:\s*var\(--man-grey-400, #afafaf\)/);
    expect(declarations).toMatch(/box-shadow:\s*none/);
    expect(PODCAST_DISPLAY_CSS.indexOf(selector)).toBeGreaterThan(
      PODCAST_DISPLAY_CSS.indexOf(`${TRACK}:active .podcast-display__handle`),
    );
  });

  // Before the change the track was 4px and the handle 12px — the band to
  // click or tap must not shrink below that, however thin the track looks.
  it("keeps a hit band at least as tall as the old handle", () => {
    const height = /height:\s*(\d+)px/.exec(rule(`${TRACK}::before`));
    expect(height).not.toBeNull();
    expect(Number(height![1])).toBeGreaterThanOrEqual(12);
    expect(rule(`${TRACK}::before`)).toMatch(/left:\s*0;[\s\S]*right:\s*0/);
  });

  it("moves the focus ring from the track onto the handle where there is one", () => {
    expect(rule(`${TRACK}:not(.podcast-display__track--thin):focus-visible`)).toMatch(/outline:\s*none\s*!important/);
  });

  it("gives the compact track the same picture, only spacing differs", () => {
    expect(rule(`${TRACK}--thin`)).not.toMatch(/height|background|border-radius/);
  });

  it("leaves room under the track for the 20px handle", () => {
    expect(rule(`${ROOT} .podcast-display__times`)).toMatch(/margin-top:\s*var\(--man-space-3, 12px\)/);
  });
});
