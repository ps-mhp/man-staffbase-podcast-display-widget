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

import { PODCAST_ID_ATTRIBUTE, DISPLAY_MODE_ATTRIBUTE, EPISODE_ID_ATTRIBUTE } from "./index";
import { configurationSchema, uiSchema } from "./configuration-schema";

describe("widget attributes", () => {
  it("are exactly the keys the configuration schema stores under", () => {
    // The host writes each configuration value under the schema key
    // verbatim and reads it back under the declared attribute. Any
    // difference — even only in case — puts the value where nothing looks.
    expect(Object.keys(configurationSchema.properties!).sort()).toEqual(
      [PODCAST_ID_ATTRIBUTE, DISPLAY_MODE_ATTRIBUTE, EPISODE_ID_ATTRIBUTE].sort(),
    );
    for (const attribute of [PODCAST_ID_ATTRIBUTE, DISPLAY_MODE_ATTRIBUTE, EPISODE_ID_ATTRIBUTE]) {
      expect(attribute).toBe(attribute.toLowerCase());
    }
  });

  it("are exactly the keys the dialog's ui hints are filed under", () => {
    expect(Object.keys(uiSchema).sort()).toEqual(
      [PODCAST_ID_ATTRIBUTE, EPISODE_ID_ATTRIBUTE].sort(),
    );
  });
});
