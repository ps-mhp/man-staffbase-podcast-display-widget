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

import { readLegacyFromDialog, startHiddenFields } from "./legacy-fields";

const OWN = "podcast-config";
const LEGACY = ["podcast-id", "display-mode", "episode-id", "player-size"];

function row(key: string, value = ""): string {
  return `<div data-row="${key}"><label for="root_${key}">${key}</label><input id="root_${key}" value="${value}"><p>Hilfe</p></div>`;
}

const rowOf = (selector: string): HTMLElement | null => document.querySelector<HTMLElement>(selector);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("startHiddenFields", () => {
  it("blendet die alten Felder im eigenen Dialog ganz aus und lässt das eigene stehen", () => {
    document.body.innerHTML = `<form>${row(OWN)}${LEGACY.map((key) => row(key)).join("")}</form>`;

    const stop = startHiddenFields(LEGACY, OWN);

    for (const key of LEGACY) expect(rowOf(`[data-row="${key}"]`)?.style.display).toBe("none");
    expect(rowOf(`[data-row="${OWN}"]`)?.style.display).toBe("");
    stop();
  });

  it("erfasst Felder, die erst später erscheinen, und gibt sie beim Aufhören wieder frei", async () => {
    document.body.innerHTML = "<form></form>";
    const stop = startHiddenFields(LEGACY, OWN);

    document.querySelector("form")?.insertAdjacentHTML("beforeend", `${row(OWN)}${row("display-mode")}`);
    await Promise.resolve();

    const displayMode = rowOf('[data-row="display-mode"]');
    expect(displayMode?.style.display).toBe("none");
    stop();
    expect(displayMode?.style.display).toBe("");
  });

  // Studio lädt alle Widget-Bündel in dasselbe Dokument. `display-mode` hat
  // auch das Hotspot-Widget, `menu-id` das Navigation-Widget: dokumentweit
  // ausgeblendet, stieg die Zeile bis zum ganzen Formular hoch, und deren
  // Dialog blieb leer.
  it("lässt den Dialog eines anderen Widgets mit gleichen Feldnamen unberührt", () => {
    document.body.innerHTML =
      `<form id="hotspot"><div data-wrap>${row("config")}${row("display-mode")}${row("menu-id")}</div></form>` +
      `<form id="podcast">${row(OWN)}${row("display-mode")}</form>`;

    const stop = startHiddenFields([...LEGACY, "menu-id"], OWN);

    expect(rowOf('#hotspot [data-row="display-mode"]')?.style.display).toBe("");
    expect(rowOf('#hotspot [data-row="menu-id"]')?.style.display).toBe("");
    expect(rowOf("#hotspot [data-wrap]")?.style.display).toBe("");
    expect(rowOf('#podcast [data-row="display-mode"]')?.style.display).toBe("none");
    stop();
  });

  it("erfasst einen fremden Dialog auch dann nicht, wenn er erst später erscheint", async () => {
    const stop = startHiddenFields(LEGACY, OWN);

    document.body.insertAdjacentHTML("beforeend", `<form>${row("display-mode")}${row("player-size")}</form>`);
    await Promise.resolve();

    expect(rowOf('[data-row="display-mode"]')?.style.display).toBe("");
    expect(rowOf('[data-row="player-size"]')?.style.display).toBe("");
    stop();
  });

  it("beobachtet nur den übergebenen Teilbaum", () => {
    document.body.innerHTML = `<div id="scope"><form>${row(OWN)}${row("episode-id")}</form></div><form>${row(OWN)}${row("episode-id")}</form>`;

    const stop = startHiddenFields(LEGACY, OWN, document.getElementById("scope")!);

    expect(rowOf('#scope [data-row="episode-id"]')?.style.display).toBe("none");
    expect(rowOf('body > form [data-row="episode-id"]')?.style.display).toBe("");
    stop();
  });
});

describe("readLegacyFromDialog", () => {
  it("liest die alten Felder aus dem eigenen Dialog, nicht aus einem fremden", () => {
    document.body.innerHTML =
      `<form id="hotspot">${row("config")}${row("display-mode", "dots")}</form>` +
      `<form id="podcast">${row(OWN)}${row("podcast-id", "abc")}${row("display-mode", "specific")}${row("player-size", "small")}</form>`;

    expect(readLegacyFromDialog()).toEqual({
      "podcast-id": "abc",
      "display-mode": "specific",
      "player-size": "small",
    });
  });

  it("liefert nichts ohne eigenen Dialog", () => {
    document.body.innerHTML = `<form>${row("display-mode", "specific")}</form>`;

    expect(readLegacyFromDialog()).toEqual({});
  });

  // Im Content Designer sind Auswahlfelder keine echten `<select>`: was dort
  // `root_<key>` trägt, hat keinen lesbaren Wert. Dann gilt die Vorgabe.
  it("überspringt Felder ohne lesbaren Wert", () => {
    document.body.innerHTML = `<form>${row(OWN)}<div id="root_display-mode" role="combobox">Bestimmte Episode</div></form>`;

    expect(readLegacyFromDialog()).toEqual({});
  });

  // RJSF schreibt die Stelle der Option, nicht ihren Wert.
  it("übersetzt die Stelle einer Option in ihren Wert", () => {
    document.body.innerHTML =
      `<form>${row(OWN)}<select id="root_display-mode"><option value="0">Neueste</option>` +
      `<option value="1" selected>Bestimmte</option></select></form>`;

    expect(readLegacyFromDialog()).toEqual({ "display-mode": "specific" });
  });

  // MUI legt die Kennung auf ein `div`, der Wert steht im versteckten Feld mit dem Namen daneben.
  it("liest eine MUI-Auswahl über ihr verstecktes Eingabefeld", () => {
    document.body.innerHTML =
      `<form>${row(OWN)}<div class="row"><div id="root_player-size" role="combobox">Kompakt</div>` +
      `<input aria-hidden="true" tabindex="-1" id="_r_8_" name="root_player-size" value="1"></div></form>`;

    expect(readLegacyFromDialog()).toEqual({ "player-size": "small" });
  });

  it("liest auch echte Auswahlfelder", () => {
    document.body.innerHTML =
      `<form>${row(OWN)}<select id="root_player-size"><option value="large">Groß</option>` +
      `<option value="small" selected>Kompakt</option></select></form>`;

    expect(readLegacyFromDialog()).toEqual({ "player-size": "small" });
  });
});
