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

/**
 * Schema for the widget's configuration dialog.
 *
 * The keys are byte-identical to `PODCAST_ID_ATTRIBUTE`, `DISPLAY_MODE_ATTRIBUTE`
 * and `EPISODE_ID_ATTRIBUTE` in `index.tsx`, and to the attributes registered
 * in `widgets.json`: the host saves a value under its schema key verbatim and
 * reads it back off the element under the declared attribute name, and it
 * drops an attribute it was never told about.
 *
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    "podcast-id": {
      type: "string",
      title: "Podcast-ID",
    },
    "display-mode": {
      type: "string",
      title: "Anzeigemodus",
      default: "latest",
      oneOf: [
        { const: "latest", title: "Neueste Episode" },
        { const: "specific", title: "Bestimmte Episode" },
      ],
    },
    "episode-id": {
      type: "string",
      title: "Episode-ID",
    },
  },
};

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  "podcast-id": {
    "ui:help":
      "ID des Podcasts aus Staffbase — die 24-stellige Zeichenfolge am Ende der Podcast-URL. " +
      "Die vollständige URL kann ebenfalls eingefügt werden.",
  },
  "episode-id": {
    "ui:help":
      'Nur im Modus "Bestimmte Episode" verwendet. Die Episode-ID oder die vollständige URL der Audiodatei.',
  },
};
