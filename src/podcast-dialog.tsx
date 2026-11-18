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
 * Was der Konfigurationsdialog zeigt: ein einziges Fenster am Feld
 * `podcast-config`, die einzelnen Felder älterer Fassungen ausgeblendet.
 *
 * Ist `podcast-config` noch leer, beginnt das Fenster mit dem, was die alten
 * Felder des eigenen Dialogs tragen. Erst „Übernehmen“ schreibt es nach
 * `podcast-config`; bis dahin gilt für die Seite weiter, was in den alten
 * Feldern steht.
 */

import * as React from "react";
import { Mic } from "lucide-react";

import { FieldModalShellOptions, startFieldModalInjector } from "@shared/config-modal";

import { LEGACY_ATTRIBUTES, PODCAST_CONFIG_ATTRIBUTE } from "./configuration-schema";
import { readLegacyFromDialog, startHiddenFields } from "./legacy-fields";
import { PodcastConfig, configFromLegacy, readPodcastConfig, serializePodcastConfig } from "./podcast-config";
import { podcastChangesStatus, validatePodcastConfig } from "./podcast-editor-rules";

/**
 * Der Editor kommt erst, wenn ein Dialog ihn zeigt: er baut auf
 * `@man/config-ui` und damit auf react-aria. Hier im Seitenbündel bleiben nur
 * Prüfung, Status und Hilfe – sie braucht der Rahmen, bevor der Editor da ist.
 */
const LazyPodcastEditor = React.lazy(() =>
  import("./podcast-editor").then((module) => ({ default: module.PodcastEditor })),
);

const LOADING = <p className="p-6 text-sm text-muted-foreground">Editor wird geladen …</p>;

/** Tasten und den Satz zu „Übernehmen“ ergänzt der Rahmen selbst. */
const HELP = (
  <ul className="flex list-disc flex-col gap-2 pl-5">
    <li>
      Links den <strong>Podcast</strong> wählen; der Pfeil davor zeigt seine Episoden. Die Suche darüber findet
      Podcasts und Episoden.
    </li>
    <li>
      <strong>Neueste Episode</strong> zeigt immer die jüngste Folge – neue Folgen erscheinen von selbst.
    </li>
    <li>
      <strong>Bestimmte Episode</strong> zeigt dauerhaft die Folge, die links gewählt ist.
    </li>
    <li>
      <strong>Groß</strong> zeigt Cover und volle Steuerung, <strong>Kompakt</strong> eine schmale Kachel.
    </li>
    <li>In Desktop, Tablet und Mobil stehen Anzeige und Player rechts neben der Vorschau.</li>
    <li>
      Fehlt ein Podcast, liegt das meist an den Rechten seines Space – <strong>Podcast nicht auffindbar?</strong> unten
      links erklärt mehr.
    </li>
    <li>Lädt die Liste nicht, lässt sich die ID unter „ID von Hand eintragen“ einfügen.</li>
  </ul>
);

/** Was der gemeinsame Rahmen von der Podcast-Anzeige wissen muss. Offengelegt für Tests. */
export const podcastEditorShell: FieldModalShellOptions<PodcastConfig> = {
  widgetName: "Podcast-Anzeige",
  title: "Podcast wählen",
  icon: Mic,
  preview: true,
  help: HELP,
  statusText: podcastChangesStatus,
  validate: validatePodcastConfig,
};

/**
 * Wartet auf den Konfigurationsdialog des Widgets, setzt das Fenster an die
 * Stelle von `podcast-config` und blendet die alten Felder aus – beides nur
 * im eigenen Dialog.
 *
 * @param root der zu beobachtende Teilbaum; standardmäßig das Dokument.
 * Offengelegt, damit Tests den Beobachter auf einen Container begrenzen.
 * @returns eine Funktion, die die Beobachtung beendet und alles abbaut.
 */
export function startPodcastDialog(root: ParentNode = document): () => void {
  const stopModal = startFieldModalInjector<PodcastConfig>({
    fieldKey: PODCAST_CONFIG_ATTRIBUTE,
    root,
    reopenLabel: "Podcast wählen",
    modalTestId: "podcast-editor-modal",
    reopenTestId: "podcast-editor-reopen",
    parse: (raw) => readPodcastConfig(raw) ?? configFromLegacy(readLegacyFromDialog(root)),
    serialize: serializePodcastConfig,
    shell: podcastEditorShell,
    render: ({ value, onChange }) => (
      <React.Suspense fallback={LOADING}>
        <LazyPodcastEditor value={value} onChange={onChange} />
      </React.Suspense>
    ),
  });
  const stopHiding = startHiddenFields(LEGACY_ATTRIBUTES, PODCAST_CONFIG_ATTRIBUTE, root);
  return () => {
    stopModal();
    stopHiding();
  };
}
