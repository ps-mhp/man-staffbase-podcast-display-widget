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
 * Die Vorschau im Gerätrahmen des Fensters: die echte Anzeige mit dem
 * Entwurf, so wie die Seite sie zeigte – samt „wird geladen“ und
 * Fehlermeldung, denn die Episode kommt auch hier aus dem Netz.
 *
 * `inert`: Abspielen, Spulen und Tab-Wandern bedeuten in der Vorschau nichts,
 * und von selbst spielt der Player nie. So bleibt es still im Studio. Das
 * Stylesheet landet im Shadow Root des Fensters (`ensureStyles` sucht die
 * Wurzel des Elements), nicht im Kopf der Wirtsseite.
 *
 * Mobil stapelt die Seite Cover und Text per Medienabfrage – die fragt aber
 * das Fenster des Studios, nicht den Gerätrahmen. Hier entscheidet deshalb
 * die Ansicht, über eine Klasse, die dieselben Regeln trägt
 * (`styles.scss`, `stacked-large-player`).
 */

import * as React from "react";
import { useConfigShell } from "@man/config-ui/shell/shell-context";

import type { PodcastConfig } from "./podcast-config";
import { PodcastView } from "./podcast-view";

/** Die Klasse, unter der der große Player wie auf dem Telefon gestapelt steht. */
export const NARROW_PREVIEW_CLASS = "podcast-display-preview--narrow";

export function PodcastPreview({ config }: { config: PodcastConfig }): React.ReactElement {
  const { view } = useConfigShell();
  return (
    <div inert className={view === "mobile" ? `p-4 ${NARROW_PREVIEW_CLASS}` : "p-4"} data-testid="podcast-preview">
      <PodcastView
        podcastId={config.podcastId === "" ? null : config.podcastId}
        displayMode={config.mode}
        episodeId={config.episodeId ?? null}
        playerSize={config.size}
      />
    </div>
  );
}
