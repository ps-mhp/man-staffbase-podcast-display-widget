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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

// The names the configuration goes by.
//
// Each has to be spelled the same in three places: the key in the
// configuration schema, the attribute declared to the host, and the name
// read back by the view. They are also the attributes registered for this
// widget in `widgets.json`: the host saves a value under its schema key
// verbatim and reads it back off the element under the declared attribute
// name, and it drops an attribute it was never told about.

/** Die ganze Konfiguration in einem Feld — siehe `podcast-config.ts`. */
export const PODCAST_CONFIG_ATTRIBUTE = "podcast-config";
export const PODCAST_ID_ATTRIBUTE = "podcast-id";
export const DISPLAY_MODE_ATTRIBUTE = "display-mode";
export const EPISODE_ID_ATTRIBUTE = "episode-id";
export const PLAYER_SIZE_ATTRIBUTE = "player-size";

/**
 * Die einzelnen Felder bis 0.4.0-rc.3. Sie stehen weiter im Schema, damit der
 * Dialog ihre Werte führt: beim ersten Übernehmen im Fenster wandern sie nach
 * `podcast-config`. Zu sehen sind sie im eigenen Dialog nicht mehr
 * (`legacy-fields.ts`).
 */
export const LEGACY_ATTRIBUTES = [
  PODCAST_ID_ATTRIBUTE,
  DISPLAY_MODE_ATTRIBUTE,
  EPISODE_ID_ATTRIBUTE,
  PLAYER_SIZE_ATTRIBUTE,
] as const;

/**
 * Schema for the widget's configuration dialog.
 *
 * Zu sehen ist nur `podcast-config`: an seine Stelle tritt der Knopf zum
 * Fenster „Podcast wählen“, in dem alles gepflegt wird
 * (`podcast-dialog.ts`). Die übrigen Felder sind die der Fassungen bis
 * 0.4.0-rc.3.
 *
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    [PODCAST_CONFIG_ATTRIBUTE]: {
      type: "string",
      title: "Podcast-Anzeige",
      default: "",
    },
    [PODCAST_ID_ATTRIBUTE]: {
      type: "string",
      title: "Podcast-ID",
    },
    [DISPLAY_MODE_ATTRIBUTE]: {
      type: "string",
      title: "Anzeigemodus",
      default: "latest",
      oneOf: [
        { const: "latest", title: "Neueste Episode" },
        { const: "specific", title: "Bestimmte Episode" },
      ],
    },
    [EPISODE_ID_ATTRIBUTE]: {
      type: "string",
      title: "Episode-ID",
    },
    [PLAYER_SIZE_ATTRIBUTE]: {
      type: "string",
      title: "Player-Größe",
      default: "large",
      oneOf: [
        { const: "large", title: "Groß" },
        { const: "small", title: "Kompakt" },
      ],
    },
  },
};

/** Alle Attribute, in der Reihenfolge des Schemas. */
export const ALL_ATTRIBUTES: string[] = Object.keys(configurationSchema.properties ?? {});

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  [PODCAST_CONFIG_ATTRIBUTE]: {
    "ui:help":
      "Podcast, Episode und Player werden im Fenster „Podcast wählen“ gepflegt; " +
      "das Textfeld dahinter ist die Rohfassung.",
  },
};
